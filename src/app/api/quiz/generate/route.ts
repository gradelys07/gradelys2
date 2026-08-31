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
  const { subject, count = 10, difficulty = "mixed", spaceId, customPrompt } = body;
  if (!subject) return errorResponse("subject is required");

  const spaceCheck = await requireSpaceWithSource(supabase, user!.id, spaceId);
  if (!spaceCheck.ok) return spaceCheck.response;

  const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user!.id).single();
  if (sub?.plan === "free") {
    return errorResponse(
      "Practice (quiz & exam) isn't included in the Free plan. Upgrade to Plus or Pro to unlock it.",
      403
    );
  }

  const input = sanitizePromptInput(subject, 500);
  const n = Math.min(Math.max(Number(count) || 10, 1), 40);
  const spaceContext = await getSpaceContextText(supabase, spaceId);
  const extraInstruction = customPrompt ? `\nAdditional instructions: ${sanitizePromptInput(customPrompt, 1000)}` : "";

  const prompt = `Create exactly ${n} multiple-choice questions (${difficulty} difficulty) about: ${input}
Ground every question strictly in the material below — do not invent facts outside of it.${extraInstruction}

MATERIAL:
${spaceContext}

Return ONLY a JSON array of objects shaped exactly like:
[{"id":"q1","question":"...","type":"mcq","options":["...","...","...","..."],"correct":"<must match one option exactly>","explanation":"...","difficulty":"easy|medium|hard"}]
No markdown fences, no commentary — JSON only.`;

  try {
    const raw = await generateContent(prompt, { jsonMode: true, temperature: 0.7 });
    const questions = JSON.parse(raw);
    if (!Array.isArray(questions)) throw new Error("Invalid response shape");
    return NextResponse.json({ questions });
  } catch (err: any) {
    return errorResponse(`AI generation failed: ${err.message}`, 502);
  }
}
