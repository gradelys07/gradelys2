import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  // Check admin role
  const { data: admin } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (admin?.role !== "admin") {
    return errorResponse("Accès refusé — Réservé aux administrateurs", 403);
  }

  // Fetch all promo codes
  const { data: promos, error: promoError } = await supabase
    .from("dzd_promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (promoError) {
    if (promoError.code === "42P01" || promoError.message?.includes("does not exist")) {
      return NextResponse.json({ promos: [], tableMissing: true });
    }
    return errorResponse(promoError.message, 500);
  }

  // Fetch all receipts that have promo_code_id or promo_code
  const { data: receipts } = await supabase
    .from("dzd_receipts")
    .select("id, promo_code_id, promo_code, plan, billing_interval, amount_dzd, discount_applied, commission_amount, status, created_at");

  // Aggregate stats per promo code
  const enrichedPromos = (promos || []).map((p) => {
    const matchingReceipts = (receipts || []).filter(
      (r) => r.promo_code_id === p.id || (r.promo_code && r.promo_code.toUpperCase() === p.code.toUpperCase())
    );

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

    matchingReceipts.forEach((r) => {
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

    return {
      id: p.id,
      code: p.code,
      discountType: p.discount_type,
      discountValue: Number(p.discount_value),
      collaboratorName: p.collaborator_name,
      collaboratorEmail: p.collaborator_email,
      commissionType: p.commission_type,
      commissionValue: Number(p.commission_value),
      secretToken: p.secret_token,
      isActive: p.is_active,
      maxUses: p.max_uses,
      usesCount: p.uses_count || approvedCount,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      stats: {
        totalRevenueDzd,
        totalCommissionDzd,
        pendingCommissionDzd,
        approvedCount,
        pendingCount,
        rejectedCount,
        planBreakdown,
      },
    };
  });

  return NextResponse.json({ promos: enrichedPromos });
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  // Check admin role
  const { data: admin } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user!.id)
    .single();

  if (admin?.role !== "admin") {
    return errorResponse("Accès refusé — Réservé aux administrateurs", 403);
  }

  const body = await req.json().catch(() => ({}));
  const {
    code,
    discountType,
    discountValue,
    collaboratorName,
    collaboratorEmail,
    commissionType,
    commissionValue,
    maxUses,
  } = body;

  // Validation
  if (!code || typeof code !== "string" || !code.trim()) {
    return errorResponse("Le code promo est obligatoire", 400);
  }

  const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9_-]{2,30}$/.test(cleanCode)) {
    return errorResponse("Le code promo doit contenir entre 2 et 30 caractères alphanumériques (lettres, chiffres, tirets)", 400);
  }

  if (!discountType || !["percent", "fixed"].includes(discountType)) {
    return errorResponse("Type de réduction invalide (percent ou fixed)", 400);
  }

  const numDiscount = Number(discountValue);
  if (isNaN(numDiscount) || numDiscount <= 0) {
    return errorResponse("La valeur de réduction doit être un nombre strictement positif", 400);
  }
  if (discountType === "percent" && numDiscount > 100) {
    return errorResponse("La réduction en pourcentage ne peut pas dépasser 100%", 400);
  }

  if (!collaboratorName || typeof collaboratorName !== "string" || !collaboratorName.trim()) {
    return errorResponse("Le nom du collaborateur est obligatoire", 400);
  }

  if (!commissionType || !["percent", "fixed"].includes(commissionType)) {
    return errorResponse("Type de commission invalide (percent ou fixed)", 400);
  }

  const numCommission = Number(commissionValue);
  if (isNaN(numCommission) || numCommission < 0) {
    return errorResponse("La commission doit être un nombre supérieur ou égal à 0", 400);
  }
  if (commissionType === "percent" && numCommission > 100) {
    return errorResponse("La commission en pourcentage ne peut pas dépasser 100%", 400);
  }

  // Generate very long, unguessable cryptographic token for the collaborator dashboard
  const randomHex = crypto.randomBytes(32).toString("hex"); // 64 hex characters
  const secretToken = `sec_collab_${randomHex}`;

  // Insert promo code
  const { data: promo, error: insertError } = await supabase
    .from("dzd_promo_codes")
    .insert({
      code: cleanCode,
      discount_type: discountType,
      discount_value: numDiscount,
      collaborator_name: collaboratorName.trim(),
      collaborator_email: collaboratorEmail?.trim() || null,
      commission_type: commissionType,
      commission_value: numCommission,
      secret_token: secretToken,
      is_active: true,
      max_uses: maxUses ? Number(maxUses) : null,
      uses_count: 0,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505" || insertError.message?.includes("unique")) {
      return errorResponse(`Le code promo "${cleanCode}" existe déjà. Veuillez en choisir un autre.`, 409);
    }
    return errorResponse(insertError.message, 500);
  }

  // Audit log
  await supabase.from("audit_log").insert({
    admin_id: user!.id,
    admin_name: admin?.name || "Admin",
    action: "Code promo DZD créé",
    target_user: collaboratorName.trim(),
    details: JSON.stringify({
      code: cleanCode,
      discount: `${numDiscount}${discountType === "percent" ? "%" : " DZD"}`,
      commission: `${numCommission}${commissionType === "percent" ? "%" : " DZD"}`,
      secretToken,
    }),
    ip: req.headers.get("x-forwarded-for") || "unknown",
  });

  return NextResponse.json({
    ok: true,
    promo,
    message: `Code promo ${cleanCode} créé avec succès !`,
  });
}
