import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { planLimits } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { data: admin } = await supabase.from("profiles").select("name").eq("id", user!.id).single();

  if (body.status) {
    const patch: Record<string, any> = { status: body.status };
    if (body.banReason) patch.ban_reason = body.banReason;
    const { error } = await supabase.from("profiles").update(patch).eq("id", params.id);
    if (error) return errorResponse(error.message, 500);

    await supabase.from("audit_log").insert({
      admin_id: user!.id,
      admin_name: admin?.name || "Admin",
      action: body.status === "banned" ? "Banned user account" : "Restored user account",
      target_user: params.id,
      details: body.banReason || "",
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });
  }

  // Direct plan assignment: plan ('free'|'plus'|'pro') + interval ('monthly'|'annual').
  if (body.plan) {
    const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", params.id).single();
    if (sub) {
      const interval = body.interval === "annual" ? "annual" : "monthly";
      const creditsMax =
        body.plan === "pro" ? planLimits.pro.creditsMax :
        body.plan === "plus" ? planLimits.plus.creditsMax :
        planLimits.free.creditsMax;

      const periodEnd = new Date();
      if (body.plan === "free") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setDate(periodEnd.getDate() + (interval === "annual" ? 365 : 30));
      }

      const patch = {
        plan: body.plan,
        billing_interval: interval,
        status: "active",
        credits_remaining: creditsMax,
        credits_max: creditsMax,
        current_period_end: body.plan === "free" ? null : periodEnd.toISOString(),
        reset_date: periodEnd.toISOString(),
      };
      const { error } = await supabase.from("subscriptions").update(patch).eq("user_id", params.id);
      if (error) return errorResponse(error.message, 500);

      await supabase.from("credit_transactions").insert({
        user_id: params.id,
        delta: creditsMax - sub.credits_remaining,
        reason: `Admin assigned ${body.plan}${body.plan !== "free" ? ` (${interval})` : ""}`,
        balance_after: creditsMax,
      });

      await supabase.from("audit_log").insert({
        admin_id: user!.id,
        admin_name: admin?.name || "Admin",
        action: `Assigned ${body.plan}${body.plan !== "free" ? ` — ${interval}` : ""} plan`,
        target_user: params.id,
        details: JSON.stringify({ plan: body.plan, interval }),
        ip: req.headers.get("x-forwarded-for") || "unknown",
      });
    }
  }

  // Credit-only adjustment (grant/revoke a specific amount without changing plan).
  if (body.creditsDelta !== undefined && !body.plan) {
    const { data: sub } = await supabase.from("subscriptions").select("credits_remaining").eq("user_id", params.id).single();
    if (sub) {
      const balanceAfter = Math.max(0, sub.credits_remaining + Number(body.creditsDelta));
      await supabase.from("subscriptions").update({ credits_remaining: balanceAfter }).eq("user_id", params.id);
      await supabase.from("credit_transactions").insert({
        user_id: params.id,
        delta: Number(body.creditsDelta),
        reason: "Admin adjustment",
        balance_after: balanceAfter,
      });
      await supabase.from("audit_log").insert({
        admin_id: user!.id,
        admin_name: admin?.name || "Admin",
        action: "Granted bonus credits",
        target_user: params.id,
        details: JSON.stringify(body),
        ip: req.headers.get("x-forwarded-for") || "unknown",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
