"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { MessageSquare, NotebookPen, Brain, FileStack, ScanLine, TrendingUp, Settings, Shield, X, CreditCard, LayoutGrid, Plus, Pin, PinOff, Trash2, ChevronDown, LogOut, MessageSquareHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateSpace, useDeleteSpace, useSpaces } from "@/hooks/use-spaces";
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation } from "@/hooks/use-chat";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Dialog } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { SPACE_TEMPLATES, type SpaceTemplateOption } from "@/lib/space-templates";
import { useTranslation } from "@/i18n/locale-provider";
import { toast } from "sonner";
import { FeedbackModal } from "@/components/feedback-modal";

const TOP_ITEMS = [
  { href: "/scan", key: "nav.scan", icon: ScanLine },
  { href: "/notes", key: "nav.notes", icon: NotebookPen },
  { href: "/progress", key: "nav.progress", icon: TrendingUp },
];

const STUDIO_ITEMS = [
  { href: "/practice", key: "nav.practice", icon: Brain },
  { href: "/visualize", key: "nav.visualize", icon: Sparkles },
  { href: "/studio", key: "nav.studio", icon: FileStack },
];

export function MobileNav() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  
  const user = useAuthStore((s) => s.user);
  const subscription = useAuthStore((s) => s.subscription);
  const setShowAuthModal = useAuthStore((s) => s.setShowAuthModal);
  
  const { data: spaces } = useSpaces();
  const createSpace = useCreateSpace();
  const deleteSpace = useDeleteSpace();
  
  const { data: conversations } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();

  const [activeTab, setActiveTab] = React.useState<"browse" | "chat">("browse");
  const [spacesOpen, setSpacesOpen] = React.useState(true);
  
  const newSpaceOpen = useUIStore((s) => s.newSpaceOpen);
  const setNewSpaceOpen = useUIStore((s) => s.setNewSpaceOpen);
  const [feedbackModalOpen, setFeedbackModalOpen] = React.useState(false);
  const [spaceName, setSpaceName] = React.useState("");
  const [template, setTemplate] = React.useState<SpaceTemplateOption>(SPACE_TEMPLATES[0]);

  const recentChats = (conversations || []).filter((c) => !c.spaceId).slice(0, 10);

  async function handleLogout() {
    document.cookie = "gradelys_demo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  async function handleNewChat() {
    if (user?.isAnonymous) {
      setOpen(false);
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await createConversation.mutateAsync({});
      setOpen(false);
      router.push(`/chat/${res.conversation.id}`);
    } catch (err: any) {
      toast.error(err.message || "Action not allowed");
    }
  }

  async function handleCreateSpace(e: React.FormEvent) {
    e.preventDefault();
    if (user?.isAnonymous) {
      setOpen(false);
      setShowAuthModal(true);
      return;
    }
    if (!spaceName.trim()) return;
    try {
      const res = await createSpace.mutateAsync({
        name: spaceName,
        emoji: template.label.split(" ")[0],
        color: template.color,
        template: template.id,
      });
      setSpaceName("");
      setNewSpaceOpen(false);
      setOpen(false);
      router.push(`/spaces/${res.space.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function handleDeleteSpace(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this space? This cannot be undone.")) return;
    deleteSpace.mutate(id);
    if (pathname === `/spaces/${id}`) {
      setOpen(false);
      router.push("/chat");
    }
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
    <div className="fixed inset-0 z-50 lg:hidden flex">
      <div className="absolute inset-0 bg-black/70 transition-opacity" onClick={() => setOpen(false)} />
      <div className="absolute inset-y-0 left-0 w-[280px] animate-slide-in-right bg-surface flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Link href="/chat" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="flex h-7 w-7 items-center justify-center rounded-md overflow-hidden">
              <img src="/favicon.png" alt="Gradelys" className="h-full w-full object-contain" />
            </div>
            <span className="text-heading-sm font-bold text-text-primary">Gradelys</span>
          </Link>
          <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 mt-2">
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
        <div className="px-3 mt-4 mb-2 shrink-0">
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

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {activeTab === "chat" ? (
            <>
              <button
                onClick={handleNewChat}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium bg-primary text-white shadow-sm transition-all hover:bg-primary-hover hover:-translate-y-0.5"
              >
                <Plus className="h-4.5 w-4.5" /> {t("nav.newChat")}
              </button>

              <div className="mt-5 px-2.5 text-label-sm uppercase text-text-muted flex items-center justify-between">
                {t("nav.recentChats")}
              </div>
              <nav className="mt-2 space-y-0.5">
                {recentChats.map((c) => (
                  <Link
                    key={c.id}
                    href={`/chat/${c.id}`}
                    onClick={(e) => {
                       if ((e.target as HTMLElement).closest('button')) return;
                       setOpen(false);
                    }}
                    className={cn(
                      "group flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                      pathname === `/chat/${c.id}` ? "bg-[var(--primary-subtle)] font-medium text-primary" : "text-text-secondary hover:bg-hover hover:text-text-primary"
                    )}
                  >
                    {c.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
                    <span className="min-w-0 flex-1 truncate">{c.title}</span>
                    <span className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={(e) => handleTogglePin(e, c.id, c.pinned)}
                        className="rounded p-1 text-text-muted hover:bg-hover hover:text-primary"
                        title={c.pinned ? "Unpin" : "Pin"}
                      >
                        {c.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(e, c.id)}
                        className="rounded p-1 text-text-muted hover:bg-hover hover:text-red"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </Link>
                ))}
                {recentChats.length === 0 && (
                  <p className="px-2.5 py-1 text-label-md text-text-muted">No chats yet</p>
                )}
              </nav>
            </>
          ) : (
            <>
              <nav className="space-y-0.5">
                {TOP_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                        isActive ? "bg-[var(--primary-subtle)] font-medium text-primary" : "text-text-secondary hover:bg-hover hover:text-text-primary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.key) === item.key ? item.key.split(".")[1] : t(item.key)}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 px-2.5 text-label-sm uppercase text-text-muted flex items-center justify-between">
                Studio
              </div>
              <nav className="mt-1 space-y-0.5">
                {STUDIO_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                        isActive ? "bg-[var(--primary-subtle)] font-medium text-primary" : "text-text-secondary hover:bg-hover hover:text-text-primary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.key) === item.key ? item.key.split(".")[1] : t(item.key)}
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={() => setSpacesOpen(!spacesOpen)}
                className="mt-6 flex w-full items-center justify-between px-2.5 text-label-sm uppercase text-text-muted"
              >
                {t("nav.spaces")}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !spacesOpen && "-rotate-90")} />
              </button>
              {spacesOpen && (
                <nav className="mt-1 space-y-0.5">
                  <button
                    onClick={() => setNewSpaceOpen(true)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
                  >
                    <Plus className="h-4.5 w-4.5" /> {t("nav.newSpace")}
                  </button>
                  {spaces?.map((space: any) => (
                    <Link
                      key={space.id}
                      href={`/spaces/${space.id}`}
                      onClick={(e) => {
                         if ((e.target as HTMLElement).closest('button')) return;
                         setOpen(false);
                      }}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                        pathname === `/spaces/${space.id}` ? "bg-[var(--primary-subtle)] font-medium text-primary" : "text-text-secondary hover:bg-hover hover:text-text-primary"
                      )}
                    >
                      <span className="shrink-0">{space.emoji}</span>
                      <span className="min-w-0 flex-1 truncate">{space.name}</span>
                      <button
                        onClick={(e) => handleDeleteSpace(e, space.id)}
                        className="shrink-0 rounded p-1 text-text-muted hover:bg-hover hover:text-red"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  ))}
                  {(!spaces || spaces.length === 0) && (
                    <p className="px-2.5 py-1 text-label-md text-text-muted">No spaces yet</p>
                  )}
                </nav>
              )}
            </>
          )}
        </div>

        {subscription && (
          <div className="mx-3 mb-3 shrink-0 rounded-md border border-border bg-surface p-3">
            <div className="flex items-center justify-between text-label-lg">
              <span className="text-text-secondary">Credits</span>
              <Badge variant={subscription.plan === "free" ? "default" : "primary"}>{subscription.plan}</Badge>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-hover">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (subscription.creditsRemaining / Math.max(subscription.creditsMax, 1)) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 text-label-md text-text-muted">
              {subscription.creditsRemaining} / {subscription.creditsMax} scans left
            </div>
            {subscription.plan === "free" && (
              <Link href="/pricing" onClick={() => setOpen(false)} className="mt-2 block text-center text-label-lg font-medium text-primary hover:underline">
                Upgrade →
              </Link>
            )}
          </div>
        )}

        <div className="p-3 shrink-0 border-t border-border-subtle/50">
          {user?.isAnonymous ? (
            <button 
              onClick={() => {
                setOpen(false);
                setShowAuthModal(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-primary-hover hover:-translate-y-0.5"
            >
              S'inscrire / Se connecter
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="w-full flex items-center gap-2.5 rounded-md p-1.5 hover:bg-hover text-left cursor-pointer">
                  <Avatar name={user?.name || "?"} src={user?.avatarUrl || undefined} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-text-primary">{user?.name}</div>
                    <div className="truncate text-label-md text-text-muted">{user?.email}</div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[240px]" align="start" side="top">
                <DropdownMenuItem onClick={() => { setOpen(false); router.push("/settings"); }}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setOpen(false); router.push("/settings?tab=subscription"); }}>
                  <CreditCard className="mr-2 h-4 w-4" /> Billing & plans
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setOpen(false); setFeedbackModalOpen(true); }}>
                  <MessageSquareHeart className="mr-2 h-4 w-4" /> Add a feedback
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem onClick={() => { setOpen(false); router.push("/admin"); }}>
                    <Shield className="mr-2 h-4 w-4" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} danger>
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Dialog open={newSpaceOpen} onOpenChange={setNewSpaceOpen} title="New space">
          <form onSubmit={handleCreateSpace} className="space-y-5 p-5">
            <div>
              <label className="mb-1.5 block text-label-lg text-text-secondary">Name</label>
              <Input value={spaceName} onChange={(e) => setSpaceName(e.target.value)} placeholder="e.g. Organic Chemistry" required autoFocus />
            </div>
            <div>
              <label className="mb-1.5 block text-label-lg text-text-secondary">Template</label>
              <div className="grid grid-cols-2 gap-2">
                {SPACE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t)}
                    className={cn(
                      "rounded-md border px-3 py-2.5 text-left text-[13px] transition-colors",
                      template.id === t.id ? "border-primary bg-[var(--primary-subtle)] text-primary" : "border-border text-text-secondary hover:bg-hover"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-primary py-2.5 text-[13px] font-medium text-white hover:bg-primary-hover"
            >
              Create space
            </button>
          </form>
        </Dialog>
      </div>
      
      <FeedbackModal open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen} />
    </div>
  );
}
