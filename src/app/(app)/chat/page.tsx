"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp, Paperclip, Sparkles, FileText, Calculator, Globe2, FolderKanban, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateConversation } from "@/hooks/use-chat";
import { useSpaces } from "@/hooks/use-spaces";
import { useTranslation } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown";

const SUGGESTIONS = [
  { icon: FileText, text: "Summarize this chapter for me" },
  { icon: Calculator, text: "Explain the quadratic formula step by step" },
  { icon: Globe2, text: "What caused the French Revolution?" },
  { icon: Sparkles, text: "Quiz me on cell biology" },
];

export default function ChatHomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createConversation = useCreateConversation();
  const { data: spaces } = useSpaces();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const { t } = useTranslation();

  const selectedSpace = spaces?.find((s) => s.id === spaceId);

  async function startChat(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    const res = await createConversation.mutateAsync({ title: text.slice(0, 48), spaceId });
    sessionStorage.setItem(`gradelys:pending-message:${res.conversation.id}`, text);
    router.push(`/chat/${res.conversation.id}`);
  }

  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-display-md text-text-primary">
          {firstName ? `${t("chat.title").replace("?", "")}, ${firstName}?` : t("chat.title")}
        </h1>
        <p className="mt-3 text-body-lg text-text-secondary">
          {t("chat.subtitle")}
        </p>

        <div className="mt-5 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3.5 py-1.5 text-body-sm text-text-secondary hover:bg-hover">
                <FolderKanban className="h-3.5 w-3.5 text-primary" />
                {selectedSpace ? `${selectedSpace.emoji} ${selectedSpace.name}` : t("chat.askAboutSpace")}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSpaceId(null)}>{t("chat.noSpace")}</DropdownMenuItem>
              {spaces?.map((s: any) => (
                <DropdownMenuItem key={s.id} onClick={() => setSpaceId(s.id)}>
                  {s.emoji} {s.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            startChat(input);
          }}
          className="mt-4 rounded-xl border border-border-strong bg-surface p-2 shadow-l2 focus-within:border-primary focus-within:shadow-glow"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                startChat(input);
              }
            }}
            placeholder={selectedSpace ? `Ask about ${selectedSpace.name}…` : t("chat.placeholder")}
            rows={2}
            className="w-full resize-none bg-transparent px-3 py-2 text-body-lg text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-body-sm text-text-muted hover:bg-hover hover:text-text-primary">
              <Paperclip className="h-4 w-4" /> Attach
            </button>
            <Button type="submit" size="icon" disabled={!input.trim()} loading={loading}>
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              onClick={() => startChat(s.text)}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-3 text-left text-body-sm text-text-secondary transition-colors hover:border-border-strong hover:bg-elevated hover:text-text-primary"
            >
              <s.icon className="h-4 w-4 shrink-0 text-primary" />
              {s.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
