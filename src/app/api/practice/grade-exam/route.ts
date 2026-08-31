import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { gradeExamContent } from "@/lib/generation/tool-generation";
import { sanitizePromptInput } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { examId, conversationId, answers, images = [], timeSeconds = 0 } = body;
  if (!examId) {
    return errorResponse("examId is required");
  }

  // Fetch the exam
  const { data: examData, error: examError } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .single();
    
  if (examError || !examData) return errorResponse("Exam not found", 404);

  // If conversationId is provided, verify it belongs to user
  if (conversationId) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user!.id)
      .single();
    if (!conv) return errorResponse("Conversation not found", 404);
  }

  const examQuestions = JSON.stringify(examData.content_json, null, 2);

  const studentAnswers = Object.entries(answers as Record<string, string>)
    .map(([qId, answer]) => `Answer to "${qId}": ${sanitizePromptInput(String(answer), 4000)}`)
    .join("\n\n");

  const parsedImages = images.map((img: string) => {
    const [header, data] = img.split(",");
    const mimeType = header.split(":")[1].split(";")[0];
    return { mimeType, data };
  });

  try {
    const grading = await gradeExamContent(supabase, examData.space_id, examQuestions, studentAnswers, parsedImages);

    if (conversationId) {
      const { data: assistantMsg, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: `Exam graded: ${grading.totalScore}/${grading.maxScore}`,
          structured: { kind: "exam-result", ...grading },
        })
        .select()
        .single();
        
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    }

    await supabase.from("practice_sessions").insert({
      user_id: user!.id,
      space_id: examData.space_id,
      mode: "exam",
      subject: examData.subject,
      score: (grading.totalScore / Math.max(grading.maxScore, 1)) * 100,
      total_questions: examData.total_points, // We use total_points as a proxy for "questions count" in the session stats, or we can just parse it
      correct_answers: Math.round((grading.totalScore / Math.max(grading.maxScore, 1)) * examData.total_points),
      time_taken_seconds: timeSeconds,
    });

    return NextResponse.json({ grading });
  } catch (err: any) {
    return errorResponse(`Grading failed: ${err.message}`, 502);
  }
}
