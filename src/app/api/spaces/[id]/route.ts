import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, any> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.emoji !== undefined) patch.emoji = body.emoji;
  if (body.color !== undefined) patch.color = body.color;

  const { data, error } = await supabase
    .from("spaces")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ space: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { error } = await supabase.from("spaces").delete().eq("id", params.id);
  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ ok: true });
}
