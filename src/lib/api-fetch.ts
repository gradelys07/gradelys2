export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const SESSION_EXPIRED_MESSAGE = "Votre session a expiré. Veuillez vous reconnecter.";

let refreshPromise: Promise<boolean> | null = null;

/**
 * Refreshes the Supabase session in the browser (shared across concurrent
 * callers so we never fire multiple refreshes with the same refresh token).
 * Returns true if a valid session is available afterwards.
 */
export async function refreshBrowserSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase.auth.refreshSession();
        return !error && Boolean(data.session);
      } catch {
        return false;
      } finally {
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      }
    })();
  }
  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?redirect=${redirect}`;
}

/**
 * fetch() wrapper that transparently recovers from an expired session:
 * on 401 it refreshes the Supabase session and retries once. If the retry
 * still fails, it redirects to /login.
 */
export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  let res = await fetch(url, init);
  if (res.status !== 401) return res;

  const refreshed = await refreshBrowserSession();
  if (refreshed) {
    res = await fetch(url, init);
    if (res.status !== 401) return res;
  }

  redirectToLogin();
  return res;
}

export async function apiFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    if (res.status === 401) message = SESSION_EXPIRED_MESSAGE;
    throw new ApiError(message, res.status);
  }
  if (res.headers.get("content-type")?.includes("application/json")) {
    return res.json();
  }
  return res as unknown as T;
}
