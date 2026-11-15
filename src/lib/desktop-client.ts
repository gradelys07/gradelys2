"use client";

import { useEffect, useState } from "react";
import type { DrawCommand } from "@/lib/assistant/schemas";
import { createClient } from "@/lib/supabase/client";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptureResult {
  imageBase64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
  displayId: number;
  displayBounds: Rect;
  scaleFactor: number;
}

export type CaptureResponse =
  | CaptureResult
  | { error: "denied" | "permission" | "failed" };

export type DesktopGoogleOAuthResult =
  | { ok: true; accessToken: string; refreshToken: string }
  | { ok: false; cancelled?: boolean; error: string };

export interface GradelysDesktopBridge {
  isDesktop: true;
  platform: "darwin" | "win32";
  version: string;
  captureScreen: () => Promise<CaptureResponse>;
  drawOverlay: (
    commands: DrawCommand[],
    displayId: number,
    displayBounds: Rect
  ) => Promise<void>;
  clearOverlay: () => Promise<void>;
  onCaptureState: (
    cb: (state: "asking" | "capturing" | "done") => void
  ) => () => void;
  onOverlayState: (cb: (active: boolean) => void) => () => void;
  setPinned: (pinned: boolean) => void;
  hideWindow: () => void;
  openQuickAssistant?: () => void;
  openMainApp?: (subPath?: string) => void;
  setWindowHeight?: (height: number) => void;
  getSettings: () => Promise<{ askBeforeCapture: boolean; shortcut: string }>;
  setAskBeforeCapture: (ask: boolean) => Promise<void>;
  startGoogleOAuth?: () => Promise<DesktopGoogleOAuthResult>;
  cancelGoogleOAuth?: () => void;
  notifyAuthChanged?: () => void;
  onAuthChanged?: (cb: () => void) => () => void;
}

declare global {
  interface Window {
    gradelysDesktop?: GradelysDesktopBridge;
  }
}

export function getDesktopBridge(): GradelysDesktopBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return window.gradelysDesktop;
}

export function isDesktopAppClient(): boolean {
  if (typeof window === "undefined") return false;
  return (
    Boolean(getDesktopBridge()?.isDesktop) ||
    /GradelysDesktop\//i.test(window.navigator.userAgent)
  );
}

export function useIsDesktopApp(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(isDesktopAppClient());
  }, []);

  return isDesktop;
}

export function notifyDesktopAuthChanged(): void {
  getDesktopBridge()?.notifyAuthChanged?.();
}

export async function signInWithGoogle(): Promise<{
  ok: boolean;
  cancelled?: boolean;
  error?: string;
}> {
  const bridge = getDesktopBridge();
  if (bridge?.startGoogleOAuth) {
    try {
      const oauthRes = await bridge.startGoogleOAuth();
      if (!oauthRes.ok) {
        return {
          ok: false,
          cancelled: oauthRes.cancelled,
          error: oauthRes.error,
        };
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: oauthRes.accessToken,
        refresh_token: oauthRes.refreshToken,
      });
      if (error) {
        return { ok: false, error: error.message };
      }

      bridge.notifyAuthChanged?.();
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Impossible de finaliser la connexion Google sur l'application desktop.",
      };
    }
  }

  if (isDesktopAppClient()) {
    return {
      ok: false,
      error: "Mets à jour Gradelys Desktop pour te connecter directement avec Google.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
