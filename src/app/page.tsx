import Link from "next/link";
import {
  ArrowRight, MessageSquare, NotebookPen, Brain, Sparkles, FileStack,
  FolderKanban, ScanLine, CheckCircle2, Star, Zap, Shield, Globe,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { HeroChatMock } from "@/components/marketing/hero-chat-mock";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "AI Chat",
    description: "Ask anything, upload a PDF or paste a YouTube link, and get grounded, cited answers in seconds.",
    color: "text-primary",
    bg: "bg-[var(--primary-subtle)]",
  },
  {
    icon: NotebookPen,
    title: "Smart Notes",
    description: "Write, organize, and tag your notes — then turn any note into flashcards or a quiz with one click.",
    color: "text-blue",
    bg: "bg-blue-500/10",
  },
  {
    icon: Brain,
    title: "Practice",
    description: "Quiz mode, timed exams, and flashcards with real spaced-repetition (SM-2) so nothing you learn fades.",
    color: "text-green",
    bg: "bg-[var(--accent-green-subtle)]",
  },
  {
    icon: Sparkles,
    title: "Visualize",
    description: "Turn dense chapters into diagrams, mind maps, timelines, and charts you'll actually remember.",
    color: "text-purple",
    bg: "bg-purple-500/10",
  },
  {
    icon: FileStack,
    title: "Studio",
    description: "Generate polished notes, reports, summaries, and essays with an AI writing panel by your side.",
    color: "text-yellow",
    bg: "bg-[var(--accent-yellow-subtle)]",
  },
  {
    icon: FolderKanban,
    title: "Spaces",
    description: "Group everything by subject or exam — sources, chats, and notes, all in one organized workspace.",
    color: "text-red",
    bg: "bg-[var(--accent-red-subtle)]",
  },
  {
    icon: ScanLine,
    title: "Scan",
    description: "Photograph a graded exam and get an instant diagnostic: what went wrong, and flashcards to fix it.",
    color: "text-primary",
    bg: "bg-[var(--primary-subtle)]",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Add your content",
    description: "Paste a topic, upload your course PDF, or snap a photo of a graded exam.",
  },
  {
    n: "02",
    title: "AI does the heavy lifting",
    description: "Gradelys reads, structures, and turns it into chat answers, flashcards, quizzes, or visuals.",
  },
  {
    n: "03",
    title: "Study — and actually remember",
    description: "Spaced repetition and active recall keep bringing back what you're about to forget.",
  },
];

const TESTIMONIALS = [
  {
    name: "Amira K.",
    role: "High school senior",
    quote: "I used to reread my notes for hours and forget everything by the exam. The flashcard scheduling actually keeps things stuck.",
  },
  {
    name: "Marc D.",
    role: "University, Biology major",
    quote: "Scanning my graded midterm and getting a breakdown of exactly which concepts I lost points on was a genuine wake-up call.",
  },
  {
    name: "Yasmine B.",
    role: "Preparing for entrance exams",
    quote: "Turning a whole chapter into a mind map takes me two minutes now instead of an evening. I actually look forward to reviewing.",
  },
];

const FAQS = [
  {
    q: "Is Gradelys free to use?",
    a: "Yes — the Free plan gives you unlimited AI chat, limited daily practice, and 3 lifetime document scans, no credit card required. Plus and Pro unlock higher limits and more scans per month.",
  },
  {
    q: "What subjects does Gradelys support?",
    a: "Gradelys works across virtually any subject — math, sciences, languages, history, computer science, and more — because it adapts to whatever content or topic you give it.",
  },
  {
    q: "How does the spaced repetition system work?",
    a: "Every flashcard uses the SM-2 algorithm — the same method behind Anki — to schedule reviews right before you're about to forget, so long-term retention goes up without extra study time.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Plans are month-to-month or annual with no lock-in, and you can cancel or switch plans anytime from your account settings.",
  },
  {
    q: "Is my data private?",
    a: "Your notes, chats, and documents are yours. We don't sell your data, and you can request a full export or deletion at any time from Settings.",
  },
  {
    q: "Which languages does Gradelys support?",
    a: "Gradelys' interface currently ships in English and French, with more languages on the roadmap — the AI itself can read and respond in dozens of languages regardless of the interface language.",
  },
];

const STATS = [
  { value: "7", label: "Learning tools in one workspace" },
  { value: "SM-2", label: "Proven spaced-repetition engine" },
  { value: "<2min", label: "From chapter to mind map" },
  { value: "24/7", label: "AI study support, always on" },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, var(--primary-glow) 0%, transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 lg:px-8 lg:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-border-strong bg-surface px-3.5 py-1.5 text-label-lg text-text-secondary">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Your entire study workflow, powered by AI
              </div>
              <h1 className="mt-6 animate-slide-up text-display-md text-text-primary sm:text-display-lg lg:text-display-xl">
                Learn smarter.
                <br />
                <span className="bg-gradient-to-r from-primary via-purple to-blue bg-clip-text text-transparent">
                  Not harder.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl animate-slide-up text-body-lg text-text-secondary">
                Chat with AI, scan your homework for instant feedback, generate flashcards
                that adapt to your memory, and turn any topic into a visual you'll actually remember.
              </p>
              <div className="mt-8 flex animate-slide-up flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" icon={<Zap className="h-4.5 w-4.5" />}>
                    Get started free
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="secondary" size="lg">
                    View pricing
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-body-sm text-text-muted">No credit card required · Free forever plan</p>
            </div>

            <div className="relative mx-auto mt-16 max-w-4xl animate-slide-up">
              <HeroChatMock />
            </div>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────────────── */}
        <section className="border-y border-border-subtle bg-surface/40">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-12 lg:grid-cols-4 lg:px-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-display-md text-text-primary">{stat.value}</div>
                <div className="mt-1 text-body-sm text-text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-display-md text-text-primary">One workspace. Every study tool.</h2>
            <p className="mt-4 text-body-lg text-text-secondary">
              Stop juggling five different apps. Gradelys brings chat, notes, practice, and visualization together.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-lg border border-border bg-surface p-6 transition-all hover:border-border-strong hover:bg-elevated"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-md ${f.bg}`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="mt-4 text-heading-sm text-text-primary">{f.title}</h3>
                <p className="mt-2 text-body-sm text-text-secondary">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────── */}
        <section className="border-y border-border-subtle bg-surface/40 py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-display-md text-text-primary">How it works</h2>
              <p className="mt-4 text-body-lg text-text-secondary">Three steps between you and a better grade.</p>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.n} className="relative rounded-lg border border-border bg-base p-7">
                  <span className="text-display-lg font-extrabold text-border-strong">{step.n}</span>
                  <h3 className="mt-3 text-heading-md text-text-primary">{step.title}</h3>
                  <p className="mt-2 text-body-md text-text-secondary">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ─────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-display-md text-text-primary">Loved by focused students</h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-lg border border-border bg-surface p-6">
                <div className="flex gap-0.5 text-yellow">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-body-md text-text-secondary">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple text-label-md font-semibold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-body-sm font-medium text-text-primary">{t.name}</div>
                    <div className="text-label-md text-text-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRUST BAR ────────────────────────────────────── */}
        <section className="border-y border-border-subtle bg-surface/40">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-6 px-5 py-10 lg:px-8">
            {[
              { icon: Shield, label: "Data encrypted in transit & at rest" },
              { icon: Globe, label: "Built for students worldwide" },
              { icon: CheckCircle2, label: "GDPR-ready data controls" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-body-sm text-text-muted">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING TEASER ───────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-display-md text-text-primary">Simple, honest pricing</h2>
            <p className="mt-4 text-body-lg text-text-secondary">Start free. Upgrade only when you need more.</p>
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/pricing">
              <Button size="lg" icon={<ArrowRight className="h-4.5 w-4.5" />}>
                See full pricing
              </Button>
            </Link>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section id="faq" className="border-t border-border-subtle bg-surface/40 py-24">
          <div className="mx-auto max-w-3xl px-5 lg:px-8">
            <h2 className="text-center text-display-md text-text-primary">Frequently asked questions</h2>
            <div className="mt-12">
              <FaqAccordion items={FAQS} />
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-5 py-24 lg:px-8">
          <div className="relative overflow-hidden rounded-xl border border-border-strong bg-gradient-to-br from-surface to-base p-12 text-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{ background: "radial-gradient(50% 80% at 50% 100%, var(--primary-glow) 0%, transparent 70%)" }}
            />
            <div className="relative">
              <h2 className="text-display-md text-text-primary">Ready to study smarter?</h2>
              <p className="mx-auto mt-4 max-w-md text-body-lg text-text-secondary">
                Join Gradelys today — it takes less than a minute to get started.
              </p>
              <div className="mt-8 flex justify-center">
                <Link href="/signup">
                  <Button size="lg" icon={<Zap className="h-4.5 w-4.5" />}>
                    Get started free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
