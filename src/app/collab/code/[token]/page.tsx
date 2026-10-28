"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Tag,
  Gift,
  ArrowUpRight,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CollabDashboardData } from "@/types";

export default function CollabDashboardPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = React.useState<CollabDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/collab/${token}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Impossible de charger le tableau de bord.");
        }

        setData(json);
      } catch (err: any) {
        setError(err.message || "Lien introuvable ou expiré.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [token]);

  function handleCopyCode() {
    if (!data?.code) return;
    navigator.clipboard.writeText(data.code);
    setCopiedCode(true);
    toast.success(`Code promo "${data.code}" copié !`);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleCopyLink() {
    const fullUrl = `https://gradelys.com/collab/code/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("Lien de votre tableau de bord copié !");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-body-md text-text-secondary">Chargement de votre tableau de bord collaborateur…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-red/30 bg-surface p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red/10 text-red mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-heading-xl text-text-primary">Lien introuvable</h1>
          <p className="mt-2 text-body-sm text-text-muted">
            {error || "Ce lien collaborateur est invalide, désactivé ou a été modifié."}
          </p>
          <div className="mt-6 rounded-lg bg-base border border-border p-3 text-label-sm text-text-muted">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur Gradelys.
          </div>
        </div>
      </div>
    );
  }

  const discountLabel =
    data.discountType === "percent"
      ? `-${data.discountValue}%`
      : `-${data.discountValue.toLocaleString()} DZD`;

  const commissionLabel =
    data.commissionType === "percent"
      ? `${data.commissionValue}% par vente`
      : `${data.commissionValue.toLocaleString()} DZD par vente`;

  return (
    <div className="min-h-screen bg-base text-text-primary">
      {/* Top Navbar */}
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-black font-bold">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-heading-sm font-bold tracking-tight">Gradelys</span>
              <span className="ml-2 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Espace Partenaire
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 text-label-sm"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Lien copié" : "Copier le lien d'accès"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-surface via-surface to-primary/5 p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-label-sm font-semibold text-primary uppercase tracking-wider mb-2">
                <Sparkles className="h-4 w-4" />
                <span>Tableau de bord officiel</span>
              </div>
              <h1 className="text-display-md sm:text-display-lg text-text-primary">
                Bienvenue, {data.collaboratorName} !
              </h1>
              <p className="mt-2 text-body-md text-text-secondary max-w-xl">
                Suivez en temps réel l'utilisation de votre code promo et les commissions générées par votre communauté sur Gradelys.
              </p>
            </div>

            {/* Code Highlight Box */}
            <div className="rounded-xl border border-border-strong bg-base/90 p-4 shrink-0 shadow-lg min-w-[280px]">
              <div className="text-label-xs font-semibold uppercase tracking-wider text-text-muted">
                Votre Code Promo Partenaire
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="font-mono text-heading-lg font-extrabold tracking-wider text-primary">
                  {data.code}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="h-8 gap-1.5 shrink-0"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCode ? "Copié" : "Copier"}</span>
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-label-xs text-text-secondary">
                <span>Avantage client : <strong className="text-text-primary">{discountLabel}</strong></span>
                <span>Commission : <strong className="text-green">{commissionLabel}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Commissions Validated */}
          <div className="rounded-xl border border-border bg-surface p-5 transition hover:border-border-strong">
            <div className="flex items-center justify-between">
              <span className="text-label-md text-text-muted font-medium">Gains validés</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green/10 text-green">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-display-md font-bold text-green">
              {data.stats.totalEarnedDzd.toLocaleString()} <span className="text-heading-sm font-semibold text-text-muted">DZD</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-label-sm text-text-muted">
              <CheckCircle2 className="h-3.5 w-3.5 text-green" />
              <span>Virements vérifiés & confirmés</span>
            </div>
          </div>

          {/* Pending Commissions */}
          <div className="rounded-xl border border-border bg-surface p-5 transition hover:border-border-strong">
            <div className="flex items-center justify-between">
              <span className="text-label-md text-text-muted font-medium">En attente de vérification</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow/10 text-yellow">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-display-md font-bold text-yellow">
              {data.stats.pendingEarnedDzd.toLocaleString()} <span className="text-heading-sm font-semibold text-text-muted">DZD</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-label-sm text-text-muted">
              <Clock className="h-3.5 w-3.5 text-yellow" />
              <span>Reçus BaridiMob en cours de traitement</span>
            </div>
          </div>

          {/* Total Sales */}
          <div className="rounded-xl border border-border bg-surface p-5 transition hover:border-border-strong">
            <div className="flex items-center justify-between">
              <span className="text-label-md text-text-muted font-medium">Abonnements activés</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-display-md font-bold text-text-primary">
              {data.stats.totalSales}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-label-sm text-text-muted">
              <Gift className="h-3.5 w-3.5 text-primary" />
              <span>Clients ayant utilisé votre code</span>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-heading-md text-text-primary font-bold">
                Historique des souscriptions
              </h2>
              <p className="text-body-sm text-text-muted mt-0.5">
                Détail de chaque abonnement souscrit avec le code <strong className="text-primary">{data.code}</strong>.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-base border border-border px-3 py-1 text-label-xs text-text-secondary">
              <ShieldCheck className="h-3.5 w-3.5 text-green" />
              <span>Données anonymisées (Confidentialité RGPD)</span>
            </div>
          </div>

          {data.transactions.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised border border-border text-text-muted mb-3">
                <Tag className="h-6 w-6" />
              </div>
              <p className="text-heading-sm text-text-primary font-medium">Aucune souscription pour l'instant</p>
              <p className="mt-1 text-body-sm text-text-muted max-w-md mx-auto">
                Partagez votre code promo <strong className="text-primary">{data.code}</strong> avec votre audience pour commencer à cumuler des commissions !
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-raised text-label-xs uppercase tracking-wider text-text-muted">
                    <th className="py-3.5 px-4 font-semibold">Identifiant</th>
                    <th className="py-3.5 px-4 font-semibold">Plan souscrit</th>
                    <th className="py-3.5 px-4 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold">Montant payé</th>
                    <th className="py-3.5 px-4 font-semibold">Votre commission</th>
                    <th className="py-3.5 px-4 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.transactions.map((tx) => {
                    const isApproved = tx.status === "approved";
                    const isPending = tx.status === "pending";
                    const isRejected = tx.status === "rejected";

                    const planName =
                      tx.plan === "pro"
                        ? tx.billingInterval === "annual" ? "Pro (Annuel)" : "Pro (Mensuel)"
                        : tx.billingInterval === "annual" ? "Plus (Annuel)" : "Plus (Mensuel)";

                    const dateFormatted = new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={tx.id} className="hover:bg-hover/40 transition">
                        {/* Masked ID */}
                        <td className="py-3.5 px-4 font-mono font-medium text-text-primary">
                          {tx.displayId}
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-label-xs font-semibold text-primary">
                            {planName}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-text-muted text-label-sm">
                          {dateFormatted}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-medium text-text-primary">
                          {tx.amountDzd.toLocaleString()} DZD
                        </td>

                        {/* Commission */}
                        <td className="py-3.5 px-4 font-bold text-green">
                          +{tx.commissionAmount.toLocaleString()} DZD
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green/10 border border-green/20 px-2.5 py-0.5 text-label-xs font-semibold text-green">
                              <CheckCircle2 className="h-3 w-3" />
                              Validé
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow/10 border border-yellow/20 px-2.5 py-0.5 text-label-xs font-semibold text-yellow">
                              <Clock className="h-3 w-3" />
                              Vérification en cours
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red/10 border border-red/20 px-2.5 py-0.5 text-label-xs font-semibold text-red">
                              <AlertCircle className="h-3 w-3" />
                              Rejeté / Annulé
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security & Info Notice */}
        <div className="rounded-xl border border-border bg-surface p-4 text-body-sm text-text-muted space-y-2">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-text-primary">
                Confidentialité & Sécurité des données
              </p>
              <p className="mt-0.5 text-label-md text-text-secondary">
                Ce tableau de bord respecte strictement la confidentialité des utilisateurs. Aucune information nominative (nom, prénom, adresse email ou coordonnées bancaires) n'est transmise ou affichée.
              </p>
              <p className="mt-1.5 text-label-sm text-text-muted">
                Pour toute question ou pour demander le versement de vos commissions cumulées, contactez directement l'équipe Gradelys via support@gradelys.com ou votre contact administrateur.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
