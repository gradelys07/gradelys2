import crypto from "crypto";

// ═══════════════════════════════════════════════════════════════
// WHOP CLIENT
// Gradelys uses Whop as its merchant of record for international
// USD billing (Plus/Pro subscriptions + scan recharge packs).
// ═══════════════════════════════════════════════════════════════

export function getCheckoutUrl(planKey: string): string | null {
  const map: Record<string, string | undefined> = {
    "plus-monthly": process.env.NEXT_PUBLIC_WHOP_CHECKOUT_PLUS_MONTHLY,
    "plus-annual": process.env.NEXT_PUBLIC_WHOP_CHECKOUT_PLUS_ANNUAL,
    "pro-monthly": process.env.NEXT_PUBLIC_WHOP_CHECKOUT_PRO_MONTHLY,
    "pro-annual": process.env.NEXT_PUBLIC_WHOP_CHECKOUT_PRO_ANNUAL,
    "recharge-50": process.env.NEXT_PUBLIC_WHOP_CHECKOUT_RECHARGE_50,
    "recharge-200": process.env.NEXT_PUBLIC_WHOP_CHECKOUT_RECHARGE_200,
    "recharge-unlimited": process.env.NEXT_PUBLIC_WHOP_CHECKOUT_RECHARGE_UNLIMITED,
  };
  return map[planKey] || null;
}

/** Verifies the X-Whop-Signature header on incoming webhooks (HMAC-SHA256). */
export function verifyWhopSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export interface WhopWebhookEvent {
  type:
    | "membership.went_valid"
    | "membership.went_invalid"
    | "payment.succeeded"
    | "payment.failed"
    | string;
  data: Record<string, any>;
}
