"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import type { Scan } from "@/types";

export function useScans() {
  return useQuery({
    queryKey: ["scans"],
    queryFn: () => apiFetch<{ scans: Scan[] }>("/api/scans"),
    select: (d) => d.scans,
  });
}

export function useCreateScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { subject: string; chapter?: string; imageBase64: string; mimeType: string }) =>
      apiFetch<{ scan: Scan }>("/api/scans", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scans"] }),
  });
}

export function useDeleteScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/scans/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scans"] }),
  });
}
