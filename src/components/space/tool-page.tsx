"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Plus, Trash2, Pin, PinOff, History, Sparkles } from "lucide-react";
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation, useMessages } from "@/hooks/use-chat";
import { ToolChatThread, type ToolKind } from "@/components/space/tool-chat-thread";
import { ToolDashboard } from "@/components/space/tool-dashboard";
import { UnifiedDashboard } from "@/components/space/unified-dashboard";
import { StudioCapabilitiesModal, StudioCapability } from "@/components/space/studio-capabilities-modal";
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
  const [guideOpen, setGuideOpen] = React.useState(false);

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

  const handleSelectCapability = (cap: StudioCapability) => {
    setGuideOpen(false);
    const sid = searchParams.get("spaceId") || activeSession?.spaceId || undefined;
    createConversation.mutateAsync({
      title: cap.title.slice(0, 48),
      spaceId: sid,
      kind: cap.kind,
    }).then((res) => {
      sessionStorage.setItem(`gradelys:pending-message:${res.conversation.id}`, cap.promptExample);
      if (cap.subKind || cap.visualType) {
        sessionStorage.setItem(
          `gradelys:pending-preset:${res.conversation.id}`,
          JSON.stringify({
            subKind: cap.subKind,
            visualType: cap.visualType,
            difficulty: cap.difficulty,
          })
        );
      }
      if (cap.id === "slides") {
        sessionStorage.setItem("gradelys:presentation-prompt", cap.promptExample);
        router.push(`/studio/presentation?conversationId=${res.conversation.id}&spaceId=${sid || ""}`);
        return;
      }
      router.push(`/${cap.kind}?c=${res.conversation.id}${sid ? `&spaceId=${sid}` : ""}`);
    });
  };

  return (
    <div className="flex h-full flex-col">
      {(!activeId && kind === "studio") ? null : (
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-heading-xl text-text-primary">{activeSession?.title || title}</h1>
            <p className="mt-1 text-body-sm text-text-muted">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {kind === "studio" && (
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-default bg-elevated px-3.5 py-2 text-label-md text-text-secondary hover:border-primary/40 hover:text-text-primary hover:bg-hover transition-colors"
              >
                <span>{t("studio.whatCanICreate")}</span>
              </button>
            )}
            <button
              onClick={() => setHistorySidebarOpen(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-elevated px-4 py-2 text-label-lg text-text-secondary hover:bg-hover transition-colors"
            >
              <History className="h-4 w-4" />
              {t("studio.history")}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {activeId ? (
          <ToolChatThread key={activeId} kind={kind} conversationId={activeId} initialSpaceId={searchParams.get("spaceId") || activeSession?.spaceId || undefined} hidePresets={kind === "studio"} />
        ) : kind === "studio" ? (
          <UnifiedDashboard />
        ) : (
          <ToolDashboard kind={kind} title={title} description={description} spaceId={null} />
        )}
      </div>

      <StudioCapabilitiesModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onSelectCapability={handleSelectCapability}
        hasSelectedSpace={!!activeSession?.spaceId}
      />
    </div>
  );
}

