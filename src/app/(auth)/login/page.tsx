"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";
import { trackViewContent, trackLead } from "@/lib/whop/tracking";
import { useAuthStore } from "@/stores/auth-store";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    trackViewContent("login");
    trackLead("login_page");
  }, []);

  React.useEffect(() => {
    if (initialized && user && !user.isAnonymous) {
      router.replace(searchParams.get("redirect") || "/chat");
      router.refresh();
    }
  }, [initialized, user, router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(searchParams.get("redirect") || "/chat");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-display-md text-text-primary">Welcome back</h1>
      <p className="mt-2 text-body-md text-text-secondary">Log in to continue your progress.</p>

      <div className="mt-7">
        <GoogleSignInButton
          label="Continue with Google"
          loadingLabel="Connexion Google dans le navigateur..."
          cancelLabel="Annuler"
          disabled={loading}
          onSuccess={() => {
            router.push(searchParams.get("redirect") || "/chat");
            router.refresh();
          }}
          onError={(msg) => setError(msg)}
        />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-label-md text-text-muted">OR</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-label-lg text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-[var(--accent-red-subtle)] bg-[var(--accent-red-subtle)] px-3 py-2 text-body-sm text-red">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-text-secondary">
        Don't have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
