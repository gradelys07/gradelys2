import { NextRequest, NextResponse } from "next/server";
import { verifyWhopSignature } from "@/lib/whop/client";
import { createServiceClient } from "@/lib/supabase/server";
import { emails } from "@/lib/resend/client";
import { planLimits } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-whop-signature");

  if (!verifyWhopSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const supabase = createServiceClient();

  switch (event.type) {
    case "membership.went_valid": {
      const { user_id: whopUserId, plan: planKey, email } = event.data;
      const plan = planKey?.includes("pro") ? "pro" : "plus";
      const creditsMax = plan === "pro" ? planLimits.pro.creditsMax : planLimits.plus.creditsMax;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profile) {
        await supabase
          .from("subscriptions")
          .update({
            plan,
            status: "active",
            credits_remaining: creditsMax,
            credits_max: creditsMax,
            whop_subscription_id: event.data.id,
            current_period_end: event.data.renewal_period_end
              ? new Date(event.data.renewal_period_end * 1000).toISOString()
              : null,
          })
          .eq("user_id", profile.id);

        try {
          await emails.subscriptionConfirmed(email, plan === "pro" ? "Pro" : "Plus");
        } catch {
          // Email failures shouldn't break webhook processing.
        }
      }
      break;
    }

    case "membership.went_invalid": {
      const { email } = event.data;
      const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).single();
      if (profile) {
        await supabase
          .from("subscriptions")
          .update({ plan: "free", status: "expired", credits_remaining: planLimits.free.creditsMax, credits_max: planLimits.free.creditsMax })
          .eq("user_id", profile.id);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
