import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rating, message, team_message } = body;

    if (!rating || !message || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating or message" }, { status: 400 });
    }

    const { error } = await supabase
      .from("feedbacks")
      .insert({
        user_id: user.id,
        rating,
        message,
        team_message: team_message || null,
      });

    if (error) {
      console.error("Feedback insertion error:", error);
      return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
