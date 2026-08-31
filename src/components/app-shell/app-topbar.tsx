"use client";

import { Search, Menu } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export function AppTopbar({ title }: { title?: string }) {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-void px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileNavOpen(true)} className="text-text-secondary lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="text-heading-sm text-text-primary">{title}</h1>}
      </div>
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-body-sm text-text-muted transition-colors hover:border-border-strong"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search everything…</span>
        <kbd className="hidden rounded border border-border-strong bg-elevated px-1.5 py-0.5 text-label-md text-text-muted sm:inline">⌘K</kbd>
      </button>
    </header>
  );
}
