"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  MessageSquare, NotebookPen, Brain, Sparkles, FileStack,
  ScanLine, TrendingUp, Settings, Shield, X, CreditCard, LayoutGrid, Plus, Pin, PinOff, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSpaces } from "@/hooks/use-spaces";
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation } from "@/hooks/use-chat";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const TOP_ITEMS = [
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];

const STUDIO_ITEMS = [
  { href: "/practice", label: "Practice", icon: Brain },
  { href: "/visualize", label: "Visualize", icon: Sparkles },
  { href: "/studio", label: "Studio", icon: FileStack },
];

export function MobileNav() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: spaces } = useSpaces();
  const { data: conversations } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();

  const [activeTab, setActiveTab] = React.useState<"browse" | "chat">("browse");

  const recentChats = (conversations || []).filter((c) => !c.spaceId).slice(0, 10);

  async function handleNewChat() {
    const res = await createConversation.mutateAsync({});
    setOpen(false);
    router.push(`/chat/${res.conversation.id}`);
  }

  function handleDeleteChat(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    deleteConversation.mutate(id);
    if (pathname === `/chat/${id}`) {
      setOpen(false);
      router.push("/chat");
    }
  }

  function handleTogglePin(e: React.MouseEvent, id: string, pinned: boolean) {
    e.preventDefault();
    e.stopPropagation();
    updateConversation.mutate({ id, pinned: !pinned });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
      <div className="absolute inset-y-0 left-0 w-64 animate-slide-in-right overflow-y-auto bg-base p-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md overflow-hidden">
              <img src="/favicon.svg" alt="Gradelys" className="h-full w-full object-contain" />
            </div>
            <span className="text-heading-sm font-bold text-text-primary">Gradelys</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-2 mt-4">
          <button
            onClick={() => {
              setOpen(false);
              setCommandPaletteOpen(true);
            }}
            className="flex w-full items-center justify-between rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-label-sm text-text-muted transition-colors hover:border-border hover:text-text-primary"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </div>
            <kbd className="inline-flex h-4 items-center gap-1 rounded bg-surface-subtle px-1.5 font-mono text-[9px] font-medium text-text-secondary">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Segmented Control */}
        <div className="px-2 mt-5 mb-4 shrink-0">
          <div className="flex bg-surface p-1 rounded-md border border-border-subtle/50">
            <button
              onClick={() => setActiveTab("browse")}
              className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 rounded-sm text-[12px] font-medium transition-all", activeTab === "browse" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:bg-hover hover:text-text-primary")}
            >
              <LayoutGrid className="h-4 w-4" /> Parcourir
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 rounded-sm text-[12px] font-medium transition-all", activeTab === "chat" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:bg-hover hover:text-text-primary")}
            >
              <MessageSquare className="h-4 w-4" /> Chat
            </button>
          </div>
        </div>

        <div className="px-2">
          {activeTab === "chat" ? (
            <>
              <button
                onClick={handleNewChat}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-body-sm font-medium bg-primary text-white shadow-sm transition-all hover:bg-primary-hover hover:-translate-y-0.5"
              >
                <Plus className="h-4.5 w-4.5" /> Nouveau Chat
              </button>

              <div className="mt-6 px-1 text-label-sm uppercase text-text-muted flex items-center justify-between">
                Récents
              </div>
              <nav className="mt-2 space-y-0.5">
                {recentChats.map((c) => (
                  <Link
                    key={c.id}
                    href={`/chat/${c.id}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex items-center gap-2 rounded-md px-2.5 py-2.5 text-[14px] transition-colors",
                      pathname === `/chat/${c.id}` ? "bg-[var(--primary-subtle)] font-medium text-primary" : "text-text-secondary hover:bg-hover hover:text-text-primary"
                    )}
                  >
                    {c.pinned && <Pin className="h-4 w-4 shrink-0 text-primary" />}
                    <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  </Link>
                ))}
                {recentChats.length === 0 && (
                  <p className="px-2.5 py-2 text-label-md text-text-muted">No chats yet</p>
                )}
              </nav>
            </>
          ) : (
            <>
              <nav className="space-y-0.5">
                {TOP_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[14px] transition-colors",
                      pathname.startsWith(item.href)
                        ? "bg-[var(--primary-subtle)] font-medium text-primary"
                        : "text-text-secondary hover:bg-hover hover:text-text-primary"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-6 px-2.5 text-label-sm uppercase text-text-muted flex items-center justify-between">
                Studio
              </div>
              <nav className="mt-1 space-y-0.5">
                {STUDIO_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[14px] transition-colors",
                      pathname.startsWith(item.href)
                        ? "bg-[var(--primary-subtle)] font-medium text-primary"
                        : "text-text-secondary hover:bg-hover hover:text-text-primary"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.label}
                  </Link>
                ))}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[14px] text-text-secondary hover:bg-hover hover:text-text-primary"
                  >
                    <Shield className="h-4.5 w-4.5" /> Admin
                  </Link>
                )}
              </nav>

              {spaces && spaces.length > 0 && (
                <>
                  <div className="mt-6 px-2.5 text-label-sm uppercase text-text-muted">Spaces</div>
                  <nav className="mt-2 space-y-0.5">
                    {spaces.map((space: any) => (
                      <Link
                        key={space.id}
                        href={`/spaces/${space.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[14px] text-text-secondary hover:bg-hover hover:text-text-primary"
                      >
                        <span>{space.emoji}</span>
                        <span className="truncate">{space.name}</span>
                      </Link>
                    ))}
                  </nav>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
