import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TrackPageView } from "@/components/track-page-view";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: {
    absolute: "About Gradelys: Science-Based Studying | Gradelys",
  },
  description:
    "Learn how Gradelys combines spaced repetition (SM-2) and active recall to help students diagnose exam mistakes, study faster, and remember more.",
  alternates: {
    canonical: "https://gradelys.com/about",
  },
  openGraph: {
    title: "About Gradelys: Science-Based Studying | Gradelys",
    description:
      "Learn how Gradelys combines spaced repetition (SM-2) and active recall to help students diagnose exam mistakes, study faster, and remember more.",
    url: "https://gradelys.com/about",
    type: "website",
    locale: "en_US",
    siteName: "Gradelys",
    images: [
      {
        url: "https://gradelys.com/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "About Gradelys: Science-Based Studying",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Gradelys: Science-Based Studying | Gradelys",
    description:
      "Learn how Gradelys combines spaced repetition (SM-2) and active recall to help students diagnose exam mistakes, study faster, and remember more.",
    images: [
      {
        url: "https://gradelys.com/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "About Gradelys: Science-Based Studying",
      },
    ],
  },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Gradelys",
  url: "https://gradelys.com/about",
  description:
    "Mission, science-backed learning methods, and active recall approach of Gradelys for academic success.",
  publisher: {
    "@type": "Organization",
    name: "Gradelys",
    url: "https://gradelys.com",
    logo: "https://gradelys.com/favicon.png",
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
      name: "About",
      item: "https://gradelys.com/about",
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <JsonLd schema={[aboutSchema, breadcrumbSchema]} />
      <SiteHeader />
      <TrackPageView page="about" />
      <main className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <div className="h-8 w-8 rounded-lg overflow-hidden">
          <img
            src="/favicon.png"
            alt="Gradelys official logo"
            width={32}
            height={32}
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="mt-4 text-display-lg text-text-primary">About Gradelys</h1>
        <p className="mt-6 text-body-lg leading-relaxed text-text-secondary">
          Gradelys is a dedicated learning workspace designed for students and learners who aim to master
          their subjects thoroughly. We bring together notes, spaced-repetition flashcards, practice exams,
          and visual conceptualization tools into one cohesive environment — helping you focus on understanding
          and long-term retention.
        </p>
        <p className="mt-4 text-body-lg leading-relaxed text-text-secondary">
          Our platform is built upon proven cognitive science principles: active recall and spaced repetition
          consistently outperform passive rereading. By diagnosing errors on homework and exams, structuring dense
          syllabi into intuitive visual maps, and scheduling timely reviews, Gradelys transforms revision into
          a calm, structured, and rewarding process.
        </p>
        <p className="mt-4 text-body-lg leading-relaxed text-text-secondary">
          We are committed to delivering clarity, educational rigor, and reliable tools that empower students
          worldwide to achieve academic excellence.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
