import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, MessageSquare, NotebookPen, Brain, Sparkles, FileStack,
  FolderKanban, ScanLine, CheckCircle2, Star, Zap, Shield, Globe, PlayCircle, Image as ImageIcon, Network, Search, Home, FileText, ChevronRight, Folder, CloudUpload, Camera, Link2, Circle, Check, GraduationCap, TrendingUp, Quote
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { HeroChatMock } from "@/components/marketing/hero-chat-mock";
import { TrackPageView } from "@/components/track-page-view";
import { TrackingCTA } from "@/components/tracking-cta";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Gradelys | Espace d'apprentissage & de révision interactif",
  description:
    "Chat d'étude, fiches de révision à répétition espacée (SM-2), diagnostic immédiat d'exercices et schémas visuels : tout pour réussir vos examens avec Gradelys.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Gradelys | Espace d'apprentissage & de révision interactif",
    description:
      "Chat d'étude, fiches de révision à répétition espacée (SM-2), diagnostic immédiat d'exercices et schémas visuels : tout pour réussir vos examens avec Gradelys.",
    url: "https://gradelys.com",
    type: "website",
  },
};

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

const TESTIMONIAL_CARDS = [
  {
    name: "Amira K.",
    rating: 4.5,
    role: "High school senior",
    quote: "I used to reread my notes for hours and forget everything by the exam. The flashcard scheduling actually keeps things stuck.",
    avatar: "https://i.pravatar.cc/100?img=47",
    color: {
      glow: "bg-blue-50/50",
      quote: "text-blue-100",
      tagText: "text-blue-700",
      tagBg: "bg-blue-50 border-blue-100",
      icon: "text-blue-500",
    },
    tagIcon: GraduationCap,
    tagText: "Improved her grades",
  },
  {
    name: "Marc D.",
    rating: 5,
    role: "University, Biology major",
    quote: "Scanning my graded midterm and getting a breakdown of exactly which concepts I lost points on was a genuine wake-up call.",
    avatar: "https://i.pravatar.cc/100?img=11",
    color: {
      glow: "bg-cyan-50/50",
      quote: "text-cyan-100",
      tagText: "text-cyan-700",
      tagBg: "bg-cyan-50 border-cyan-100",
      icon: "text-cyan-500",
    },
    tagIcon: TrendingUp,
    tagText: "Understands his weak points",
  },
  {
    name: "Yasmine B.",
    rating: 4,
    role: "Preparing for entrance exams",
    quote: "Turning a whole chapter into a mind map takes me two minutes now instead of an evening. I actually look forward to reviewing.",
    avatar: "https://i.pravatar.cc/100?img=41",
    color: {
      glow: "bg-purple-50/50",
      quote: "text-purple-100",
      tagText: "text-purple-700",
      tagBg: "bg-purple-50 border-purple-100",
      icon: "text-purple-500",
    },
    tagIcon: Sparkles,
    tagText: "More confidence",
  },
];

const TESTIMONIAL_CARDS_ROW_2 = [
  {
    name: "Lucas M.",
    rating: 4.5,
    role: "Medical Student",
    quote: "I upload my 50-page lecture slides and within seconds I have a full study guide. It saves me days of manual formatting.",
    avatar: "https://i.pravatar.cc/100?img=33",
    color: {
      glow: "bg-emerald-50/50",
      quote: "text-emerald-100",
      tagText: "text-emerald-700",
      tagBg: "bg-emerald-50 border-emerald-100",
      icon: "text-emerald-500",
    },
    tagIcon: FileText,
    tagText: "Saves hours of work",
  },
  {
    name: "Chloe R.",
    rating: 5,
    role: "High school junior",
    quote: "The AI chat explains math formulas better than my textbook. I can literally ask 'explain this like I'm 5' and it works perfectly.",
    avatar: "https://i.pravatar.cc/100?img=5",
    color: {
      glow: "bg-rose-50/50",
      quote: "text-rose-100",
      tagText: "text-rose-700",
      tagBg: "bg-rose-50 border-rose-100",
      icon: "text-rose-500",
    },
    tagIcon: MessageSquare,
    tagText: "Easier to understand",
  },
  {
    name: "David P.",
    rating: 4.5,
    role: "Computer Science major",
    quote: "I love that I can visualize complex data structures. Generating flowcharts directly from my notes is an absolute game-changer.",
    avatar: "https://i.pravatar.cc/100?img=53",
    color: {
      glow: "bg-amber-50/50",
      quote: "text-amber-100",
      tagText: "text-amber-700",
      tagBg: "bg-amber-50 border-amber-100",
      icon: "text-amber-500",
    },
    tagIcon: Brain,
    tagText: "Visual learning",
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

// Deprecated STATS block removed

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Gradelys",
  url: "https://gradelys.com",
  logo: "https://gradelys.com/favicon.svg",
  description: "Plateforme éducative d'apprentissage et de révision avec mémorisation espacée (SM-2), diagnostics d'exercices et synthèses.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@gradelys.com",
    contactType: "customer service",
  },
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Gradelys",
  url: "https://gradelys.com",
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Gradelys",
  url: "https://gradelys.com",
  applicationCategory: "EducationalApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  featureList: [
    "Fiches de révision et mémorisation espacée (SM-2)",
    "Diagnostics de devoirs et examens",
    "Synthèses de cours et cartes conceptuelles",
    "Quiz personnalisés et examens blancs",
    "Espaces d'étude organisés par matière",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

const renderStar = (rating: number, index: number, cardId: string) => {
  const isHalf = rating - index === 0.5;
  const isFull = rating > index;

  if (isFull && !isHalf) {
    return (
      <svg key={index} className="w-4 h-4 fill-current text-amber-400" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    );
  } else if (isHalf) {
    return (
      <svg key={index} className="w-4 h-4 text-amber-400" viewBox="0 0 20 20">
        <defs>
          <linearGradient id={`half-${cardId}-${index}`} x1="0" x2="100%" y1="0" y2="0">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="#fef3c7" />
          </linearGradient>
        </defs>
        <path fill={`url(#half-${cardId}-${index})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    );
  } else {
    return (
      <svg key={index} className="w-4 h-4 fill-current text-amber-100" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    );
  }
};

export default function LandingPage() {
  return (
    <>
      <JsonLd schema={[organizationSchema, webSiteSchema, webAppSchema, faqSchema]} />
      <SiteHeader />
      <TrackPageView page="landing" />
      <main>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, var(--primary-glow) 0%, transparent 70%)",
            }}
          />

          {/* Floating Abstract Shapes */}
          <div className="absolute top-40 left-[5%] w-32 h-32 rounded-[40px] bg-gradient-to-br from-purple-400 to-blue-500 blur-xl opacity-40 transform rotate-12 hidden lg:block" />
          <div className="absolute top-60 right-[5%] w-32 h-32 rounded-[40px] bg-gradient-to-bl from-blue-400 to-primary blur-xl opacity-40 transform -rotate-12 hidden lg:block" />

          {/* Left Floating Content */}
          <div className="absolute top-20 left-4 xl:left-[8%] 2xl:left-[12%] hidden lg:flex flex-col gap-4 max-w-[280px] animate-fade-in z-10">
            {/* Handwritten note */}
            <div className="relative mb-6">
              <div className="text-blue-500 font-medium text-[1.1rem] rotate-[-12deg] flex flex-col items-center italic">
                <span>Your AI study</span>
                <span>companion</span>
                <svg width="40" height="40" viewBox="0 0 24 24" className="absolute -right-12 -bottom-2 text-blue-400 rotate-45 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </div>
            
            {/* Floating Card 1 */}
            <div className="bg-surface/80 backdrop-blur-md border border-border-subtle rounded-[1rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transform rotate-[-4deg] hover:rotate-0 transition-transform duration-300">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">Chat with AI</h4>
                  <p className="text-text-muted text-xs mt-1 leading-snug">Get instant help, explanations and personalized guidance.</p>
                </div>
              </div>
            </div>
            {/* Floating Card 2 */}
            <div className="bg-surface/80 backdrop-blur-md border border-border-subtle rounded-[1rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transform rotate-[2deg] hover:rotate-0 transition-transform duration-300 ml-8 mt-2">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8fbf0] text-[#10b981]">
                  <ScanLine className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">Scan & Solve</h4>
                  <p className="text-text-muted text-xs mt-1 leading-snug">Upload your homework or notes and get step-by-step help.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Floating Content */}
          <div className="absolute top-24 right-4 xl:right-[8%] 2xl:right-[12%] hidden lg:flex flex-col gap-4 max-w-[280px] animate-fade-in z-10">
            {/* Handwritten note */}
            <div className="relative mb-6 flex justify-end pr-4">
              <div className="text-purple-500 font-medium text-[1.1rem] rotate-[8deg] flex flex-col items-center italic">
                <span>From questions...</span>
                <span>to understanding</span>
                <svg width="40" height="40" viewBox="0 0 24 24" className="absolute -left-10 -bottom-2 text-purple-400 rotate-[135deg] opacity-80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </div>
            
            {/* Floating Card 3 */}
            <div className="bg-surface/80 backdrop-blur-md border border-border-subtle rounded-[1rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transform rotate-[3deg] hover:rotate-0 transition-transform duration-300">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">Smart Flashcards</h4>
                  <p className="text-text-muted text-xs mt-1 leading-snug">Spaced repetition that adapts to your progress.</p>
                </div>
              </div>
            </div>
            {/* Floating Card 4 */}
            <div className="bg-surface/80 backdrop-blur-md border border-border-subtle rounded-[1rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300 mr-8 mt-2">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">Visual Learning</h4>
                  <p className="text-text-muted text-xs mt-1 leading-snug">Turn any topic into diagrams, charts and mind maps.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto max-w-7xl px-5 lg:px-8 z-20">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-purple-200/60 bg-purple-50/50 px-4 py-1.5 text-label-lg text-purple-700 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Your complete interactive study workspace
              </div>
              <h1 className="mt-8 animate-slide-up text-[3.5rem] leading-[1.05] tracking-tight text-gray-900 sm:text-[4.5rem] font-extrabold">
                Learn smarter.
                <br />
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent pb-2">
                  Not harder.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl animate-slide-up text-[1.1rem] leading-relaxed text-text-secondary font-medium">
                Chat with AI, scan your homework for instant feedback, generate flashcards
                that adapt to your memory, and turn any topic into a visual you'll actually remember.
              </p>
              <div className="mt-10 flex animate-slide-up flex-col items-center justify-center gap-4 sm:flex-row">
                <div className="[&_button]:!rounded-full [&_button]:px-8">
                  <TrackingCTA href="/signup" label="Get started free" source="hero_cta" showArrow={true} />
                </div>
                <Link href="/demo">
                  <Button variant="secondary" size="lg" className="!rounded-full px-8 gap-2 bg-white text-gray-900 hover:bg-gray-50 border-border-subtle shadow-sm">
                    <PlayCircle className="h-5 w-5 text-indigo-600 fill-indigo-100" />
                    Watch demo
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex animate-slide-up items-center justify-center gap-4 text-sm font-medium text-text-muted">
                <div className="flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-text-muted" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 10H21" stroke="currentColor" strokeWidth="2"/></svg>
                  No credit card required
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
                <div>Free forever plan</div>
              </div>
            </div>

            <div className="relative mx-auto mt-20 max-w-5xl animate-slide-up">
              <HeroChatMock />
            </div>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────────────── */}
        <section className="border-y border-border-subtle bg-surface/40">
          <div className="mx-auto max-w-7xl px-5 lg:px-8 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border-subtle">
              {[
                { value: "7", label: "Learning tools in one workspace" },
                { value: "SM-2", label: "Proven spaced-repetition engine" },
                { value: "<2min", label: "From chapter to mind map" },
                { value: "24/7", label: "AI study support, always on" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center text-center px-4">
                  <span className="text-heading-lg font-bold text-text-primary">{s.value}</span>
                  <span className="text-label-sm text-text-secondary mt-1">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES (BENTO GRID) ───────────────────────── */}
        <section id="features" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/50 px-4 py-1.5 text-[11px] font-bold tracking-wider text-blue-700 uppercase backdrop-blur-sm mb-6">
              THE GRADELYS WORKSPACE <Sparkles className="h-3 w-3 text-blue-500" />
            </div>
            <h2 className="text-[2.5rem] sm:text-[3.5rem] leading-[1.1] font-extrabold tracking-tight text-text-primary">
              Everything you need to <br/>
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">learn, in one place.</span>
            </h2>
            <p className="mt-6 text-[1.1rem] leading-relaxed text-text-secondary max-w-2xl mx-auto">
              From asking your first question to reviewing before an exam, Gradelys brings your entire study workflow together.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CARD 1: AI CHAT (Full Width) */}
            <div className="lg:col-span-2 relative flex flex-col lg:flex-row bg-white border border-border-subtle rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden gap-8">
              <div className="flex flex-col w-full lg:w-1/3 z-10">
                <div className="inline-flex items-center gap-2 text-blue-600 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">AI Chat</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Your personal AI study companion.</h3>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Ask questions, upload your course material, or paste a YouTube link. Get clear, contextual explanations grounded in what you're studying.
                </p>
                <div className="mt-auto">
                  <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6 gap-2">
                    Try AI Chat <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Ask anything</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Upload files</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-500" /> YouTube links</div>
                  </div>
                </div>
              </div>
              
              {/* Fake UI Preview: AI Chat */}
              <div className="w-full lg:w-2/3 relative min-h-[350px] bg-[#fcfdff] rounded-2xl border border-gray-100 shadow-xl overflow-hidden flex flex-col lg:flex-row text-sm">
                {/* Sidebar */}
                <div className="w-48 bg-white border-r border-gray-100 p-4 hidden sm:flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
                    <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center"><Sparkles className="w-3 h-3 text-white"/></div> Gradelys
                  </div>
                  <div className="w-full bg-gray-50 rounded-md p-1.5 flex items-center gap-2 text-gray-400 text-xs border border-gray-100">
                    <Search className="w-3 h-3" /> Search...
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-md"><Home className="w-3.5 h-3.5"/> Home</div>
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-md"><MessageSquare className="w-3.5 h-3.5"/> Chat</div>
                    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-md"><ScanLine className="w-3.5 h-3.5"/> Scan</div>
                    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-md"><FileText className="w-3.5 h-3.5"/> Notes</div>
                  </div>
                </div>
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-[#fcfdff]">
                  <div className="h-12 border-b border-gray-100 flex items-center px-4 justify-between">
                    <div className="font-semibold text-gray-900">Chat</div>
                    <div className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">🔥 3 day study streak</div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden relative">
                    {/* User message */}
                    <div className="self-end bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 text-[13px] shadow-sm max-w-[80%]">
                      Explain photosynthesis simply
                    </div>
                    {/* AI message */}
                    <div className="self-start flex gap-3 max-w-[90%]">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-3 h-3 text-white"/>
                      </div>
                      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm p-4 text-[13px] text-gray-700 leading-relaxed">
                        <p className="mb-4">Photosynthesis is the process by which plants convert light energy into chemical energy (glucose) using carbon dioxide and water, with the help of chlorophyll.</p>
                        {/* Fake Diagram */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-2 text-center text-xs">
                          <div className="flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">☀️</div> Light</div>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <div className="flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">🍃</div> Chloroplast</div>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <div className="flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">🍬</div> Glucose</div>
                        </div>
                      </div>
                    </div>
                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fcfdff] to-transparent" />
                  </div>
                  {/* Chat Input */}
                  <div className="p-4 pt-0">
                    <div className="bg-white border border-gray-200 rounded-full h-10 px-4 flex items-center justify-between shadow-sm">
                      <span className="text-gray-400 text-xs">Ask anything...</span>
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center"><ArrowRight className="w-3 h-3" /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: SCAN */}
            <div className="relative flex flex-col bg-white border border-border-subtle rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="inline-flex items-center gap-2 text-emerald-600 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <ScanLine className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Scan</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Turn mistakes into your next study session.</h3>
              <p className="text-gray-500 leading-relaxed text-sm mb-8">
                Upload a graded exam or homework and instantly see what went wrong, why, and what to review next.
              </p>
              
              <div className="mt-auto flex gap-4 h-48 bg-gray-50 -mx-4 -mb-4 p-4 rounded-t-xl border border-gray-100 overflow-hidden">
                {/* Fake Document */}
                <div className="w-1/2 bg-white rounded shadow-sm border border-gray-200 p-2 relative h-full flex flex-col gap-1.5 opacity-80">
                  <div className="w-3/4 h-1 bg-gray-300 rounded-full" />
                  <div className="w-full h-1 bg-gray-200 rounded-full" />
                  <div className="w-5/6 h-1 bg-gray-200 rounded-full" />
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-2" />
                  <div className="w-2/3 h-1 bg-gray-200 rounded-full" />
                  {/* Scan Brackets */}
                  <div className="absolute inset-4 border-2 border-emerald-400 rounded-sm">
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-400" />
                  </div>
                  {/* Highlight */}
                  <div className="absolute top-[40%] left-[20%] w-[60%] h-4 bg-red-100/50 rounded" />
                </div>
                {/* Analysis Panel */}
                <div className="w-1/2 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-900">Score</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3"/> 72%</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">What went wrong</span>
                    <div className="text-[10px] text-gray-700 flex items-start gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 flex-shrink-0" /> Question 2 - Calculation error</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">What to review</span>
                    <div className="text-[10px] text-gray-700 flex items-start gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" /> Quadratic functions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: PRACTICE */}
            <div className="relative flex flex-col bg-white border border-border-subtle rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="inline-flex items-center gap-2 text-purple-600 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                  <Brain className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Practice</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Practice until it sticks.</h3>
              <p className="text-gray-500 leading-relaxed text-sm mb-8">
                Turn your course material into quizzes, timed exams, and adaptive flashcards.
              </p>
              
              <div className="mt-auto bg-[#fafafa] -mx-4 -mb-4 p-5 pt-6 rounded-t-xl border border-gray-100 flex flex-col gap-4 h-48">
                <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 mb-1">
                  <div className="h-1 bg-gray-200 rounded-full w-[80%] overflow-hidden"><div className="h-full bg-purple-500 w-[30%]" /></div>
                  <span>3/10</span>
                </div>
                <div className="text-xs font-semibold text-gray-900">What is the main function of mitochondria?</div>
                <div className="flex flex-col gap-2">
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-600 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 text-[9px] flex items-center justify-center font-medium">A</div> Protein synthesis
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-[11px] text-purple-800 flex items-center gap-2 shadow-[0_0_0_1px_rgba(168,85,247,0.2)]">
                    <div className="w-4 h-4 rounded bg-purple-600 text-white text-[9px] flex items-center justify-center font-medium"><CheckCircle2 className="w-3 h-3"/></div> Cellular respiration
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: VISUALIZE */}
            <div className="relative flex flex-col bg-white border border-border-subtle rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="inline-flex items-center gap-2 text-indigo-600 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <Network className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Visualize</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Make complex ideas visible.</h3>
              <p className="text-gray-500 leading-relaxed text-sm mb-8">
                Transform difficult topics into diagrams, mind maps, timelines, and visual summaries.
              </p>
              
              <div className="mt-auto relative h-48 bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-t-xl border border-gray-100 overflow-hidden flex items-center justify-center">
                {/* Lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M50 50 L20 30 M50 50 L20 70 M50 50 L80 30 M50 50 L80 70" stroke="#cbd5e1" strokeWidth="1" fill="none" />
                </svg>
                {/* Center Node */}
                <div className="absolute w-24 h-8 bg-indigo-600 text-white rounded-full shadow-md flex items-center justify-center text-[10px] font-semibold z-10">
                  Photosynthesis
                </div>
                {/* Side Nodes */}
                <div className="absolute top-[20%] left-[10%] px-2 py-1 bg-white border border-yellow-200 text-yellow-600 rounded-full shadow-sm text-[9px] font-medium flex items-center gap-1 z-10">
                  ☀️ Light energy
                </div>
                <div className="absolute bottom-[20%] left-[10%] px-2 py-1 bg-white border border-blue-200 text-blue-600 rounded-full shadow-sm text-[9px] font-medium z-10">
                  💧 CO₂ + H₂O
                </div>
                <div className="absolute top-[20%] right-[10%] px-2 py-1 bg-white border border-green-200 text-green-600 rounded-full shadow-sm text-[9px] font-medium flex items-center gap-1 z-10">
                  🍃 Chloroplast
                </div>
                <div className="absolute bottom-[20%] right-[10%] px-2 py-1 bg-white border border-purple-200 text-purple-600 rounded-full shadow-sm text-[9px] font-medium flex items-center gap-1 z-10">
                  🍬 Glucose
                </div>
              </div>
            </div>

            {/* CARD 5: SMART NOTES */}
            <div className="relative flex flex-col bg-white border border-border-subtle rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="inline-flex items-center gap-2 text-violet-600 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Smart Notes</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Notes that work harder.</h3>
              <p className="text-gray-500 leading-relaxed text-sm mb-8">
                Organize your study material and turn notes into quizzes or flashcards instantly.
              </p>
              
              <div className="mt-auto bg-white -mx-4 -mb-4 rounded-t-xl border border-gray-200 shadow-[0_-4px_20px_rgb(0,0,0,0.02)] h-48 flex flex-col">
                <div className="h-8 border-b border-gray-100 flex items-center px-4 gap-3 text-gray-400">
                  <span className="text-[10px] font-medium text-gray-800">Photosynthesis - Summary</span>
                </div>
                <div className="h-8 border-b border-gray-100 flex items-center px-4 gap-3">
                  <span className="font-serif font-bold text-[11px] text-gray-700">B</span>
                  <span className="font-serif italic text-[11px] text-gray-700">I</span>
                  <span className="font-serif underline text-[11px] text-gray-700">U</span>
                  <div className="w-px h-3 bg-gray-200" />
                  <span className="text-[11px] text-gray-700">☰</span>
                </div>
                <div className="p-4 flex-1 overflow-hidden relative">
                  <div className="text-[10px] font-bold text-gray-800 mb-1">1. Overview</div>
                  <div className="text-[9px] text-gray-600 leading-relaxed bg-yellow-50 inline-block px-1 rounded">Photosynthesis is the process by which plants convert light energy...</div>
                  <div className="text-[10px] font-bold text-gray-800 mt-3 mb-1">2. Key reactants</div>
                  <ul className="text-[9px] text-gray-600 list-disc pl-3">
                    <li>Carbon dioxide (CO₂)</li>
                    <li>Water (H₂O)</li>
                  </ul>
                  {/* Floating Action Bar */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 rounded-full p-1 shadow-lg">
                    <button className="bg-violet-600 text-white text-[9px] font-medium px-3 py-1.5 rounded-full">Create flashcards</button>
                    <button className="bg-gray-50 text-gray-700 text-[9px] font-medium px-3 py-1.5 rounded-full border border-gray-200">Generate quiz</button>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 6: STUDIO (Half width on LG?) Wait, grid is 2 cols. */}
            {/* We will put Studio and Spaces side by side using a nested grid if we want them smaller, or just let them be 1 col each. */}
            <div className="relative flex flex-col bg-white border border-border-subtle rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="inline-flex items-center gap-2 text-pink-600 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Studio</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Turn sources into study material.</h3>
              <p className="text-gray-500 leading-relaxed text-sm mb-8">
                Generate structured notes, summaries, reports, essays, and slide outlines from your sources.
              </p>
              
              <div className="mt-auto bg-gray-50 -mx-4 -mb-4 rounded-t-xl border border-gray-200 p-4 h-48 flex items-center justify-center">
                 <div className="w-full max-w-[200px] bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
                   <div className="px-3 py-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Generate with Studio</div>
                   <div className="flex items-center justify-between px-3 py-2 border-t border-gray-50 hover:bg-gray-50 text-[10px] font-medium text-gray-700"><div className="flex items-center gap-2"><FileText className="w-3 h-3 text-blue-500"/> Study Notes</div><ChevronRight className="w-3 h-3 text-gray-300"/></div>
                   <div className="flex items-center justify-between px-3 py-2 border-t border-gray-50 hover:bg-gray-50 text-[10px] font-medium text-gray-700"><div className="flex items-center gap-2"><FileText className="w-3 h-3 text-purple-500"/> Summary</div><ChevronRight className="w-3 h-3 text-gray-300"/></div>
                   <div className="flex items-center justify-between px-3 py-2 border-t border-gray-50 hover:bg-gray-50 text-[10px] font-medium text-gray-700"><div className="flex items-center gap-2"><FileText className="w-3 h-3 text-emerald-500"/> Report</div><ChevronRight className="w-3 h-3 text-gray-300"/></div>
                 </div>
              </div>
            </div>

            {/* CARD 7: SPACES */}
            <div className="relative flex flex-col bg-white border border-border-subtle rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="inline-flex items-center gap-2 text-sky-600 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
                  <Folder className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Spaces</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Keep every subject organized.</h3>
              <p className="text-gray-500 leading-relaxed text-sm mb-8">
                Group sources, chats, notes, quizzes, and study material by subject or exam.
              </p>
              
              <div className="mt-auto flex flex-col justify-end bg-[#f8fafc] -mx-4 -mb-4 p-4 rounded-t-xl border border-gray-100 h-48">
                <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Folder className="w-5 h-5 text-blue-600 fill-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-900">French Revolution</span>
                    <span className="text-[9px] text-gray-400 mt-0.5">12 documents • 8 chats • 4 notes</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────── */}
        <section className="relative overflow-hidden border-y border-border-subtle bg-white py-24">
          <div className="pointer-events-none absolute inset-0 flex justify-center opacity-30">
            <div className="w-[1000px] h-[500px] bg-gradient-to-b from-blue-50/50 via-purple-50/20 to-transparent blur-3xl rounded-full" />
          </div>

          <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider text-blue-700 uppercase bg-blue-50/80 mb-6">
                <Sparkles className="h-3 w-3 text-blue-500" />
                HOW IT WORKS
              </div>
              <h2 className="text-[2.5rem] sm:text-[3.5rem] leading-[1.1] font-extrabold tracking-tight text-gray-900">
                Three steps between you <br/>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">and a better grade.</span>
              </h2>
              <p className="mt-5 text-[1.1rem] leading-relaxed text-gray-500">
                It's simple. Add your content, get personalized help, <br className="hidden sm:block"/> and turn your study time into real progress.
              </p>
            </div>

            <div className="relative flex flex-col lg:flex-row items-stretch gap-6">
              
              {/* Fake Background Arrows (Desktop Only) */}
              <div className="absolute top-1/2 left-0 w-full hidden lg:flex justify-between px-[15%] -translate-y-1/2 pointer-events-none opacity-40 z-0">
                <div className="w-16 h-8 text-blue-300">
                  <svg viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M0 10c20 0 40-10 60 0M80 10l-10-5M80 10l-10 5"/></svg>
                </div>
                <div className="w-16 h-8 text-purple-300">
                  <svg viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M0 10c20 0 40-10 60 0M80 10l-10-5M80 10l-10 5"/></svg>
                </div>
              </div>

              {/* STEP 1: Add your content */}
              <div className="flex-1 bg-white border border-gray-100 rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] z-10 flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg flex-shrink-0">
                    01
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <CloudUpload className="h-4 w-4 text-blue-500" /> Add your content
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Paste a topic, upload your course PDF, or snap a photo of a graded exam.
                    </p>
                  </div>
                </div>
                <div className="mt-auto bg-[#fafbfc] border border-gray-100 rounded-xl p-4 shadow-inner flex gap-3 h-48 overflow-hidden relative">
                  {/* Mini Sidebar */}
                  <div className="w-16 flex flex-col gap-3">
                    <div className="flex items-center gap-1 font-bold text-[10px] text-gray-800"><Sparkles className="w-2.5 h-2.5 text-blue-600"/> Gradelys</div>
                    <div className="flex flex-col gap-2 text-[8px] text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5"><Search className="w-2.5 h-2.5"/> Search</div>
                      <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 rounded px-1 py-0.5 -mx-1"><MessageSquare className="w-2.5 h-2.5"/> Chat</div>
                      <div className="flex items-center gap-1.5"><FileText className="w-2.5 h-2.5"/> Notes</div>
                      <div className="flex items-center gap-1.5"><Brain className="w-2.5 h-2.5"/> Practice</div>
                    </div>
                  </div>
                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col gap-2">
                    {/* Dropzone */}
                    <div className="h-16 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white">
                      <CloudUpload className="w-4 h-4 text-blue-500 mb-1" />
                      <span className="text-[9px] font-semibold text-gray-700">Drop your file here</span>
                      <span className="text-[7px] text-gray-400">PDF, image, or link</span>
                    </div>
                    {/* Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white border border-gray-200 rounded flex flex-col items-center justify-center py-2 text-[8px] font-medium text-gray-600"><CloudUpload className="w-3 h-3 text-blue-500 mb-1"/> Upload file</div>
                      <div className="bg-white border border-gray-200 rounded flex flex-col items-center justify-center py-2 text-[8px] font-medium text-gray-600"><Camera className="w-3 h-3 text-blue-500 mb-1"/> Take a photo</div>
                      <div className="bg-white border border-gray-200 rounded flex flex-col items-center justify-center py-2 text-[8px] font-medium text-gray-600"><Link2 className="w-3 h-3 text-blue-500 mb-1"/> Paste link</div>
                    </div>
                    {/* Uploaded Files */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <div className="bg-white border border-gray-200 rounded p-1.5 flex items-center gap-2">
                         <div className="w-5 h-5 bg-red-100 rounded-sm flex items-center justify-center"><FileText className="w-2.5 h-2.5 text-red-600"/></div>
                         <div className="flex flex-col"><span className="text-[7px] font-bold text-gray-800">Biology Notes.pdf</span><span className="text-[6px] text-gray-400">2.4 MB</span></div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded p-1.5 flex items-center gap-2">
                         <div className="w-5 h-5 bg-blue-100 rounded-sm flex items-center justify-center"><ImageIcon className="w-2.5 h-2.5 text-blue-600"/></div>
                         <div className="flex flex-col"><span className="text-[7px] font-bold text-gray-800">French Exam.jpg</span><span className="text-[6px] text-gray-400">1.2 MB</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: AI does the heavy lifting */}
              <div className="flex-1 bg-white border border-gray-100 rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] z-10 flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold text-lg flex-shrink-0">
                    02
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" /> AI does the heavy lifting
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Gradelys reads, structures, and turns it into chat answers, flashcards, quizzes, or visuals.
                    </p>
                  </div>
                </div>
                <div className="mt-auto bg-[#fafbfc] border border-gray-100 rounded-xl p-4 shadow-inner flex flex-col justify-end gap-3 h-48 overflow-hidden relative">
                   {/* Chat UI Mockup */}
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fafbfc] pointer-events-none z-10" />
                   
                   <div className="flex flex-col gap-3 z-0 mb-8">
                     <div className="self-end bg-blue-100 text-blue-800 text-[9px] px-2 py-1.5 rounded-lg rounded-tr-sm">Explain photosynthesis simply</div>
                     <div className="self-start flex gap-2 w-full pr-4">
                       <div className="w-5 h-5 rounded-sm bg-purple-600 flex items-center justify-center flex-shrink-0"><Sparkles className="w-2.5 h-2.5 text-white"/></div>
                       <div className="bg-white border border-gray-200 rounded-xl rounded-tl-sm p-2 text-[9px] text-gray-600 leading-relaxed shadow-sm w-full">
                         Photosynthesis is the process by which plants convert light energy into chemical energy (glucose) using carbon dioxide and water, with the help of chlorophyll.
                       </div>
                     </div>
                     {/* Action chips */}
                     <div className="flex gap-2 pl-7 mt-1">
                       <div className="bg-white border border-gray-200 rounded-full px-2 py-1 text-[8px] font-medium text-gray-600 flex items-center gap-1 shadow-sm"><FileText className="w-2 h-2 text-blue-500"/> Generate quiz</div>
                       <div className="bg-white border border-gray-200 rounded-full px-2 py-1 text-[8px] font-medium text-gray-600 flex items-center gap-1 shadow-sm"><FileText className="w-2 h-2 text-purple-500"/> Save as note</div>
                       <div className="bg-white border border-gray-200 rounded-full px-2 py-1 text-[8px] font-medium text-gray-600 flex items-center gap-1 shadow-sm"><Brain className="w-2 h-2 text-emerald-500"/> Create flashcards</div>
                     </div>
                   </div>

                   {/* Fake input */}
                   <div className="absolute bottom-3 left-4 right-4 bg-white border border-gray-200 rounded-full h-8 px-3 flex items-center justify-between shadow-sm z-20">
                     <span className="text-gray-400 text-[9px]">Ask anything...</span>
                     <div className="flex items-center gap-1">
                       <Link2 className="w-3 h-3 text-gray-400"/>
                       <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center"><ArrowRight className="w-2.5 h-2.5" /></div>
                     </div>
                   </div>
                </div>
              </div>

              {/* STEP 3: Study — and actually remember */}
              <div className="flex-1 bg-white border border-gray-100 rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] z-10 flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-lg flex-shrink-0">
                    03
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Study — and actually remember
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Spaced repetition and active recall keep bringing back what you're about to forget.
                    </p>
                  </div>
                </div>
                <div className="mt-auto bg-[#fafbfc] border border-gray-100 rounded-xl p-4 shadow-inner flex gap-3 h-48 overflow-hidden">
                  
                  {/* Left Side (Quiz) */}
                  <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 flex flex-col shadow-sm">
                    <div className="flex justify-between items-center text-[8px] text-gray-500 font-semibold mb-2">
                      <span className="text-blue-600 flex items-center gap-1"><Brain className="w-2 h-2"/> Biology - Cell structure</span>
                      <span>2/10</span>
                    </div>
                    <div className="text-[9px] font-bold text-gray-800 mb-2">What is the main function of mitochondria?</div>
                    <div className="flex flex-col gap-1.5 mt-auto">
                      <div className="border border-gray-100 rounded px-2 py-1.5 text-[8px] text-gray-600 flex items-center gap-2"><Circle className="w-2.5 h-2.5 text-gray-300"/> Protein synthesis</div>
                      <div className="border border-emerald-200 bg-emerald-50 rounded px-2 py-1.5 text-[8px] text-emerald-800 flex items-center gap-2 font-medium"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-600"/> Cellular Respiration</div>
                      <div className="border border-gray-100 rounded px-2 py-1.5 text-[8px] text-gray-600 flex items-center gap-2"><Circle className="w-2.5 h-2.5 text-gray-300"/> DNA replication</div>
                    </div>
                  </div>

                  {/* Right Side (Stats) */}
                  <div className="w-[35%] flex flex-col gap-2">
                    <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm flex items-center justify-between">
                      <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center text-[8px] font-bold text-emerald-600">12</div>
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] font-bold text-gray-800">82% <span className="text-gray-400 font-normal">cards due</span></span>
                        <span className="text-[7px] font-bold text-gray-800">82% <span className="text-gray-400 font-normal">mastered</span></span>
                        <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden flex">
                          <div className="bg-emerald-500 h-full w-[82%]" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm flex items-center gap-2 mt-auto">
                      <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center flex-shrink-0"><Network className="w-3 h-3 text-purple-600"/></div>
                      <div className="flex flex-col">
                        <span className="text-[7px] font-bold text-gray-900">Mitochondria</span>
                        <span className="text-[6px] text-gray-500">Powerhouse of the cell</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-1.5 flex justify-center text-[7px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                      <Zap className="w-2 h-2"/> Spaced repetition active
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS & TRUST BAR ────────────────────── */}
        <section className="relative overflow-hidden bg-[#fcfdff] py-24 sm:py-32">
          {/* Subtle background effects */}
          <div className="pointer-events-none absolute inset-0 flex justify-center opacity-30">
            <div className="w-[800px] h-[400px] bg-gradient-to-b from-blue-50/80 via-purple-50/30 to-transparent blur-3xl rounded-full translate-y-[-20%]" />
          </div>
          {/* Faint glowing orbs */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-indigo-200/20 rounded-full blur-3xl" />
          
          {/* Decorative Sparkle (Left) & Squiggle (Right) */}
          <div className="absolute top-32 left-[15%] hidden lg:block opacity-50">
             <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div className="absolute top-32 right-[15%] hidden lg:block opacity-40">
            <svg width="60" height="30" viewBox="0 0 60 30" fill="none" stroke="url(#gradient)" strokeWidth="1.5" strokeLinecap="round">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path d="M5,25 Q15,5 25,25 T45,15 Q55,25 55,5" />
            </svg>
          </div>

          <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
            {/* Header */}
            <div className="mx-auto max-w-2xl text-center mb-16">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider text-blue-700 uppercase bg-blue-50/80 mb-6">
                <Sparkles className="h-3 w-3 text-blue-500" />
                LOVED BY STUDENTS
              </div>
              <h2 className="text-[2.5rem] sm:text-[3.5rem] leading-[1.1] font-extrabold tracking-tight text-gray-900">
                Real students. <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Real progress.</span>
              </h2>
              <p className="mt-5 text-[1.1rem] leading-relaxed text-gray-500 max-w-lg mx-auto">
                Join thousands of students who are already using Gradelys <br className="hidden sm:block"/> to study smarter, not harder.
              </p>
            </div>

            {/* Testimonials Marquee Rows */}
            <div className="relative mb-20 flex flex-col gap-6 overflow-hidden w-full max-w-[100vw] -mx-5 px-5 lg:-mx-8 lg:px-8 py-4">
              
              {/* Row 1: Left to Right (Reverse) */}
              <div className="flex w-max animate-marquee-reverse gap-6">
                {[...TESTIMONIAL_CARDS, ...TESTIMONIAL_CARDS].map((t, idx) => (
                  <div key={`row1-${idx}`} className="relative bg-white border border-gray-100 w-[350px] sm:w-[400px] rounded-[24px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col overflow-hidden shrink-0">
                    <div className={`absolute bottom-0 right-0 w-32 h-32 rounded-full blur-2xl transform translate-x-1/2 translate-y-1/4 pointer-events-none ${t.color.glow}`} />
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => renderStar(t.rating, i, `row1-${idx}`))}
                      </div>
                      <span className={`text-4xl font-serif leading-none h-6 ${t.color.quote}`}>"</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-1 relative z-10">"{t.quote}"</p>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 leading-tight">{t.name}</div>
                        <div className="text-xs text-gray-500">{t.role}</div>
                      </div>
                    </div>
                    <div className={`inline-flex self-start items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold border relative z-10 ${t.color.tagText} ${t.color.tagBg}`}>
                      <t.tagIcon className={`w-3 h-3 ${t.color.icon}`} /> {t.tagText}
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2: Right to Left (Normal) */}
              <div className="flex w-max animate-marquee gap-6">
                {[...TESTIMONIAL_CARDS_ROW_2, ...TESTIMONIAL_CARDS_ROW_2].map((t, idx) => (
                  <div key={`row2-${idx}`} className="relative bg-white border border-gray-100 w-[350px] sm:w-[400px] rounded-[24px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col overflow-hidden shrink-0">
                    <div className={`absolute bottom-0 right-0 w-32 h-32 rounded-full blur-2xl transform translate-x-1/2 translate-y-1/4 pointer-events-none ${t.color.glow}`} />
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => renderStar(t.rating, i, `row2-${idx}`))}
                      </div>
                      <span className={`text-4xl font-serif leading-none h-6 ${t.color.quote}`}>"</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-1 relative z-10">"{t.quote}"</p>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 leading-tight">{t.name}</div>
                        <div className="text-xs text-gray-500">{t.role}</div>
                      </div>
                    </div>
                    <div className={`inline-flex self-start items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold border relative z-10 ${t.color.tagText} ${t.color.tagBg}`}>
                      <t.tagIcon className={`w-3 h-3 ${t.color.icon}`} /> {t.tagText}
                    </div>
                  </div>
                ))}
              </div>

              {/* Side fades for the marquee */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-[#fcfdff] to-transparent z-20" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-[#fcfdff] to-transparent z-20" />
            </div>

            {/* Trust Bar (Divided) */}
            <div className="mx-auto flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 max-w-4xl border-t border-gray-100 pt-8">
              
              <div className="flex flex-1 items-center justify-center gap-3 text-xs text-gray-400 font-medium px-6 md:border-r border-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-blue-500" />
                </div>
                Data encrypted in transit & at rest
              </div>
              
              <div className="flex flex-1 items-center justify-center gap-3 text-xs text-gray-400 font-medium px-6 md:border-r border-gray-100">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-4 w-4 text-purple-500" />
                </div>
                Built for students worldwide
              </div>
              
              <div className="flex flex-1 items-center justify-center gap-3 text-xs text-gray-400 font-medium px-6">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                GDPR-ready data controls
              </div>

            </div>
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
                <TrackingCTA href="/signup" label="Get started free" source="final_cta" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
