import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { generateContent } from "@/lib/gemini/client";
import { sanitizePromptInput } from "@/lib/security";
import { requireSpaceWithSource } from "@/lib/supabase/require-space";
import { getSpaceContextText } from "@/lib/supabase/space-context";
import { planLimits } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const spaceId = new URL(req.url).searchParams.get("spaceId");
  let query = supabase.from("studio_documents").select("*").eq("user_id", user!.id);
  if (spaceId) query = query.eq("space_id", spaceId);

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ documents: data });
}

const TYPE_INSTRUCTIONS: Record<string, string> = {
  notes: "Write structured, exam-ready study notes with headings, bullet points, and bolded key terms.",
  report: "Write a formal, well-organized report with an introduction, body sections, and conclusion.",
  summary: "Write a concise, dense summary that captures every key idea with no filler.",
  essay: "Write a well-argued essay with a clear thesis, supporting paragraphs, and a conclusion.",
  slides: "Write slide-by-slide content: a short title and 3-5 bullet points per slide, separated by '---'.",
};

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { topic, type = "notes", spaceId, customPrompt } = body;
  if (!topic) return errorResponse("topic is required");

  const spaceCheck = await requireSpaceWithSource(supabase, user!.id, spaceId);
  if (!spaceCheck.ok) return spaceCheck.response;

  const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user!.id).single();
  if (sub?.plan === "free") {
    const { count } = await supabase
      .from("studio_documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id);
    if ((count ?? 0) >= planLimits.free.studioTotal) {
      return errorResponse(
        `The Free plan includes ${planLimits.free.studioTotal} Studio document. Upgrade to Plus or Pro for more.`,
        403
      );
    }
  }

  const input = sanitizePromptInput(topic, 4000);
  const instruction = customPrompt ? sanitizePromptInput(customPrompt, 2000) : TYPE_INSTRUCTIONS[type] || TYPE_INSTRUCTIONS.notes;
  const spaceContext = await getSpaceContextText(supabase, spaceId);

  const prompt = `${instruction}\n\nFocus: ${input}\n\nGround your answer strictly in the material below — this is the student's own course material.\n\n${spaceContext}\n\nFormat the output in clean Markdown starting with a single # title.`;

  let content: string;
  try {
    content = await generateContent(prompt, { temperature: 0.6 });
  } catch (err: any) {
    return errorResponse(`AI generation failed: ${err.message}`, 502);
  }

  const titleLine = content.split("\n").find((l) => l.startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s*/, "") : input.slice(0, 60);

  const { data, error } = await supabase
    .from("studio_documents")
    .insert({
      user_id: user!.id,
      space_id: spaceId,
      type,
      title,
      content,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ document: data }, { status: 201 });
}
