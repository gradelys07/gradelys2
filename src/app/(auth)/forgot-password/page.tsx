"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "An error occurred while sending the reset link.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-green-subtle)]">
          <Check className="h-6 w-6 text-green" />
        </div>
        <h1 className="mt-5 text-heading-xl text-text-primary">Check your inbox</h1>
        <p className="mt-2 text-body-md text-text-secondary">
          If an account exists for <strong className="text-text-primary">{email}</strong>, a reset link is on its way.
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-body-sm text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to login
      </Link>
      <h1 className="text-display-md text-text-primary">Reset your password</h1>
      <p className="mt-2 text-body-md text-text-secondary">Enter your email and we'll send you a reset link.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9" />
          </div>
        </div>
        {error && (
          <div className="rounded-md border border-[var(--accent-red-subtle)] bg-[var(--accent-red-subtle)] px-3 py-2 text-body-sm text-red">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Send reset link
        </Button>
      </form>
    </div>
  );
}
