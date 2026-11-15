import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { integrations } from "@/lib/config";
import { checkAssistantRateLimit } from "@/lib/assistant/rate-limit";
import {
  MAX_AUDIO_BODY_BYTES,
  TranscribeRequestSchema,
  validateAudioBytes,
} from "@/lib/assistant/schemas";
import { transcribeAssistantAudio } from "@/lib/assistant/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!integrations.supabase) {
    return NextResponse.json(
      { error: "Service d'authentification non configuré." },
      { status: 503 }
    );
  }

  try {
    const contentLengthHeader = req.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number.parseInt(contentLengthHeader, 10);
      if (Number.isFinite(contentLength) && contentLength > MAX_AUDIO_BODY_BYTES) {
        return NextResponse.json(
          { error: "Enregistrement audio trop volumineux (max 6 Mo)." },
          { status: 413 }
        );
      }
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Connecte-toi pour utiliser la dictée vocale." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profile?.status === "banned" || profile?.status === "deleted") {
      return NextResponse.json(
        { error: "Ce compte Gradelys n'est plus actif." },
        { status: 403 }
      );
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_AUDIO_BODY_BYTES) {
      return NextResponse.json(
        { error: "Enregistrement audio trop volumineux (max 6 Mo)." },
        { status: 413 }
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Requête JSON invalide." }, { status: 400 });
    }

    const validated = TranscribeRequestSchema.safeParse(parsedJson);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Format audio non supporté pour la dictée." },
        { status: 400 }
      );
    }

    const audioCheck = validateAudioBytes(validated.data.audioBase64);
    if (!audioCheck.ok) {
      return NextResponse.json(
        { error: audioCheck.message },
        { status: audioCheck.code === "too_large" ? 413 : 400 }
      );
    }

    const rateCheck = await checkAssistantRateLimit(user.id, false);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: 429 });
    }

    const text = await transcribeAssistantAudio(
      validated.data.audioBase64,
      audioCheck.buffer,
      validated.data.mimeType
    );

    console.info(
      JSON.stringify({
        event: "assistant_audio_transcribed",
        userId: user.id,
        mimeType: validated.data.mimeType,
        audioByteLength: audioCheck.byteLength,
        textLength: text.length,
      })
    );

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[api/assistant/transcribe] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Impossible de transcrire la dictée vocale pour le moment." },
      { status: 502 }
    );
  }
}

