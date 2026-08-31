import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { error } = await supabase.from("space_sources").delete().eq("id", params.id);
  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ ok: true });
}
