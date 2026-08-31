"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import type { StudioDocType, StudioDocument } from "@/types";

export function useStudioDocuments(spaceId?: string) {
  return useQuery({
    queryKey: ["studio", spaceId],
    queryFn: () => apiFetch<{ documents: StudioDocument[] }>(`/api/studio${spaceId ? `?spaceId=${spaceId}` : ""}`),
    select: (d) => d.documents,
  });
}

export function useStudioDocument(id: string) {
  return useQuery({
    queryKey: ["studio-document", id],
    queryFn: () => apiFetch<{ document: StudioDocument }>(`/api/studio/${id}`),
    select: (d) => d.document,
    enabled: Boolean(id),
  });
}

export function useGenerateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { topic: string; type: StudioDocType; spaceId: string; customPrompt?: string }) =>
      apiFetch<{ document: StudioDocument }>("/api/studio", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio"] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; title?: string; content?: string }) =>
      apiFetch<{ document: StudioDocument }>(`/api/studio/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio"] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/studio/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio"] }),
  });
}
