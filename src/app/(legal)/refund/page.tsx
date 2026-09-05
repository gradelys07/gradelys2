import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de remboursement | Gradelys",
  description:
    "Prenez connaissance des conditions de remboursement de Gradelys : garantie 7 jours sur les abonnements, packs de recharge et gestion simplifiée.",
  alternates: {
    canonical: "/refund",
  },
  openGraph: {
    title: "Politique de remboursement | Gradelys",
    description:
      "Prenez connaissance des conditions de remboursement de Gradelys : garantie 7 jours sur les abonnements, packs de recharge et gestion simplifiée.",
    url: "https://gradelys.com/refund",
    type: "article",
  },
};

export default function RefundPage() {
  return (
    <>
      <h1>Refund Policy</h1>
      <p className="text-body-sm text-text-muted">Last updated: August 2026</p>

      <h2>1. Subscriptions</h2>
      <p>
        If you're not satisfied with a paid plan, contact us within 7 days of your initial purchase at{" "}
        <a href="mailto:support@gradelys.com">support@gradelys.com</a> for a full refund. After 7 days,
        subscription payments are non-refundable, but you can cancel anytime to stop future billing — you'll
        keep access through the end of your current billing period.
      </p>

      <h2>2. Scan recharge packs</h2>
      <p>
        One-time scan recharge packs are non-refundable once credits have been used, but unused packs can
        be refunded within 7 days of purchase.
      </p>

      <h2>3. How refunds are processed</h2>
      <p>
        Refunds are issued to your original payment method via Whop, our payment processor, and typically
        appear within 5–10 business days depending on your bank.
      </p>

      <h2>4. Chargebacks</h2>
      <p>
        Please contact us before filing a chargeback with your bank — we're happy to resolve billing issues
        directly and quickly.
      </p>

      <h2>5. Contact</h2>
      <p>Billing questions? Email <a href="mailto:support@gradelys.com">support@gradelys.com</a>.</p>
    </>
  );
}
