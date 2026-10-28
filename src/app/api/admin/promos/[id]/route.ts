import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { data: admin } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (admin?.role !== "admin") {
    return errorResponse("Accès refusé — Réservé aux administrateurs", 403);
  }

  const { data: promo, error: promoError } = await supabase
    .from("dzd_promo_codes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (promoError || !promo) {
    return errorResponse("Code promo introuvable", 404);
  }

  // Fetch all receipts linked to this promo
  const { data: receipts } = await supabase
    .from("dzd_receipts")
    .select("id, user_name, user_email, plan, billing_interval, amount_dzd, original_amount_dzd, discount_applied, commission_amount, status, created_at, receipt_url")
    .or(`promo_code_id.eq.${promo.id},promo_code.ilike.${promo.code}`)
    .order("created_at", { ascending: false });

  // Compute analytics
  let totalRevenueDzd = 0;
  let totalCommissionDzd = 0;
  let pendingCommissionDzd = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  const planBreakdown = {
    plusMonthly: 0,
    plusAnnual: 0,
    proMonthly: 0,
    proAnnual: 0,
  };

  (receipts || []).forEach((r) => {
    const comm = Number(r.commission_amount || 0);
    const rev = Number(r.amount_dzd || 0);

    if (r.status === "approved") {
      approvedCount++;
      totalRevenueDzd += rev;
      totalCommissionDzd += comm;

      if (r.plan === "plus" && r.billing_interval === "monthly") planBreakdown.plusMonthly++;
      if (r.plan === "plus" && r.billing_interval === "annual") planBreakdown.plusAnnual++;
      if (r.plan === "pro" && r.billing_interval === "monthly") planBreakdown.proMonthly++;
      if (r.plan === "pro" && r.billing_interval === "annual") planBreakdown.proAnnual++;
    } else if (r.status === "pending") {
      pendingCount++;
      pendingCommissionDzd += comm;
    } else if (r.status === "rejected") {
      rejectedCount++;
    }
  });

  return NextResponse.json({
    promo: {
      id: promo.id,
      code: promo.code,
      discountType: promo.discount_type,
      discountValue: Number(promo.discount_value),
      collaboratorName: promo.collaborator_name,
      collaboratorEmail: promo.collaborator_email,
      commissionType: promo.commission_type,
      commissionValue: Number(promo.commission_value),
      secretToken: promo.secret_token,
      isActive: promo.is_active,
      maxUses: promo.max_uses,
      usesCount: promo.uses_count || approvedCount,
      createdAt: promo.created_at,
      updatedAt: promo.updated_at,
      stats: {
        totalRevenueDzd,
        totalCommissionDzd,
        pendingCommissionDzd,
        approvedCount,
        pendingCount,
        rejectedCount,
        planBreakdown,
      },
    },
    receipts: receipts || [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { data: admin } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user!.id)
    .single();

  if (admin?.role !== "admin") {
    return errorResponse("Accès refusé — Réservé aux administrateurs", 403);
  }

  const body = await req.json().catch(() => ({}));
  const updateData: any = { updated_at: new Date().toISOString() };

  if (typeof body.isActive === "boolean") {
    updateData.is_active = body.isActive;
  }
  if (body.collaboratorName && typeof body.collaboratorName === "string") {
    updateData.collaborator_name = body.collaboratorName.trim();
  }
  if (body.collaboratorEmail !== undefined) {
    updateData.collaborator_email = body.collaboratorEmail ? body.collaboratorEmail.trim() : null;
  }
  if (body.commissionType && ["percent", "fixed"].includes(body.commissionType)) {
    updateData.commission_type = body.commissionType;
  }
  if (body.commissionValue !== undefined) {
    updateData.commission_value = Number(body.commissionValue);
  }
  if (body.maxUses !== undefined) {
    updateData.max_uses = body.maxUses ? Number(body.maxUses) : null;
  }

  const { data: updatedPromo, error } = await supabase
    .from("dzd_promo_codes")
    .update(updateData)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return NextResponse.json({ ok: true, promo: updatedPromo });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { data: admin } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user!.id)
    .single();

  if (admin?.role !== "admin") {
    return errorResponse("Accès refusé — Réservé aux administrateurs", 403);
  }

  const { error } = await supabase
    .from("dzd_promo_codes")
    .delete()
    .eq("id", params.id);

  if (error) {
    return errorResponse(error.message, 500);
  }

  return NextResponse.json({ ok: true, message: "Code promo supprimé" });
}
