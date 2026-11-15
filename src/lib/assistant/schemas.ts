import { z } from "zod";

export const MAX_BODY_BYTES = Math.floor(1.5 * 1024 * 1024); // 1.5 MB
export const MAX_IMAGE_BYTES = 500 * 1024; // 500 KB decoded JPEG cap for minimal token cost
export const MAX_AUDIO_BYTES = 6 * 1024 * 1024; // 6 MB decoded
export const MAX_AUDIO_BODY_BYTES = Math.floor(8.5 * 1024 * 1024); // 8.5 MB JSON body cap

export const PointSchema = z.object({
  x: z.number().finite().min(0).max(1000),
  y: z.number().finite().min(0).max(1000),
});

export const DrawCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("circle"),
    at: PointSchema,
    radius: z.number().finite().gt(0).max(1000).optional(),
  }),
  z.object({
    type: z.literal("rect"),
    from: PointSchema,
    to: PointSchema,
  }),
  z.object({
    type: z.literal("arrow"),
    from: PointSchema,
    to: PointSchema,
  }),
  z.object({
    type: z.literal("highlight"),
    from: PointSchema,
    to: PointSchema,
  }),
  z.object({
    type: z.literal("text"),
    at: PointSchema,
    text: z.string().trim().min(1).max(60),
  }),
  z.object({
    type: z.literal("step"),
    n: z.number().int().min(1).max(99),
    label: z.string().trim().max(60).optional(),
  }),
  z.object({
    type: z.literal("clear"),
  }),
]);

export type DrawCommand = z.infer<typeof DrawCommandSchema>;

export const AssistantMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export const AssistantScreenshotSchema = z.object({
  imageBase64: z.string().min(16).max(3_000_000),
  mimeType: z.literal("image/jpeg"),
  width: z.number().int().min(1).max(2000),
  height: z.number().int().min(1).max(2000),
});

export const AssistantContextSchema = z.object({
  desktop: z.boolean(),
  platform: z.enum(["darwin", "win32"]).optional(),
  locale: z.literal("fr").optional(),
});

export const AssistantRequestSchema = z.object({
  messages: z.array(AssistantMessageSchema).min(1).max(20),
  screenshot: AssistantScreenshotSchema.nullable(),
  context: AssistantContextSchema,
  conversationId: z.string().uuid().nullable().optional(),
  isScreenshotFollowUp: z.boolean().optional(),
  disableCapture: z.boolean().optional(),
});

export type AssistantRequestPayload = z.infer<typeof AssistantRequestSchema>;

export const TranscribeMimeTypeSchema = z.enum([
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/mpeg",
]);

export const TranscribeRequestSchema = z.object({
  audioBase64: z.string().min(16).max(8_500_000),
  mimeType: TranscribeMimeTypeSchema,
  language: z.literal("fr").optional(),
});

export type TranscribeRequestPayload = z.infer<typeof TranscribeRequestSchema>;

export type AssistantErrorCode =
  | "auth"
  | "rate_limit"
  | "too_large"
  | "bad_request"
  | "upstream";

export type AssistantSSEEvent =
  | { type: "conversation"; conversationId: string }
  | { type: "text_delta"; text: string }
  | { type: "need_screenshot"; reason: string }
  | { type: "draw"; commands: DrawCommand[] }
  | { type: "done" }
  | { type: "error"; code: AssistantErrorCode; message: string };

/**
 * Validates and sanitizes draw commands emitted by an AI model tool call.
 * Invalid commands are silently dropped; at most 30 commands are retained.
 */
export function validateDrawCommands(raw: unknown): DrawCommand[] {
  if (!Array.isArray(raw)) return [];
  const valid: DrawCommand[] = [];

  for (const item of raw) {
    if (valid.length >= 30) break;
    if (!item || typeof item !== "object") continue;

    const candidate: Record<string, unknown> = { ...(item as Record<string, unknown>) };
    if (candidate.type === "text" && typeof candidate.text === "string") {
      candidate.text = candidate.text.trim().slice(0, 60);
    }
    if (candidate.type === "step" && typeof candidate.label === "string") {
      candidate.label = candidate.label.trim().slice(0, 60) || undefined;
    }

    const parsed = DrawCommandSchema.safeParse(candidate);
    if (parsed.success) {
      if (parsed.data.type === "circle" && parsed.data.radius === undefined) {
        valid.push({ ...parsed.data, radius: 40 });
      } else {
        valid.push(parsed.data);
      }
    }
  }

  return valid;
}

/**
 * Validates base64 payload size (<= 2 MB) and verifies JPEG SOI header (0xFF 0xD8 0xFF).
 */
export function validateScreenshotBytes(base64: string): { ok: true; byteLength: number } | { ok: false; code: "too_large" | "bad_request"; message: string } {
  const cleaned = base64.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) {
    return { ok: false, code: "bad_request", message: "Format d'image base64 invalide." };
  }

  const decoded = Buffer.from(cleaned, "base64");
  if (decoded.byteLength === 0) {
    return { ok: false, code: "bad_request", message: "Image vide." };
  }
  if (decoded.byteLength > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      code: "too_large",
      message: "La capture d'écran dépasse la limite de 2 Mo.",
    };
  }
  if (decoded.byteLength < 3 || decoded[0] !== 0xff || decoded[1] !== 0xd8 || decoded[2] !== 0xff) {
    return {
      ok: false,
      code: "bad_request",
      message: "Seules les images JPEG valides sont acceptées.",
    };
  }

  return { ok: true, byteLength: decoded.byteLength };
}

/**
 * Validates base64 audio payload size (<= 6 MB) for voice dictation transcription.
 */
export function validateAudioBytes(
  base64: string
): { ok: true; byteLength: number; buffer: Buffer } | { ok: false; code: "too_large" | "bad_request"; message: string } {
  const cleaned = base64.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) {
    return { ok: false, code: "bad_request", message: "Format audio base64 invalide." };
  }

  const decoded = Buffer.from(cleaned, "base64");
  if (decoded.byteLength < 32) {
    return { ok: false, code: "bad_request", message: "Enregistrement audio vide ou trop court." };
  }
  if (decoded.byteLength > MAX_AUDIO_BYTES) {
    return {
      ok: false,
      code: "too_large",
      message: "L'enregistrement audio dépasse la limite de 6 Mo.",
    };
  }

  return { ok: true, byteLength: decoded.byteLength, buffer: decoded };
}

