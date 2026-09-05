import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingClient } from "@/components/marketing/pricing-client";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Tarifs & Formules d'abonnement | Gradelys",
  description:
    "Découvrez les formules Gradelys : accès Gratuit pour débuter, offres Plus et Pro avec mémorisation espacée (SM-2), diagnostics et synthèses illimités.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Tarifs & Formules d'abonnement | Gradelys",
    description:
      "Découvrez les formules Gradelys : accès Gratuit pour débuter, offres Plus et Pro avec mémorisation espacée (SM-2), diagnostics et synthèses illimités.",
    url: "https://gradelys.com/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarifs & Formules d'abonnement | Gradelys",
    description:
      "Découvrez les formules Gradelys : accès Gratuit pour débuter, offres Plus et Pro avec mémorisation espacée (SM-2), diagnostics et synthèses illimités.",
  },
};

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Gradelys Subscriptions",
  description: "Plateforme d'apprentissage et de révision avec mémorisation espacée, diagnostics d'exercices et synthèses.",
  brand: {
    "@type": "Brand",
    name: "Gradelys",
  },
  offers: [
    {
      "@type": "Offer",
      name: "Gradelys Free",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      description: "Accès essentiel aux outils d'apprentissage, fiches et chat d'étude.",
    },
    {
      "@type": "Offer",
      name: "Gradelys Plus",
      price: "6.99",
      priceCurrency: "EUR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      description: "Pour les étudiants qui révisent toute l'année. 100 scans/mois, 30 synthèses visuelles.",
    },
    {
      "@type": "Offer",
      name: "Gradelys Pro",
      price: "13.99",
      priceCurrency: "EUR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      description: "Accès illimité avec 300 scans/mois, synthèses et documents illimités.",
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
      name: "Accueil",
      item: "https://gradelys.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Tarifs",
      item: "https://gradelys.com/pricing",
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <JsonLd schema={[pricingSchema, breadcrumbSchema]} />
      <SiteHeader />
      <PricingClient />
      <SiteFooter />
    </>
  );
}
