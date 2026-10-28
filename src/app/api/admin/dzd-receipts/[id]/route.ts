import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { planLimits } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
  const { action, adminNotes, customPlan, customInterval } = body;

  if (!action || !["approve", "reject"].includes(action)) {
    return errorResponse("Action invalide ('approve' ou 'reject' requis)", 400);
  }

  // Fetch the receipt
  const { data: receipt, error: receiptError } = await supabase
    .from("dzd_receipts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (receiptError || !receipt) {
    return errorResponse("Reçu introuvable", 404);
  }

  if (action === "reject") {
    const { error: updateError } = await supabase
      .from("dzd_receipts")
      .update({
        status: "rejected",
        admin_notes: adminNotes || "Reçu rejeté par l'administrateur",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) return errorResponse(updateError.message, 500);

    await supabase.from("audit_log").insert({
      admin_id: user!.id,
      admin_name: admin?.name || "Admin",
      action: "Reçu BaridiMob rejeté",
      target_user: receipt.user_email,
      details: adminNotes || "Rejeté",
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // APPROVAL WORKFLOW
  const targetPlan = (customPlan || receipt.plan) as "plus" | "pro";
  const targetInterval = (customInterval || receipt.billing_interval) as "monthly" | "annual";

  // Find user in database
  let targetUserId = receipt.user_id;
  if (!targetUserId) {
    const { data: matchedProfile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", receipt.user_email.trim())
      .maybeSingle();
    if (matchedProfile?.id) {
      targetUserId = matchedProfile.id;
    }
  }

  let userActivated = false;

  if (targetUserId) {
    const creditsMax =
      targetPlan === "pro"
        ? planLimits.pro.creditsMax
        : planLimits.plus.creditsMax;

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + (targetInterval === "annual" ? 365 : 30));

    // Update or insert subscription
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (existingSub) {
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({
          plan: targetPlan,
          billing_interval: targetInterval,
          status: "active",
          credits_remaining: creditsMax,
          credits_max: creditsMax,
          current_period_end: periodEnd.toISOString(),
          reset_date: periodEnd.toISOString(),
        })
        .eq("user_id", targetUserId);

      if (subError) return errorResponse(subError.message, 500);
    } else {
      const { error: insertSubError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: targetUserId,
          plan: targetPlan,
          billing_interval: targetInterval,
          status: "active",
          credits_remaining: creditsMax,
          credits_max: creditsMax,
          current_period_end: periodEnd.toISOString(),
          reset_date: periodEnd.toISOString(),
        });

      if (insertSubError) return errorResponse(insertSubError.message, 500);
    }

    // Set user educationSystem to Algérie if not already set
    await supabase
      .from("profiles")
      .update({ education_system: "Algérie" })
      .eq("id", targetUserId)
      .is("education_system", null);

    // Record credit transaction
    await supabase.from("credit_transactions").insert({
      user_id: targetUserId,
      delta: creditsMax,
      reason: `Validation reçu BaridiMob DZD (${receipt.amount_dzd} DZD) — Plan ${targetPlan} (${targetInterval})`,
      balance_after: creditsMax,
    });

    userActivated = true;
  }

  // Update receipt record
  const noteText = userActivated
    ? adminNotes || `Abonnement ${targetPlan} (${targetInterval}) activé avec succès`
    : `Reçu validé — Attention: Aucun compte avec l'email ${receipt.user_email} pour l'instant`;

  const { error: updateReceiptError } = await supabase
    .from("dzd_receipts")
    .update({
      status: "approved",
      user_id: targetUserId || receipt.user_id,
      admin_notes: noteText,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (updateReceiptError) return errorResponse(updateReceiptError.message, 500);

  // Increment promo code usage count if linked
  if (receipt.promo_code_id || receipt.promo_code) {
    try {
      if (receipt.promo_code_id) {
        const { data: p } = await supabase
          .from("dzd_promo_codes")
          .select("uses_count")
          .eq("id", receipt.promo_code_id)
          .maybeSingle();
        if (p) {
          await supabase
            .from("dzd_promo_codes")
            .update({ uses_count: (p.uses_count || 0) + 1, updated_at: new Date().toISOString() })
            .eq("id", receipt.promo_code_id);
        }
      } else if (receipt.promo_code) {
        const { data: p } = await supabase
          .from("dzd_promo_codes")
          .select("id, uses_count")
          .ilike("code", receipt.promo_code)
          .maybeSingle();
        if (p) {
          await supabase
            .from("dzd_promo_codes")
            .update({ uses_count: (p.uses_count || 0) + 1, updated_at: new Date().toISOString() })
            .eq("id", p.id);
        }
      }
    } catch (promoErr) {
      console.warn("[DZD Receipt] Promo count increment warning:", promoErr);
    }
  }

  // Log in audit log
  await supabase.from("audit_log").insert({
    admin_id: user!.id,
    admin_name: admin?.name || "Admin",
    action: `Validé reçu BaridiMob DZD & ${userActivated ? `activé ${targetPlan} (${targetInterval})` : "en attente de compte"}`,
    target_user: receipt.user_email,
    details: JSON.stringify({
      receiptId: receipt.id,
      amountDzd: receipt.amount_dzd,
      plan: targetPlan,
      interval: targetInterval,
      userActivated,
    }),
    ip: req.headers.get("x-forwarded-for") || "unknown",
  });

  return NextResponse.json({
    ok: true,
    status: "approved",
    userActivated,
    message: userActivated
      ? `Abonnement ${targetPlan.toUpperCase()} (${targetInterval}) activé avec succès pour ${receipt.user_email} !`
      : `Reçu validé. Note : Aucun compte trouvé avec l'email ${receipt.user_email}.`,
  });
}
