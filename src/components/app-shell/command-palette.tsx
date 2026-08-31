"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import {
  MessageSquare, NotebookPen, Brain, Sparkles, FileStack, FolderKanban,
  ScanLine, Settings, Plus, Search,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useConversations, useCreateConversation } from "@/hooks/use-chat";
import { useNotes } from "@/hooks/use-notes";
import { useSpaces } from "@/hooks/use-spaces";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { label: "New chat", href: "/chat", icon: Plus },
  { label: "New note", href: "/notes?new=1", icon: NotebookPen },
  { label: "Practice", href: "/practice", icon: Brain },
  { label: "Visualize", href: "/visualize", icon: Sparkles },
  { label: "Studio", href: "/studio", icon: FileStack },
  { label: "Scan a document", href: "/scan", icon: ScanLine },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { data: conversations } = useConversations();
  const { data: notes } = useNotes();
  const { data: spaces } = useSpaces();
  const createConversation = useCreateConversation();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const q = query.toLowerCase().trim();
  const filteredActions = QUICK_ACTIONS.filter((a) => !q || a.label.toLowerCase().includes(q));
  const filteredConvos = (conversations || []).filter((c) => !q || c.title.toLowerCase().includes(q)).slice(0, 5);
  const filteredNotes = (notes || []).filter((n) => !q || n.title.toLowerCase().includes(q)).slice(0, 5);
  const filteredSpaces = (spaces || []).filter((s) => !q || s.name.toLowerCase().includes(q)).slice(0, 5);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  async function handleAction(action: (typeof QUICK_ACTIONS)[number]) {
    if (action.label === "New chat") {
      const res = await createConversation.mutateAsync({});
      go(`/chat/${res.conversation.id}`);
    } else {
      go(action.href);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-lg border border-border-strong bg-elevated shadow-l3 animate-slide-up">
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats, notes, spaces, or jump to a page…"
            className="flex-1 bg-transparent text-body-md text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="rounded border border-border-strong bg-surface px-1.5 py-0.5 text-label-md text-text-muted">Esc</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          <CommandSection title="Quick actions">
            {filteredActions.map((a) => (
              <CommandRow key={a.label} icon={a.icon} label={a.label} onClick={() => handleAction(a)} />
            ))}
          </CommandSection>

          {filteredConvos.length > 0 && (
            <CommandSection title="Chats">
              {filteredConvos.map((c) => (
                <CommandRow key={c.id} icon={MessageSquare} label={c.title} onClick={() => go(`/chat/${c.id}`)} />
              ))}
            </CommandSection>
          )}

          {filteredNotes.length > 0 && (
            <CommandSection title="Notes">
              {filteredNotes.map((n) => (
                <CommandRow key={n.id} icon={NotebookPen} label={n.title} onClick={() => go(`/notes/${n.id}`)} />
              ))}
            </CommandSection>
          )}

          {filteredSpaces.length > 0 && (
            <CommandSection title="Spaces">
              {filteredSpaces.map((s) => (
                <CommandRow key={s.id} icon={FolderKanban} label={`${s.emoji} ${s.name}`} onClick={() => go(`/spaces/${s.id}`)} />
              ))}
            </CommandSection>
          )}
        </div>
      </div>
    </div>
  );
}

function CommandSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-2.5 py-1.5 text-label-sm uppercase text-text-muted">{title}</div>
      {children}
    </div>
  );
}

function CommandRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-text-muted" />
      <span className="truncate">{label}</span>
    </button>
  );
}
