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

export function verifyWhopSignature(rawBody: string, headers: Headers): boolean {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Whop Webhook] Missing WHOP_WEBHOOK_SECRET in environment variables.");
    return false;
  }

  try {
    // 1. Check for Standard Webhooks (Whop V3)
    const webhookId = headers.get("webhook-id");
    const webhookTimestamp = headers.get("webhook-timestamp");
    const webhookSignature = headers.get("webhook-signature");

    if (webhookId && webhookTimestamp && webhookSignature) {
      // payload = msgId . timestamp . body
      const payload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
      
      // Compute HMAC-SHA256, but Standard Webhooks often use base64 encoding.
      // We will compute both base64 and hex just to be safe.
      const hmacBase64 = crypto.createHmac("sha256", secret).update(payload).digest("base64");
      const hmacHex = crypto.createHmac("sha256", secret).update(payload).digest("hex");

      const signatures = webhookSignature.split(" ").map(s => s.split(",")[1]); // extract signatures without v1, prefix
      
      if (signatures.includes(hmacBase64) || signatures.includes(hmacHex)) {
        return true;
      } else {
        console.error("[Whop Webhook] Standard Webhooks signature mismatch.", {
          expectedBase64: hmacBase64,
          expectedHex: hmacHex,
          received: webhookSignature
        });
        return false;
      }
    }

    // 2. Check for legacy Whop Webhooks (V2)
    const legacySignature = headers.get("x-whop-signature");
    if (legacySignature) {
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(legacySignature))) {
        return true;
      } else {
        console.error("[Whop Webhook] Legacy X-Whop-Signature mismatch.", {
          expected,
          received: legacySignature
        });
        return false;
      }
    }

    console.error("[Whop Webhook] No signature headers found. Received headers:", Object.fromEntries(headers.entries()));
    return false;
  } catch (err) {
    console.error("[Whop Webhook] Verification error:", err);
    return false;
  }
}

export interface WhopWebhookEvent {
  type:
    | "membership.activated"
    | "membership.deactivated"
    | "payment.succeeded"
    | "payment.failed"
    | string;
  data: Record<string, any>;
}
