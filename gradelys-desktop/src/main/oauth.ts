import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { shell } from 'electron';
import log from 'electron-log/main';
import type { GoogleOAuthResult } from '../../shared/types';
import { isTrustedOrigin, isValidOAuthState } from '../../shared/securityValidation';
import { getGradelysBaseUrl } from './security';

const OAUTH_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_BODY_BYTES = 32 * 1024;

const CALLBACK_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connexion Gradelys</title>
    <link rel="stylesheet" href="/callback.css" />
  </head>
  <body>
    <main class="card" role="status" aria-live="polite">
      <div class="badge">Gradelys Desktop</div>
      <h1 id="status-title">Finalisation de la connexion...</h1>
      <p id="status-desc">Envoi sécurisé vers l'application Gradelys.</p>
    </main>
    <script src="/callback.js" defer></script>
  </body>
</html>`;

const CALLBACK_CSS = `:root {
  color-scheme: light;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #f0f9ff 0%, #ffffff 55%, #f8fafc 100%);
  color: #1e293b;
}
.card {
  width: min(420px, calc(100vw - 32px));
  padding: 28px 24px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
  text-align: center;
}
.badge {
  display: inline-block;
  margin-bottom: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.12);
  color: #0284c7;
  font-size: 12px;
  font-weight: 600;
}
h1 {
  margin: 0 0 8px;
  font-size: 18px;
  line-height: 1.35;
}
p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #64748b;
}`;

const CALLBACK_JS = `(() => {
  const titleEl = document.getElementById('status-title');
  const descEl = document.getElementById('status-desc');
  const rawHash = window.location.hash ? window.location.hash.slice(1) : '';
  const rawSearch = window.location.search ? window.location.search.slice(1) : '';
  const params = new URLSearchParams(rawHash || rawSearch);

  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, '', '/callback');
  }

  const payload = {
    state: params.get('state') || '',
    access_token: params.get('access_token') || '',
    refresh_token: params.get('refresh_token') || '',
    error: params.get('error') || '',
  };

  fetch('/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.ok) {
        if (titleEl) titleEl.textContent = 'Connexion réussie !';
        if (descEl) descEl.textContent = 'Tu peux fermer cet onglet et revenir dans Gradelys.';
        window.setTimeout(() => {
          try { window.close(); } catch {}
        }, 350);
      } else {
        if (titleEl) titleEl.textContent = 'Connexion annulée ou expirée';
        if (descEl) descEl.textContent = "Retourne dans l'application Gradelys pour réessayer.";
      }
    })
    .catch(() => {
      if (titleEl) titleEl.textContent = 'Erreur de communication';
      if (descEl) descEl.textContent = "Retourne dans l'application Gradelys pour réessayer.";
    });
})();`;

interface ActiveOAuthFlow {
  server: Server;
  timeout: ReturnType<typeof setTimeout>;
  expectedState: string;
  finish: (result: GoogleOAuthResult) => void;
}

let activeFlow: ActiveOAuthFlow | null = null;

function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'"
  );
}

function sendJson(res: ServerResponse, statusCode: number, body: Record<string, unknown>): void {
  setSecurityHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function constantTimeStateMatch(candidate: string, expected: string): boolean {
  if (!isValidOAuthState(candidate) || !isValidOAuthState(expected)) {
    return false;
  }
  const bufA = Buffer.from(candidate, 'utf8');
  const bufB = Buffer.from(expected, 'utf8');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    const done = (val: Record<string, unknown> | null): void => {
      if (settled) return;
      settled = true;
      resolve(val);
    };

    req.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        req.destroy();
        done(null);
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          done(null);
          return;
        }
        done(parsed as Record<string, unknown>);
      } catch {
        done(null);
      }
    });

    req.on('error', () => done(null));
  });
}

export function cancelDesktopGoogleOAuth(): void {
  if (!activeFlow) return;
  activeFlow.finish({
    ok: false,
    cancelled: true,
    error: 'Connexion Google annulée.',
  });
}

export async function startDesktopGoogleOAuth(
  senderUrl: string,
  onRestoreWindow?: () => void
): Promise<GoogleOAuthResult> {
  const baseOrigin = getGradelysBaseUrl();
  if (!isTrustedOrigin(senderUrl, baseOrigin)) {
    log.warn('Blocked desktop Google OAuth request from untrusted origin:', senderUrl);
    return { ok: false, error: 'Origine non autorisée.' };
  }

  let canonicalOrigin: string;
  try {
    canonicalOrigin = new URL(senderUrl).origin;
  } catch {
    return { ok: false, error: 'URL invalide.' };
  }

  cancelDesktopGoogleOAuth();

  const expectedState = randomBytes(24).toString('hex');

  return await new Promise<GoogleOAuthResult>((resolve) => {
    let settled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const finish = (result: GoogleOAuthResult): void => {
      if (settled) return;
      settled = true;
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
      if (activeFlow && activeFlow.expectedState === expectedState) {
        activeFlow = null;
      }
      try {
        server.close();
      } catch {
        // Ignore server close failures cleanly
      }
      resolve(result);
    };

    const server = createServer((req, res) => {
      const requestPath = (req.url || '/').split('?')[0];

      if (req.method === 'GET' && requestPath === '/callback') {
        setSecurityHeaders(res);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(CALLBACK_HTML);
        return;
      }

      if (req.method === 'GET' && requestPath === '/callback.css') {
        setSecurityHeaders(res);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.end(CALLBACK_CSS);
        return;
      }

      if (req.method === 'GET' && requestPath === '/callback.js') {
        setSecurityHeaders(res);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.end(CALLBACK_JS);
        return;
      }

      if (req.method === 'POST' && requestPath === '/complete') {
        void readJsonBody(req).then((body) => {
          if (!body) {
            sendJson(res, 400, { ok: false });
            return;
          }

          const candidateState = typeof body.state === 'string' ? body.state : '';
          if (!constantTimeStateMatch(candidateState, expectedState)) {
            sendJson(res, 403, { ok: false });
            return;
          }

          const oauthError = typeof body.error === 'string' ? body.error.trim() : '';
          const accessToken = typeof body.access_token === 'string' ? body.access_token.trim() : '';
          const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token.trim() : '';

          if (oauthError || !accessToken || !refreshToken) {
            sendJson(res, 200, { ok: false });
            onRestoreWindow?.();
            finish({
              ok: false,
              cancelled: oauthError.toLowerCase().includes('access_denied'),
              error: oauthError || 'Session Google incomplète. Réessaie.',
            });
            return;
          }

          sendJson(res, 200, { ok: true });
          onRestoreWindow?.();
          finish({
            ok: true,
            accessToken,
            refreshToken,
          });
        });
        return;
      }

      setSecurityHeaders(res);
      res.statusCode = 404;
      res.end('Not found');
    });

    server.on('error', (err) => {
      log.warn('Desktop Google OAuth loopback server error:', err.message);
      finish({ ok: false, error: 'Impossible de démarrer la connexion locale.' });
    });

    timeoutHandle = setTimeout(() => {
      finish({
        ok: false,
        cancelled: true,
        error: 'Délai de connexion dépassé. Réessaie.',
      });
    }, OAUTH_TIMEOUT_MS);

    activeFlow = {
      server,
      timeout: timeoutHandle,
      expectedState,
      finish,
    };

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string' || addr.port < 1024) {
        finish({ ok: false, error: 'Port local invalide.' });
        return;
      }

      const authStartUrl = `${canonicalOrigin}/api/auth/desktop-google?port=${addr.port}&state=${expectedState}`;
      if (!isTrustedOrigin(authStartUrl, baseOrigin)) {
        finish({ ok: false, error: 'URL de connexion non autorisée.' });
        return;
      }

      void shell.openExternal(authStartUrl).catch(() => {
        finish({
          ok: false,
          error: "Impossible d'ouvrir le navigateur système pour Google.",
        });
      });
    });
  });
}

