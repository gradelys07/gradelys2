import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ cards: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  if (!body.question || !body.answer) return errorResponse("question and answer are required");

  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      deck_id: params.id,
      question: body.question,
      answer: body.answer,
      hint: body.hint,
      tags: body.tags || [],
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ card: data }, { status: 201 });
}
