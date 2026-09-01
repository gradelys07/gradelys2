"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
  NotebookPen, Brain, Sparkles, FileStack, ScanLine,
  ChevronsLeft, ChevronsRight, ChevronDown, Plus, GraduationCap, LogOut,
  CreditCard, Search, Settings, TrendingUp, Shield, Trash2, Pin, PinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Dialog } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation } from "@/hooks/use-chat";
import { useCreateSpace, useDeleteSpace, useSpaces } from "@/hooks/use-spaces";
import { SPACE_TEMPLATES, type SpaceTemplateOption } from "@/lib/space-templates";
import { useTranslation } from "@/i18n/locale-provider";
import { toast } from "sonner";

const EXPLORE_ITEMS = [
  { href: "/practice", key: "nav.practice", icon: Brain },
  { href: "/visualize", key: "nav.visualize", icon: Sparkles },
  { href: "/studio", key: "nav.studio", icon: FileStack },
  { href: "/scan", key: "nav.scan", icon: ScanLine },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const user = useAuthStore((s) => s.user);
  const subscription = useAuthStore((s) => s.subscription);
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();
  const { data: conversations } = useConversations();
  const { data: spaces } = useSpaces();
  const createSpace = useCreateSpace();
  const deleteSpace = useDeleteSpace();

  const [spacesOpen, setSpacesOpen] = React.useState(true);
  const [chatsOpen, setChatsOpen] = React.useState(true);
  const [newSpaceOpen, setNewSpaceOpen] = React.useState(false);
  const [spaceName, setSpaceName] = React.useState("");
  const [template, setTemplate] = React.useState<SpaceTemplateOption>(SPACE_TEMPLATES[0]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleNewChat() {
    const res = await createConversation.mutateAsync({});
    router.push(`/chat/${res.conversation.id}`);
  }

  async function handleCreateSpace(e: React.FormEvent) {
    e.preventDefault();
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
    if (pathname === `/spaces/${id}`) router.push("/chat");
  }

  function handleDeleteChat(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    deleteConversation.mutate(id);
    if (pathname === `/chat/${id}`) router.push("/chat");
  }

  function handleTogglePin(e: React.MouseEvent, id: string, pinned: boolean) {
    e.preventDefault();
    e.stopPropagation();
    updateConversation.mutate({ id, pinned: !pinned });
  }

  const recentChats = (conversations || []).filter((c) => !c.spaceId).slice(0, 10);

  if (collapsed) {
    return (
      <aside className="hidden h-screen w-[68px] shrink-0 flex-col items-center border-r border-border-subtle bg-base py-4 lg:flex">
        <Link href="/chat" className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden">
          <img src="/favicon.svg" alt="Gradelys" className="h-full w-full object-contain" />
        </Link>
        <button onClick={handleNewChat} className="mt-4 flex h-9 w-9 items-center justify-center rounded-md border border-border-strong bg-elevated text-text-secondary hover:bg-hover">
          <Plus className="h-4 w-4" />
        </button>
        <nav className="mt-4 flex flex-1 flex-col items-center gap-1">
          {[{ href: "/progress", icon: TrendingUp }, { href: "/notes", icon: NotebookPen }, ...EXPLORE_ITEMS].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md",
                pathname.startsWith(item.href) ? "bg-[var(--primary-subtle)] text-primary" : "text-text-secondary hover:bg-hover"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
            </Link>
          ))}
        </nav>
        <button onClick={toggleSidebar} className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-hover">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col border-r border-border-subtle bg-base lg:flex">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/chat" className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md overflow-hidden">
            <img src="/favicon.svg" alt="Gradelys" className="h-full w-full object-contain" />
          </div>
          <span className="text-heading-sm font-bold text-text-primary">Gradelys</span>
        </Link>
        <button onClick={toggleSidebar} className="text-text-muted hover:text-text-primary">
          <ChevronsLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
        >
          <Plus className="h-4.5 w-4.5" /> {t("nav.newChat")}
        </button>
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
        >
          <Search className="h-4.5 w-4.5" /> {t("nav.searchChats")}
        </button>
        <Link
          href="/progress"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm transition-colors",
            pathname.startsWith("/progress") ? "bg-[var(--primary-subtle)] font-medium text-primary" : "text-text-secondary hover:bg-hover hover:text-text-primary"
          )}
        >
          <TrendingUp className="h-4.5 w-4.5" /> {t("nav.progress")}
        </Link>
        <Link
          href="/notes"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm transition-colors",
            pathname.startsWith("/notes") ? "bg-[var(--primary-subtle)] font-medium text-primary" : "text-text-secondary hover:bg-hover hover:text-text-primary"
          )}
        >
          <NotebookPen className="h-4.5 w-4.5" /> {t("nav.notes")}
        </Link>

        <div className="mt-5 px-2.5 text-label-sm uppercase text-text-muted">{t("nav.explore")}</div>
        <nav className="mt-1 space-y-0.5">
          {EXPLORE_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm transition-colors",
                  active ? "bg-[var(--primary-subtle)] font-medium text-primary" : "text-text-secondary hover:bg-hover hover:text-text-primary"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* SPACES */}
        <button
          onClick={() => setSpacesOpen(!spacesOpen)}
          className="mt-5 flex w-full items-center justify-between px-2.5 text-label-sm uppercase text-text-muted"
        >
          {t("nav.spaces")}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !spacesOpen && "-rotate-90")} />
        </button>
        {spacesOpen && (
          <nav className="mt-1 space-y-0.5">
            <button
              onClick={() => setNewSpaceOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
            >
              <Plus className="h-4.5 w-4.5" /> {t("nav.newSpace")}
            </button>
            {spaces?.map((space: any) => (
              <Link
                key={space.id}
                href={`/spaces/${space.id}`}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm transition-colors",
                  pathname === `/spaces/${space.id}` ? "bg-[var(--primary-subtle)] font-medium text-primary" : "text-text-secondary hover:bg-hover hover:text-text-primary"
                )}
              >
                <span className="shrink-0">{space.emoji}</span>
                <span className="min-w-0 flex-1 truncate">{space.name}</span>
                <button
                  onClick={(e) => handleDeleteSpace(e, space.id)}
                  className="shrink-0 rounded p-1 text-text-muted opacity-0 hover:bg-hover hover:text-red group-hover:opacity-100"
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

        {/* RECENT CHATS */}
        <button
          onClick={() => setChatsOpen(!chatsOpen)}
          className="mt-5 flex w-full items-center justify-between px-2.5 text-label-sm uppercase text-text-muted"
        >
          {t("nav.recentChats")}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !chatsOpen && "-rotate-90")} />
        </button>
        {chatsOpen && (
          <nav className="mt-1 space-y-0.5">
            {recentChats.map((c) => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2.5 py-2 text-body-sm transition-colors",
                  pathname === `/chat/${c.id}` ? "bg-[var(--primary-subtle)] font-medium text-primary" : "text-text-secondary hover:bg-hover hover:text-text-primary"
                )}
              >
                {c.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
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
        )}
      </div>

      {subscription && (
        <div className="mx-3 mb-3 rounded-md border border-border bg-surface p-3">
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
            <Link href="/pricing" className="mt-2 block text-center text-label-lg font-medium text-primary hover:underline">
              Upgrade →
            </Link>
          )}
        </div>
      )}

      <div className="border-t border-border-subtle p-3">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-2.5 rounded-md p-1.5 hover:bg-hover">
              <Avatar name={user?.name || "?"} src={user?.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-body-sm font-medium text-text-primary">{user?.name}</div>
                <div className="truncate text-label-md text-text-muted">{user?.email}</div>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="top">
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/pricing")}>
              <CreditCard className="h-4 w-4" /> Billing & plans
            </DropdownMenuItem>
            {user?.role === "admin" && (
              <DropdownMenuItem onClick={() => router.push("/admin")}>
                <Shield className="h-4 w-4" /> Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} danger>
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                    "rounded-md border px-3 py-2.5 text-left text-body-sm transition-colors",
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
            className="w-full rounded-md bg-primary py-2.5 text-body-sm font-medium text-white hover:bg-primary-hover"
          >
            Create space
          </button>
        </form>
      </Dialog>
    </aside>
  );
}
