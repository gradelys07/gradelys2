"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";

export function useGradeExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      conversationId: string;
      spaceId: string;
      questions: { id: string; question: string; points: number }[];
      answers: Record<string, string>;
    }) => apiFetch<{ message: any }>("/api/practice/grade-exam", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["practice-sessions"] }),
  });
}
