import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, any> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.pinned !== undefined) patch.pinned = body.pinned;
  if (body.model !== undefined) patch.model = body.model;
  if (body.webSearchEnabled !== undefined) patch.web_search_enabled = body.webSearchEnabled;
  if (body.spaceId !== undefined) patch.space_id = body.spaceId;

  const { data, error } = await supabase
    .from("conversations")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ conversation: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { error } = await supabase.from("conversations").delete().eq("id", params.id);
  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ ok: true });
}
