import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dzdPricing } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, plan, interval } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { valid: false, error: "Veuillez entrer un code promo" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check plan & interval
    if (!plan || !["plus", "pro"].includes(plan)) {
      return NextResponse.json(
        { valid: false, error: "Plan invalide" },
        { status: 400 }
      );
    }
    if (!interval || !["monthly", "annual"].includes(interval)) {
      return NextResponse.json(
        { valid: false, error: "Intervalle invalide" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: promo, error } = await supabase
      .from("dzd_promo_codes")
      .select("*")
      .ilike("code", cleanCode)
      .maybeSingle();

    if (error || !promo) {
      return NextResponse.json({
        valid: false,
        error: "Code promo introuvable ou invalide.",
      });
    }

    if (!promo.is_active) {
      return NextResponse.json({
        valid: false,
        error: "Ce code promo n'est plus actif.",
      });
    }

    if (promo.max_uses && promo.uses_count >= promo.max_uses) {
      return NextResponse.json({
        valid: false,
        error: "Ce code promo a atteint sa limite maximale d'utilisations.",
      });
    }

    // Calculate base price in DZD
    const basePrice =
      plan === "plus"
        ? interval === "annual"
          ? dzdPricing.plus.annual
          : dzdPricing.plus.monthly
        : interval === "annual"
        ? dzdPricing.pro.annual
        : dzdPricing.pro.monthly;

    let discountAmount = 0;
    if (promo.discount_type === "percent") {
      discountAmount = Math.round((basePrice * Number(promo.discount_value)) / 100);
    } else {
      discountAmount = Math.min(basePrice, Math.round(Number(promo.discount_value)));
    }

    const finalAmount = Math.max(0, basePrice - discountAmount);

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discountType: promo.discount_type,
      discountValue: Number(promo.discount_value),
      originalAmount: basePrice,
      discountAmount,
      finalAmount,
      collaboratorName: promo.collaborator_name,
    });
  } catch (err: any) {
    console.error("[Promo Validate] Unexpected error:", err);
    return NextResponse.json(
      { valid: false, error: err.message || "Erreur de validation" },
      { status: 500 }
    );
  }
}
