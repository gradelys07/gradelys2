import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { integrations } from "@/lib/config";
import {
  DESKTOP_OAUTH_COOKIE_NAME,
  parseDesktopOAuthParams,
} from "@/lib/desktop-oauth-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!integrations.supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const desktopParams = parseDesktopOAuthParams(
    requestUrl.searchParams.get("port"),
    requestUrl.searchParams.get("state")
  );

  if (!desktopParams) {
    return NextResponse.json({ error: "Invalid desktop OAuth parameters" }, { status: 400 });
  }

  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
        ) {
          for (const cookie of cookiesToSet) {
            pendingCookies.push(cookie);
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${requestUrl.origin}/api/auth/callback`,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data?.url) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error?.message || "oauth_init_failed")}`, request.url)
    );
  }

  const response = NextResponse.redirect(data.url, 302);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  response.cookies.set(
    DESKTOP_OAUTH_COOKIE_NAME,
    JSON.stringify(desktopParams),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: requestUrl.protocol === "https:",
      path: "/",
      maxAge: 600,
    }
  );

  return response;
}
