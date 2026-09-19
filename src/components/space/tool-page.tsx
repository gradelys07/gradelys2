"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Plus, Trash2, Pin, PinOff, History } from "lucide-react";
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation, useMessages } from "@/hooks/use-chat";
import { ToolChatThread, type ToolKind } from "@/components/space/tool-chat-thread";
import { ToolDashboard } from "@/components/space/tool-dashboard";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useTranslation } from "@/i18n/locale-provider";
import { Presentation } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export function ToolPage({ kind, title, description }: { kind: ToolKind; title: string; description: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: sessions, isLoading } = useConversations(kind);
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();
  const { t } = useTranslation();
  const setHistorySidebarOpen = useUIStore((s) => s.setHistorySidebarOpen);

  const explicitC = searchParams.get("c");
  const activeId = explicitC || null;
  const activeSession = sessions?.find((s) => s.id === activeId);

  // Check if active session has slides and redirect to editor
  const { data: activeMessages } = useMessages(activeId || "");
  React.useEffect(() => {
    // Only redirect if the user explicitly clicked on it in the history (explicitC is true)
    if (explicitC && kind === "studio" && activeMessages && activeMessages.length > 0) {
      const slidesMsg = activeMessages.find(
        (m: any) => m.structured?.kind === "studio" && m.structured?.docType === "slides" && m.structured?.documentId
      );
      if (slidesMsg) {
        const docId = slidesMsg.structured.documentId;
        const sid = activeSession?.spaceId;
        router.replace(`/studio/documents/${docId}?conversationId=${activeId}&spaceId=${sid || ""}`);
      }
    }
    
    if (explicitC && kind === "visualize" && activeMessages && activeMessages.length > 0) {
      const visualizeMsg = activeMessages.find(
        (m: any) => (m.structured?.kind === "visualize" || m.structured?.kind === "image") && m.structured?.visualizeId
      );
      if (visualizeMsg) {
        const docId = visualizeMsg.structured.visualizeId;
        const sid = activeSession?.spaceId;
        router.replace(`/visualize/${docId}?conversationId=${activeId}&spaceId=${sid || ""}`);
      }
    }
  }, [activeMessages, kind, activeId, explicitC, activeSession, router]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-heading-xl text-text-primary">{title}</h1>
          <p className="mt-1 text-body-sm text-text-muted">{description}</p>
        </div>
        <button
          onClick={() => setHistorySidebarOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-elevated px-4 py-2 text-label-lg text-text-secondary hover:bg-hover transition-colors"
        >
          <History className="h-4 w-4" />
          Historique
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeSession ? (
          <ToolChatThread kind={kind} conversationId={activeSession.id} initialSpaceId={activeSession.spaceId || undefined} hidePresets={kind === "studio"} />
        ) : (
          <ToolDashboard kind={kind} title={title} description={description} spaceId={null} />
        )}
      </div>
    </div>
  );
}
