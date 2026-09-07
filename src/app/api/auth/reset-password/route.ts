import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { emails } from "@/lib/resend/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Check if user exists first (optional, but good for security so we don't error out on admin.generateLink)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    const userExists = users?.users?.some(u => u.email === email);

    if (userExists) {
      // Generate a recovery link using the service role key (bypasses Supabase email sending limits)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get("origin") || "http://localhost:3000");
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${baseUrl}/reset-password`,
        },
      });

      if (error) {
        console.error("Error generating recovery link:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Send the custom email using Resend
      if (data?.properties?.action_link) {
        await emails.passwordReset(email, data.properties.action_link);
      }
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
