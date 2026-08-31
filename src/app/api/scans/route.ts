import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { generateContent } from "@/lib/gemini/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ scans: data });
}

const DIAGNOSTIC_SCHEMA = `{
  "currentGrade": number (out of 20),
  "potentialGrade": number (out of 20),
  "errors": [{"id":"e1","title":"...","description":"...","type":"error|weak|correct"}],
  "flashcards": [{"id":"f1","question":"...","answer":"..."}],
  "globalFeedback": "..."
}`;

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { subject, chapter, imageBase64, mimeType } = body;
  if (!subject || !imageBase64 || !mimeType) {
    return errorResponse("subject, imageBase64 and mimeType are required");
  }

  // Consume one credit before analyzing.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("credits_remaining")
    .eq("user_id", user!.id)
    .single();
  if (!sub || sub.credits_remaining <= 0) {
    return errorResponse("You're out of scan credits. Upgrade or recharge to continue.", 403);
  }

  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .insert({ user_id: user!.id, subject, chapter, status: "processing" })
    .select()
    .single();
  if (scanError) return errorResponse(scanError.message, 500);

  const prompt = `You are grading a student's ${subject} exam/homework (chapter: ${chapter || "unspecified"}) from the attached photo.
Analyze the handwritten or printed work: identify what's correct, what's wrong, and what's weak.
Return ONLY JSON matching exactly this shape (no markdown fences, no commentary):
${DIAGNOSTIC_SCHEMA}`;

  try {
    const raw = await generateContent(prompt, {
      jsonMode: true,
      temperature: 0.4,
      images: [{ mimeType, data: imageBase64 }],
    });
    const diagnostic = JSON.parse(raw);

    await supabase
      .from("scans")
      .update({ status: "ready", diagnostic })
      .eq("id", scan.id);

    const newBalance = sub.credits_remaining - 1;
    await supabase
      .from("subscriptions")
      .update({ credits_remaining: newBalance })
      .eq("user_id", user!.id);
    await supabase.from("credit_transactions").insert({
      user_id: user!.id,
      delta: -1,
      reason: "Document scan analysis",
      balance_after: newBalance,
    });

    return NextResponse.json({ scan: { ...scan, status: "ready", diagnostic } }, { status: 201 });
  } catch (err: any) {
    await supabase.from("scans").update({ status: "error" }).eq("id", scan.id);
    return errorResponse(`AI analysis failed: ${err.message}`, 502);
  }
}
