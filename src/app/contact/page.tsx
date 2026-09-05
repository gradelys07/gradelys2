import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Mail, MessageCircle } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Contact & Assistance | Gradelys",
  description:
    "Une question, un retour ou un besoin d'assistance ? Contactez l'équipe Gradelys par email à support@gradelys.com. Nous vous répondons sous 24h.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact & Assistance | Gradelys",
    description:
      "Une question, un retour ou un besoin d'assistance ? Contactez l'équipe Gradelys par email à support@gradelys.com. Nous vous répondons sous 24h.",
    url: "https://gradelys.com/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact & Assistance | Gradelys",
    description:
      "Une question, un retour ou un besoin d'assistance ? Contactez l'équipe Gradelys par email à support@gradelys.com.",
  },
};

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contactez Gradelys",
  url: "https://gradelys.com/contact",
  description: "Canaux de contact et assistance pour les utilisateurs et partenaires de Gradelys.",
  mainEntity: {
    "@type": "Organization",
    name: "Gradelys",
    url: "https://gradelys.com",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@gradelys.com",
        availableLanguage: ["French", "English"],
      },
      {
        "@type": "ContactPoint",
        contactType: "general inquiries",
        email: "hello@gradelys.com",
        availableLanguage: ["French", "English"],
      },
    ],
  },
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
      name: "Contact",
      item: "https://gradelys.com/contact",
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <JsonLd schema={[contactSchema, breadcrumbSchema]} />
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-20 text-center lg:px-8">
        <h1 className="text-display-lg text-text-primary">Get in touch</h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Questions, feedback, or partnership inquiries — our team is here to assist you.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href="mailto:support@gradelys.com"
            className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Contacter le support par email à support@gradelys.com"
          >
            <Mail className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
            <p className="mt-3 text-heading-sm text-text-primary">Support</p>
            <p className="mt-1 text-body-sm text-text-muted">support@gradelys.com</p>
          </a>
          <a
            href="mailto:hello@gradelys.com"
            className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Contact général par email à hello@gradelys.com"
          >
            <MessageCircle className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
            <p className="mt-3 text-heading-sm text-text-primary">General inquiries</p>
            <p className="mt-1 text-body-sm text-text-muted">hello@gradelys.com</p>
          </a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
