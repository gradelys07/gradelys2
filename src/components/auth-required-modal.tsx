"use client";

import * as React from "react";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trackCompleteRegistration } from "@/lib/whop/tracking";
import Link from "next/link";

export function AuthRequiredModal() {
  const showAuthModal = useAuthStore((s) => s.showAuthModal);
  const setShowAuthModal = useAuthStore((s) => s.setShowAuthModal);
  const router = useRouter();

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!showAuthModal) {
      setMode("signup");
      setName("");
      setEmail("");
      setPassword("");
      setError(null);
      setDone(false);
      setLoading(false);
    }
  }, [showAuthModal]);

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    
    if (mode === "signup") {
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
        setShowAuthModal(false);
        window.location.href = "/chat";
      } else {
        trackCompleteRegistration("email_confirmation");
        setDone(true);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        setShowAuthModal(false);
        window.location.href = "/chat";
      }
    }
  }

  return (
    <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
      <div className="p-6 sm:p-8">
        
        {done ? (
          <div className="text-center py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-green-subtle)] mb-5">
              <Check className="h-8 w-8 text-green" />
            </div>
            <h3 className="text-heading-lg text-text-primary mb-2">Vérifiez votre boîte mail</h3>
            <p className="text-body-md text-text-secondary">
              Nous avons envoyé un lien de confirmation à <strong className="text-text-primary">{email}</strong>. 
              Cliquez dessus pour activer votre compte.
            </p>
            <Button 
              className="mt-8 w-full rounded-full"
              onClick={() => setShowAuthModal(false)}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h3 className="text-heading-lg font-semibold text-text-primary mb-1.5">
                {mode === "signup" ? "Rejoignez-nous" : "Bon retour !"}
              </h3>
              <p className="text-body-sm text-text-secondary">
                {mode === "signup" 
                  ? "Créez votre compte et commencez votre parcours d'apprentissage" 
                  : "Connectez-vous pour continuer votre apprentissage"}
              </p>
            </div>

            <button
              onClick={handleGoogle}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-elevated py-2.5 text-body-sm font-medium text-text-primary transition-colors hover:bg-hover"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuer avec Google
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border-subtle" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">OU</span>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-text-muted" />
                  <Input 
                    id="name" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Entrez votre nom complet" 
                    className="pl-10 rounded-full h-11" 
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-text-muted" />
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Adresse e-mail" 
                  className="pl-10 rounded-full h-11" 
                />
              </div>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-text-muted" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="pl-10 pr-10 rounded-full h-11"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <div className="rounded-lg border border-[var(--accent-red-subtle)] bg-[var(--accent-red-subtle)] px-3 py-2 text-body-xs text-red">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full rounded-full h-11 mt-2 text-body-sm" loading={loading}>
                {mode === "signup" ? "Créer un compte" : "Se connecter"}
              </Button>
            </form>

            <p className="mt-5 text-center text-body-xs text-text-secondary">
              {mode === "signup" ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"} {" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "login" : "signup");
                  setError(null);
                }}
                className="font-medium text-text-primary hover:underline transition-colors"
              >
                {mode === "signup" ? "Se connecter" : "S'inscrire"}
              </button>
            </p>
          </>
        )}
      </div>
    </Dialog>
  );
}
