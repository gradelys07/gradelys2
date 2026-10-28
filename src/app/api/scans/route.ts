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
  "questions": [
    {
      "id": "q1",
      "questionText": "...",
      "status": "correct|partial|wrong",
      "remark": "...",
      "trick": "... (optional, if correct)",
      "howToFix": "... (optional, if partial)",
      "correction": "... (optional, if wrong)",
      "whyErrorMade": "... (optional, if wrong)",
      "howToHandleFuture": "... (optional, if wrong)",
      "stepByStep": "... (optional, if wrong)"
    }
  ],
  "flashcards": [{"id":"f1","question":"...","answer":"..."}],
  "globalFeedback": "..."
}`;

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { subject, chapter, workFiles, subjectFiles, correctionFiles, imageBase64, mimeType } = body;
  
  // Backwards compatibility for old clients
  const finalWorkFiles = workFiles || (imageBase64 ? [{ base64: imageBase64, mimeType }] : []);
  
  if (!subject || !finalWorkFiles.length) {
    return errorResponse("subject and workFiles are required");
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

  let prompt = `You are grading a student's ${subject} exam/homework (chapter: ${chapter || "unspecified"}) from the attached photos.
The attached images are in the following order:
- The first ${finalWorkFiles.length} images are the student's work.
- The next ${subjectFiles?.length || 0} images are the problem statement/subject.
- The next ${correctionFiles?.length || 0} images are the professor's correction.

Analyze the student's work question by question.
List EVERY question that the student attempted. For each question:
- If it is completely correct (status: "correct"), give a small remark or a "trick" (astuce) to do it more easily or faster.
- If it is partially correct (status: "partial"), provide a remark and explain how to fix the missing/incorrect parts.
- If it is wrong (status: "wrong"), provide the complete correction, explain why they made this error, how to handle such questions in the future, and a step-by-step resolution.
`;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("learning_profile")
    .eq("id", user!.id)
    .single();

  const { calibratePrompt } = await import("@/lib/ai/personalize-prompt");
  prompt = calibratePrompt(prompt, profileData?.learning_profile);

  prompt += `\nReturn ONLY JSON matching exactly this shape (no markdown fences, no commentary):
${DIAGNOSTIC_SCHEMA}`;

  const allImages = [...finalWorkFiles];
  if (subjectFiles) allImages.push(...subjectFiles);
  if (correctionFiles) allImages.push(...correctionFiles);

  try {
    const raw = await generateContent(prompt, {
      jsonMode: true,
      temperature: 0.4,
      images: allImages.map(img => ({ mimeType: img.mimeType, data: img.base64 })),
    });
    
    // Clean potential markdown blocks
    const cleanRaw = raw.replace(/```(?:json)?\n?/gi, "").replace(/```/g, "").trim();
    const diagnostic = JSON.parse(cleanRaw);

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
