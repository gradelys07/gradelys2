import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const [
    { count: totalUsers },
    { count: activeToday },
    { data: subs },
    { count: bannedUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_active_at", new Date(Date.now() - 86400000).toISOString()),
    supabase.from("subscriptions").select("plan, credits_remaining, credits_max"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "banned"),
  ]);

  const planCounts = { free: 0, plus: 0, pro: 0 };
  let avgCreditsUsedPct = 0;
  if (subs && subs.length > 0) {
    for (const s of subs) planCounts[s.plan as keyof typeof planCounts]++;
    avgCreditsUsedPct =
      (subs.reduce((acc, s) => acc + (1 - s.credits_remaining / Math.max(s.credits_max, 1)), 0) / subs.length) * 100;
  }

  const PRICE = { plus: 9.99, pro: 19.99 };
  const mrr = planCounts.plus * PRICE.plus + planCounts.pro * PRICE.pro;

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    activeToday: activeToday || 0,
    bannedUsers: bannedUsers || 0,
    planCounts,
    mrr: Math.round(mrr * 100) / 100,
    avgCreditsUsedPct: Math.round(avgCreditsUsedPct),
  });
}
