"use client";

import * as React from "react";
import {
  Users,
  DollarSign,
  Activity,
  Ban,
  Search,
  Shield,
  AlertTriangle,
  MessageSquare,
  Star,
  Receipt,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  Check,
  Clock,
  Download,
  AlertCircle,
  Tag,
  Plus,
  Trash2,
  ExternalLink,
  BarChart3,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import {
  useAdminStats,
  useAdminUsers,
  useAuditLog,
  useSecurityEvents,
  useUpdateAdminUser,
  useAdminFeedbacks,
  useAdminDzdReceipts,
  useApproveDzdReceipt,
  useRejectDzdReceipt,
  useAdminPromos,
  useCreatePromo,
  useUpdatePromo,
  useDeletePromo,
  usePromoDetails,
} from "@/hooks/use-admin";
import { cn, formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminPage() {
  const { data: dzdData } = useAdminDzdReceipts("all");
  const pendingDzdCount = dzdData?.receipts?.filter((r: any) => r.status === "pending").length || 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-display-md text-text-primary">Admin</h1>
      </div>

      <Tabs defaultValue="dashboard" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="dzd-receipts" className="relative flex items-center gap-1.5">
            <span>🇩🇿 Reçus Algérie (DZD)</span>
            {pendingDzdCount > 0 && (
              <span className="rounded-full bg-yellow px-1.5 py-0.5 text-[10px] font-bold text-black">
                {pendingDzdCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="promos" className="flex items-center gap-1.5">
            <Tag className="h-4 w-4" />
            <span>Codes Promo & Collabs (DZD)</span>
          </TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6"><DashboardTab /></TabsContent>
        <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
        <TabsContent value="dzd-receipts" className="mt-6"><DzdReceiptsTab /></TabsContent>
        <TabsContent value="promos" className="mt-6"><PromoCodesTab /></TabsContent>
        <TabsContent value="audit" className="mt-6"><AuditTab /></TabsContent>
        <TabsContent value="security" className="mt-6"><SecurityTab /></TabsContent>
        <TabsContent value="feedbacks" className="mt-6"><FeedbackTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardTab() {
  const { data, isLoading } = useAdminStats();
  if (isLoading || !data) return <p className="text-body-sm text-text-muted">Loading…</p>;

  const cards = [
    { label: "Total users", value: data.totalUsers, icon: Users, color: "text-primary" },
    { label: "Active today", value: data.activeToday, icon: Activity, color: "text-green" },
    { label: "MRR", value: `$${data.mrr}`, icon: DollarSign, color: "text-yellow" },
    { label: "Banned users", value: data.bannedUsers, icon: Ban, color: "text-red" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-surface p-5">
            <c.icon className={cn("h-5 w-5", c.color)} />
            <div className="mt-2 text-display-md text-text-primary">{c.value}</div>
            <div className="text-label-md text-text-muted">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <h3 className="text-heading-sm text-text-primary">Plan distribution</h3>
        <div className="mt-4 space-y-3">
          {(["free", "plus", "pro"] as const).map((plan) => {
            const count = data.planCounts[plan];
            const total = data.planCounts.free + data.planCounts.plus + data.planCounts.pro || 1;
            return (
              <div key={plan}>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="capitalize text-text-secondary">{plan}</span>
                  <span className="text-text-muted">{count} users</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-hover">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(count / total) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [q, setQ] = React.useState("");
  const { data, isLoading } = useAdminUsers({ q });
  const updateUser = useUpdateAdminUser();

  async function handleBan(id: string, status: string) {
    const reason = status === "banned" ? prompt("Reason for ban (optional):") || "" : undefined;
    await updateUser.mutateAsync({ id, status, banReason: reason });
    toast.success(status === "banned" ? "User banned" : "User restored");
  }

  async function handleGrantCredits(id: string) {
    const amount = prompt("Credits to grant:");
    if (!amount) return;
    await updateUser.mutateAsync({ id, creditsDelta: Number(amount) });
    toast.success(`Granted ${amount} credits`);
  }

  async function handleAssignPlan(id: string, plan: string, interval?: "monthly" | "annual") {
    await updateUser.mutateAsync({ id, plan, interval });
    toast.success(`Assigned ${plan}${interval ? ` (${interval})` : ""} plan`);
  }

  const PLAN_OPTIONS: { label: string; plan: string; interval?: "monthly" | "annual" }[] = [
    { label: "Free", plan: "free" },
    { label: "Plus — Monthly", plan: "plus", interval: "monthly" },
    { label: "Plus — Annual", plan: "plus", interval: "annual" },
    { label: "Pro — Monthly", plan: "pro", interval: "monthly" },
    { label: "Pro — Annual", plan: "pro", interval: "annual" },
  ];

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
      </div>

      {isLoading && <p className="text-body-sm text-text-muted">Loading…</p>}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead className="bg-surface">
            <tr>
              {["User", "Plan", "Credits", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-label-lg text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u: any) => {
              const sub = Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions;
              return (
                <tr key={u.id} className="border-t border-border-subtle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} src={u.avatar_url} size="sm" />
                      <div>
                        <div className="text-body-sm text-text-primary">{u.name}</div>
                        <div className="text-label-md text-text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={sub?.plan === "free" ? "default" : "primary"}>
                      {sub?.plan || "free"}{sub?.plan && sub.plan !== "free" ? ` · ${sub.billing_interval || "monthly"}` : ""}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">{sub?.credits_remaining ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === "banned" ? "danger" : u.status === "active" ? "success" : "default"}>{u.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-muted">{formatRelativeDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <span className="text-label-lg text-primary hover:underline">Assign plan</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {PLAN_OPTIONS.map((opt) => (
                            <DropdownMenuItem key={opt.label} onClick={() => handleAssignPlan(u.id, opt.plan, opt.interval)}>
                              {opt.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <button onClick={() => handleGrantCredits(u.id)} className="text-label-lg text-text-secondary hover:underline">Credits</button>
                      <button
                        onClick={() => handleBan(u.id, u.status === "banned" ? "active" : "banned")}
                        className="text-label-lg text-red hover:underline"
                      >
                        {u.status === "banned" ? "Unban" : "Ban"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 🇩🇿 Section des Reçus Algérie (BaridiMob / DZD) */
function DzdReceiptsTab() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedReceipt, setSelectedReceipt] = React.useState<any | null>(null);

  const { data, isLoading } = useAdminDzdReceipts(statusFilter);
  const approveMutation = useApproveDzdReceipt();
  const rejectMutation = useRejectDzdReceipt();

  const receipts = data?.receipts || [];
  const tableMissing = Boolean(data?.tableMissing);

  // Statistics calculation
  const totalCount = receipts.length;
  const pendingCount = receipts.filter((r: any) => r.status === "pending").length;
  const approvedCount = receipts.filter((r: any) => r.status === "approved").length;
  const totalDzdCollected = receipts
    .filter((r: any) => r.status === "approved")
    .reduce((acc: number, r: any) => acc + (Number(r.amount_dzd) || 0), 0);

  // Filtered receipts
  const filteredReceipts = receipts.filter((r: any) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.user_name?.toLowerCase().includes(q);
      const matchEmail = r.user_email?.toLowerCase().includes(q);
      const matchPlan = r.plan?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPlan;
    }
    return true;
  });

  async function handleApprove(receipt: any) {
    const confirmMessage = `Confirmer la validation du reçu et l'activation de l'abonnement ${receipt.plan.toUpperCase()} (${receipt.billing_interval === "annual" ? "Annuel" : "Mensuel"}) pour ${receipt.user_email} ?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await approveMutation.mutateAsync({
        id: receipt.id,
        customPlan: receipt.plan,
        customInterval: receipt.billing_interval,
      });

      if (res.userActivated) {
        toast.success(`Abonnement ${receipt.plan.toUpperCase()} activé pour ${receipt.user_email} !`);
      } else {
        toast.info(res.message);
      }
      setSelectedReceipt(null);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la validation");
    }
  }

  async function handleReject(receipt: any) {
    const reason = prompt("Raison du refus (ex: Montant incorrect, faux reçu...) :") || "";
    try {
      await rejectMutation.mutateAsync({
        id: receipt.id,
        adminNotes: reason || "Reçu rejeté par l'administrateur",
      });
      toast.success("Reçu marqué comme refusé.");
      setSelectedReceipt(null);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du rejet");
    }
  }

  function handleCopyEmail(email: string) {
    navigator.clipboard.writeText(email);
    toast.success("Email copié dans le presse-papiers");
  }

  return (
    <div className="space-y-6">
      {/* Alert if database table is missing in Supabase */}
      {tableMissing && (
        <div className="rounded-xl border border-yellow/40 bg-yellow/10 p-5 text-text-primary">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow" />
            <div>
              <h4 className="font-semibold text-text-primary">Table Supabase manquante</h4>
              <p className="mt-1 text-body-sm text-text-secondary">
                La table <code className="rounded bg-base px-1.5 py-0.5 font-mono text-primary">dzd_receipts</code> n'existe pas encore dans votre base Supabase.
                Veuillez exécuter le script SQL situé dans <code className="font-mono text-text-primary">supabase/migration_dzd_receipts.sql</code> dans votre SQL Editor Supabase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-5">
          <Receipt className="h-5 w-5 text-primary" />
          <div className="mt-2 text-display-md text-text-primary">{totalCount}</div>
          <div className="text-label-md text-text-muted">Total reçus reçus</div>
        </div>

        <div className="rounded-lg border border-yellow/30 bg-yellow/5 p-5">
          <Clock className="h-5 w-5 text-yellow" />
          <div className="mt-2 text-display-md text-yellow">{pendingCount}</div>
          <div className="text-label-md text-text-muted">En attente d'activation</div>
        </div>

        <div className="rounded-lg border border-green/30 bg-green/5 p-5">
          <CheckCircle2 className="h-5 w-5 text-green" />
          <div className="mt-2 text-display-md text-green">{approvedCount}</div>
          <div className="text-label-md text-text-muted">Validés & activés</div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          <div className="mt-2 text-display-md text-text-primary">
            {totalDzdCollected.toLocaleString()} <span className="text-sm font-normal text-text-muted">DZD</span>
          </div>
          <div className="text-label-md text-text-muted">Revenus DZD encaissés</div>
        </div>
      </div>

      {/* Controls: Search & Status Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email..."
            className="pl-9"
          />
        </div>

        <div className="inline-flex rounded-lg border border-border bg-surface p-1">
          {[
            { id: "all", label: "Tous" },
            { id: "pending", label: "En attente", count: pendingCount },
            { id: "approved", label: "Validés", count: approvedCount },
            { id: "rejected", label: "Refusés" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-label-md font-medium transition-colors",
                statusFilter === tab.id
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    statusFilter === tab.id ? "bg-white/20 text-white" : "bg-elevated text-text-muted"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-body-sm text-text-muted">Chargement des reçus…</p>}

      {!isLoading && filteredReceipts.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Receipt className="mx-auto h-10 w-10 text-text-muted" />
          <h3 className="mt-3 text-heading-md text-text-primary">Aucun reçu trouvé</h3>
          <p className="mt-1 text-body-sm text-text-secondary">
            {searchQuery
              ? "Aucun reçu ne correspond à votre recherche."
              : "Aucun reçu de paiement BaridiMob n'a été soumis pour le moment."}
          </p>
        </div>
      )}

      {/* Receipts Table */}
      {!isLoading && filteredReceipts.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 text-label-lg text-text-muted">Utilisateur</th>
                <th className="px-4 py-3 text-label-lg text-text-muted">Formule</th>
                <th className="px-4 py-3 text-label-lg text-text-muted">Montant DZD</th>
                <th className="px-4 py-3 text-label-lg text-text-muted">Reçu</th>
                <th className="px-4 py-3 text-label-lg text-text-muted">Statut</th>
                <th className="px-4 py-3 text-label-lg text-text-muted">Date</th>
                <th className="px-4 py-3 text-right text-label-lg text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((r: any) => {
                const isPending = r.status === "pending";
                const isApproved = r.status === "approved";
                const isRejected = r.status === "rejected";
                const hasAccount = Boolean(r.user_id || r.userProfile);

                return (
                  <tr key={r.id} className="border-t border-border-subtle hover:bg-surface/50 transition">
                    {/* User */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.user_name} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-body-sm text-text-primary">{r.user_name}</span>
                            {hasAccount ? (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 border-emerald-500/30 text-emerald-500">
                                Inscrit
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-[10px] py-0 px-1 text-text-muted">
                                Non inscrit
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-label-md text-text-muted">{r.user_email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(r.user_email)}
                              className="text-text-muted hover:text-text-primary p-0.5 rounded"
                              title="Copier l'email"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3.5">
                      <Badge variant={r.plan === "pro" ? "primary" : "default"}>
                        {r.plan.toUpperCase()} · {r.billing_interval === "annual" ? "Annuel" : "Mensuel"}
                      </Badge>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 font-semibold text-body-sm text-text-primary">
                      {Number(r.amount_dzd).toLocaleString()} DZD
                    </td>

                    {/* Thumbnail */}
                    <td className="px-4 py-3.5">
                      {r.receipt_url ? (
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(r)}
                          className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-border bg-base hover:border-primary transition"
                          title="Cliquer pour agrandir le reçu"
                        >
                          <img
                            src={r.receipt_url}
                            alt="Reçu"
                            className="h-full w-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                            <Eye className="h-4 w-4" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-label-md text-text-muted">Pas d'image</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {isPending && <Badge variant="warning">En attente</Badge>}
                      {isApproved && <Badge variant="success">Validé</Badge>}
                      {isRejected && <Badge variant="danger">Refusé</Badge>}
                      {r.admin_notes && (
                        <p className="mt-1 text-[11px] text-text-muted max-w-[180px] truncate" title={r.admin_notes}>
                          {r.admin_notes}
                        </p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-label-md text-text-muted">
                      {formatRelativeDate(r.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReceipt(r)}
                          className="gap-1 h-8 px-2.5 text-label-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Voir</span>
                        </Button>

                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(r)}
                              loading={approveMutation.isPending}
                              className="gap-1 h-8 px-3 text-label-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Valider & Activer</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(r)}
                              loading={rejectMutation.isPending}
                              className="h-8 px-2.5 text-label-sm text-red hover:bg-red/10 border-red/30"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Refuser</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightbox Modal for Receipt Preview */}
      <Dialog
        open={Boolean(selectedReceipt)}
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
        className="max-w-3xl"
      >
        {selectedReceipt && (
          <div className="p-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-surface border border-border px-3 py-0.5 text-label-md text-text-secondary mb-1.5">
                  <span>🇩🇿 Reçu BaridiMob</span>
                  <span>·</span>
                  <strong className="text-text-primary">
                    {Number(selectedReceipt.amount_dzd).toLocaleString()} DZD
                  </strong>
                </div>
                <h3 className="text-heading-lg text-text-primary">
                  {selectedReceipt.user_name} ({selectedReceipt.user_email})
                </h3>
                <p className="text-body-sm text-text-muted mt-0.5">
                  Demande pour le plan <strong className="text-text-primary uppercase">{selectedReceipt.plan}</strong> ({selectedReceipt.billing_interval === "annual" ? "Annuel" : "Mensuel"}) · Soumis {formatRelativeDate(selectedReceipt.created_at)}
                </p>
              </div>

              <div>
                {selectedReceipt.status === "pending" && <Badge variant="warning">En attente</Badge>}
                {selectedReceipt.status === "approved" && <Badge variant="success">Validé & Activé</Badge>}
                {selectedReceipt.status === "rejected" && <Badge variant="danger">Refusé</Badge>}
              </div>
            </div>

            {/* Receipt Image */}
            <div className="mt-4 flex max-h-[60vh] items-center justify-center overflow-auto rounded-xl border border-border bg-base p-2">
              {selectedReceipt.receipt_url ? (
                <img
                  src={selectedReceipt.receipt_url}
                  alt="Reçu de paiement BaridiMob"
                  className="max-h-full max-w-full rounded object-contain select-none"
                />
              ) : (
                <p className="text-body-sm text-text-muted py-12">Aucune image disponible</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyEmail(selectedReceipt.user_email)}
                  className="gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copier l'email</span>
                </Button>
                {selectedReceipt.receipt_url && (
                  <a
                    href={selectedReceipt.receipt_url}
                    download={`recu-${selectedReceipt.user_name}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      <span>Télécharger</span>
                    </Button>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedReceipt.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(selectedReceipt)}
                      className="text-red border-red/30 hover:bg-red/10"
                    >
                      Refuser le reçu
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedReceipt)}
                      loading={approveMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Valider & Activer l'abonnement</span>
                    </Button>
                  </>
                )}
                {selectedReceipt.status !== "pending" && (
                  <Button variant="outline" onClick={() => setSelectedReceipt(null)}>
                    Fermer
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function AuditTab() {
  const { data, isLoading } = useAuditLog();
  return (
    <div className="space-y-2">
      {isLoading && <p className="text-body-sm text-text-muted">Loading…</p>}
      {data?.map((entry) => (
        <div key={entry.id} className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-text-primary">
              <span className="font-medium">{entry.adminName}</span> {entry.action.toLowerCase()}
              {entry.targetUser && <span className="text-text-muted"> — {entry.targetUser}</span>}
            </p>
            <span className="text-label-md text-text-muted">{formatRelativeDate(entry.createdAt)}</span>
          </div>
          {entry.details && <p className="mt-1 text-label-md text-text-muted">{entry.details}</p>}
        </div>
      ))}
      {!isLoading && (!data || data.length === 0) && <p className="text-body-sm text-text-muted">No admin actions yet.</p>}
    </div>
  );
}

function SecurityTab() {
  const { data, isLoading } = useSecurityEvents();
  const severityColor = {
    low: "default", medium: "warning", high: "danger", critical: "danger",
  } as const;

  return (
    <div className="space-y-2">
      {isLoading && <p className="text-body-sm text-text-muted">Loading…</p>}
      {data?.map((event) => (
        <div key={event.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-body-sm text-text-primary">{event.eventType}</p>
              <Badge variant={severityColor[event.severity]}>{event.severity}</Badge>
            </div>
            <p className="mt-1 text-label-md text-text-muted">{event.details} · IP {event.ip} · {formatRelativeDate(event.createdAt)}</p>
          </div>
        </div>
      ))}
      {!isLoading && (!data || data.length === 0) && <p className="text-body-sm text-text-muted">No security events logged.</p>}
    </div>
  );
}

function FeedbackTab() {
  const { data, isLoading } = useAdminFeedbacks();

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-body-sm text-text-muted">Loading feedbacks…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <p className="text-body-sm text-text-muted">No feedback submitted yet.</p>
      )}
      
      <div className="grid gap-4">
        {data?.map((fb: any) => (
          <div key={fb.id} className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={fb.profiles?.name || "User"} src={fb.profiles?.avatar_url} size="sm" />
                <div>
                  <div className="text-body-sm text-text-primary">{fb.profiles?.name || "Unknown"}</div>
                  <div className="text-label-md text-text-muted">{fb.profiles?.email}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-yellow">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < fb.rating ? "fill-current" : "text-border")} />
                  ))}
                </div>
                <div className="mt-1 text-label-md text-text-muted">{formatRelativeDate(fb.created_at)}</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-label-sm font-medium text-text-secondary uppercase tracking-wider">Message</p>
                <p className="mt-1 text-body-sm text-text-primary whitespace-pre-wrap">{fb.message}</p>
              </div>
              {fb.team_message && (
                <div className="rounded-md bg-hover p-3">
                  <p className="text-label-sm font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Note for team
                  </p>
                  <p className="mt-1 text-body-sm text-text-primary whitespace-pre-wrap">{fb.team_message}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// PROMO CODES & COLLABORATORS TAB
// ═════════════════════════════════════════════════════════════════════

function PromoCodesTab() {
  const { data, isLoading } = useAdminPromos();
  const updatePromo = useUpdatePromo();
  const deletePromo = useDeletePromo();

  const [q, setQ] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [analyticsPromoId, setAnalyticsPromoId] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const promos = data?.promos || [];
  const tableMissing = data?.tableMissing;

  const filteredPromos = promos.filter((p: any) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return (
      p.code.toLowerCase().includes(term) ||
      p.collaboratorName.toLowerCase().includes(term) ||
      (p.collaboratorEmail && p.collaboratorEmail.toLowerCase().includes(term))
    );
  });

  // Global KPIs
  const totalCodes = promos.length;
  const activeCodes = promos.filter((p: any) => p.isActive).length;
  const totalSales = promos.reduce((acc: number, p: any) => acc + (p.usesCount || 0), 0);
  const totalRevenue = promos.reduce((acc: number, p: any) => acc + (p.stats?.totalRevenueDzd || 0), 0);
  const totalCommission = promos.reduce((acc: number, p: any) => acc + (p.stats?.totalCommissionDzd || 0), 0);

  function handleCopyCollabLink(secretToken: string, id: string) {
    const fullUrl = `https://gradelys.com/collab/code/${secretToken}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success("Lien unique du collaborateur copié !");
    setTimeout(() => setCopiedId(null), 2500);
  }

  async function handleToggleStatus(promo: any) {
    try {
      await updatePromo.mutateAsync({
        id: promo.id,
        isActive: !promo.isActive,
      });
      toast.success(
        !promo.isActive
          ? `Code ${promo.code} réactivé`
          : `Code ${promo.code} désactivé`
      );
    } catch (err: any) {
      toast.error(err.message || "Erreur de mise à jour");
    }
  }

  async function handleDelete(promo: any) {
    if (!confirm(`Supprimer définitivement le code "${promo.code}" (Collaborateur: ${promo.collaboratorName}) ?`)) {
      return;
    }
    try {
      await deletePromo.mutateAsync(promo.id);
      toast.success(`Code promo ${promo.code} supprimé`);
    } catch (err: any) {
      toast.error(err.message || "Erreur de suppression");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-heading-xl text-text-primary">
            Codes Promo & Collaborateurs (DZD)
          </h2>
          <p className="text-body-sm text-text-muted mt-0.5">
            Gérez vos codes promo exclusifs pour les abonnements en DZD et suivez les commissions partenaires.
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Créer un code promo</span>
        </Button>
      </div>

      {tableMissing && (
        <div className="rounded-xl border border-yellow/30 bg-yellow/5 p-4 text-body-sm text-text-secondary">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow" />
            <div>
              <p className="font-semibold text-text-primary">
                La table Supabase des codes promo n'est pas encore initialisée
              </p>
              <p className="mt-1">
                Veuillez exécuter le script SQL <code className="rounded bg-base px-1.5 py-0.5 font-mono text-primary">supabase/migration_promo_codes.sql</code> dans votre éditeur SQL Supabase pour activer cette fonctionnalité.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-label-sm font-medium">Codes Promo</span>
            <Tag className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-heading-xl text-text-primary">
            {activeCodes} <span className="text-label-sm text-text-muted font-normal">/ {totalCodes}</span>
          </div>
          <div className="mt-1 text-label-xs text-text-muted">Codes actifs</div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-label-sm font-medium">Ventes validées</span>
            <TrendingUp className="h-4 w-4 text-green" />
          </div>
          <div className="mt-2 text-heading-xl text-text-primary">
            {totalSales}
          </div>
          <div className="mt-1 text-label-xs text-text-muted">Abonnements générés</div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-label-sm font-medium">CA Total (DZD)</span>
            <DollarSign className="h-4 w-4 text-yellow" />
          </div>
          <div className="mt-2 text-heading-xl font-bold text-text-primary">
            {totalRevenue.toLocaleString()} <span className="text-label-sm font-normal text-text-muted">DZD</span>
          </div>
          <div className="mt-1 text-label-xs text-text-muted">Revenus via codes promo</div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-label-sm font-medium">Commissions DZD</span>
            <Sparkles className="h-4 w-4 text-green" />
          </div>
          <div className="mt-2 text-heading-xl font-bold text-green">
            {totalCommission.toLocaleString()} <span className="text-label-sm font-normal text-text-muted">DZD</span>
          </div>
          <div className="mt-1 text-label-xs text-text-muted">Commissions validées</div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par code ou collaborateur…"
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {isLoading ? (
          <div className="p-8 text-center text-body-sm text-text-muted">
            Chargement des codes promo…
          </div>
        ) : filteredPromos.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="mx-auto h-10 w-10 text-text-muted mb-3 opacity-50" />
            <p className="text-heading-sm text-text-primary font-medium">
              Aucun code promo trouvé
            </p>
            <p className="text-body-sm text-text-muted mt-1 max-w-md mx-auto">
              {q ? "Aucun code ne correspond à votre recherche." : "Créez votre premier code promo pour commencer à collaborer avec des créateurs de contenu ou partenaires."}
            </p>
            {!q && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="mt-4 gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span>Créer un code promo</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised text-label-xs uppercase tracking-wider text-text-muted">
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Collaborateur</th>
                  <th className="py-3 px-4 font-semibold">Réduction</th>
                  <th className="py-3 px-4 font-semibold">Commission</th>
                  <th className="py-3 px-4 font-semibold">Utilisations</th>
                  <th className="py-3 px-4 font-semibold">CA Généré</th>
                  <th className="py-3 px-4 font-semibold">Commissions</th>
                  <th className="py-3 px-4 font-semibold">Statut</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPromos.map((p: any) => {
                  const discountStr =
                    p.discountType === "percent"
                      ? `-${p.discountValue}%`
                      : `-${p.discountValue.toLocaleString()} DZD`;

                  const commissionStr =
                    p.commissionType === "percent"
                      ? `${p.commissionValue}%`
                      : `${p.commissionValue.toLocaleString()} DZD`;

                  const revenue = p.stats?.totalRevenueDzd || 0;
                  const commission = p.stats?.totalCommissionDzd || 0;

                  return (
                    <tr key={p.id} className="hover:bg-hover/40 transition">
                      {/* Code */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold tracking-wider text-text-primary px-2 py-0.5 rounded bg-base border border-border">
                          {p.code}
                        </span>
                      </td>

                      {/* Collaborator */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-text-primary">{p.collaboratorName}</div>
                        {p.collaboratorEmail && (
                          <div className="text-label-xs text-text-muted">{p.collaboratorEmail}</div>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-primary">{discountStr}</span>
                      </td>

                      {/* Commission */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-green">{commissionStr}</span>
                      </td>

                      {/* Uses */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-text-primary">{p.usesCount || 0}</span>
                        {p.maxUses ? (
                          <span className="text-label-xs text-text-muted"> / {p.maxUses}</span>
                        ) : null}
                      </td>

                      {/* Revenue */}
                      <td className="py-3 px-4 font-medium text-text-primary">
                        {revenue.toLocaleString()} DZD
                      </td>

                      {/* Commission Total */}
                      <td className="py-3 px-4 font-bold text-green">
                        {commission.toLocaleString()} DZD
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-xs font-semibold transition",
                            p.isActive
                              ? "bg-green/10 text-green hover:bg-green/20"
                              : "bg-red/10 text-red hover:bg-red/20"
                          )}
                          title="Cliquer pour activer / désactiver"
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", p.isActive ? "bg-green" : "bg-red")} />
                          <span>{p.isActive ? "Actif" : "Inactif"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Copy Link Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyCollabLink(p.secretToken, p.id)}
                            className="h-8 gap-1 px-2.5 text-label-xs"
                            title="Copier le lien unique du tableau de bord collaborateur"
                          >
                            {copiedId === p.id ? (
                              <Check className="h-3.5 w-3.5 text-green" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span>{copiedId === p.id ? "Copié !" : "Lien Collab"}</span>
                          </Button>

                          {/* Analytics Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAnalyticsPromoId(p.id)}
                            className="h-8 gap-1 px-2.5 text-label-xs"
                            title="Voir toutes les analyses et transactions de ce code promo"
                          >
                            <BarChart3 className="h-3.5 w-3.5 text-primary" />
                            <span>Analyses</span>
                          </Button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            className="rounded p-1.5 text-text-muted hover:text-red hover:bg-red/10 transition"
                            title="Supprimer ce code promo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <CreatePromoDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Analytics Modal */}
      {analyticsPromoId && (
        <PromoAnalyticsDialog
          promoId={analyticsPromoId}
          open={!!analyticsPromoId}
          onOpenChange={(open) => !open && setAnalyticsPromoId(null)}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// CREATE PROMO MODAL
// ═════════════════════════════════════════════════════════════════════

function CreatePromoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createPromo = useCreatePromo();

  const [code, setCode] = React.useState("");
  const [discountType, setDiscountType] = React.useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = React.useState("10");
  const [collaboratorName, setCollaboratorName] = React.useState("");
  const [collaboratorEmail, setCollaboratorEmail] = React.useState("");
  const [commissionType, setCommissionType] = React.useState<"percent" | "fixed">("percent");
  const [commissionValue, setCommissionValue] = React.useState("15");
  const [maxUses, setMaxUses] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Veuillez entrer un code promo.");
      return;
    }
    if (!collaboratorName.trim()) {
      toast.error("Veuillez entrer le nom du collaborateur.");
      return;
    }

    const numDiscount = Number(discountValue);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      toast.error("La réduction doit être un nombre strictement supérieur à 0.");
      return;
    }

    const numCommission = Number(commissionValue);
    if (isNaN(numCommission) || numCommission < 0) {
      toast.error("La commission doit être un nombre supérieur ou égal à 0.");
      return;
    }

    try {
      await createPromo.mutateAsync({
        code: code.trim().toUpperCase().replace(/\s+/g, ""),
        discountType,
        discountValue: numDiscount,
        collaboratorName: collaboratorName.trim(),
        collaboratorEmail: collaboratorEmail.trim() || undefined,
        commissionType,
        commissionValue: numCommission,
        maxUses: maxUses ? Number(maxUses) : undefined,
      });

      toast.success(`Code promo "${code.trim().toUpperCase()}" créé avec succès !`);
      onOpenChange(false);
      // Reset form
      setCode("");
      setCollaboratorName("");
      setCollaboratorEmail("");
      setDiscountValue("10");
      setCommissionValue("15");
      setMaxUses("");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création du code promo");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-lg">
      <div className="p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-heading-lg text-text-primary">Nouveau Code Promo (DZD)</h3>
              <p className="text-body-sm text-text-muted">
                Créez une offre personnalisée pour un collaborateur ou partenaire.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Code */}
          <div>
            <Label htmlFor="promo-code">Code Promo *</Label>
            <Input
              id="promo-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: BAC2026, AMINE10, MATHPRO"
              className="font-mono uppercase tracking-wider"
              required
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Sera saisi par les étudiants lors de leur paiement BaridiMob.
            </p>
          </div>

          {/* Discount Section */}
          <div className="rounded-xl border border-border bg-base/50 p-4 space-y-3">
            <span className="text-label-sm font-semibold uppercase tracking-wider text-text-primary">
              1. Réduction pour le client (Paiement DZD)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={cn(
                  "rounded-lg border p-2.5 text-center text-body-sm font-medium transition",
                  discountType === "percent"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-text-muted hover:border-border-strong"
                )}
              >
                Pourcentage (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={cn(
                  "rounded-lg border p-2.5 text-center text-body-sm font-medium transition",
                  discountType === "fixed"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-text-muted hover:border-border-strong"
                )}
              >
                Montant Fixe (DZD)
              </button>
            </div>

            <div>
              <Label htmlFor="promo-discount-val">
                Valeur de la réduction ({discountType === "percent" ? "%" : "DZD"}) *
              </Label>
              <Input
                id="promo-discount-val"
                type="number"
                min="1"
                max={discountType === "percent" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percent" ? "Ex: 10 pour -10%" : "Ex: 200 pour -200 DZD"}
                required
              />
            </div>
          </div>

          {/* Collaborator Section */}
          <div className="rounded-xl border border-border bg-base/50 p-4 space-y-3">
            <span className="text-label-sm font-semibold uppercase tracking-wider text-text-primary">
              2. Collaborateur & Commission
            </span>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="collab-name">Nom du collaborateur *</Label>
                <Input
                  id="collab-name"
                  value={collaboratorName}
                  onChange={(e) => setCollaboratorName(e.target.value)}
                  placeholder="Ex: Mohamed Amine"
                  required
                />
              </div>
              <div>
                <Label htmlFor="collab-email">Email (Optionnel)</Label>
                <Input
                  id="collab-email"
                  type="email"
                  value={collaboratorEmail}
                  onChange={(e) => setCollaboratorEmail(e.target.value)}
                  placeholder="amine@exemple.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCommissionType("percent")}
                className={cn(
                  "rounded-lg border p-2.5 text-center text-body-sm font-medium transition",
                  commissionType === "percent"
                    ? "border-green bg-green/10 text-green"
                    : "border-border bg-surface text-text-muted hover:border-border-strong"
                )}
              >
                Commission en %
              </button>
              <button
                type="button"
                onClick={() => setCommissionType("fixed")}
                className={cn(
                  "rounded-lg border p-2.5 text-center text-body-sm font-medium transition",
                  commissionType === "fixed"
                    ? "border-green bg-green/10 text-green"
                    : "border-border bg-surface text-text-muted hover:border-border-strong"
                )}
              >
                Commission Fixe (DZD)
              </button>
            </div>

            <div>
              <Label htmlFor="collab-comm-val">
                Montant de la commission ({commissionType === "percent" ? "%" : "DZD"}) *
              </Label>
              <Input
                id="collab-comm-val"
                type="number"
                min="0"
                max={commissionType === "percent" ? "100" : undefined}
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                placeholder={commissionType === "percent" ? "Ex: 15 pour 15%" : "Ex: 300 pour 300 DZD"}
                required
              />
            </div>
          </div>

          {/* Max Uses */}
          <div>
            <Label htmlFor="promo-max-uses">Limite d'utilisations (Optionnel)</Label>
            <Input
              id="promo-max-uses"
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Laisser vide pour illimité"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={createPromo.isPending}
            >
              Créer le code promo
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

// ═════════════════════════════════════════════════════════════════════
// PROMO ANALYTICS MODAL
// ═════════════════════════════════════════════════════════════════════

function PromoAnalyticsDialog({
  promoId,
  open,
  onOpenChange,
}: {
  promoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = usePromoDetails(promoId);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const promo = data?.promo;
  const receipts = data?.receipts || [];

  function handleCopyCollabLink() {
    if (!promo?.secretToken) return;
    const fullUrl = `https://gradelys.com/collab/code/${promo.secretToken}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("Lien secret du collaborateur copié !");
    setTimeout(() => setCopiedLink(false), 2500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-4xl">
      <div className="p-6">
        {isLoading || !promo ? (
          <div className="py-12 text-center text-body-sm text-text-muted">
            Chargement des analyses…
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-heading-xl font-bold tracking-wider text-primary px-3 py-1 rounded-lg bg-base border border-border">
                    {promo.code}
                  </span>
                  <Badge variant={promo.isActive ? "success" : "danger"}>
                    {promo.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <h3 className="mt-2 text-heading-md text-text-primary">
                  Collaborateur : <strong className="text-text-primary">{promo.collaboratorName}</strong>
                  {promo.collaboratorEmail && (
                    <span className="text-text-muted font-normal text-body-sm ml-2">({promo.collaboratorEmail})</span>
                  )}
                </h3>
                <p className="text-label-sm text-text-muted mt-1">
                  Réduction : <strong className="text-text-primary">{promo.discountType === "percent" ? `-${promo.discountValue}%` : `-${promo.discountValue} DZD`}</strong>
                  {" · "}
                  Commission : <strong className="text-green">{promo.commissionType === "percent" ? `${promo.commissionValue}%` : `${promo.commissionValue} DZD`}</strong>
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCollabLink}
                className="gap-2 shrink-0"
              >
                {copiedLink ? <Check className="h-4 w-4 text-green" /> : <Copy className="h-4 w-4" />}
                <span>{copiedLink ? "Lien copié !" : "Copier le lien dashboard collab"}</span>
              </Button>
            </div>

            {/* Secret URL Box */}
            <div className="rounded-xl border border-primary/20 bg-surface-raised p-3.5">
              <div className="flex items-center justify-between text-label-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
                <span>Lien secret Collaborateur (Unguessable & Privé)</span>
                <span className="text-text-muted font-normal lowercase">Accès direct sans mot de passe</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-base p-2.5 font-mono text-label-sm text-text-secondary select-all break-all">
                <span>
                  https://gradelys.com/collab/code/{promo.secretToken}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCollabLink}
                  className="shrink-0 h-7 px-2"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Analytics KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <span className="text-label-xs font-medium text-text-muted uppercase">Chiffre d'Affaires</span>
                <div className="mt-2 text-heading-lg font-bold text-text-primary">
                  {promo.stats.totalRevenueDzd.toLocaleString()} <span className="text-label-sm font-normal text-text-muted">DZD</span>
                </div>
                <div className="mt-1 text-label-xs text-text-muted">{promo.stats.approvedCount} ventes confirmées</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <span className="text-label-xs font-medium text-text-muted uppercase">Commissions Validées</span>
                <div className="mt-2 text-heading-lg font-bold text-green">
                  {promo.stats.totalCommissionDzd.toLocaleString()} <span className="text-label-sm font-normal text-text-muted">DZD</span>
                </div>
                <div className="mt-1 text-label-xs text-text-muted">À reverser au collaborateur</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <span className="text-label-xs font-medium text-text-muted uppercase">Commissions en Attente</span>
                <div className="mt-2 text-heading-lg font-bold text-yellow">
                  {promo.stats.pendingCommissionDzd.toLocaleString()} <span className="text-label-sm font-normal text-text-muted">DZD</span>
                </div>
                <div className="mt-1 text-label-xs text-text-muted">{promo.stats.pendingCount} reçus en attente</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <span className="text-label-xs font-medium text-text-muted uppercase">Taux d'approbation</span>
                <div className="mt-2 text-heading-lg font-bold text-primary">
                  {promo.stats.approvedCount + promo.stats.rejectedCount > 0
                    ? Math.round(
                        (promo.stats.approvedCount /
                          (promo.stats.approvedCount + promo.stats.rejectedCount)) *
                          100
                      )
                    : 100}
                  %
                </div>
                <div className="mt-1 text-label-xs text-text-muted">{promo.stats.rejectedCount} rejetés</div>
              </div>
            </div>

            {/* Plan Breakdown */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <h4 className="text-label-sm font-semibold uppercase tracking-wider text-text-primary mb-3">
                Répartition des ventes par formule
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                <div className="rounded-lg bg-base border border-border p-3">
                  <div className="text-label-xs text-text-muted">Plus Mensuel</div>
                  <div className="mt-1 text-heading-md font-bold text-text-primary">
                    {promo.stats.planBreakdown.plusMonthly}
                  </div>
                </div>
                <div className="rounded-lg bg-base border border-border p-3">
                  <div className="text-label-xs text-text-muted">Plus Annuel</div>
                  <div className="mt-1 text-heading-md font-bold text-text-primary">
                    {promo.stats.planBreakdown.plusAnnual}
                  </div>
                </div>
                <div className="rounded-lg bg-base border border-border p-3">
                  <div className="text-label-xs text-text-muted">Pro Mensuel</div>
                  <div className="mt-1 text-heading-md font-bold text-text-primary">
                    {promo.stats.planBreakdown.proMonthly}
                  </div>
                </div>
                <div className="rounded-lg bg-base border border-border p-3">
                  <div className="text-label-xs text-text-muted">Pro Annuel</div>
                  <div className="mt-1 text-heading-md font-bold text-text-primary">
                    {promo.stats.planBreakdown.proAnnual}
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions History Table */}
            <div>
              <h4 className="text-label-sm font-semibold uppercase tracking-wider text-text-primary mb-3">
                Historique des souscriptions ({receipts.length})
              </h4>

              {receipts.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface p-8 text-center text-body-sm text-text-muted">
                  Aucun reçu soumis avec ce code promo pour le moment.
                </div>
              ) : (
                <div className="max-h-72 overflow-auto rounded-xl border border-border bg-surface">
                  <table className="w-full text-left border-collapse text-body-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised text-label-xs uppercase tracking-wider text-text-muted">
                        <th className="py-2.5 px-3 font-semibold">Date</th>
                        <th className="py-2.5 px-3 font-semibold">Client</th>
                        <th className="py-2.5 px-3 font-semibold">Formule</th>
                        <th className="py-2.5 px-3 font-semibold">Montant payé</th>
                        <th className="py-2.5 px-3 font-semibold">Réduction</th>
                        <th className="py-2.5 px-3 font-semibold">Commission</th>
                        <th className="py-2.5 px-3 font-semibold">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {receipts.map((r: any) => (
                        <tr key={r.id} className="hover:bg-hover/40 transition">
                          <td className="py-2.5 px-3 text-label-sm text-text-muted">
                            {formatRelativeDate(r.created_at)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-text-primary">{r.user_name}</div>
                            <div className="text-label-xs text-text-muted">{r.user_email}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="capitalize font-semibold text-text-primary">{r.plan}</span>
                            <span className="text-label-xs text-text-muted ml-1">
                              ({r.billing_interval === "annual" ? "1 an" : "1 mois"})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-text-primary">
                            {Number(r.amount_dzd).toLocaleString()} DZD
                          </td>
                          <td className="py-2.5 px-3 text-label-sm text-primary">
                            -{Number(r.discount_applied || 0).toLocaleString()} DZD
                          </td>
                          <td className="py-2.5 px-3 font-bold text-green">
                            +{Number(r.commission_amount || 0).toLocaleString()} DZD
                          </td>
                          <td className="py-2.5 px-3">
                            {r.status === "approved" && <Badge variant="success">Validé</Badge>}
                            {r.status === "pending" && <Badge variant="warning">En attente</Badge>}
                            {r.status === "rejected" && <Badge variant="danger">Rejeté</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

