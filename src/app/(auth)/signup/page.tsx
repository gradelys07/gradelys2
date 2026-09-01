"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";
import { passwordStrength, validatePassword } from "@/lib/security";
import { trackLead, trackCompleteRegistration } from "@/lib/whop/tracking";
import { cn } from "@/lib/utils";

const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong", "Excellent"];
const STRENGTH_COLORS = ["bg-red", "bg-yellow", "bg-yellow", "bg-green", "bg-green"];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  React.useEffect(() => {
    trackLead("signup_page");
  }, []);

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.reason || "Password doesn't meet requirements.");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      trackCompleteRegistration("email");
      router.push("/chat");
      router.refresh();
    } else {
      trackCompleteRegistration("email_confirmation");
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-green-subtle)]">
          <Check className="h-6 w-6 text-green" />
        </div>
        <h1 className="mt-5 text-heading-xl text-text-primary">Check your inbox</h1>
        <p className="mt-2 text-body-md text-text-secondary">
          We've sent a confirmation link to <strong className="text-text-primary">{email}</strong>. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-display-md text-text-primary">Create your account</h1>
      <p className="mt-2 text-body-md text-text-secondary">Free forever. No credit card required.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Johnson" className="pl-9" />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9" />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="pl-9 pr-9"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full bg-hover", i < strength && STRENGTH_COLORS[strength - 1])} />
                ))}
              </div>
              <p className="mt-1 text-label-md text-text-muted">{STRENGTH_LABELS[Math.max(0, strength - 1)] || "Weak"}</p>
            </div>
          )}
        </div>

        <label className="flex items-start gap-2 text-body-sm text-text-secondary">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border-strong bg-elevated accent-primary"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </span>
        </label>

        {error && (
          <div className="rounded-md border border-[var(--accent-red-subtle)] bg-[var(--accent-red-subtle)] px-3 py-2 text-body-sm text-red">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
