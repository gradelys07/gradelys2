"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, MessageSquare, TrendingUp, NotebookPen, Brain, Sparkles, FileStack, ScanLine } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useTranslation } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const MAIN_NAV_ITEMS = [
  { href: "/chat", key: "nav.chat", label: "Chat", icon: MessageSquare },
  { href: "/practice", key: "nav.practice", label: "Practice", icon: Brain },
  { href: "/visualize", key: "nav.visualize", label: "Visualize", icon: Sparkles },
  { href: "/studio", key: "nav.studio", label: "Studio", icon: FileStack },
  { href: "/scan", key: "nav.scan", label: "Scan", icon: ScanLine },
  { href: "/notes", key: "nav.notes", label: "Notes", icon: NotebookPen },
  { href: "/progress", key: "nav.progress", label: "Progress", icon: TrendingUp },
];

export function AppTopbar({ title }: { title?: string }) {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const toolsMode = useUIStore((s) => s.toolsMode);
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <header className={cn("flex w-full shrink-0 items-center justify-between z-40 transition-all duration-300", toolsMode ? "h-0 opacity-0 pointer-events-none -translate-y-full overflow-hidden" : "h-14 opacity-100 translate-y-0")}>
      {/* Mobile view topbar content (left aligned) */}
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={() => setMobileNavOpen(true)} className="text-text-secondary">
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="text-heading-sm font-semibold text-text-primary">{title}</h1>}
      </div>
      
      {/* Search button on mobile, shown on the right */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center justify-center rounded-md border border-border bg-surface p-2 text-text-muted hover:border-border-strong lg:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Desktop view floating bar (full width) */}
      <div 
        className="hidden lg:flex items-center justify-between rounded-xl border border-border/40 bg-surface/80 backdrop-blur-xl px-4 py-2 shadow-sm w-full relative"
      >
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/chat" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-body-sm transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-primary text-white shadow-sm font-medium" 
                    : "text-text-secondary hover:bg-hover hover:text-text-primary"
                )}
              >
                <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-white" : "text-text-muted")} />
                {t(item.key) === item.key ? item.label : t(item.key)}
              </Link>
            );
          })}
        </nav>
        
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-6 w-px bg-border-subtle" />
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-transparent bg-transparent px-3 py-2 text-body-sm text-text-muted transition-colors hover:bg-hover hover:text-text-primary group"
          >
            <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
            <span className="hidden xl:inline">Search...</span>
            <kbd className="hidden rounded border border-border bg-elevated px-1.5 py-0.5 text-label-md text-text-muted xl:inline">⌘K</kbd>
          </button>
        </div>
      </div>
    </header>
  );
}
