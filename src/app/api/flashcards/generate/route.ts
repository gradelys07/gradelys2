import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { generateContent } from "@/lib/gemini/client";
import { sanitizePromptInput } from "@/lib/security";
import { requireSpaceWithSource } from "@/lib/supabase/require-space";
import { getSpaceContextText } from "@/lib/supabase/space-context";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { deckId, topic, sourceText, spaceId, customPrompt, count = 10 } = body;
  if (!deckId) return errorResponse("deckId is required");

  const n = Math.min(Math.max(Number(count) || 10, 1), 30);
  let input = sanitizePromptInput(sourceText || topic || "", 12000);

  // Chat-generated flashcards (no space) stay free; deck-level AI generation from
  // within a Space requires a source and is a paid feature, matching Practice.
  if (spaceId) {
    const spaceCheck = await requireSpaceWithSource(supabase, user!.id, spaceId);
    if (!spaceCheck.ok) return spaceCheck.response;

    const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user!.id).single();
    if (sub?.plan === "free") {
      return errorResponse(
        "Practice (flashcards) isn't included in the Free plan. Upgrade to Plus or Pro to unlock it.",
        403
      );
    }
    const spaceContext = await getSpaceContextText(supabase, spaceId);
    input = `${input}\n\n${spaceContext}`.trim();
  }

  if (!input) return errorResponse("topic, sourceText, or a spaceId with sources is required");
  const extraInstruction = customPrompt ? `\nAdditional instructions: ${sanitizePromptInput(customPrompt, 1000)}` : "";

  const prompt = `Generate exactly ${n} high-quality flashcards (question + answer pairs) for a student studying the material below.${extraInstruction}
Return ONLY a JSON array like [{"question": "...", "answer": "..."}]. No markdown, no commentary.

MATERIAL:
${input}`;

  let cards: { question: string; answer: string }[];
  try {
    const raw = await generateContent(prompt, { jsonMode: true, temperature: 0.6 });
    cards = JSON.parse(raw);
    if (!Array.isArray(cards)) throw new Error("Invalid response shape");
  } catch (err: any) {
    return errorResponse(`AI generation failed: ${err.message}`, 502);
  }

  const rows = cards.slice(0, n).map((c) => ({
    deck_id: deckId,
    question: c.question,
    answer: c.answer,
  }));

  const { data, error } = await supabase.from("flashcards").insert(rows).select();
  if (error) return errorResponse(error.message, 500);

  return NextResponse.json({ cards: data }, { status: 201 });
}
