import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingClient } from "@/components/marketing/pricing-client";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: {
    absolute: "Pricing: Free & Paid Study Plans | Gradelys",
  },
  description:
    "Start studying for free with no credit card required, or upgrade to Plus and Pro for unlimited exam scans, spaced repetition flashcards, and mind maps.",
  alternates: {
    canonical: "https://gradelys.com/pricing",
  },
  openGraph: {
    title: "Pricing: Free & Paid Study Plans | Gradelys",
    description:
      "Start studying for free with no credit card required, or upgrade to Plus and Pro for unlimited exam scans, spaced repetition flashcards, and mind maps.",
    url: "https://gradelys.com/pricing",
    type: "website",
    locale: "en_US",
    siteName: "Gradelys",
    images: [
      {
        url: "https://gradelys.com/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Gradelys Pricing: Free & Paid Study Plans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing: Free & Paid Study Plans | Gradelys",
    description:
      "Start studying for free with no credit card required, or upgrade to Plus and Pro for unlimited exam scans, spaced repetition flashcards, and mind maps.",
    images: [
      {
        url: "https://gradelys.com/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Gradelys Pricing: Free & Paid Study Plans",
      },
    ],
  },
};

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Gradelys Study Plans",
  description:
    "Active recall study app featuring spaced repetition (SM-2) flashcards, exam and homework scanning, and visual study diagrams.",
  brand: {
    "@type": "Brand",
    name: "Gradelys",
  },
  offers: [
    {
      "@type": "Offer",
      name: "Gradelys Free",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description: "Essential access to study chat, flashcards, 1 space, and 3 lifetime document scans. No credit card required.",
    },
    {
      "@type": "Offer",
      name: "Gradelys Plus",
      price: "6.99",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      description: "For active students. 100 scans per month, 30 visual syntheses, and unlimited study chat.",
    },
    {
      "@type": "Offer",
      name: "Gradelys Pro",
      price: "13.99",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      description: "Unlimited scans, unlimited mind maps, priority AI processing, and advanced exam revision.",
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://gradelys.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Pricing",
      item: "https://gradelys.com/pricing",
    },
  ],
};

import { Suspense } from "react";

export default function PricingPage() {
  return (
    <>
      <JsonLd schema={[pricingSchema, breadcrumbSchema]} />
      <SiteHeader />
      <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-24 text-center text-text-muted">Loading pricing...</div>}>
        <PricingClient />
      </Suspense>
      <SiteFooter />
    </>
  );
}
