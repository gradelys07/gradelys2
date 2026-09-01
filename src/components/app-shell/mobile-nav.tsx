"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare, NotebookPen, Brain, Sparkles, FileStack,
  ScanLine, TrendingUp, Settings, Shield, X, GraduationCap, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSpaces } from "@/hooks/use-spaces";

const NAV_ITEMS = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/practice", label: "Practice", icon: Brain },
  { href: "/visualize", label: "Visualize", icon: Sparkles },
  { href: "/studio", label: "Studio", icon: FileStack },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/pricing", label: "Billing & plans", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { data: spaces } = useSpaces();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
      <div className="absolute inset-y-0 left-0 w-72 animate-slide-in-right overflow-y-auto bg-base p-4">
        <div className="flex items-center justify-between">
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

        <nav className="mt-6 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-body-md transition-colors",
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
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-body-md text-text-secondary hover:bg-hover hover:text-text-primary"
            >
              <Shield className="h-4.5 w-4.5" /> Admin
            </Link>
          )}
        </nav>

        {spaces && spaces.length > 0 && (
          <>
            <div className="mt-5 px-2.5 text-label-sm uppercase text-text-muted">Spaces</div>
            <nav className="mt-1 space-y-0.5">
              {spaces.map((space: any) => (
                <Link
                  key={space.id}
                  href={`/spaces/${space.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-body-md text-text-secondary hover:bg-hover hover:text-text-primary"
                >
                  <span>{space.emoji}</span>
                  <span className="truncate">{space.name}</span>
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
