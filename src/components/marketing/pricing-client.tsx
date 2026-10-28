"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import * as React from "react";
import Link from "next/link";
import { Check, X, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCheckoutUrl } from "@/lib/whop/client";
import { trackViewContent, trackViewPricing, trackInitiateCheckout, trackClickUpgrade } from "@/lib/whop/tracking";
import { useAuthStore } from "@/stores/auth-store";
import { dzdPricing, isAlgerianUser } from "@/lib/config";
import { BaridimobPaymentModal } from "@/components/marketing/baridimob-modal";

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

export function PricingClient() {
  const [annual, setAnnual] = React.useState(true);
  const user = useAuthStore((s) => s.user);

  // Automatically detect if user is Algerian:
  // 1. User has chosen "Algérie" in Settings (profile education_system)
  // 2. OR detected in Algeria via browser timezone (Africa/Algiers) or locale
  // 3. OR direct link with ?country=dz or ?dzd=true
  const [isAlgeria, setIsAlgeria] = React.useState(false);

  // Payment method for Algerian users: "dzd" (BaridiMob) or "intl" (Stripe/Whop)
  const [dzPaymentMethod, setDzPaymentMethod] = React.useState<"dzd" | "intl">("dzd");

  // BaridiMob payment modal state
  const [baridimobModalOpen, setBaridimobModalOpen] = React.useState(false);
  const [selectedPlanForDzd, setSelectedPlanForDzd] = React.useState<"plus" | "pro">("plus");

  React.useEffect(() => {
    trackViewContent("pricing");
    trackViewPricing();

    // STRICT CHECK: Only activate Algerian DZD mode if the user selected "Algérie" in Settings
    const cachedCountry = typeof window !== "undefined" ? localStorage.getItem("gradelys_education_system") : null;
    const activeCountry = user?.educationSystem || cachedCountry;

    setIsAlgeria(isAlgerianUser(activeCountry));
  }, [user?.educationSystem]);

  const isDzdMode = isAlgeria && dzPaymentMethod === "dzd";

  function handleOpenDzdModal(plan: "plus" | "pro") {
    setSelectedPlanForDzd(plan);
    setBaridimobModalOpen(true);
  }

  // International plans (standard, untouched)
  const intlPlans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: annual ? "/year" : "/month",
      description: "Get started with the essentials.",
      cta: user ? "Current plan" : "Get started free",
      href: user ? "/settings" : "/signup",
      isDzd: false,
    },
    {
      id: "plus",
      name: "Plus",
      price: annual ? "$69" : "$9.99",
      period: annual ? "/year" : "/month",
      description: "For students who study year-round.",
      cta: "Upgrade to Plus",
      href: getCheckoutUrl(annual ? "plus-annual" : "plus-monthly") || "/signup",
      highlighted: true,
      isDzd: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: annual ? "$139" : "$19.99",
      period: annual ? "/year" : "/month",
      description: "Unlimited everything, priority model.",
      cta: "Upgrade to Pro",
      href: getCheckoutUrl(annual ? "pro-annual" : "pro-monthly") || "/signup",
      isDzd: false,
    },
  ];

  // Algerian DZD plans
  const dzdPlans = [
    {
      id: "free",
      name: "Free",
      price: "0 DZD",
      period: annual ? "/an" : "/mois",
      description: "Démarrez gratuitement avec les fonctionnalités essentielles.",
      cta: user ? "Plan actuel" : "Commencer gratuitement",
      href: user ? "/settings" : "/signup",
      isDzd: true,
    },
    {
      id: "plus",
      name: "Plus",
      price: annual ? `${dzdPricing.plus.annual.toLocaleString()} DZD` : `${dzdPricing.plus.monthly.toLocaleString()} DZD`,
      period: annual ? "/an" : "/mois",
      description: "Pour les étudiants qui étudient toute l'année.",
      cta: "Payer via BaridiMob",
      highlighted: true,
      isDzd: true,
      planKey: "plus" as const,
    },
    {
      id: "pro",
      name: "Pro",
      price: annual ? `${dzdPricing.pro.annual.toLocaleString()} DZD` : `${dzdPricing.pro.monthly.toLocaleString()} DZD`,
      period: annual ? "/an" : "/mois",
      description: "Accès illimité à tout et modèle IA prioritaire.",
      cta: "Payer via BaridiMob",
      isDzd: true,
      planKey: "pro" as const,
    },
  ];

  const plans = isDzdMode ? dzdPlans : intlPlans;

  function handlePlanAction(plan: any) {
    if (plan.isDzd && plan.id !== "free") {
      handleOpenDzdModal(plan.planKey);
      return;
    }

    if (plan.id === "free") {
      if (user) {
        window.location.href = "/settings";
      } else {
        window.location.href = "/signup";
      }
      return;
    }

    trackInitiateCheckout(plan.id, annual ? "annual" : "monthly");

    const checkoutUrl =
      getCheckoutUrl(annual ? `${plan.id}-annual` : `${plan.id}-monthly`) ||
      "https://whop.com/gradelys";

    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
      <div className="text-center">
        <h1 className="text-display-lg text-text-primary">
          {isDzdMode ? "Tarifs simples et adaptés en DZD" : "Simple, honest pricing"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-text-secondary">
          {isDzdMode
            ? "Commencez gratuitement. Passez au niveau supérieur uniquement lorsque vous avez besoin de plus de scans, visuels ou documents."
            : "Start free. Upgrade only when you need more scans, visuals, or documents."}
        </p>

        {/* Algerian Payment Method Selector — only shown to users with Algeria set or detected */}
        {isAlgeria && (
          <div className="mt-6 flex flex-col items-center">
            <p className="mb-2 text-label-sm font-medium uppercase tracking-wider text-text-muted">
              Option de paiement
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface p-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => setDzPaymentMethod("dzd")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-body-sm font-semibold transition-all",
                  dzPaymentMethod === "dzd"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                <span>🇩🇿 Paiement BaridiMob (DZD)</span>
              </button>
              <button
                type="button"
                onClick={() => setDzPaymentMethod("intl")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-body-sm font-medium transition-all",
                  dzPaymentMethod === "intl"
                    ? "bg-surface-raised border border-border text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                <CreditCard className="h-4 w-4" />
                <span>🌍 Paiement International (Carte)</span>
              </button>
            </div>
          </div>
        )}

        {/* Monthly / Annual Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              "rounded-full px-4 py-1.5 text-body-sm transition-colors",
              !annual ? "bg-primary text-white" : "text-text-secondary"
            )}
          >
            {isDzdMode ? "Mensuel" : "Monthly"}
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn(
              "rounded-full px-4 py-1.5 text-body-sm transition-colors",
              annual ? "bg-primary text-white" : "text-text-secondary"
            )}
          >
            {isDzdMode ? "Annuel" : "Annual"}{" "}
            <span className="text-green font-medium">
              {isDzdMode ? "— Économisez jusqu'à 47%" : "— save 30%"}
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan: any) => (
          <div
            key={plan.id}
            className={cn(
              "relative rounded-xl border p-7 transition-all flex flex-col justify-between",
              plan.highlighted ? "border-primary bg-surface shadow-glow" : "border-border bg-surface"
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-label-md font-medium text-white shadow-sm">
                {isDzdMode ? "Le plus populaire" : "Most popular"}
              </div>
            )}

            <div>
              <h2 className="text-heading-lg text-text-primary">{plan.name}</h2>
              <p className="mt-1 text-body-sm text-text-muted">{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-display-lg text-text-primary">{plan.price}</span>
                <span className="text-body-sm text-text-muted">{plan.period}</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                className="w-full"
                variant={plan.highlighted ? "primary" : "secondary"}
                size="lg"
                onClick={() => handlePlanAction(plan)}
              >
                {plan.cta}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Features Comparison Table */}
      <div className="mt-16 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="py-3 text-body-sm font-medium text-text-muted">
                {isDzdMode ? "Fonctionnalités" : "Features"}
              </th>
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

      {/* Bottom CTA */}
      <div className="mt-16 rounded-xl border border-border-strong bg-gradient-to-br from-surface to-base p-10 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-primary" />
        <h2 className="mt-3 text-heading-xl text-text-primary">
          {isDzdMode ? "Vous hésitez sur le plan ?" : "Not sure which plan fits?"}
        </h2>
        <p className="mt-2 text-body-md text-text-secondary">
          {isDzdMode
            ? "Commencez gratuitement — vous pouvez upgrader à tout moment."
            : "Start free — you can upgrade or downgrade anytime."}
        </p>
        <Link href="/signup">
          <Button className="mt-5">
            {isDzdMode ? "Commencer gratuitement" : "Get started free"}
          </Button>
        </Link>
      </div>

      {/* BaridiMob Payment Modal */}
      <BaridimobPaymentModal
        open={baridimobModalOpen}
        onOpenChange={setBaridimobModalOpen}
        plan={selectedPlanForDzd}
        interval={annual ? "annual" : "monthly"}
      />
    </main>
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
