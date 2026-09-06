"use client";

import * as React from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    // Only show on mobile devices
    if (window.innerWidth > 768) return;

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show immediately if they just loaded the page,
      // wait a bit for them to orient themselves.
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If it's iOS, we don't get the event, so we just show the prompt manually
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-4 rounded-xl border border-border bg-base p-4 shadow-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-body-md font-medium text-text-primary">
            Install Gradelys App
          </h3>
          <p className="mt-1 text-body-sm text-text-secondary">
            {isIOS
              ? "To install, tap the Share button below and select 'Add to Home Screen'."
              : "Install our app for a faster, better experience."}
          </p>
          {!isIOS && (
            <div className="mt-3 flex gap-2">
              <Button onClick={handleInstallClick} size="sm" className="w-full">
                Install
              </Button>
            </div>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 text-text-muted hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
