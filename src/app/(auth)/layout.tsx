import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, MessageSquare, Brain, ScanLine } from "lucide-react";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Link href="/" className="mb-10 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
            <img
              src="/favicon.png"
              alt="Logo officiel Gradelys"
              width={32}
              height={32}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-heading-sm font-bold text-text-primary">Gradelys</span>
        </Link>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>

      <div className="relative hidden overflow-hidden bg-surface lg:block">
        <div
          className="absolute inset-0 opacity-50"
          style={{ background: "radial-gradient(60% 50% at 50% 20%, var(--primary-glow) 0%, transparent 70%)" }}
        />
        <div className="relative flex h-full flex-col items-center justify-center p-16 overflow-hidden">
          <h2 className="max-w-md text-center text-display-md text-text-primary z-10">
            Everything you need to study smarter, in one place.
          </h2>
          <div className="mt-16 relative w-full max-w-sm h-[220px] overflow-hidden">
            <div className="flex flex-col animate-carousel-vertical hover:[animation-play-state:paused]">
              {[
                { icon: MessageSquare, title: "Chat with AI", text: "Interact directly with your course notes and get precise, grounded answers." },
                { icon: Brain, title: "Smart Flashcards", text: "Spaced-repetition flashcards that automatically adapt to your learning pace." },
                { icon: ScanLine, title: "Exam Diagnostic", text: "Scan a graded exam to instantly identify your weaknesses and how to improve." },
                { icon: MessageSquare, title: "Chat with AI", text: "Interact directly with your course notes and get precise, grounded answers." },
              ].map((item, i) => (
                <div key={i} className="flex h-[220px] w-full flex-col items-center justify-center p-2 text-center">
                  <div className="flex h-14 w-14 mb-4 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-glow">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-heading-lg font-bold text-text-primary">{item.title}</span>
                    <span className="text-body-md text-text-secondary leading-relaxed max-w-[280px]">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
