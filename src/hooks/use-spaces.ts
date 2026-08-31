"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import type { Space, SpaceSource, SpaceTemplate, SourceType } from "@/types";

export function useSpaces() {
  return useQuery({
    queryKey: ["spaces"],
    queryFn: () => apiFetch<{ spaces: Space[] }>("/api/spaces"),
    select: (d) => d.spaces,
  });
}

export function useCreateSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; emoji?: string; color?: string; template?: SpaceTemplate }) =>
      apiFetch<{ space: Space }>("/api/spaces", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spaces"] }),
  });
}

export function useDeleteSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/spaces/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spaces"] }),
  });
}

export function useSources(spaceId: string | null) {
  return useQuery({
    queryKey: ["sources", spaceId],
    queryFn: () => apiFetch<{ sources: SpaceSource[] }>(`/api/spaces/${spaceId}/sources`),
    select: (d) => d.sources,
    enabled: Boolean(spaceId),
  });
}

export function useAddSource(spaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: SourceType; name: string; url?: string; contentPreview?: string }) =>
      apiFetch<{ source: SpaceSource }>(`/api/spaces/${spaceId}/sources`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources", spaceId] }),
  });
}

export function useUploadSource(spaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fileName: string; mimeType: string; fileBase64: string }) =>
      apiFetch<{ source: SpaceSource }>(`/api/spaces/${spaceId}/sources/upload`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources", spaceId] }),
  });
}

export function useDeleteSource(spaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/sources/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources", spaceId] }),
  });
}
