import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { supabase, user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => ({}));
    const { name, level, educationSystem, lang } = body;

    const patch: Record<string, any> = {};
    if (name !== undefined) patch.name = name.trim();
    if (level !== undefined) patch.level = level;
    if (educationSystem !== undefined) patch.education_system = educationSystem;
    if (lang !== undefined) patch.lang = lang;

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user!.id)
      .select()
      .single();

    if (error) {
      console.error("[Profiles Update API] Error:", error);
      return errorResponse(error.message, 500);
    }

    return NextResponse.json({ ok: true, profile: data });
  } catch (err: any) {
    console.error("[Profiles Update API] Unexpected error:", err);
    return errorResponse(err.message || "Failed to update profile", 500);
  }
}
