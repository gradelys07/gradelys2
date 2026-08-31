import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, user, response } = await requireUser();
  if (response) return response;
  const uid = user!.id;

  const [
    { data: streak },
    { data: badges },
    { count: messagesSent },
    { count: cardsReviewed },
    { count: quizzesCompleted },
    { count: scansCompleted },
    { count: visualizationsCreated },
    { count: documentsCreated },
    { count: notesCreated },
  ] = await Promise.all([
    supabase.from("streaks").select("*").eq("user_id", uid).single(),
    supabase.from("badges").select("*").eq("user_id", uid),
    supabase
      .from("messages")
      .select("id, conversations!inner(user_id)", { count: "exact", head: true })
      .eq("role", "user")
      .eq("conversations.user_id", uid),
    supabase
      .from("flashcards")
      .select("id, flashcard_decks!inner(user_id)", { count: "exact", head: true })
      .eq("flashcard_decks.user_id", uid)
      .not("last_reviewed_at", "is", null),
    supabase
      .from("practice_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .in("mode", ["quiz", "exam"]),
    supabase.from("scans").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "ready"),
    supabase.from("visualize_outputs").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("studio_documents").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", uid),
  ]);

  return NextResponse.json({
    streak: streak || { current_streak: 0, longest_streak: 0, last_activity_date: null, total_study_days: 0 },
    badges: badges || [],
    counters: {
      messagesSent: messagesSent || 0,
      cardsReviewed: cardsReviewed || 0,
      quizzesCompleted: quizzesCompleted || 0,
      scansCompleted: scansCompleted || 0,
      visualizationsCreated: visualizationsCreated || 0,
      documentsCreated: documentsCreated || 0,
      notesCreated: notesCreated || 0,
    },
  });
}
