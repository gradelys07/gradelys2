"use client";

import { Search, Menu } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export function AppTopbar({ title }: { title?: string }) {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);

  return (
    <header className="flex lg:hidden w-full shrink-0 items-center justify-between p-3 z-40 bg-surface border-b border-border/40">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setMobileNavOpen(true)} 
          className="p-1.5 text-text-secondary hover:bg-hover hover:text-text-primary rounded-md transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-body-lg font-semibold text-text-primary">
          {title || "Gradelys"}
        </h1>
      </div>
      
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="p-1.5 text-text-secondary hover:bg-hover hover:text-text-primary rounded-md transition-colors"
      >
        <Search className="h-5 w-5" />
      </button>
    </header>
  );
}

