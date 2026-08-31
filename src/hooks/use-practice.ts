"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import type { PracticeSession, QuizQuestion } from "@/types";

export function usePracticeSessions(spaceId?: string) {
  return useQuery({
    queryKey: ["practice-sessions", spaceId],
    queryFn: () => apiFetch<{ sessions: PracticeSession[] }>(`/api/practice-sessions${spaceId ? `?spaceId=${spaceId}` : ""}`),
    select: (d) => d.sessions,
  });
}

export function useSaveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<PracticeSession, "id" | "userId" | "completedAt">) =>
      apiFetch("/api/practice-sessions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["practice-sessions"] }),
  });
}

export function useGenerateQuiz() {
  return useMutation({
    mutationFn: (body: { subject: string; spaceId: string; count?: number; difficulty?: string; customPrompt?: string }) =>
      apiFetch<{ questions: QuizQuestion[] }>("/api/quiz/generate", { method: "POST", body: JSON.stringify(body) }),
  });
}
