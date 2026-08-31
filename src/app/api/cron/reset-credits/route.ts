import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("subscriptions")
    .select("user_id, plan, credits_max")
    .lte("reset_date", now);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let resetCount = 0;
  for (const sub of due || []) {
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    await supabase
      .from("subscriptions")
      .update({ credits_remaining: sub.credits_max, reset_date: nextReset.toISOString() })
      .eq("user_id", sub.user_id);
    resetCount++;
  }

  return NextResponse.json({ resetCount });
}
