import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TrackPageView } from "@/components/track-page-view";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "À propos de Gradelys | Notre Mission Éducative",
  description:
    "Découvrez la mission de Gradelys : un espace d'apprentissage conçu pour aider chaque étudiant à réviser avec méthode grâce à la mémorisation espacée et au rappel actif.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "À propos de Gradelys | Notre Mission Éducative",
    description:
      "Découvrez la mission de Gradelys : un espace d'apprentissage conçu pour aider chaque étudiant à réviser avec méthode grâce à la mémorisation espacée et au rappel actif.",
    url: "https://gradelys.com/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "À propos de Gradelys | Notre Mission Éducative",
    description:
      "Découvrez la mission de Gradelys : un espace d'apprentissage conçu pour aider chaque étudiant à réviser avec méthode grâce à la mémorisation espacée et au rappel actif.",
  },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "À propos de Gradelys",
  url: "https://gradelys.com/about",
  description:
    "Mission, méthode et vision de Gradelys pour l'apprentissage et la réussite scolaire et universitaire.",
  publisher: {
    "@type": "Organization",
    name: "Gradelys",
    url: "https://gradelys.com",
    logo: "https://gradelys.com/favicon.svg",
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
      name: "À propos",
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
            src="/favicon.svg"
            alt="Logo officiel Gradelys"
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
