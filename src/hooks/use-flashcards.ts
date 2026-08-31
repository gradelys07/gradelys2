"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import type { Flashcard, FlashcardDeck, Rating } from "@/types";

export function useDecks(spaceId?: string) {
  return useQuery({
    queryKey: ["decks", spaceId],
    queryFn: () => apiFetch<{ decks: FlashcardDeck[] }>(`/api/decks${spaceId ? `?spaceId=${spaceId}` : ""}`),
    select: (d) => d.decks,
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; subject?: string; spaceId?: string | null }) =>
      apiFetch<{ deck: FlashcardDeck }>("/api/decks", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/decks/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
  });
}

export function useCards(deckId: string | null) {
  return useQuery({
    queryKey: ["cards", deckId],
    queryFn: () => apiFetch<{ cards: Flashcard[] }>(`/api/decks/${deckId}/cards`),
    select: (d) => d.cards,
    enabled: Boolean(deckId),
  });
}

export function useAddCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { question: string; answer: string; hint?: string }) =>
      apiFetch<{ card: Flashcard }>(`/api/decks/${deckId}/cards`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards", deckId] }),
  });
}

export function useGenerateFlashcards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { deckId: string; topic?: string; sourceText?: string; spaceId?: string; customPrompt?: string; count?: number }) =>
      apiFetch<{ cards: Flashcard[] }>("/api/flashcards/generate", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["cards", vars.deckId] }),
  });
}

export function useReviewCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: Rating }) =>
      apiFetch<{ card: Flashcard }>(`/api/cards/${id}`, { method: "PATCH", body: JSON.stringify({ rating }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards", deckId] }),
  });
}

export function useDeleteCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/cards/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards", deckId] }),
  });
}
