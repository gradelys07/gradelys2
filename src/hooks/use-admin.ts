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

export function useAdminFeedbacks() {
  return useQuery({
    queryKey: ["admin-feedbacks"],
    queryFn: () => apiFetch<{ feedbacks: any[] }>("/api/admin/feedbacks"),
    select: (d) => d.feedbacks,
  });
}

export function useAdminDzdReceipts(status?: string) {
  return useQuery({
    queryKey: ["admin-dzd-receipts", status],
    queryFn: () =>
      apiFetch<{ receipts: any[]; tableMissing?: boolean }>(
        `/api/admin/dzd-receipts${status && status !== "all" ? `?status=${status}` : ""}`
      ),
  });
}

export function useApproveDzdReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      adminNotes,
      customPlan,
      customInterval,
    }: {
      id: string;
      adminNotes?: string;
      customPlan?: "plus" | "pro";
      customInterval?: "monthly" | "annual";
    }) =>
      apiFetch<{ ok: boolean; status: string; userActivated: boolean; message: string }>(
        `/api/admin/dzd-receipts/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action: "approve",
            adminNotes,
            customPlan,
            customInterval,
          }),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-dzd-receipts"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useRejectDzdReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminNotes }: { id: string; adminNotes?: string }) =>
      apiFetch<{ ok: boolean; status: string }>(`/api/admin/dzd-receipts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reject", adminNotes }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-dzd-receipts"] });
    },
  });
}

export function useAdminPromos() {
  return useQuery({
    queryKey: ["admin-promos"],
    queryFn: () =>
      apiFetch<{ promos: any[]; tableMissing?: boolean }>("/api/admin/promos"),
  });
}

export function usePromoDetails(id: string | null) {
  return useQuery({
    queryKey: ["admin-promo-details", id],
    queryFn: () => apiFetch<{ promo: any; receipts: any[] }>(`/api/admin/promos/${id}`),
    enabled: !!id,
  });
}

export function useCreatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      code: string;
      discountType: "percent" | "fixed";
      discountValue: number;
      collaboratorName: string;
      collaboratorEmail?: string;
      commissionType: "percent" | "fixed";
      commissionValue: number;
      maxUses?: number;
    }) =>
      apiFetch<{ ok: boolean; promo: any; message: string }>("/api/admin/promos", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
    },
  });
}

export function useUpdatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: string;
      isActive?: boolean;
      collaboratorName?: string;
      collaboratorEmail?: string;
      commissionType?: "percent" | "fixed";
      commissionValue?: number;
      maxUses?: number | null;
    }) =>
      apiFetch<{ ok: boolean; promo: any }>(`/api/admin/promos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
      qc.invalidateQueries({ queryKey: ["admin-promo-details", variables.id] });
    },
  });
}

export function useDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/admin/promos/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
    },
  });
}


