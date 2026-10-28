import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { generateContent } from "@/lib/gemini/client";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const { message, history, questionContext } = body;

  if (!message) return errorResponse("message is required");

  // Fetch the scan and diagnostic
  const { data: scan, error } = await supabase.from("scans").select("*").eq("id", id).single();
  if (error || !scan) return errorResponse("Scan not found", 404);

  let prompt = `You are an expert tutor helping a student understand their graded homework/exam.
The subject is: ${scan.subject}

The student is asking a question specifically about THIS exercise/question from their exam:
${JSON.stringify(questionContext, null, 2)}

You must answer the student's question accurately, explain any concepts they misunderstood, and be encouraging.
`;

  if (history && history.length > 0) {
    prompt += `\nHere is the conversation history:\n`;
    for (const h of history) {
      prompt += `${h.role === "user" ? "Student" : "Tutor"}: ${h.content}\n`;
    }
  }

  prompt += `\nStudent: ${message}\nTutor:`;

  try {
    const raw = await generateContent(prompt, { temperature: 0.7 });
    return NextResponse.json({ reply: raw });
  } catch (err: any) {
    return errorResponse(`AI chat failed: ${err.message}`, 502);
  }
}
