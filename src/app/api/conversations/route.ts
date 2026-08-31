import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  const spaceId = searchParams.get("spaceId");

  let query = supabase.from("conversations").select("*").eq("user_id", user!.id);
  query = query.eq("kind", kind || "chat");
  if (spaceId) query = query.eq("space_id", spaceId);

  const { data, error } = await query
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ conversations: data });
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user!.id,
      space_id: body.spaceId ?? null,
      kind: body.kind || "chat",
      title: body.title || "New conversation",
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ conversation: data }, { status: 201 });
}
