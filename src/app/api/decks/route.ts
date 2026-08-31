import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const spaceId = new URL(req.url).searchParams.get("spaceId");
  let query = supabase.from("flashcard_decks").select("*, flashcards(count)").eq("user_id", user!.id);
  if (spaceId) query = query.eq("space_id", spaceId);

  const { data: decks, error } = await query.order("updated_at", { ascending: false });
  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ decks });
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  if (!body.name) return errorResponse("name is required");

  const { data, error } = await supabase
    .from("flashcard_decks")
    .insert({
      user_id: user!.id,
      space_id: body.spaceId ?? null,
      name: body.name,
      subject: body.subject || "General",
      description: body.description,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ deck: data }, { status: 201 });
}
