"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import type { AdminUserRow, AuditLogEntry, SecurityEvent } from "@/types";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () =>
      apiFetch<{
        totalUsers: number;
        activeToday: number;
        bannedUsers: number;
        planCounts: { free: number; plus: number; pro: number };
        mrr: number;
        avgCreditsUsedPct: number;
      }>("/api/admin/stats"),
  });
}

export function useAdminUsers(params: { q?: string; status?: string; plan?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.plan) search.set("plan", params.plan);
  if (params.page) search.set("page", String(params.page));

  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => apiFetch<{ users: AdminUserRow[]; total: number }>(`/api/admin/users?${search.toString()}`),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; status?: string; banReason?: string; plan?: string; interval?: "monthly" | "annual"; creditsDelta?: number }) =>
      apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["audit-log"],
    queryFn: () => apiFetch<{ entries: AuditLogEntry[] }>("/api/admin/audit-log"),
    select: (d) => d.entries,
  });
}

export function useSecurityEvents() {
  return useQuery({
    queryKey: ["security-events"],
    queryFn: () => apiFetch<{ events: SecurityEvent[] }>("/api/admin/security-events"),
    select: (d) => d.events,
  });
}
