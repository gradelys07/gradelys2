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
import { GoogleSignInButton } from "@/components/google-sign-in-button";
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

            <div className="mb-6">
              <GoogleSignInButton
                label="Continuer avec Google"
                loadingLabel="Connexion Google dans le navigateur..."
                cancelLabel="Annuler"
                disabled={loading}
                onSuccess={() => {
                  setShowAuthModal(false);
                  window.location.href = "/chat";
                }}
                onError={(msg) => setError(msg)}
                className="rounded-full text-body-sm"
              />
            </div>

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
