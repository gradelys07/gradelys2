"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { GraduationCap, Lock, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";
import { validatePassword } from "@/lib/security";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  // The recovery link Supabase emails out can land here either as a PKCE
  // `?code=` param (needs an explicit exchange) or with the session already
  // detected from the URL hash by the client SDK. Handle both.
  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get("code");

    async function establishSession() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError("This reset link is invalid or has expired. Please request a new one.");
        }
      }
      setReady(true);
    }
    establishSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.reason || "Password doesn't meet requirements.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message || "This reset link is invalid or has expired. Please request a new one.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/chat"), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
            <img
              src="/favicon.svg"
              alt="Logo Gradelys"
              width={32}
              height={32}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-heading-sm font-bold text-text-primary">Gradelys</span>
        </Link>

        {!ready ? (
          <div className="flex flex-col items-center text-body-sm text-text-muted">
            <Loader2 className="mb-3 h-5 w-5 animate-spin" /> Verifying your reset link…
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-green-subtle)]">
              <Check className="h-6 w-6 text-green" />
            </div>
            <h1 className="mt-5 text-heading-xl text-text-primary">Password updated</h1>
            <p className="mt-2 text-body-md text-text-secondary">Redirecting you to the app…</p>
          </div>
        ) : (
          <>
            <h1 className="text-center text-display-md text-text-primary">Set a new password</h1>
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="pl-9"
                  />
                </div>
              </div>
              {error && (
                <div className="rounded-md border border-[var(--accent-red-subtle)] bg-[var(--accent-red-subtle)] px-3 py-2 text-body-sm text-red">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Update password
              </Button>
              <p className="text-center text-body-sm text-text-secondary">
                Link not working? <Link href="/forgot-password" className="font-medium text-primary hover:underline">Request a new one</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-void text-text-muted">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
