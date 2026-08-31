"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import type { VisualizeOutput, VisualType } from "@/types";

export function useVisualizeOutputs(spaceId?: string) {
  return useQuery({
    queryKey: ["visualize", spaceId],
    queryFn: () => apiFetch<{ outputs: VisualizeOutput[] }>(`/api/visualize${spaceId ? `?spaceId=${spaceId}` : ""}`),
    select: (d) => d.outputs,
  });
}

export function useGenerateVisualization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { prompt: string; type: VisualType; spaceId: string; customPrompt?: string }) =>
      apiFetch<{ output: VisualizeOutput }>("/api/visualize", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visualize"] }),
  });
}

export function useDeleteVisualization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/visualize/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visualize"] }),
  });
}
