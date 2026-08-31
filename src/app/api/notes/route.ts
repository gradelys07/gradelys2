import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ notes: data });
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user!.id,
      space_id: body.spaceId ?? null,
      title: body.title || "Untitled note",
      content: body.content || "",
      tags: body.tags || [],
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ note: data }, { status: 201 });
}
