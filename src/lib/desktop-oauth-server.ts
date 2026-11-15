export const DESKTOP_OAUTH_COOKIE_NAME = "gradelys_desktop_oauth";

export interface DesktopOAuthState {
  port: number;
  state: string;
}

export function parseDesktopOAuthParams(
  portRaw: string | null | undefined,
  stateRaw: string | null | undefined
): DesktopOAuthState | null {
  if (!portRaw || !stateRaw) return null;
  if (!/^\d{4,5}$/.test(portRaw)) return null;
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return null;
  if (!/^[a-f0-9]{32,128}$/i.test(stateRaw)) return null;
  return { port, state: stateRaw };
}

export function parseDesktopOAuthCookie(raw: string | undefined): DesktopOAuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { port?: unknown; state?: unknown };
    return parseDesktopOAuthParams(
      typeof parsed.port === "number" || typeof parsed.port === "string"
        ? String(parsed.port)
        : null,
      typeof parsed.state === "string" ? parsed.state : null
    );
  } catch {
    return null;
  }
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildDesktopLoopbackHandoffHtml(params: {
  port: number;
  state: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}): string {
  const fragment = new URLSearchParams();
  fragment.set("state", params.state);
  if (params.error) {
    fragment.set("error", params.error);
  } else if (params.accessToken && params.refreshToken) {
    fragment.set("access_token", params.accessToken);
    fragment.set("refresh_token", params.refreshToken);
  } else {
    fragment.set("error", "Session Google incomplète.");
  }

  const handoffUrl = `http://127.0.0.1:${params.port}/callback#${fragment.toString()}`;
  const safeJsUrl = JSON.stringify(handoffUrl).replace(/</g, "\\u003c");
  const safeHref = escapeHtmlAttr(handoffUrl);

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Retour vers Gradelys</title>
    <style>
      :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #1e293b; }
      .card { width: min(420px, calc(100vw - 32px)); padding: 28px 24px; border-radius: 18px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08); text-align: center; }
      h1 { margin: 0 0 8px; font-size: 18px; }
      p { margin: 0 0 18px; font-size: 14px; line-height: 1.5; color: #64748b; }
      a.btn { display: inline-block; padding: 10px 16px; border-radius: 10px; background: #0ea5e9; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Connexion en cours...</h1>
      <p>Redirection automatique vers l'application Gradelys Desktop.</p>
      <a class="btn" href="${safeHref}">Revenir dans Gradelys</a>
    </main>
    <script>window.location.replace(${safeJsUrl});</script>
  </body>
</html>`;
}

