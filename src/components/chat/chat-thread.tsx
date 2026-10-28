"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import * as React from "react";
import { ArrowUp, Paperclip, Globe, ThumbsUp, ThumbsDown, Copy, Brain, X, ChevronDown, Check, NotebookPen, FolderPlus, Folder, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMessages, useSetMessageFeedback, useUpdateConversation, useConversations, useCreateConversation } from "@/hooks/use-chat";
import { useSpaces } from "@/hooks/use-spaces";
import { useQueryClient } from "@tanstack/react-query";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { SaveToSpaceDialog } from "@/components/chat/save-to-space-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch, authFetch } from "@/lib/api-fetch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useCreateDeck, useGenerateFlashcards } from "@/hooks/use-flashcards";
import { useCreateNote } from "@/hooks/use-notes";
import { useRecordActivity } from "@/hooks/use-gamification";
import { detectChatIntent } from "@/lib/chat-intent";
import { useTranslation } from "@/i18n/locale-provider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { trackChatSent, trackFlashcardsCreated, trackShare, trackHitLimit } from "@/lib/whop/tracking";

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
  attachments?: { id: string; type: string; name: string; meta?: string }[];
  pending?: boolean;
}

interface AttachedFile {
  file: File;
  name: string;
  size: number;
  mimeType: string;
  previewUrl?: string;
  base64: string;
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 Mo
const ACCEPTED_FILES = "image/*,application/pdf,text/plain,text/markdown,text/csv,.pdf,.txt,.md,.csv";

function guessMimeType(file: File): string {
  if (file.type) return file.type;
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".md")) return "text/markdown";
  if (n.endsWith(".csv")) return "text/csv";
  if (n.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}

function isSupportedMime(mime: string): boolean {
  return mime.startsWith("image/") || mime === "application/pdf" || mime.startsWith("text/");
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function ChatThread({
  conversationId,
  spaceId,
  placeholder,
  renderInputToolbar,
  onMessageSent,
  activeSourceIds,
}: {
  conversationId: string;
  spaceId?: string | null;
  placeholder?: string;
  renderInputToolbar?: () => React.ReactNode;
  onMessageSent?: () => void;
  activeSourceIds?: string[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: serverMessages } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const createConversation = useCreateConversation();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const setFeedback = useSetMessageFeedback();
  const updateConversation = useUpdateConversation();
  const recordActivity = useRecordActivity();
  const qc = useQueryClient();

  const { data: spaces } = useSpaces();
  const linkedSpaceId = conversation?.spaceId || spaceId;
  const linkedSpace = spaces?.find((s) => s.id === linkedSpaceId);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);

  const [localMessages, setLocalMessages] = React.useState<LocalMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [model, setModel] = React.useState("auto");
  const [webSearch, setWebSearch] = React.useState(false);
  const [attachedFile, setAttachedFile] = React.useState<AttachedFile | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (serverMessages) {
      setLocalMessages((prev) => {
        const dbMessages = serverMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
          attachments: m.attachments,
        }));
        
        // Keep local messages that don't match any DB message content
        const locals = prev.filter(
          (m) => m.id.startsWith("local-") && !dbMessages.some((dbM) => dbM.content === m.content && dbM.role === m.role)
        );
        
        return [...dbMessages, ...locals];
      });
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

  async function send(rawText: string) {
    const fileToSend = attachedFile;
    if ((!rawText.trim() && !fileToSend) || sending) return;
    const text = rawText.trim()
      ? rawText
      : `Analyse ce document joint (${fileToSend!.name}) et explique son contenu.`;
    if (onMessageSent) onMessageSent();

    const attachmentPayload = fileToSend
      ? { name: fileToSend.name, mimeType: fileToSend.mimeType, data: fileToSend.base64, size: fileToSend.size }
      : undefined;

    // ── Intent routing: if user asks for a tool (presentation, visualize, practice, studio),
    // auto-provisions a space if needed, AI-synthesizes a tailored grounded study source,
    // and links the tool session to the space! ──
    const intent = detectChatIntent(text);
    if (intent.type !== "chat") {
      setSending(true);
      setInput("");
      const toastId = toast.loading("Création de l'espace et synthèse du contenu avec l'IA...");
      try {
        const effectiveSpaceId = spaceId || conversation?.spaceId || null;

        const res = await apiFetch<{
          success: boolean;
          toolConversationId: string;
          spaceId: string;
          space: { id: string; name: string; emoji: string };
          targetKind: string;
          preset?: { visualType?: string; subKind?: string };
          userPrompt: string;
        }>("/api/chat/prepare-tool", {
          method: "POST",
          body: JSON.stringify({
            conversationId,
            userPrompt: text,
            intent,
            spaceId: effectiveSpaceId,
            attachment: attachmentPayload,
          }),
        });

        setAttachedFile(null);
        sessionStorage.setItem(`gradelys:pending-message:${res.toolConversationId}`, text);
        if (res.preset?.visualType || res.preset?.subKind) {
          sessionStorage.setItem(`gradelys:pending-preset:${res.toolConversationId}`, JSON.stringify(res.preset));
        }

        toast.dismiss(toastId);
        toast.success(`Redirection vers ${res.targetKind === "studio" && intent.type === "presentation" ? "la présentation" : res.targetKind}...`);
        router.push(`/${res.targetKind}?c=${res.toolConversationId}&spaceId=${res.spaceId}`);
        return;
      } catch (err: any) {
        toast.dismiss(toastId);
        toast.error(err.message || "Erreur lors de la redirection vers l'outil");
      } finally {
        setSending(false);
      }
      return;
    }

    setSending(true);
    setInput("");
    const userMsgId = `local-${Date.now()}`;
    const assistantMsgId = `local-${Date.now()}-a`;

    setLocalMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: text,
        attachments: fileToSend
          ? [{
              id: `att-${Date.now()}`,
              type: fileToSend.mimeType.startsWith("image/") ? "image" : fileToSend.mimeType === "application/pdf" ? "pdf" : "txt",
              name: fileToSend.name,
              meta: formatSize(fileToSend.size),
            }]
          : undefined,
      },
      { id: assistantMsgId, role: "assistant", content: "", pending: true },
    ]);

    setAttachedFile(null);

    try {
      let sources: any[] | undefined;
      let buffer = "";
      const fullText = await (async () => {
        let effectiveActiveSources = activeSourceIds;
        if (effectiveActiveSources === undefined && linkedSpaceId && typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem(`gradelys:active-sources:${linkedSpaceId}`);
            if (stored) effectiveActiveSources = JSON.parse(stored);
          } catch {}
        }

        const res = await authFetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: text,
            model,
            attachment: attachmentPayload,
            activeSourceIds: effectiveActiveSources,
          }),
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
      trackChatSent(model);
      recordActivity.mutate();
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    } catch (err: any) {
      const msg = err.message || "Something went wrong";
      if (msg.includes("Upgrade")) trackHitLimit("chat");
      toast.error(msg);
      setLocalMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
    } finally {
      setSending(false);
    }
  }

  function attachFile(file: File) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Le fichier dépasse la limite maximale de 10 Mo.");
      return;
    }
    const mimeType = guessMimeType(file);
    if (!isSupportedMime(mimeType)) {
      toast.error("Format non supporté. Formats acceptés : PDF, images, TXT, MD, CSV.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      setAttachedFile({
        file,
        name: file.name || "fichier",
        size: file.size,
        mimeType,
        previewUrl: mimeType.startsWith("image/") ? result : undefined,
        base64,
      });
    };
    reader.onerror = () => toast.error("Impossible de lire le fichier.");
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (file) attachFile(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(e.clipboardData.files || [])[0];
    if (file) {
      e.preventDefault();
      attachFile(file);
    }
  }

  function toggleWebSearch() {
    const next = !webSearch;
    setWebSearch(next);
    updateConversation.mutate({ id: conversationId, webSearchEnabled: next });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-base/60 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="truncate">
            <h1 className="truncate text-body-md font-semibold text-text-primary">
              {conversation?.title || t("chat.generalDiscussion")}
            </h1>
            {linkedSpace ? (
              <Link
                href={`/spaces/${linkedSpace.id}`}
                className="mt-0.5 inline-flex items-center gap-1.5 text-label-md text-primary hover:underline"
              >
                <span>{linkedSpace.emoji || "📚"}</span>
                <span className="truncate">{linkedSpace.name}</span>
              </Link>
            ) : (
              <span className="text-label-md text-text-muted">{t("chat.header.noSpaceLinked")}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            icon={<FolderPlus className="h-3.5 w-3.5 text-primary" />}
            className="text-label-md"
          >
            {linkedSpace ? t("chat.header.saveToSpace") : t("chat.header.createOrLinkSpace")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {localMessages.length === 0 && (
            <div className="py-10 text-center text-body-sm text-text-muted">
              {linkedSpace
                ? t("chat.header.emptyPromptSpace").replace("{name}", `${linkedSpace.emoji || "📚"} ${linkedSpace.name}`)
                : t("chat.header.emptyPromptGeneral")}
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
        <div className="mx-auto max-w-4xl">
          {attachedFile && (
            <div className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-body-sm text-text-secondary">
              {attachedFile.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={attachedFile.previewUrl} alt={attachedFile.name} className="h-9 w-9 rounded object-cover" />
              ) : (
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded text-[10px] font-bold",
                  attachedFile.mimeType === "application/pdf" ? "bg-red-50 text-red-600" : "bg-[var(--primary-subtle)] text-primary"
                )}>
                  {attachedFile.mimeType === "application/pdf" ? "PDF" : <FileText className="h-4 w-4" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-text-primary">{attachedFile.name}</div>
                <div className="text-label-md text-text-muted">{formatSize(attachedFile.size)} · max 10 Mo</div>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="rounded-md p-1 text-text-muted hover:bg-hover hover:text-text-primary"
                title="Retirer le fichier"
              >
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
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={placeholder || t("chat.placeholder")}
              rows={1}
              className="max-h-40 w-full resize-none bg-transparent px-3 py-2 text-[16px] sm:text-body-md text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <input ref={fileInputRef} type="file" accept={ACCEPTED_FILES} className="hidden" onChange={handleFileChange} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre un fichier (PDF, image, texte — max 10 Mo)"
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
                    <Globe className="h-4 w-4" /> {t("chat.webSearch")}
                  </button>
                )}
                {renderInputToolbar && renderInputToolbar()}
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
                disabled={(!input.trim() && !attachedFile) || sending}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <SaveToSpaceDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        conversationId={conversationId}
        defaultTitle={conversation?.title}
        currentSpaceId={linkedSpaceId}
      />
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
        <div className="flex max-w-[80%] flex-col items-end gap-1.5">
          {message.attachments?.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-body-sm text-text-secondary"
            >
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded text-[9px] font-bold",
                att.type === "pdf" ? "bg-red-50 text-red-600" : "bg-[var(--primary-subtle)] text-primary"
              )}>
                {att.type === "pdf" ? "PDF" : <FileText className="h-3.5 w-3.5" />}
              </div>
              <span className="max-w-[220px] truncate text-text-primary">{att.name}</span>
              {att.meta && <span className="text-label-md text-text-muted">{att.meta}</span>}
            </div>
          ))}
          <div className="rounded-lg rounded-tr-sm bg-primary px-4 py-2.5 text-body-md text-white">
            {message.content}
          </div>
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
          <div className="flex items-center gap-3 py-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-body-sm font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
            >
              Generating response...
            </motion.span>
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
                trackShare("chat_message");
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
