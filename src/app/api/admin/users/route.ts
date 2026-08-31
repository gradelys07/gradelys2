import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const page = Number(searchParams.get("page") || "1");
  const pageSize = 25;

  let query = supabase
    .from("profiles")
    .select("id, name, email, avatar_url, status, created_at, last_active_at, subscriptions(plan, credits_remaining)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) return errorResponse(error.message, 500);

  let users = data || [];
  if (plan) users = users.filter((u: any) => u.subscriptions?.[0]?.plan === plan || u.subscriptions?.plan === plan);

  return NextResponse.json({ users, total: count || 0, page, pageSize });
}
