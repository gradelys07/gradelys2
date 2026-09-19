"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { HistorySidebar } from "@/components/app-shell/history-sidebar";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { useAuthStore } from "@/stores/auth-store";

import { AuthRequiredModal } from "@/components/auth-required-modal";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ProfileOnboarding } from "@/components/profile-onboarding";
import { GlobalFocusTimer } from "@/components/dashboard/global-focus-timer";

const EDITOR_ROUTES = ["/studio/presentation", "/studio/documents/", "/visualize/"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const setShowAuthModal = useAuthStore((s) => s.setShowAuthModal);
  const pathname = usePathname();

  const isEditorRoute = EDITOR_ROUTES.some((route) => pathname.startsWith(route));

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-void">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (isEditorRoute) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-void via-surface to-primary-subtle/10 relative">
        <div className="flex min-w-0 flex-1 flex-col relative z-10 h-full bg-base">
          <main className="flex-1 overflow-y-auto relative isolate">
            {children}
          </main>
        </div>
        <CommandPalette />
        <AuthRequiredModal />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-void via-surface to-primary-subtle/10 relative">
      <AppSidebar />
      <HistorySidebar />
      <MobileNav />
      <div className="flex min-w-0 flex-1 flex-col relative z-10 h-full bg-base">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto relative isolate">
          {children}
        </main>
      </div>
      <CommandPalette />
      <PwaInstallPrompt />
      <AuthRequiredModal />
      <OnboardingTour />
      <ProfileOnboarding />
      <GlobalFocusTimer />
    </div>
  );
}
