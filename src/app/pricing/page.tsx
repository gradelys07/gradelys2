"use client";

import * as React from "react";
import Link from "next/link";
import { Check, X, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCheckoutUrl } from "@/lib/whop/client";
import { trackViewContent, trackViewPricing, trackInitiateCheckout, trackClickUpgrade } from "@/lib/whop/tracking";
import { useAuthStore } from "@/stores/auth-store";

const FEATURES = [
  { label: "AI chat", free: "20 msgs/day", plus: "Unlimited", pro: "Unlimited" },
  { label: "Web search in chat", free: "5/day", plus: "Unlimited", pro: "Unlimited" },
  { label: "Document scans", free: "3 total", plus: "100/month", pro: "300/month" },
  { label: "Visualizations", free: "1/month", plus: "30/month", pro: "Unlimited" },
  { label: "Studio documents", free: "1/month", plus: "20/month", pro: "Unlimited" },
  { label: "Spaces", free: "1", plus: "10", pro: "Unlimited" },
  { label: "Flashcard decks", free: true, plus: true, pro: true },
  { label: "Spaced repetition (SM-2)", free: true, plus: true, pro: true },
  { label: "Priority AI model (Pro)", free: false, plus: false, pro: true },
  { label: "Priority support", free: false, plus: true, pro: true },
];

export default function PricingPage() {
  const [annual, setAnnual] = React.useState(true);
  const user = useAuthStore((s) => s.user);

  React.useEffect(() => {
    trackViewContent("pricing");
    trackViewPricing();
  }, []);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      description: "Get started with the essentials.",
      cta: user ? "Current plan" : "Get started free",
      href: user ? "/settings" : "/signup",
    },
    {
      id: "plus",
      name: "Plus",
      price: annual ? 6.99 : 9.99,
      description: "For students who study year-round.",
      cta: "Upgrade to Plus",
      href: getCheckoutUrl(annual ? "plus-annual" : "plus-monthly") || "/signup",
      highlighted: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: annual ? 13.99 : 19.99,
      description: "Unlimited everything, priority model.",
      cta: "Upgrade to Pro",
      href: getCheckoutUrl(annual ? "pro-annual" : "pro-monthly") || "/signup",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <div className="text-center">
          <h1 className="text-display-lg text-text-primary">Simple, honest pricing</h1>
          <p className="mx-auto mt-4 max-w-xl text-body-lg text-text-secondary">
            Start free. Upgrade only when you need more scans, visuals, or documents.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-surface p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn("rounded-full px-4 py-1.5 text-body-sm transition-colors", !annual ? "bg-primary text-white" : "text-text-secondary")}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn("rounded-full px-4 py-1.5 text-body-sm transition-colors", annual ? "bg-primary text-white" : "text-text-secondary")}
            >
              Annual <span className="text-green">— save 30%</span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl border p-7",
                plan.highlighted ? "border-primary bg-surface shadow-glow" : "border-border bg-surface"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-label-md font-medium text-white">
                  Most popular
                </div>
              )}
              <h3 className="text-heading-lg text-text-primary">{plan.name}</h3>
              <p className="mt-1 text-body-sm text-text-muted">{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-display-lg text-text-primary">${plan.price}</span>
                <span className="text-body-sm text-text-muted">/month</span>
              </div>
              <a
                href={plan.href}
                target={plan.id !== "free" ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={() => {
                  if (plan.id !== "free") {
                    trackInitiateCheckout(plan.id, annual ? "annual" : "monthly");
                  } else if (!user) {
                    trackClickUpgrade("pricing-free-cta");
                  }
                }}
              >
                <Button className="mt-6 w-full" variant={plan.highlighted ? "primary" : "secondary"} size="lg">
                  {plan.cta}
                </Button>
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="py-3 text-body-sm font-medium text-text-muted">Features</th>
                <th className="py-3 text-center text-body-sm font-medium text-text-muted">Free</th>
                <th className="py-3 text-center text-body-sm font-medium text-text-muted">Plus</th>
                <th className="py-3 text-center text-body-sm font-medium text-text-muted">Pro</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.label} className="border-b border-border-subtle">
                  <td className="py-3 text-body-sm text-text-secondary">{f.label}</td>
                  <FeatureCell value={f.free} />
                  <FeatureCell value={f.plus} />
                  <FeatureCell value={f.pro} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-16 rounded-xl border border-border-strong bg-gradient-to-br from-surface to-base p-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-3 text-heading-xl text-text-primary">Not sure which plan fits?</h2>
          <p className="mt-2 text-body-md text-text-secondary">Start free — you can upgrade or downgrade anytime.</p>
          <Link href="/signup">
            <Button className="mt-5">Get started free</Button>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return (
      <td className="py-3 text-center">
        {value ? <Check className="mx-auto h-4 w-4 text-green" /> : <X className="mx-auto h-4 w-4 text-text-muted" />}
      </td>
    );
  }
  return <td className="py-3 text-center text-body-sm text-text-secondary">{value}</td>;
}
