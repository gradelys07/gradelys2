/**
 * Pure URL and origin validation helpers for Electron security guards.
 * Kept free of Electron imports so they can run in both main process and Vitest.
 */

export function normalizeBaseUrl(rawUrl: string | undefined, isPackaged: boolean): string {
  const fallback = isPackaged ? 'https://gradelys.com' : 'http://localhost:3000';
  const candidate = (rawUrl || fallback).trim();

  try {
    const parsed = new URL(candidate);
    const isLocalhost =
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
    if (parsed.protocol !== 'https:' && !isLocalhost) {
      return fallback;
    }
    return parsed.origin;
  } catch {
    return fallback;
  }
}

const CANONICAL_GRADELYS_HOSTS = new Set(['gradelys.com', 'www.gradelys.com']);

export function isTrustedOrigin(targetUrl: string | undefined | null, baseOrigin: string): boolean {
  if (!targetUrl) return false;
  try {
    const parsedTarget = new URL(targetUrl);
    const parsedBase = new URL(baseOrigin);
    if (parsedTarget.protocol !== parsedBase.protocol) return false;
    if (parsedTarget.origin === parsedBase.origin) return true;
    // Production gradelys.com issues a 308 redirect to www.gradelys.com; allow only that canonical apex/www pair
    return (
      parsedBase.protocol === 'https:' &&
      parsedTarget.port === parsedBase.port &&
      CANONICAL_GRADELYS_HOSTS.has(parsedBase.hostname) &&
      CANONICAL_GRADELYS_HOSTS.has(parsedTarget.hostname)
    );
  } catch {
    return false;
  }
}

export function isSafeExternalHttpsUrl(targetUrl: string | undefined | null): boolean {
  if (!targetUrl) return false;
  try {
    const parsed = new URL(targetUrl);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isTrustedRendererUrl(
  frameUrl: string | undefined | null,
  allowedBaseOrigin: string
): boolean {
  return isTrustedOrigin(frameUrl, allowedBaseOrigin);
}

const TRUSTED_VIDEO_EMBED_HOSTS = new Set([
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'www.youtube.com',
]);

export function isTrustedEmbedUrl(
  targetUrl: string | undefined | null,
  baseOrigin: string
): boolean {
  if (isTrustedOrigin(targetUrl, baseOrigin)) return true;
  if (!targetUrl) return false;
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'https:') return false;
    return (
      TRUSTED_VIDEO_EMBED_HOSTS.has(parsed.hostname) &&
      parsed.pathname.startsWith('/embed/')
    );
  } catch {
    return false;
  }
}

export function isValidOAuthState(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{32,128}$/i.test(value);
}

export function isValidLoopbackPort(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1024 && value <= 65535;
}

