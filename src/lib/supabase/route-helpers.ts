import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { planLimits } from "@/lib/config";

export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Auto-downgrade expired subscriptions to free
  const { data: sub } = await supabase.from("subscriptions").select("plan, current_period_end").eq("user_id", user.id).single();
  if (sub && sub.plan !== "free" && sub.current_period_end) {
    if (new Date(sub.current_period_end) < new Date()) {
      await supabase.from("subscriptions").update({ 
        plan: "free", 
        status: "expired",
        credits_remaining: planLimits.free.creditsMax,
        credits_max: planLimits.free.creditsMax
      }).eq("user_id", user.id);
    }
  }

  return { supabase, user, response: null };
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
