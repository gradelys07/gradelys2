import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { planLimits } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("spaces")
    .select("*, space_sources(count)")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ spaces: data });
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  if (!body.name) return errorResponse("name is required");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user!.id)
    .single();

  if (sub?.plan === "free") {
    const { count } = await supabase
      .from("spaces")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id);
    if ((count ?? 0) >= planLimits.free.spaces) {
      return errorResponse(
        `The Free plan includes ${planLimits.free.spaces} space. Upgrade to Plus or Pro to create more.`,
        403
      );
    }
  }

  const { data, error } = await supabase
    .from("spaces")
    .insert({
      user_id: user!.id,
      name: body.name,
      emoji: body.emoji || "📘",
      color: body.color || "#0EA5E9",
      template: body.template || "blank",
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json({ space: data }, { status: 201 });
}
