import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildDesktopLoopbackHandoffHtml,
  DESKTOP_OAUTH_COOKIE_NAME,
  parseDesktopOAuthCookie,
} from "@/lib/desktop-oauth-server";

export const dynamic = "force-dynamic";

function buildDesktopHandoffResponse(
  html: string,
  cookiesToClear: Array<{ name: string; value: string; options: CookieOptions }>,
  isHttps: boolean
): NextResponse {
  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Referrer-Policy": "no-referrer",
    },
  });

  response.cookies.set(DESKTOP_OAUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 0,
  });

  for (const { name, value, options } of cookiesToClear) {
    response.cookies.set(name, value, options);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError =
    requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error");
  const redirectPath = requestUrl.searchParams.get("redirect") || "/chat";
  const desktopOAuth = parseDesktopOAuthCookie(
    request.cookies.get(DESKTOP_OAUTH_COOKIE_NAME)?.value
  );

  if (desktopOAuth) {
    const isHttps = requestUrl.protocol === "https:";
    const cookiesToClear: Array<{ name: string; value: string; options: CookieOptions }> = [];

    if (oauthError || !code) {
      const html = buildDesktopLoopbackHandoffHtml({
        port: desktopOAuth.port,
        state: desktopOAuth.state,
        error: oauthError || "Autorisation Google annulée.",
      });
      return buildDesktopHandoffResponse(html, cookiesToClear, isHttps);
    }

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
            for (const c of cookiesToSet) {
              // Only clear temporary PKCE cookies; avoid writing desktop session tokens into system browser cookies.
              if (c.name.includes("code-verifier") || c.value === "") {
                cookiesToClear.push(c);
              }
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session?.access_token || !data.session?.refresh_token) {
      console.error("Desktop OAuth exchange error:", error?.message || "missing_session");
      const html = buildDesktopLoopbackHandoffHtml({
        port: desktopOAuth.port,
        state: desktopOAuth.state,
        error: error?.message || "Impossible de finaliser la connexion Google.",
      });
      return buildDesktopHandoffResponse(html, cookiesToClear, isHttps);
    }

    const html = buildDesktopLoopbackHandoffHtml({
      port: desktopOAuth.port,
      state: desktopOAuth.state,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
    return buildDesktopHandoffResponse(html, cookiesToClear, isHttps);
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth session exchange error:", error);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
  }

  return NextResponse.redirect(new URL(redirectPath, request.url));
}
