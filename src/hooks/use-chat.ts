"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import type { ChatMessage, Conversation } from "@/types";

export function useConversations(kind: "chat" | "visualize" | "studio" | "practice" = "chat", spaceId?: string) {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (spaceId) params.set("spaceId", spaceId);
  return useQuery({
    queryKey: ["conversations", kind, spaceId],
    queryFn: () => apiFetch<{ conversations: Conversation[] }>(`/api/conversations?${params.toString()}`),
    select: (d) => d.conversations,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { spaceId?: string | null; title?: string; kind?: "chat" | "visualize" | "studio" | "practice" }) =>
      apiFetch<{ conversation: Conversation }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; title?: string; pinned?: boolean; model?: string; webSearchEnabled?: boolean; spaceId?: string | null }) =>
      apiFetch(`/api/conversations/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/conversations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => apiFetch<{ messages: ChatMessage[] }>(`/api/conversations/${conversationId}/messages`),
    select: (d) => d.messages,
    enabled: Boolean(conversationId),
  });
}

export function useSetMessageFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: "up" | "down" | null }) =>
      apiFetch(`/api/messages/${id}`, { method: "PATCH", body: JSON.stringify({ feedback }) }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

/** Streams a chat completion from /api/chat, invoking onChunk as text arrives. */
export async function streamChat(
  conversationId: string,
  message: string,
  model: string,
  onChunk: (text: string) => void,
  image?: { mimeType: string; data: string }
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, message, model, image }),
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Chat request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk(chunk);
  }
  return full;
}
