"use client";

import * as React from "react";
import { Check, Copy, Upload, AlertCircle, Clock, CheckCircle2, X, FileText, Image as ImageIcon, Tag, Loader2, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { dzdPricing } from "@/lib/config";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

interface BaridimobPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: "plus" | "pro";
  interval: "monthly" | "annual";
}

export function BaridimobPaymentModal({
  open,
  onOpenChange,
  plan,
  interval,
}: BaridimobPaymentModalProps) {
  const user = useAuthStore((s) => s.user);

  const [name, setName] = React.useState(user?.name || "");
  const [email, setEmail] = React.useState(user?.email || "");
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Promo code state
  const [promoInput, setPromoInput] = React.useState("");
  const [validatingPromo, setValidatingPromo] = React.useState(false);
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = React.useState<{
    code: string;
    discountType: "percent" | "fixed";
    discountValue: number;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    collaboratorName?: string;
  } | null>(null);

  // Sync user info if user logs in
  React.useEffect(() => {
    if (user?.name && !name) setName(user.name);
    if (user?.email && !email) setEmail(user.email);
  }, [user]);

  // Reset states when opened
  React.useEffect(() => {
    if (open) {
      setSuccess(false);
      setError(null);
      setPromoError(null);
    }
  }, [open]);

  // Calculate base pricing
  const baseAmountDzd =
    plan === "plus"
      ? interval === "annual"
        ? dzdPricing.plus.annual
        : dzdPricing.plus.monthly
      : interval === "annual"
      ? dzdPricing.pro.annual
      : dzdPricing.pro.monthly;

  // Final amount considering promo discount
  const currentFinalAmount = appliedPromo ? appliedPromo.finalAmount : baseAmountDzd;

  const planLabel = plan === "pro" ? "Pro" : "Plus";
  const intervalLabel = interval === "annual" ? "Annuel (1 an)" : "Mensuel (1 mois)";

  async function handleApplyPromo() {
    if (!promoInput.trim()) return;
    setValidatingPromo(true);
    setPromoError(null);

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoInput.trim(),
          plan,
          interval,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setPromoError(data.error || "Code promo invalide ou expiré.");
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo(data);
      setPromoError(null);
      toast.success(`Code promo "${data.code}" appliqué avec succès !`);
    } catch {
      setPromoError("Erreur lors de la vérification du code promo.");
    } finally {
      setValidatingPromo(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
    toast.info("Code promo retiré");
  }

  function handleCopyRip() {
    navigator.clipboard.writeText(dzdPricing.rip);
    setCopied(true);
    toast.success("Numéro RIP copié dans le presse-papiers !");
    setTimeout(() => setCopied(false), 2500);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/") && selected.type !== "application/pdf") {
      toast.error("Veuillez importer une image (PNG, JPG, WEBP) ou un PDF.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 10 Mo.");
      return;
    }

    setFile(selected);
    setError(null);

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreviewUrl(null);
    }
  }

  function handleRemoveFile() {
    setFile(null);
    setPreviewUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Veuillez renseigner votre nom complet.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez renseigner une adresse email valide.");
      return;
    }
    if (!file) {
      setError("Veuillez joindre la capture d'écran de votre reçu BaridiMob.");
      return;
    }

    setSubmitting(true);

    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/payments/dzd/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: name.trim(),
          userEmail: email.trim().toLowerCase(),
          plan,
          billingInterval: interval,
          amountDzd: currentFinalAmount,
          promoCode: appliedPromo?.code || null,
          fileBase64: base64Data,
          fileName: file.name,
          mimeType: file.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi.");
      }

      setSuccess(true);
      toast.success("Reçu envoyé avec succès !");
    } catch (err: any) {
      console.error("[BaridimobModal] Submission error:", err);
      setError(err.message || "Erreur de connexion. Veuillez réessayer.");
      toast.error(err.message || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-xl">
      <div className="p-6">
        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green/10 text-green">
              <CheckCircle2 className="h-10 w-10 text-green" />
            </div>
            <h2 className="mt-4 text-heading-lg text-text-primary">Reçu envoyé avec succès !</h2>
            <p className="mt-2 text-body-md text-text-secondary">
              Votre demande d'abonnement <strong className="text-text-primary">{planLabel} ({intervalLabel})</strong> a bien été transmise à notre équipe.
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-lg border border-yellow/30 bg-yellow/5 p-4 text-left">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-yellow" />
                <div className="text-body-sm text-text-secondary">
                  <p className="font-semibold text-text-primary">Délai d'activation :</p>
                  <p className="mt-0.5">
                    L'activation de votre abonnement peut prendre entre <strong className="text-text-primary">8H à 48H</strong> après vérification de votre virement.
                  </p>
                  <p className="mt-2 text-label-md text-text-muted">
                    Un email de confirmation sera envoyé à <strong className="text-text-primary">{email}</strong>.
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="mt-8 w-full"
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              Compris, fermer
            </Button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-surface border border-border px-3 py-1 text-label-md text-text-secondary mb-2">
                  <span>🇩🇿 Paiement BaridiMob (DZD)</span>
                </div>
                <h2 className="text-heading-xl text-text-primary">Souscrire au plan {planLabel}</h2>
                <div className="text-body-sm text-text-muted mt-1 flex flex-wrap items-center gap-2">
                  <span>Formule {intervalLabel} · Montant :</span>
                  {appliedPromo ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="line-through text-text-muted">{baseAmountDzd.toLocaleString()} DZD</span>
                      <strong className="text-green font-bold text-heading-sm">
                        {currentFinalAmount.toLocaleString()} DZD
                      </strong>
                      <span className="rounded-full bg-green/10 text-green px-2 py-0.5 text-label-xs font-semibold">
                        -{appliedPromo.discountType === "percent" ? `${appliedPromo.discountValue}%` : `${appliedPromo.discountValue} DZD`}
                      </span>
                    </div>
                  ) : (
                    <strong className="text-primary font-bold">{baseAmountDzd.toLocaleString()} DZD</strong>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red/30 bg-red/10 p-3 text-body-sm text-red">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Promo Code Section */}
            <div className="mt-5 rounded-xl border border-border bg-surface/70 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="text-label-md font-semibold text-text-primary">
                    Code promo (Optionnel)
                  </span>
                </div>
                {appliedPromo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-label-xs font-semibold text-green">
                    <Sparkles className="h-3 w-3" />
                    Réduction activée
                  </span>
                )}
              </div>

              {appliedPromo ? (
                <div className="mt-2.5 flex items-center justify-between rounded-lg border border-green/30 bg-green/5 p-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green/20 text-green">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-text-primary">{appliedPromo.code}</span>
                        <span className="text-label-sm text-green font-semibold">
                          ({appliedPromo.discountType === "percent" ? `-${appliedPromo.discountValue}%` : `-${appliedPromo.discountValue} DZD`})
                        </span>
                      </div>
                      <p className="text-label-xs text-text-muted">
                        Économie : <strong className="text-green">-{appliedPromo.discountAmount.toLocaleString()} DZD</strong>
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePromo}
                    className="h-8 px-2 text-text-muted hover:text-red hover:bg-red/10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    <span>Retirer</span>
                  </Button>
                </div>
              ) : (
                <div className="mt-2.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value.toUpperCase());
                          setPromoError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyPromo();
                          }
                        }}
                        placeholder="Ex: BAC2026, AMINE10"
                        className="font-mono uppercase tracking-wider h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyPromo}
                      disabled={validatingPromo || !promoInput.trim()}
                      className="shrink-0 h-9"
                    >
                      {validatingPromo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Appliquer"
                      )}
                    </Button>
                  </div>
                  {promoError && (
                    <p className="mt-1.5 text-label-sm text-red flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {promoError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: RIP Card */}
            <div className="mt-4 rounded-xl border border-primary/20 bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-label-md font-semibold uppercase tracking-wider text-primary">
                  Numéro RIP BaridiMob
                </span>
                <span className="text-label-sm font-mono text-text-muted">Algérie Poste</span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-border-strong bg-base p-3">
                <div className="font-mono text-heading-sm tracking-wide text-text-primary select-all">
                  {dzdPricing.rip}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyRip}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copié !" : "Copier le RIP"}</span>
                </Button>
              </div>

              <p className="mt-2 text-label-md text-text-muted">
                Ouvrez BaridiMob, effectuez un virement de <strong className="text-text-primary">{currentFinalAmount.toLocaleString()} DZD</strong> vers ce RIP, puis téléversez la capture du reçu ci-dessous.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dzd-name">Nom complet *</Label>
                  <Input
                    id="dzd-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Mohamed Benali"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dzd-email">Email du compte Gradelys *</Label>
                  <Input
                    id="dzd-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre-email@exemple.com"
                    required
                  />
                  <p className="mt-1 text-[11px] text-text-muted">
                    L'abonnement sera activé sur ce compte.
                  </p>
                </div>
              </div>

              {/* Receipt File Upload */}
              <div>
                <Label htmlFor="dzd-receipt">Capture d'écran du reçu BaridiMob *</Label>

                {!file ? (
                  <label
                    htmlFor="dzd-file-input"
                    className="mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-surface/50 p-6 text-center cursor-pointer transition hover:border-primary hover:bg-surface"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-body-sm font-medium text-text-primary">
                      Cliquez pour choisir votre capture d'écran
                    </p>
                    <p className="mt-1 text-label-sm text-text-muted">
                      Formats acceptés : PNG, JPG, JPEG, WEBP ou PDF (max 10 Mo)
                    </p>
                    <input
                      id="dzd-file-input"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="mt-1 flex items-center justify-between rounded-xl border border-border-strong bg-surface p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Reçu"
                          className="h-12 w-12 shrink-0 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-raised border border-border text-text-muted">
                          <FileText className="h-6 w-6" />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="truncate text-body-sm font-medium text-text-primary">
                          {file.name}
                        </p>
                        <p className="text-label-sm text-text-muted">
                          {(file.size / 1024).toFixed(0)} Ko
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="rounded p-1.5 text-text-muted hover:text-red hover:bg-red/10 transition"
                      title="Supprimer le fichier"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Activation Notice */}
              <div className="rounded-lg border border-yellow/30 bg-yellow/5 p-3.5 flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow" />
                <p className="text-label-md text-text-secondary leading-relaxed">
                  <strong className="text-text-primary">Note importante :</strong> L'activation de votre abonnement peut prendre entre <strong className="text-text-primary">8H à 48H</strong> après vérification de votre reçu.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={submitting || !file}
                  className="gap-2"
                >
                  <span>Envoyer le reçu</span>
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Dialog>
  );
}
