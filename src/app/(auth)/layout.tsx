import Link from "next/link";
import { GraduationCap, MessageSquare, Brain, ScanLine } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Link href="/" className="mb-10 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
            <img src="/favicon.svg" alt="Gradelys" className="h-full w-full object-contain" />
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
        <div className="relative flex h-full flex-col items-center justify-center p-16">
          <h2 className="max-w-md text-center text-display-md text-text-primary">
            Everything you need to study smarter, in one place.
          </h2>
          <div className="mt-12 grid w-full max-w-sm grid-cols-1 gap-4">
            {[
              { icon: MessageSquare, text: "Chat with AI, grounded in your own material" },
              { icon: Brain, text: "Spaced-repetition flashcards that adapt to you" },
              { icon: ScanLine, text: "Scan a graded exam for an instant diagnostic" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 rounded-lg border border-border bg-base/60 px-4 py-3">
                <item.icon className="h-4.5 w-4.5 shrink-0 text-primary" />
                <span className="text-body-sm text-text-secondary">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
