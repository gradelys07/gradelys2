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
  return NextResponse.json({ sessions: data });
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
  return NextResponse.json({ session: data }, { status: 201 });
}
