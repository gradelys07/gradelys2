import { GraduationCap, Sparkles, FileText, Brain } from "lucide-react";

export function HeroChatMock() {
  return (
    <div className="rounded-xl border border-border-strong bg-surface shadow-l3">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border-subtle px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-red/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-green/70" />
        <span className="ml-3 text-label-md text-text-muted">gradelys.app/chat</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
        {/* Fake sidebar */}
        <div className="hidden border-r border-border-subtle bg-base p-4 md:block">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md overflow-hidden">
              <img src="/favicon.svg" alt="Gradelys" className="h-full w-full object-contain" />
            </div>
            <span className="text-body-sm font-semibold text-text-primary">Gradelys</span>
          </div>
          <div className="mt-5 space-y-1">
            {["Chat", "Notes", "Practice", "Visualize", "Studio", "Scan"].map((label, i) => (
              <div
                key={label}
                className={`rounded-md px-2.5 py-1.5 text-body-sm ${
                  i === 0 ? "bg-[var(--primary-subtle)] text-primary" : "text-text-muted"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Fake chat area */}
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-lg rounded-tr-sm bg-primary px-4 py-2.5 text-body-sm text-white">
              Can you explain the Krebs cycle and quiz me on it after?
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="max-w-[85%] space-y-3">
              <div className="rounded-lg rounded-tl-sm border border-border-subtle bg-elevated px-4 py-3 text-body-sm text-text-secondary">
                The Krebs cycle (citric acid cycle) is a series of 8 reactions that break
                down acetyl-CoA to release energy, carried out in the mitochondrial matrix…
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-label-lg text-text-secondary">
                  <Brain className="h-3.5 w-3.5 text-green" /> Generate quiz
                </div>
                <div className="flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-label-lg text-text-secondary">
                  <FileText className="h-3.5 w-3.5 text-blue" /> Save as note
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-border-strong px-4 py-3 text-body-sm text-text-muted">
            Ask anything, or attach a PDF, image, or YouTube link…
          </div>
        </div>
      </div>
    </div>
  );
}
