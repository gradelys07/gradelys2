import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

const BADGE_RULES: { type: string; check: (c: Record<string, number>, streak: number) => boolean }[] = [
  { type: "first-steps", check: (c) => c.messagesSent >= 1 },
  { type: "bookworm", check: (c) => c.notesCreated >= 5 },
  { type: "quiz-master", check: (c) => c.quizzesCompleted >= 10 },
  { type: "on-fire", check: (_c, s) => s >= 3 },
  { type: "streak-legend", check: (_c, s) => s >= 30 },
  { type: "card-shark", check: (c) => c.cardsReviewed >= 50 },
  { type: "memory-pro", check: (c) => c.cardsReviewed >= 500 },
  { type: "scanner-pro", check: (c) => c.scansCompleted >= 10 },
  { type: "visualizer", check: (c) => c.visualizationsCreated >= 10 },
  { type: "author", check: (c) => c.documentsCreated >= 5 },
  { type: "power-user", check: (c) => c.messagesSent >= 100 },
];

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
function isYesterday(a: Date, b: Date) {
  const d = new Date(b);
  d.setDate(d.getDate() - 1);
  return isSameDay(a, d);
}

export async function POST() {
  const { supabase, user, response } = await requireUser();
  if (response) return response;
  const uid = user!.id;

  const { data: streak } = await supabase.from("streaks").select("*").eq("user_id", uid).single();
  const now = new Date();

  if (streak) {
    const last = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
    if (!last || !isSameDay(last, now)) {
      const currentStreak = last && isYesterday(last, now) ? streak.current_streak + 1 : 1;
      const longestStreak = Math.max(streak.longest_streak, currentStreak);
      await supabase
        .from("streaks")
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: now.toISOString().slice(0, 10),
          total_study_days: streak.total_study_days + 1,
        })
        .eq("user_id", uid);
    }
  }

  // Recompute counters and award any newly-earned badges.
  const [{ data: refreshedStreak }, { data: existingBadges }] = await Promise.all([
    supabase.from("streaks").select("current_streak").eq("user_id", uid).single(),
    supabase.from("badges").select("type").eq("user_id", uid),
  ]);

  const owned = new Set((existingBadges || []).map((b) => b.type));
  const [
    { count: messagesSent },
    { count: cardsReviewed },
    { count: quizzesCompleted },
    { count: scansCompleted },
    { count: visualizationsCreated },
    { count: documentsCreated },
    { count: notesCreated },
  ] = await Promise.all([
    supabase.from("messages").select("id, conversations!inner(user_id)", { count: "exact", head: true }).eq("role", "user").eq("conversations.user_id", uid),
    supabase.from("flashcards").select("id, flashcard_decks!inner(user_id)", { count: "exact", head: true }).eq("flashcard_decks.user_id", uid).not("last_reviewed_at", "is", null),
    supabase.from("practice_sessions").select("id", { count: "exact", head: true }).eq("user_id", uid).in("mode", ["quiz", "exam"]),
    supabase.from("scans").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "ready"),
    supabase.from("visualize_outputs").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("studio_documents").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", uid),
  ]);

  const counters = {
    messagesSent: messagesSent || 0,
    cardsReviewed: cardsReviewed || 0,
    quizzesCompleted: quizzesCompleted || 0,
    scansCompleted: scansCompleted || 0,
    visualizationsCreated: visualizationsCreated || 0,
    documentsCreated: documentsCreated || 0,
    notesCreated: notesCreated || 0,
  };

  const newlyEarned: string[] = [];
  for (const rule of BADGE_RULES) {
    if (!owned.has(rule.type) && rule.check(counters, refreshedStreak?.current_streak || 0)) {
      newlyEarned.push(rule.type);
    }
  }
  if (newlyEarned.length > 0) {
    await supabase
      .from("badges")
      .insert(newlyEarned.map((type) => ({ user_id: uid, type })));
  }

  return NextResponse.json({ newlyEarned });
}
