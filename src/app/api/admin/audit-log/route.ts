import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ entries: data });
}
