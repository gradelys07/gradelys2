"use client";

import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { useAuthStore } from "@/stores/auth-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-void">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-void via-surface to-primary-subtle/10 relative">
      <AppSidebar />
      <MobileNav />
      <div className="flex min-w-0 flex-1 flex-col relative p-4 gap-4 z-10 h-full">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto rounded-[2rem] border border-border/60 bg-base shadow-xl relative isolate">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
