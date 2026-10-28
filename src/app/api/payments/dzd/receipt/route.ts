import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/supabase/route-helpers";
import { dzdPricing } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const body = await req.json().catch(() => ({}));
    const {
      userName,
      userEmail,
      plan,
      billingInterval,
      amountDzd,
      promoCode,
      fileBase64,
      fileName,
      mimeType,
    } = body;

    // Validation
    if (!userName || !userName.trim()) {
      return errorResponse("Le nom est obligatoire", 400);
    }
    if (!userEmail || !userEmail.includes("@")) {
      return errorResponse("Une adresse email valide est obligatoire", 400);
    }
    if (!plan || !["plus", "pro"].includes(plan)) {
      return errorResponse("Plan invalide (plus ou pro requis)", 400);
    }
    if (!billingInterval || !["monthly", "annual"].includes(billingInterval)) {
      return errorResponse("Intervalle de facturation invalide (monthly ou annual requis)", 400);
    }
    if (!fileBase64) {
      return errorResponse("La capture d'écran du reçu est obligatoire", 400);
    }

    // Determine user ID (authenticated or matching profile by email)
    let matchedUserId: string | null = authUser?.id || null;
    if (!matchedUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", userEmail.trim())
        .maybeSingle();
      if (profile?.id) {
        matchedUserId = profile.id;
      }
    }

    // Expected base amount fallback
    const expectedAmount =
      plan === "plus"
        ? billingInterval === "annual"
          ? dzdPricing.plus.annual
          : dzdPricing.plus.monthly
        : billingInterval === "annual"
        ? dzdPricing.pro.annual
        : dzdPricing.pro.monthly;

    // Check Promo Code if present
    let promoRecord: any = null;
    let discountApplied = 0;
    let finalAmount: number = expectedAmount;
    let commissionAmount = 0;

    if (promoCode && typeof promoCode === "string" && promoCode.trim()) {
      const cleanCode = promoCode.trim().toUpperCase();
      const { data: foundPromo } = await supabase
        .from("dzd_promo_codes")
        .select("*")
        .ilike("code", cleanCode)
        .eq("is_active", true)
        .maybeSingle();

      if (foundPromo) {
        promoRecord = foundPromo;
        if (foundPromo.discount_type === "percent") {
          discountApplied = Math.round((expectedAmount * Number(foundPromo.discount_value)) / 100);
        } else {
          discountApplied = Math.min(expectedAmount, Math.round(Number(foundPromo.discount_value)));
        }
        finalAmount = Math.max(0, expectedAmount - discountApplied);

        // Calculate collaborator commission
        if (foundPromo.commission_type === "percent") {
          commissionAmount = Math.round((finalAmount * Number(foundPromo.commission_value)) / 100);
        } else {
          commissionAmount = Math.round(Number(foundPromo.commission_value));
        }
      }
    }

    if (amountDzd) {
      finalAmount = Number(amountDzd);
    }

    // Format receipt image URL: try uploading to storage or fallback to data URL
    let receiptUrl = "";
    const cleanBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
    const finalMime = mimeType || "image/jpeg";
    const dataUrl = fileBase64.startsWith("data:")
      ? fileBase64
      : `data:${finalMime};base64,${cleanBase64}`;

    try {
      const buffer = Buffer.from(cleanBase64, "base64");
      const safeFileName = (fileName || `receipt-${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `dzd-receipts/${Date.now()}-${safeFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(storagePath, buffer, {
          contentType: finalMime,
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage.from("receipts").getPublicUrl(storagePath);
        receiptUrl = publicUrlData?.publicUrl || dataUrl;
      } else {
        receiptUrl = dataUrl;
      }
    } catch {
      receiptUrl = dataUrl;
    }

    // Insert into dzd_receipts
    const { data: receipt, error: insertError } = await supabase
      .from("dzd_receipts")
      .insert({
        user_id: matchedUserId,
        user_name: userName.trim(),
        user_email: userEmail.trim().toLowerCase(),
        plan,
        billing_interval: billingInterval,
        amount_dzd: finalAmount,
        original_amount_dzd: expectedAmount,
        discount_applied: discountApplied,
        promo_code_id: promoRecord?.id || null,
        promo_code: promoRecord?.code || null,
        commission_amount: commissionAmount,
        receipt_url: receiptUrl,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[DZD Receipt] Insert error:", insertError);
      return errorResponse(insertError.message, 500);
    }

    // Insert into audit_log
    try {
      await supabase.from("audit_log").insert({
        admin_id: matchedUserId,
        admin_name: userName.trim(),
        action: "Reçu BaridiMob DZD soumis",
        target_user: userEmail.trim().toLowerCase(),
        details: JSON.stringify({
          receiptId: receipt.id,
          plan,
          interval: billingInterval,
          amountDzd: finalAmount,
          rip: dzdPricing.rip,
        }),
        ip: req.headers.get("x-forwarded-for") || "unknown",
      });
    } catch (auditErr) {
      console.warn("[DZD Receipt] Audit log warning:", auditErr);
    }

    return NextResponse.json({
      ok: true,
      receiptId: receipt.id,
      message: "Reçu envoyé avec succès. Votre abonnement sera activé sous 8H à 48H.",
    });
  } catch (err: any) {
    console.error("[DZD Receipt] Unexpected error:", err);
    return errorResponse(err.message || "Erreur lors de l'envoi du reçu", 500);
  }
}
