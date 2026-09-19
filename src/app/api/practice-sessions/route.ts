import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const spaceId = new URL(req.url).searchParams.get("spaceId");
  let query = supabase.from("practice_sessions").select("*").eq("user_id", user!.id);
  if (spaceId) query = query.eq("space_id", spaceId);

  const { data, error } = await query.order("completed_at", { ascending: false }).limit(100);
  if (error) return errorResponse(error.message, 500);

  const camelCaseData = data.map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    spaceId: s.space_id,
    mode: s.mode,
    subject: s.subject,
    score: s.score,
    totalQuestions: s.total_questions,
    correctAnswers: s.correct_answers,
    timeTakenSeconds: s.time_taken_seconds,
    completedAt: s.completed_at,
  }));

  return NextResponse.json({ sessions: camelCaseData });
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { data, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user!.id,
      space_id: body.spaceId ?? null,
      mode: body.mode,
      subject: body.subject,
      score: body.score,
      total_questions: body.totalQuestions,
      correct_answers: body.correctAnswers,
      time_taken_seconds: body.timeTakenSeconds,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  // Background track learning profile (fire-and-forget)
  import("@/lib/ai/learning-profile").then((m) => {
    m.trackPracticeSession(
      supabase,
      user!.id,
      body.mode,
      body.score,
      body.totalQuestions,
      body.timeTakenSeconds
    );
  }).catch(() => {});

  const camelCaseData = {
    id: data.id,
    userId: data.user_id,
    spaceId: data.space_id,
    mode: data.mode,
    subject: data.subject,
    score: data.score,
    totalQuestions: data.total_questions,
    correctAnswers: data.correct_answers,
    timeTakenSeconds: data.time_taken_seconds,
    completedAt: data.completed_at,
  };

  return NextResponse.json({ session: camelCaseData }, { status: 201 });
}
