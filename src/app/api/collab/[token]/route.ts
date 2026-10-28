import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token || typeof token !== "string" || token.length < 20) {
      return NextResponse.json(
        { error: "Lien collaborateur invalide ou expiré" },
        { status: 404 }
      );
    }

    const supabase = createClient();

    // Fetch promo code by secret_token
    const { data: promo, error: promoError } = await supabase
      .from("dzd_promo_codes")
      .select("*")
      .eq("secret_token", token)
      .maybeSingle();

    if (promoError || !promo) {
      return NextResponse.json(
        { error: "Tableau de bord introuvable. Vérifiez l'adresse ou contactez l'équipe Gradelys." },
        { status: 404 }
      );
    }

    // Fetch receipts for this promo
    // STRICT PRIVACY: Do NOT select user_name, user_email, user_id!
    const { data: receipts } = await supabase
      .from("dzd_receipts")
      .select("id, plan, billing_interval, amount_dzd, commission_amount, status, created_at")
      .or(`promo_code_id.eq.${promo.id},promo_code.ilike.${promo.code}`)
      .order("created_at", { ascending: false });

    let totalSales = 0;
    let totalEarnedDzd = 0;
    let pendingEarnedDzd = 0;

    const anonymizedTransactions = (receipts || []).map((r, index) => {
      const comm = Number(r.commission_amount || 0);

      if (r.status === "approved") {
        totalSales++;
        totalEarnedDzd += comm;
      } else if (r.status === "pending") {
        pendingEarnedDzd += comm;
      }

      // Generate privacy-safe anonymous display tag (e.g. Vente #1024)
      const shortId = r.id.substring(0, 8).toUpperCase();

      return {
        id: r.id,
        displayId: `Souscription #${shortId}`,
        plan: r.plan,
        billingInterval: r.billing_interval,
        amountDzd: Number(r.amount_dzd || 0),
        commissionAmount: comm,
        status: r.status,
        createdAt: r.created_at,
      };
    });

    return NextResponse.json({
      collaboratorName: promo.collaborator_name,
      code: promo.code,
      discountType: promo.discount_type,
      discountValue: Number(promo.discount_value),
      commissionType: promo.commission_type,
      commissionValue: Number(promo.commission_value),
      isActive: promo.is_active,
      stats: {
        totalSales,
        totalEarnedDzd,
        pendingEarnedDzd,
      },
      transactions: anonymizedTransactions,
    });
  } catch (err: any) {
    console.error("[Collab API] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
