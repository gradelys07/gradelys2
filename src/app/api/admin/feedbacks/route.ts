import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("feedbacks")
      .select("*, profiles(name, email, avatar_url)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Feedback fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
    }

    return NextResponse.json({ feedbacks: data });
  } catch (err) {
    console.error("Admin Feedback API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
