import { NextRequest, NextResponse } from "next/server";
import { verifyWhopSignature } from "@/lib/whop/client";
import { createServiceClient } from "@/lib/supabase/server";
import { emails } from "@/lib/resend/client";
import { planLimits } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyWhopSignature(rawBody, req.headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    const supabase = createServiceClient();

    switch (event.type) {
      case "membership.activated": {
        if (!event.data) throw new Error("Webhook event.data is missing.");
        
        // In Whop V3, user data might be nested inside 'user' object
        const whopUserId = event.data.user_id || event.data.user?.id;
        const email = event.data.email || event.data.user?.email;

        if (!email) {
          throw new Error("Webhook event is missing the user's email.");
        }

        // Get IDs from event to cross-reference with our configured checkout URLs
        const planId = event.data.plan_id || event.data.plan?.id;
        const productId = event.data.product_id || event.data.product?.id;
        const experienceId = event.data.experience_id || event.data.experience?.id;
        const allEventIds = [planId, productId, experienceId].filter(Boolean);

        const proUrls = [
          process.env.NEXT_PUBLIC_WHOP_CHECKOUT_PRO_MONTHLY,
          process.env.NEXT_PUBLIC_WHOP_CHECKOUT_PRO_ANNUAL
        ].filter(Boolean) as string[];

        let plan: "pro" | "plus" = "plus";

        // Check if any of the event's IDs match our Pro checkout URLs
        const isProUrlMatch = proUrls.some(url => allEventIds.some(id => url.includes(id)));

        if (isProUrlMatch) {
          plan = "pro";
        } else {
          // Fallback: check if the stringified product/plan contains "pro"
          const planRaw = event.data.plan || event.data.product || event.data.experience || "";
          const planStr = typeof planRaw === 'string' ? planRaw : JSON.stringify(planRaw);
          if (planStr.toLowerCase().includes("pro")) {
            plan = "pro";
          }
        }

        const creditsMax = plan === "pro" ? planLimits.pro.creditsMax : planLimits.plus.creditsMax;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
           console.error("Supabase profile fetch error:", profileError);
        }

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

      case "membership.deactivated": {
        if (!event.data) throw new Error("Webhook event.data is missing.");
        
        const email = event.data.email || event.data.user?.email;
        if (!email) {
          throw new Error("Webhook event is missing the user's email.");
        }

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
  } catch (err: any) {
    console.error("[Whop Webhook] Execution error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}
