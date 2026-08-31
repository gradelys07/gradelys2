import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, any> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.content !== undefined) patch.content = body.content;
  if (body.tags !== undefined) patch.tags = body.tags;

  const { data, error } = await supabase
    .from("notes")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ note: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { error } = await supabase.from("notes").delete().eq("id", params.id);
  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ ok: true });
}
