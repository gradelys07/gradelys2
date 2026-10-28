import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") {
    return errorResponse("Accès refusé — Réservé aux administrateurs", 403);
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  let query = supabase
    .from("dzd_receipts")
    .select(`
      *,
      userProfile:profiles!dzd_receipts_user_id_fkey (
        id,
        name,
        email,
        avatar_url,
        subscriptions (
          plan,
          billing_interval,
          status,
          credits_remaining
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    // If the relation doesn't exist yet, return helpful flag
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      return NextResponse.json({ receipts: [], tableMissing: true });
    }
    // If foreign key relation failed, try fallback select without relation
    const fallbackQuery = await supabase
      .from("dzd_receipts")
      .select("*")
      .order("created_at", { ascending: false });

    if (fallbackQuery.error) {
      return errorResponse(fallbackQuery.error.message, 500);
    }
    return NextResponse.json({ receipts: fallbackQuery.data || [], tableMissing: false });
  }

  return NextResponse.json({ receipts: data || [], tableMissing: false });
}
