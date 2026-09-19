"use client";

import { useGamification } from "@/hooks/use-gamification";
import { usePracticeSessions } from "@/hooks/use-practice";
import { ActivityHeatmap } from "@/components/progress/activity-heatmap";
import { SkillTree } from "@/components/progress/skill-tree";
import { AnalyticsCards } from "@/components/progress/analytics-cards";
import { FocusRewards } from "@/components/progress/focus-rewards";

export default function ProgressPage() {
  const { data, isLoading } = useGamification();
  const { data: sessions } = usePracticeSessions();

  if (isLoading || !data) {
    return <div className="p-8 text-body-sm text-text-muted">Loading analytics…</div>;
  }

  // Derive insights from sessions
  const validSessions = sessions || [];
  const sessionDates = validSessions.map(s => new Date(s.completedAt));
  
  // Real metrics for analytics
  const totalFocusTimeMins = validSessions.reduce((acc, s) => acc + Math.round((s.timeTakenSeconds || 0) / 60), 0);
  
  // Aggregate subjects for Skill Tree
  const subjectMap = new Map<string, { totalScore: number; count: number }>();
  validSessions.forEach(s => {
    if (!s.subject) return;
    const current = subjectMap.get(s.subject) || { totalScore: 0, count: 0 };
    subjectMap.set(s.subject, {
      totalScore: current.totalScore + (s.score || 0),
      count: current.count + 1
    });
  });
  
  const skills = Array.from(subjectMap.entries()).map(([subject, stats]) => ({
    subject,
    mastery: stats.totalScore / stats.count
  })).sort((a, b) => b.mastery - a.mastery);

  // Real retention index based on correct answers percentage across all sessions
  const totalCorrect = validSessions.reduce((acc, s) => acc + (s.correctAnswers || 0), 0);
  const totalQuestions = validSessions.reduce((acc, s) => acc + (s.totalQuestions || 0), 0);
  const retentionIndex = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  
  // Real average response time
  const avgResponseTime = validSessions.length > 0
    ? Math.round(validSessions.reduce((acc, s) => acc + ((s.timeTakenSeconds || 0) / (s.totalQuestions || 1)), 0) / validSessions.length)
    : 0;

  // Derive "Focus Credits" from total focus time (1 min = 1 credit)
  const focusCredits = totalFocusTimeMins;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md text-text-primary">Strategic Analytics</h1>
          <p className="mt-2 text-body-lg text-text-secondary">Measure your ROI and optimize your learning curve.</p>
        </div>
      </header>

      <section>
        <h2 className="text-heading-lg text-text-primary mb-4">Deep Metrics</h2>
        <AnalyticsCards 
          retentionIndex={retentionIndex} 
          averageResponseTime={avgResponseTime} 
          totalFocusTime={totalFocusTimeMins} 
        />
      </section>

      <section>
        <h2 className="text-heading-lg text-text-primary mb-4">Consistency Heatmap</h2>
        <div className="rounded-lg border border-border bg-surface p-6">
          <ActivityHeatmap dates={sessionDates} />
          <div className="mt-4 text-body-xs text-text-muted flex justify-between">
            <span>{data.streak.current_streak} days active streak</span>
            <div className="flex items-center gap-2">
              Less <div className="w-3 h-3 rounded-sm bg-surface-elevated"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
              <div className="w-3 h-3 rounded-sm bg-primary"></div> More
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-heading-lg text-text-primary mb-4">Knowledge Graph</h2>
        <SkillTree skills={skills} />
      </section>

      <section>
        <FocusRewards focusCredits={focusCredits} />
      </section>
    </div>
  );
}
