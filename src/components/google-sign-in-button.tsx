"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { getDesktopBridge, signInWithGoogle } from "@/lib/desktop-client";
import { cn } from "@/lib/utils";

interface GoogleSignInButtonProps {
  label?: string;
  loadingLabel?: string;
  cancelLabel?: string;
  className?: string;
  disabled?: boolean;
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (message: string | null) => void;
}

export function GoogleSignInButton({
  label = "Continue with Google",
  loadingLabel = "Connexion dans le navigateur...",
  cancelLabel = "Annuler",
  className,
  disabled = false,
  onStart,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClick = async () => {
    if (loading || disabled) return;
    onError?.(null);
    onStart?.();
    setLoading(true);

    try {
      const res = await signInWithGoogle();
      if (!mountedRef.current) return;

      if (res.ok) {
        onSuccess?.();
      } else if (!res.cancelled && res.error) {
        onError?.(res.error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    getDesktopBridge()?.cancelGoogleOAuth?.();
    if (mountedRef.current) {
      setLoading(false);
    }
  };

  const hasDesktopOAuth = Boolean(getDesktopBridge()?.startGoogleOAuth);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading || disabled}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-md border border-border bg-elevated py-2.5 text-body-md font-medium text-text-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-65",
          className
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span>{loading ? loadingLabel : label}</span>
      </button>

      {loading && hasDesktopOAuth && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            {cancelLabel}
          </button>
        </div>
      )}
    </div>
  );
}

