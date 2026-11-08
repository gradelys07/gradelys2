import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Mail, MessageCircle } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: {
    absolute: "Contact Gradelys Support | Gradelys",
  },
  description:
    "Have questions about Gradelys or need help studying? Contact our support team directly at support@gradelys.com. We answer within 24 hours.",
  alternates: {
    canonical: "https://gradelys.com/contact",
  },
  openGraph: {
    title: "Contact Gradelys Support | Gradelys",
    description:
      "Have questions about Gradelys or need help studying? Contact our support team directly at support@gradelys.com. We answer within 24 hours.",
    url: "https://gradelys.com/contact",
    type: "website",
    locale: "en_US",
    siteName: "Gradelys",
    images: [
      {
        url: "https://gradelys.com/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Contact Gradelys Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Gradelys Support | Gradelys",
    description:
      "Have questions about Gradelys or need help studying? Contact our support team directly at support@gradelys.com.",
    images: [
      {
        url: "https://gradelys.com/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Contact Gradelys Support",
      },
    ],
  },
};

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Gradelys",
  url: "https://gradelys.com/contact",
  description: "Contact and customer support channels for Gradelys students and educators.",
  mainEntity: {
    "@type": "Organization",
    name: "Gradelys",
    url: "https://gradelys.com",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@gradelys.com",
        availableLanguage: ["English", "French"],
      },
      {
        "@type": "ContactPoint",
        contactType: "general inquiries",
        email: "hello@gradelys.com",
        availableLanguage: ["English", "French"],
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
      name: "Home",
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
            aria-label="Contact support by email at support@gradelys.com"
          >
            <Mail className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
            <p className="mt-3 text-heading-sm text-text-primary">Support</p>
            <p className="mt-1 text-body-sm text-text-muted">support@gradelys.com</p>
          </a>
          <a
            href="mailto:hello@gradelys.com"
            className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Contact general inquiries by email at hello@gradelys.com"
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
