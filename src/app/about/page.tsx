import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { GraduationCap } from "lucide-react";
import { TrackPageView } from "@/components/track-page-view";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <TrackPageView page="about" />
      <main className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <div className="h-8 w-8 rounded-lg overflow-hidden">
          <img src="/favicon.svg" alt="Gradelys" className="h-full w-full object-contain" />
        </div>
        <h1 className="mt-4 text-display-lg text-text-primary">About Gradelys</h1>
        <p className="mt-6 text-body-lg leading-relaxed text-text-secondary">
          Gradelys is an AI-powered learning workspace built for students who want to study smarter, not
          longer. We bring chat, notes, spaced-repetition flashcards, practice exams, and visual learning
          tools together in one place — so you spend less time juggling apps and more time actually
          learning.
        </p>
        <p className="mt-4 text-body-lg leading-relaxed text-text-secondary">
          The product is built around a simple idea: active recall and spaced repetition work, and AI can
          make them effortless to set up. Scan a graded exam and get a diagnostic of exactly what to review.
          Turn a dense chapter into a mind map in seconds. Ask a question and get an answer grounded in your
          own material.
        </p>
        <p className="mt-4 text-body-lg leading-relaxed text-text-secondary">
          We're just getting started, and we're building Gradelys for students everywhere — starting with a
          focus on clarity, honesty, and genuinely useful AI, not gimmicks.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
