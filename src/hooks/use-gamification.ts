"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";

interface GamificationData {
  streak: { current_streak: number; longest_streak: number; last_activity_date: string | null; total_study_days: number };
  badges: { type: string; earned_at: string }[];
  counters: Record<string, number>;
}

export function useGamification() {
  return useQuery({
    queryKey: ["gamification"],
    queryFn: () => apiFetch<GamificationData>("/api/gamification"),
  });
}

export function useRecordActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ newlyEarned: string[] }>("/api/gamification/activity", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gamification"] }),
  });
}
