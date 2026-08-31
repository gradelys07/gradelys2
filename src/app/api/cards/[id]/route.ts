import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { sm2 } from "@/lib/sm2";
import type { Rating } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));

  if (body.rating) {
    const { data: card } = await supabase
      .from("flashcards")
      .select("easiness_factor, interval_days, repetitions")
      .eq("id", params.id)
      .single();
    if (!card) return errorResponse("Card not found", 404);

    const result = sm2(
      {
        easinessFactor: card.easiness_factor,
        intervalDays: card.interval_days,
        repetitions: card.repetitions,
      },
      body.rating as Rating
    );

    const { data, error } = await supabase
      .from("flashcards")
      .update({
        easiness_factor: result.easinessFactor,
        interval_days: result.intervalDays,
        repetitions: result.repetitions,
        next_review_at: result.nextReviewAt,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ card: data });
  }

  const patch: Record<string, any> = {};
  if (body.question !== undefined) patch.question = body.question;
  if (body.answer !== undefined) patch.answer = body.answer;
  if (body.hint !== undefined) patch.hint = body.hint;
  if (body.tags !== undefined) patch.tags = body.tags;

  const { data, error } = await supabase
    .from("flashcards")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ card: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { error } = await supabase.from("flashcards").delete().eq("id", params.id);
  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ ok: true });
}
