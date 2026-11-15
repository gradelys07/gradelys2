import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAssistantRateLimit } from "@/lib/assistant/rate-limit";
import { streamAssistant } from "@/lib/assistant/provider";
import { calibratePrompt } from "@/lib/ai/personalize-prompt";
import {
  AssistantRequestSchema,
  MAX_BODY_BYTES,
  validateScreenshotBytes,
  type AssistantSSEEvent,
} from "@/lib/assistant/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-store, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

function sseEventLine(event: AssistantSSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function sseErrorResponse(
  code: Extract<AssistantSSEEvent, { type: "error" }>["code"],
  message: string,
  status: number
): Response {
  return new Response(sseEventLine({ type: "error", code, message }), {
    status,
    headers: SSE_HEADERS,
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  const startedAt = Date.now();
  let userId = "anonymous";
  let payloadBytes = 0;
  let hasImage = false;

  const logSummary = (status: number) => {
    console.info(
      JSON.stringify({
        route: "/api/assistant",
        userId,
        payloadBytes,
        hasImage,
        durationMs: Date.now() - startedAt,
        status,
      })
    );
  };

  try {
    // 1. Auth check via existing Supabase session cookies (reject unauthenticated & anonymous demo sessions)
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.is_anonymous) {
      logSummary(401);
      return sseErrorResponse(
        "auth",
        "Connecte-toi à ton compte Gradelys pour utiliser l'assistant.",
        401
      );
    }

    userId = user.id;

    // Verify account is active (not banned/deleted) and load learning profile for main-chat parity
    const { data: profile } = await supabase
      .from("profiles")
      .select("status, learning_profile")
      .eq("id", user.id)
      .single();

    if (profile && (profile.status === "banned" || profile.status === "deleted")) {
      logSummary(401);
      return sseErrorResponse(
        "auth",
        "Ce compte ne peut pas accéder à l'assistant pour le moment.",
        401
      );
    }

    // 2. Enforce max request size (<= 3.5 MB)
    const contentLengthHeader = req.headers.get("content-length");
    if (contentLengthHeader) {
      const declaredBytes = Number.parseInt(contentLengthHeader, 10);
      if (Number.isFinite(declaredBytes) && declaredBytes > MAX_BODY_BYTES) {
        logSummary(413);
        return sseErrorResponse(
          "too_large",
          "La requête est trop volumineuse (maximum 3,5 Mo).",
          413
        );
      }
    }

    const rawText = await req.text();
    payloadBytes = Buffer.byteLength(rawText, "utf8");
    if (payloadBytes > MAX_BODY_BYTES) {
      logSummary(413);
      return sseErrorResponse(
        "too_large",
        "La requête est trop volumineuse (maximum 3,5 Mo).",
        413
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      logSummary(400);
      return sseErrorResponse("bad_request", "Corps de requête JSON invalide.", 400);
    }

    // 3. Strict Zod validation
    const validated = AssistantRequestSchema.safeParse(parsedJson);
    if (!validated.success) {
      logSummary(400);
      return sseErrorResponse(
        "bad_request",
        "Paramètres invalides pour l'assistant.",
        400
      );
    }

    const payload = validated.data;
    hasImage = payload.screenshot !== null;

    if (payload.screenshot) {
      const imgCheck = validateScreenshotBytes(payload.screenshot.imageBase64);
      if (!imgCheck.ok) {
        const status = imgCheck.code === "too_large" ? 413 : 400;
        logSummary(status);
        return sseErrorResponse(imgCheck.code, imgCheck.message, status);
      }
    }

    // 4. Per-user rate limiting (Upstash Redis or in-memory fallback)
    const rate = await checkAssistantRateLimit(user.id, hasImage);
    if (!rate.allowed) {
      logSummary(429);
      return sseErrorResponse("rate_limit", rate.message, 429);
    }

    const extraSystemContext = profile?.learning_profile
      ? calibratePrompt("", profile.learning_profile as Parameters<typeof calibratePrompt>[1])
      : "";

    // Resolve or create the synced main Gradelys conversation thread
    let activeConversationId: string | null = payload.conversationId ?? null;
    try {
      if (activeConversationId) {
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("id")
          .eq("id", activeConversationId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!existingConv) {
          activeConversationId = null;
        }
      }

      if (!activeConversationId) {
        const firstUserText =
          payload.messages.find((m) => m.role === "user")?.content.trim() ?? "";
        const titleSource = firstUserText || "Assistant écran";
        const title =
          titleSource.length > 60 ? `${titleSource.slice(0, 57).trimEnd()}…` : titleSource;

        const { data: createdConv } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            space_id: null,
            kind: "chat",
            title,
          })
          .select("id")
          .single();

        activeConversationId = createdConv?.id ?? null;
      }
    } catch (convErr) {
      console.warn(
        "[api/assistant] Conversation lookup/insert skipped:",
        convErr instanceof Error ? convErr.message : convErr
      );
      activeConversationId = null;
    }

    // 5. Stream AI response & tool calls via SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let finalStatus = 200;
        let fullAssistantText = "";
        let emittedDraw = false;
        let emittedTerminal = false;
        try {
          if (activeConversationId) {
            controller.enqueue(
              encoder.encode(
                sseEventLine({ type: "conversation", conversationId: activeConversationId })
              )
            );
          }

          for await (const event of streamAssistant(payload, extraSystemContext)) {
            if (event.type === "text_delta") {
              fullAssistantText += event.text;
            } else if (event.type === "draw") {
              emittedDraw = true;
            } else if (event.type === "error" || event.type === "need_screenshot") {
              emittedTerminal = true;
            }

            if (event.type === "done" && !fullAssistantText.trim() && !emittedDraw && !emittedTerminal) {
              emittedTerminal = true;
              finalStatus = 502;
              controller.enqueue(
                encoder.encode(
                  sseEventLine({
                    type: "error",
                    code: "upstream",
                    message:
                      "L'assistant n'a renvoyé aucune réponse exploitable. Réessaie dans un instant.",
                  })
                )
              );
              break;
            }

            if (event.type === "done" && activeConversationId && fullAssistantText.trim()) {
              const lastUserMsg = [...payload.messages]
                .reverse()
                .find((m) => m.role === "user")?.content;
              try {
                const rowsToInsert: Array<{
                  conversation_id: string;
                  role: "user" | "assistant";
                  content: string;
                }> = [];
                if (lastUserMsg?.trim()) {
                  rowsToInsert.push({
                    conversation_id: activeConversationId,
                    role: "user",
                    content: lastUserMsg.trim(),
                  });
                }
                rowsToInsert.push({
                  conversation_id: activeConversationId,
                  role: "assistant",
                  content: fullAssistantText.trim(),
                });
                await supabase.from("messages").insert(rowsToInsert);
                await supabase
                  .from("conversations")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", activeConversationId);
              } catch (persistErr) {
                console.warn(
                  "[api/assistant] Message persistence skipped:",
                  persistErr instanceof Error ? persistErr.message : persistErr
                );
              }
            }
            controller.enqueue(encoder.encode(sseEventLine(event)));
            if (event.type === "done") {
              emittedTerminal = true;
            }
            if (event.type === "need_screenshot") {
              break;
            }
          }

          if (!emittedTerminal && !fullAssistantText.trim() && !emittedDraw) {
            finalStatus = 502;
            controller.enqueue(
              encoder.encode(
                sseEventLine({
                  type: "error",
                  code: "upstream",
                  message:
                    "L'assistant n'a renvoyé aucune réponse exploitable. Réessaie dans un instant.",
                })
              )
            );
          }
        } catch (err) {
          finalStatus = 502;
          const isTimeout =
            err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
          console.error(
            "[assistant] upstream error:",
            err instanceof Error ? err.message.replace(/key=[^&\s]+/gi, "key=[REDACTED]") : "unknown"
          );
          controller.enqueue(
            encoder.encode(
              sseEventLine({
                type: "error",
                code: "upstream",
                message: isTimeout
                  ? "L'assistant met trop de temps à répondre. Réessaie dans quelques instants."
                  : "L'assistant rencontre un problème temporaire. Réessaie dans quelques instants.",
              })
            )
          );
        } finally {
          logSummary(finalStatus);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: SSE_HEADERS,
    });
  } catch (err) {
    console.error("[assistant] unexpected failure:", err instanceof Error ? err.message : "unknown");
    logSummary(500);
    return sseErrorResponse(
      "upstream",
      "Une erreur inattendue est survenue. Réessaie dans quelques instants.",
      500
    );
  }
}

