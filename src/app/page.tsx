import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare, NotebookPen, Brain, FileStack, Folder, ScanLine, CheckCircle2, Star, Zap, Shield, Globe, PlayCircle, Image as ImageIcon, Network, Search, Home, FileText, ChevronRight, CloudUpload, Camera, Link2, Circle, Check, GraduationCap, TrendingUp, Quote, MessageSquareHeart } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { HeroChatMock } from "@/components/marketing/hero-chat-mock";
import { TrackPageView } from "@/components/track-page-view";
import { TrackingCTA } from "@/components/tracking-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { HowItWorksScroll } from "@/components/marketing/how-it-works-scroll";
import { EverythingYouGet } from "@/components/marketing/everything-you-get";
import { FeaturesBentoDynamic } from "@/components/marketing/features-bento-dynamic";
import { HeroBackground } from "@/components/marketing/hero-background";
import { AnimatedHeroContent } from "@/components/marketing/animated-hero-content";
import { DemoFeedbackButton } from "@/components/marketing/demo-feedback-button";
import { AiAdaptationSection } from "@/components/marketing/ai-adaptation-section";

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
    icon: Folder,
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
  logo: "https://gradelys.com/favicon.png",
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
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
        <path fill={`url(#half-${cardId}-${index})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  } else {
    return (
      <svg key={index} className="w-4 h-4 fill-current text-amber-100" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
      <main className="relative w-full">
        {/* ── GLOBAL BACKGROUND ─────────────────────────── */}
        <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full bg-slate-50/20 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]">
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
        </div>

        {/* ── HERO TEXT & ANIMATIONS ────────────────────── */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-24 lg:pb-32 bg-gray-50/30">
          <HeroBackground />
          <AnimatedHeroContent />
        </section>

        {/* ── HERO MOCKUP (Separate Section) ──────────────── */}
        <section className="relative bg-gray-50/30 z-20">
          <HeroChatMock />
        </section>


        {/* ── FEATURES (BENTO GRID) ───────────────────────── */}
        <FeaturesBentoDynamic />

        {/* ── AI ADAPTATION SECTION ───────────────────────── */}
        <AiAdaptationSection />

        {/* ── HOW IT WORKS ─────────────────────────────────── */}
        <HowItWorksScroll />

        {/* ── TESTIMONIALS & TRUST BAR ────────────────────── */}
        <section className="relative overflow-hidden bg-transparent pb-24 sm:pb-32 pt-0 -mt-10 lg:-mt-24 z-0">
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

            <div className="mt-8 mb-16 flex justify-center">
              <DemoFeedbackButton />
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

        {/* ── EVERYTHING YOU GET ───────────────────────────── */}
        <EverythingYouGet />

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section id="faq" className="border-t border-gray-100 bg-white/40 backdrop-blur-3xl py-32 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[100px]" />
          </div>

          <div className="mx-auto max-w-7xl px-5 lg:px-8 flex flex-col md:flex-row gap-16 lg:gap-24 relative z-10">
            
            {/* Left Column: Title and Contact */}
            <div className="md:w-1/3 flex flex-col items-start">
               <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-6">
                 Frequently asked questions
               </h2>
               <p className="text-lg text-gray-500 font-medium mb-10">
                 Everything you need to know about the product and billing. Can't find the answer you're looking for?
               </p>
               
               <a href="mailto:support@gradelys.com" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gray-900 text-white font-bold shadow-md hover:bg-gray-800 transition-colors duration-300">
                 Contact Support
               </a>
            </div>

            {/* Right Column: Accordion */}
            <div className="md:w-2/3">
              <FaqAccordion items={FAQS} />
            </div>

          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────── */}
        <section className="relative overflow-hidden py-32 mt-12 mb-12 mx-5 lg:mx-8 rounded-[40px] bg-blue-600 shadow-[0_20px_80px_rgba(37,99,235,0.25)]">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 z-0">
            {/* Grain overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            {/* Glowing animated orbs */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400 rounded-full blur-[120px] opacity-30 animate-pulse" style={{ animationDuration: '5s' }}></div>
          </div>

          <div className="relative z-10 mx-auto max-w-5xl px-5 text-center flex flex-col items-center">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 drop-shadow-sm">
              Ready to study smarter?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-xl md:text-2xl text-blue-100 font-medium mb-10 leading-relaxed">
              Join thousands of students who have already upgraded their learning experience with Gradelys. It takes less than a minute.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="group relative cursor-pointer">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-300 via-white to-purple-300 opacity-70 blur transition duration-500 group-hover:opacity-100 animate-tilt"></div>
                <TrackingCTA 
                  href="/signup" 
                  label="Get started free" 
                  source="final_cta"
                  showArrow={true}
                  className="relative flex items-center justify-center h-16 px-10 text-lg font-extrabold text-blue-900 bg-white hover:bg-white rounded-full transition-transform duration-300 hover:scale-105 active:scale-95 shadow-xl border-0"
                />
              </div>
            </div>
            
            <p className="mt-8 text-sm text-blue-200 font-medium opacity-90 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-300" /> No credit card required. Free forever plan available.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
