"use client";

import { Flame, Trophy, MessageSquare, Layers, Brain, ScanLine, Sparkles, FileText, NotebookPen } from "lucide-react";
import { useGamification } from "@/hooks/use-gamification";
import { usePracticeSessions } from "@/hooks/use-practice";
import { cn, formatRelativeDate } from "@/lib/utils";

const BADGE_META: Record<string, { label: string; icon: string; description: string }> = {
  "first-steps": { label: "First Steps", icon: "👣", description: "Sent your first chat message" },
  "bookworm": { label: "Bookworm", icon: "📚", description: "Created 5 notes" },
  "quiz-master": { label: "Quiz Master", icon: "🎓", description: "Completed 10 quizzes or exams" },
  "on-fire": { label: "On Fire", icon: "🔥", description: "3-day study streak" },
  "streak-legend": { label: "Streak Legend", icon: "⚡", description: "30-day study streak" },
  "card-shark": { label: "Card Shark", icon: "🃏", description: "Reviewed 50 flashcards" },
  "memory-pro": { label: "Memory Pro", icon: "🧠", description: "Reviewed 500 flashcards" },
  "scanner-pro": { label: "Scanner Pro", icon: "📸", description: "Completed 10 scans" },
  "visualizer": { label: "Visualizer", icon: "🎨", description: "Created 10 visualizations" },
  "author": { label: "Author", icon: "✍️", description: "Generated 5 documents in Studio" },
  "power-user": { label: "Power User", icon: "💪", description: "Sent 100 chat messages" },
};

const ALL_BADGES = Object.keys(BADGE_META);

export default function ProgressPage() {
  const { data, isLoading } = useGamification();
  const { data: sessions } = usePracticeSessions();

  if (isLoading || !data) {
    return <div className="p-8 text-body-sm text-text-muted">Loading…</div>;
  }

  const { streak, badges, counters } = data;
  const earnedTypes = new Set(badges.map((b) => b.type));

  const stats = [
    { label: "Messages sent", value: counters.messagesSent, icon: MessageSquare, color: "text-primary" },
    { label: "Cards reviewed", value: counters.cardsReviewed, icon: Layers, color: "text-green" },
    { label: "Quizzes completed", value: counters.quizzesCompleted, icon: Brain, color: "text-blue" },
    { label: "Scans analyzed", value: counters.scansCompleted, icon: ScanLine, color: "text-yellow" },
    { label: "Visualizations", value: counters.visualizationsCreated, icon: Sparkles, color: "text-purple" },
    { label: "Documents written", value: counters.documentsCreated, icon: FileText, color: "text-red" },
    { label: "Notes created", value: counters.notesCreated, icon: NotebookPen, color: "text-primary" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-display-md text-text-primary">Progress</h1>
      <p className="mt-2 text-body-lg text-text-secondary">Your study streaks, stats, and achievements.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border-strong bg-gradient-to-br from-surface to-base p-5 text-center">
          <Flame className="mx-auto h-6 w-6 text-yellow" />
          <div className="mt-2 text-display-md text-text-primary">{streak.current_streak}</div>
          <div className="text-label-md text-text-muted">Current streak</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 text-center">
          <Trophy className="mx-auto h-6 w-6 text-primary" />
          <div className="mt-2 text-display-md text-text-primary">{streak.longest_streak}</div>
          <div className="text-label-md text-text-muted">Longest streak</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 text-center col-span-2 sm:col-span-1">
          <div className="mt-2 text-display-md text-text-primary">{streak.total_study_days}</div>
          <div className="text-label-md text-text-muted">Total study days</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 text-center">
          <div className="mt-2 text-display-md text-text-primary">{badges.length}</div>
          <div className="text-label-md text-text-muted">Badges earned</div>
        </div>
      </div>

      <h2 className="mt-10 text-heading-lg text-text-primary">Activity</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-4">
            <s.icon className={cn("h-4 w-4", s.color)} />
            <div className="mt-2 text-heading-lg text-text-primary">{s.value}</div>
            <div className="text-label-md text-text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-heading-lg text-text-primary">Badges</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ALL_BADGES.map((type) => {
          const meta = BADGE_META[type];
          const earned = earnedTypes.has(type);
          return (
            <div
              key={type}
              className={cn(
                "rounded-lg border p-4 text-center transition-opacity",
                earned ? "border-border-strong bg-surface" : "border-border-subtle bg-base opacity-40"
              )}
            >
              <div className="text-3xl">{meta.icon}</div>
              <div className="mt-2 text-body-sm font-medium text-text-primary">{meta.label}</div>
              <div className="mt-1 text-label-md text-text-muted">{meta.description}</div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-heading-lg text-text-primary">Recent practice sessions</h2>
      <div className="mt-4 space-y-2">
        {(!sessions || sessions.length === 0) && (
          <p className="text-body-sm text-text-muted">No practice sessions yet — try a quiz or exam.</p>
        )}
        {sessions?.slice(0, 10).map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
            <div>
              <p className="text-body-sm font-medium capitalize text-text-primary">{s.mode} — {s.subject}</p>
              <p className="text-label-md text-text-muted">{formatRelativeDate(s.completedAt)}</p>
            </div>
            <div className={cn("text-heading-sm", s.score >= 70 ? "text-green" : s.score >= 40 ? "text-yellow" : "text-red")}>
              {Math.round(s.score)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
