"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Plus, Trash2, Pin, PinOff } from "lucide-react";
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation } from "@/hooks/use-chat";
import { ToolChatThread, type ToolKind } from "@/components/space/tool-chat-thread";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useTranslation } from "@/i18n/locale-provider";

export function ToolPage({ kind, title, description }: { kind: ToolKind; title: string; description: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: sessions, isLoading } = useConversations(kind);
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();
  const { t } = useTranslation();

  const activeId = searchParams.get("c") || sessions?.[0]?.id;
  const activeSession = sessions?.find((s) => s.id === activeId);

  async function handleNewSession() {
    const res = await createConversation.mutateAsync({ kind });
    router.push(`?c=${res.conversation.id}`);
  }

  function handleSelect(id: string) {
    router.push(`?c=${id}`);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this session?")) return;
    deleteConversation.mutate(id);
    if (id === activeId) {
      const next = sessions?.find((s) => s.id !== id);
      router.push(next ? `?c=${next.id}` : "?");
    }
  }

  function handlePin(e: React.MouseEvent, id: string, pinned: boolean) {
    e.stopPropagation();
    updateConversation.mutate({ id, pinned: !pinned });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-6">
        <h1 className="text-heading-xl text-text-primary">{title}</h1>
        <p className="mt-1 text-body-sm text-text-muted">{description}</p>
      </div>

      {/* History bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border-subtle bg-surface px-4 py-2 sm:px-6">
        <button
          onClick={handleNewSession}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-elevated px-3 py-1.5 text-label-lg text-text-secondary hover:bg-hover"
        >
          <Plus className="h-3.5 w-3.5" /> {t("tool.newSession")}
        </button>
        {isLoading && <span className="text-label-md text-text-muted">Loading…</span>}
        {sessions?.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s.id)}
            className={cn(
              "group flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-lg transition-colors",
              s.id === activeId ? "border-primary bg-[var(--primary-subtle)] text-primary" : "border-border bg-elevated text-text-secondary hover:bg-hover"
            )}
          >
            {s.pinned && <Pin className="h-3 w-3" />}
            <span className="max-w-[140px] truncate">{s.title}</span>
            <span className="text-text-muted">· {formatRelativeDate(s.updatedAt)}</span>
            <span
              onClick={(e) => handlePin(e, s.id, s.pinned)}
              className="ml-0.5 hidden rounded p-0.5 hover:bg-hover group-hover:inline-flex"
            >
              {s.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            </span>
            <span
              onClick={(e) => handleDelete(e, s.id)}
              className="hidden rounded p-0.5 hover:bg-hover hover:text-red group-hover:inline-flex"
            >
              <Trash2 className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeSession ? (
          <ToolChatThread kind={kind} conversationId={activeSession.id} initialSpaceId={activeSession.spaceId || undefined} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-body-md text-text-secondary">{t("tool.noSessions")}</p>
            <button
              onClick={handleNewSession}
              className="mt-4 flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-body-sm font-medium text-white hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" /> {t("tool.startSession")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
