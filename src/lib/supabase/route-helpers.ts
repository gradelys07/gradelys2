import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { planLimits } from "@/lib/config";

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const isDemo = cookies().get("gradelys_demo")?.value === "true";
    if (isDemo) {
      const demoUser = {
        id: DEMO_USER_ID,
        email: "demo@gradelys.com",
        user_metadata: { name: "Demo User" },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
        is_anonymous: true,
      };
      return {
        supabase,
        user: demoUser as any,
        response: null,
      };
    }

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
