"use client";

import * as React from "react";
import {
  ArrowUp, Paperclip, Sparkles, Globe, ThumbsUp, ThumbsDown, Copy,
  Brain, X, ChevronDown, Check, NotebookPen,
} from "lucide-react";
import { useMessages, useSetMessageFeedback, useUpdateConversation, useConversations } from "@/hooks/use-chat";
import { useQueryClient } from "@tanstack/react-query";
import { Markdown } from "@/components/markdown";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreateDeck, useGenerateFlashcards } from "@/hooks/use-flashcards";
import { useCreateNote } from "@/hooks/use-notes";
import { useRecordActivity } from "@/hooks/use-gamification";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown";

const MODELS = [
  { id: "auto", label: "Auto", description: "Best model for the task" },
  { id: "flash", label: "Flash", description: "Fast, great for most questions" },
  { id: "pro", label: "Pro", description: "Deeper reasoning, slower" },
];

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { id: string; title: string; snippet: string; url: string }[];
  pending?: boolean;
}

export function ChatThread({
  conversationId,
  spaceId,
  placeholder,
}: {
  conversationId: string;
  spaceId?: string | null;
  placeholder?: string;
}) {
  const user = useAuthStore((s) => s.user);
  const { data: serverMessages } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const setFeedback = useSetMessageFeedback();
  const updateConversation = useUpdateConversation();
  const recordActivity = useRecordActivity();
  const qc = useQueryClient();

  const [localMessages, setLocalMessages] = React.useState<LocalMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [model, setModel] = React.useState("auto");
  const [webSearch, setWebSearch] = React.useState(false);
  const [attachedImage, setAttachedImage] = React.useState<{ file: File; preview: string; base64: string } | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (serverMessages) {
      setLocalMessages(serverMessages.map((m) => ({ id: m.id, role: m.role, content: m.content, sources: m.sources })));
    }
  }, [serverMessages]);

  React.useEffect(() => {
    if (conversation) setWebSearch(conversation.webSearchEnabled);
  }, [conversation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Auto-send a message queued from the /chat landing page.
  React.useEffect(() => {
    const key = `gradelys:pending-message:${conversationId}`;
    const pending = sessionStorage.getItem(key);
    if (pending) {
      sessionStorage.removeItem(key);
      send(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setInput("");
    const userMsgId = `local-${Date.now()}`;
    const assistantMsgId = `local-${Date.now()}-a`;

    setLocalMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: text },
      { id: assistantMsgId, role: "assistant", content: "", pending: true },
    ]);

    const image = attachedImage ? { mimeType: attachedImage.file.type, data: attachedImage.base64 } : undefined;
    setAttachedImage(null);

    try {
      let sources: any[] | undefined;
      let buffer = "";
      const fullText = await (async () => {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message: text, model, image }),
        });
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Chat request failed");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          let chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          if (buffer.startsWith("__SOURCES__") && buffer.includes("__ENDSOURCES__")) {
            const end = buffer.indexOf("__ENDSOURCES__");
            const json = buffer.slice("__SOURCES__".length, end);
            try {
              sources = JSON.parse(json);
            } catch {}
            chunk = buffer.slice(end + "__ENDSOURCES__".length);
            buffer = "";
          } else if (buffer.startsWith("__SOURCES__")) {
            continue; // still accumulating the sources header
          }
          full += chunk;
          setLocalMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: full, pending: false } : m))
          );
        }
        return full;
      })();

      setLocalMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fullText, sources, pending: false } : m))
      );
      recordActivity.mutate();
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setLocalMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
    } finally {
      setSending(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image attachments are supported right now.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setAttachedImage({ file, preview: result, base64 });
    };
    reader.readAsDataURL(file);
  }

  function toggleWebSearch() {
    const next = !webSearch;
    setWebSearch(next);
    updateConversation.mutate({ id: conversationId, webSearchEnabled: next });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {localMessages.length === 0 && (
            <div className="py-10 text-center text-body-sm text-text-muted">
              {spaceId ? "Ask a question — answers are grounded in this space's sources." : "Start the conversation below."}
            </div>
          )}
          {localMessages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onFeedback={(fb) => setFeedback.mutate({ id: m.id, feedback: fb })}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border-subtle bg-void px-4 py-4">
        <div className="mx-auto max-w-3xl">
          {attachedImage && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-text-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachedImage.preview} alt="Attached" className="h-8 w-8 rounded object-cover" />
              <span className="flex-1 truncate">{attachedImage.file.name}</span>
              <button onClick={() => setAttachedImage(null)} className="text-text-muted hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="rounded-xl border border-border-strong bg-surface p-2 shadow-l2 focus-within:border-primary"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={placeholder || "Message Gradelys…"}
              rows={1}
              className="max-h-40 w-full resize-none bg-transparent px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-body-sm text-text-muted hover:bg-hover hover:text-text-primary"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                {!spaceId && (
                  <button
                    type="button"
                    onClick={toggleWebSearch}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-body-sm transition-colors",
                      webSearch ? "bg-[var(--primary-subtle)] text-primary" : "text-text-muted hover:bg-hover hover:text-text-primary"
                    )}
                  >
                    <Globe className="h-4 w-4" /> Web search
                  </button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-body-sm text-text-muted hover:bg-hover hover:text-text-primary">
                      <Sparkles className="h-4 w-4" />
                      {MODELS.find((m) => m.id === model)?.label}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {MODELS.map((m) => (
                      <DropdownMenuItem key={m.id} onClick={() => setModel(m.id)}>
                        <div className="flex w-full items-center justify-between">
                          <div>
                            <div className="text-body-sm text-text-primary">{m.label}</div>
                            <div className="text-label-md text-text-muted">{m.description}</div>
                          </div>
                          {model === m.id && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onFeedback,
}: {
  message: LocalMessage;
  onFeedback: (fb: "up" | "down") => void;
}) {
  const createDeck = useCreateDeck();
  const generateFlashcards = useGenerateFlashcards();
  const createNote = useCreateNote();
  const [savingCards, setSavingCards] = React.useState(false);
  const [savingNote, setSavingNote] = React.useState(false);

  async function handleGenerateFlashcards() {
    setSavingCards(true);
    try {
      const deck = await createDeck.mutateAsync({ name: "From chat", subject: "General" });
      await generateFlashcards.mutateAsync({ deckId: deck.deck.id, sourceText: message.content, count: 8 });
      toast.success("Flashcards created — check your Practice tab");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCards(false);
    }
  }

  async function handleSaveNote() {
    setSavingNote(true);
    try {
      await createNote.mutateAsync({
        title: message.content.split("\n")[0].slice(0, 60) || "Note from chat",
        content: message.content,
      });
      toast.success("Saved to Notes");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingNote(false);
    }
  }

  if (message.role === "user") {
    return (
      <div className="mb-6 flex justify-end gap-3">
        <div className="max-w-[80%] rounded-lg rounded-tr-sm bg-primary px-4 py-2.5 text-body-md text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        {message.pending && !message.content ? (
          <div className="flex gap-1 rounded-lg rounded-tl-sm border border-border-subtle bg-elevated px-4 py-3">
            <span className="typing-dot h-2 w-2 rounded-full bg-text-muted" />
            <span className="typing-dot h-2 w-2 rounded-full bg-text-muted" />
            <span className="typing-dot h-2 w-2 rounded-full bg-text-muted" />
          </div>
        ) : (
          <div className="rounded-lg rounded-tl-sm border border-border-subtle bg-elevated px-4 py-3">
            <Markdown content={message.content} />
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.sources.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="max-w-[220px] truncate rounded-md border border-border-strong bg-surface px-2.5 py-1 text-label-lg text-text-secondary hover:border-primary hover:text-primary"
                title={s.title}
              >
                🔗 {s.title}
              </a>
            ))}
          </div>
        )}

        {!message.pending && message.content && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                toast.success("Copied to clipboard");
              }}
              className="rounded-md p-1.5 text-text-muted hover:bg-hover hover:text-text-primary"
              title="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onFeedback("up")} className="rounded-md p-1.5 text-text-muted hover:bg-hover hover:text-text-primary" title="Good response">
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onFeedback("down")} className="rounded-md p-1.5 text-text-muted hover:bg-hover hover:text-text-primary" title="Bad response">
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className="ml-1 flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-label-lg text-text-secondary hover:border-border-strong hover:text-text-primary disabled:opacity-50"
            >
              <NotebookPen className="h-3.5 w-3.5 text-primary" /> {savingNote ? "Saving…" : "Save as note"}
            </button>
            <button
              onClick={handleGenerateFlashcards}
              disabled={savingCards}
              className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-label-lg text-text-secondary hover:border-border-strong hover:text-text-primary disabled:opacity-50"
            >
              <Brain className="h-3.5 w-3.5 text-green" /> {savingCards ? "Generating…" : "Flashcards"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
