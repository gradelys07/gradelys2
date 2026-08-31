"use client";

import * as React from "react";
import { Users, DollarSign, Activity, Ban, Search, Shield, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import {
  useAdminStats, useAdminUsers, useAuditLog, useSecurityEvents, useUpdateAdminUser,
} from "@/hooks/use-admin";
import { cn, formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-display-md text-text-primary">Admin</h1>
      </div>

      <Tabs defaultValue="dashboard" className="mt-8">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-6"><DashboardTab /></TabsContent>
        <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
        <TabsContent value="audit" className="mt-6"><AuditTab /></TabsContent>
        <TabsContent value="security" className="mt-6"><SecurityTab /></TabsContent>
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
