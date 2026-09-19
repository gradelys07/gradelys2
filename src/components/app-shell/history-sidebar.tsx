"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Plus, Pin, PinOff, Trash2 } from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation } from "@/hooks/use-chat";
import { useTranslation } from "@/i18n/locale-provider";
import type { ToolKind } from "@/components/space/tool-chat-thread";

export function HistorySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  
  const historySidebarOpen = useUIStore((s) => s.historySidebarOpen);
  const setHistorySidebarOpen = useUIStore((s) => s.setHistorySidebarOpen);

  // Determine kind from pathname
  let kind: ToolKind | null = null;
  if (pathname.startsWith("/visualize")) kind = "visualize";
  else if (pathname.startsWith("/studio")) kind = "studio";
  else if (pathname.startsWith("/practice")) kind = "practice";

  const { data: sessions, isLoading } = useConversations(kind || "chat");
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();

  async function handleNewSession() {
    if (!kind) return;
    const res = await createConversation.mutateAsync({ kind });
    router.push(`?c=${res.conversation.id}`);
    // Close sidebar to maximize workspace on new session creation
    setHistorySidebarOpen(false);
  }

  function handleSelect(id: string) {
    router.push(`?c=${id}`);
    // Close sidebar to maximize workspace when a session is selected
    setHistorySidebarOpen(false);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this session?")) return;
    deleteConversation.mutate(id);
  }

  function handlePin(e: React.MouseEvent, id: string, pinned: boolean) {
    e.stopPropagation();
    updateConversation.mutate({ id, pinned: !pinned });
  }

  // If we are not in one of the tools, don't render anything 
  // (though the layout manages visibility, it's safer to check)
  if (!kind) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/70 lg:hidden transition-opacity",
          historySidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setHistorySidebarOpen(false)}
      />
      <aside
        className={cn(
          "fixed lg:static h-[calc(100vh-1rem)] w-[280px] lg:w-[230px] shrink-0 flex-col border border-border/40 bg-surface/90 lg:bg-surface/40 backdrop-blur-xl rounded-2xl my-2 mx-2 flex shadow-2xl lg:shadow-lg transition-transform duration-300 ease-in-out z-50 lg:z-20",
          historySidebarOpen ? "translate-x-0 lg:relative" : "-translate-x-[120%] lg:-translate-x-[110%] lg:absolute"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 pt-2">
          <span className="text-heading-sm font-bold text-text-primary capitalize">{kind} History</span>
        <button
          onClick={() => setHistorySidebarOpen(false)}
          className="text-text-muted hover:text-text-primary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="px-2 mt-4">
        <button
          onClick={handleNewSession}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium bg-primary text-white shadow-sm transition-all hover:bg-primary-hover hover:-translate-y-0.5"
        >
          <Plus className="h-4.5 w-4.5" /> {t("tool.newSession") || "New Session"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 mt-5">
        <div className="px-2.5 text-label-sm uppercase text-text-muted mb-2">
          {t("nav.recentChats") || "Recent Sessions"}
        </div>
        
        {isLoading && <p className="px-2.5 py-1 text-label-md text-text-muted">Loading…</p>}
        
        <nav className="space-y-0.5">
          {sessions?.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              className="group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors text-text-secondary hover:bg-hover hover:text-text-primary text-left"
            >
              {s.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
              <div className="min-w-0 flex-1 flex flex-col">
                <span className="truncate">{s.title || "Untitled Session"}</span>
                <span className="text-[10px] text-text-muted truncate">{formatRelativeDate(s.updatedAt)}</span>
              </div>
              <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                <div
                  onClick={(e) => handlePin(e, s.id, s.pinned)}
                  className="rounded p-1 text-text-muted hover:bg-hover hover:text-primary"
                  title={s.pinned ? "Unpin" : "Pin"}
                >
                  {s.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </div>
                <div
                  onClick={(e) => handleDelete(e, s.id)}
                  className="rounded p-1 text-text-muted hover:bg-hover hover:text-red"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </div>
              </span>
            </button>
          ))}
          {(!sessions || sessions.length === 0) && !isLoading && (
            <p className="px-2.5 py-1 text-label-md text-text-muted">No sessions yet</p>
          )}
        </nav>
      </div>
    </aside>
    </>
  );
}
