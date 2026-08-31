import DOMPurify from "isomorphic-dompurify";

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING — in-memory sliding window (per Partie 8.3 of CDC)
// In production, swap this for Upstash Redis (see README) — the
// interface is identical so the swap is a one-file change.
// ═══════════════════════════════════════════════════════════════

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

// Rate limit tiers per CDC 8.3
export const RATE_LIMITS = {
  public: { limit: 5, windowSeconds: 10 },
  auth: { limit: 10, windowSeconds: 900 },
  aiFree: { limit: 20, windowSeconds: 86400 },
  aiPlus: { limit: 200, windowSeconds: 3600 },
  aiPro: { limit: 500, windowSeconds: 3600 },
  admin: { limit: 10, windowSeconds: 60 },
};

// ═══════════════════════════════════════════════════════════════
// INPUT SANITIZATION
// ═══════════════════════════════════════════════════════════════

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "blockquote", "code", "pre", "span",
      "table", "thead", "tbody", "tr", "th", "td", "hr",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });
}

export function sanitizePromptInput(input: string, maxLength = 10000): string {
  return input.slice(0, maxLength).trim();
}

// ═══════════════════════════════════════════════════════════════
// PASSWORD VALIDATION (CDC 8.1 — min 8 chars, 1 digit, 1 uppercase)
// ═══════════════════════════════════════════════════════════════

export function validatePassword(password: string): { valid: boolean; reason?: string } {
  if (password.length < 8) return { valid: false, reason: "At least 8 characters" };
  if (!/[0-9]/.test(password)) return { valid: false, reason: "At least 1 number" };
  if (!/[A-Z]/.test(password)) return { valid: false, reason: "At least 1 uppercase letter" };
  return { valid: true };
}

export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD VALIDATION (CDC 8.8)
// ═══════════════════════════════════════════════════════════════

export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
};

export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20MB

export function validateFile(file: { type: string; size: number; name: string }): {
  valid: boolean;
  reason?: string;
} {
  if (file.size === 0) return { valid: false, reason: "File is empty" };
  if (file.size > MAX_UPLOAD_SIZE) return { valid: false, reason: "File exceeds 20MB limit" };
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const allowedExts = Object.values(ALLOWED_FILE_TYPES).flat();
  if (!allowedExts.includes(ext)) {
    return { valid: false, reason: "Unsupported file type" };
  }
  return { valid: true };
}
