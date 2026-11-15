import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface MemoryBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();
let warnedAboutMemoryFallback = false;

function parseEnvLimit(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getLimits() {
  return {
    perMin: parseEnvLimit("ASSISTANT_RATE_PER_MIN", 20),
    perDay: parseEnvLimit("ASSISTANT_RATE_PER_DAY", 200),
    imagePerDay: parseEnvLimit("ASSISTANT_IMAGE_PER_DAY", 30),
  };
}

let cachedRedis: Redis | null = null;
let cachedMinLimiter: Ratelimit | null = null;
let cachedDayLimiter: Ratelimit | null = null;
let cachedImageDayLimiter: Ratelimit | null = null;
let cachedConfigSig = "";

function getUpstashLimiters(): {
  minLimiter: Ratelimit;
  dayLimiter: Ratelimit;
  imageDayLimiter: Ratelimit;
} | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    if (!warnedAboutMemoryFallback) {
      warnedAboutMemoryFallback = true;
      console.warn(
        "[assistant/rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not configured; falling back to in-memory rate limiting."
      );
    }
    return null;
  }

  const limits = getLimits();
  const sig = `${url}:${limits.perMin}:${limits.perDay}:${limits.imagePerDay}`;
  if (cachedRedis && cachedMinLimiter && cachedDayLimiter && cachedImageDayLimiter && cachedConfigSig === sig) {
    return {
      minLimiter: cachedMinLimiter,
      dayLimiter: cachedDayLimiter,
      imageDayLimiter: cachedImageDayLimiter,
    };
  }

  cachedRedis = new Redis({ url, token });
  cachedMinLimiter = new Ratelimit({
    redis: cachedRedis,
    limiter: Ratelimit.slidingWindow(limits.perMin, "1 m"),
    prefix: "gradelys:assistant:min",
  });
  cachedDayLimiter = new Ratelimit({
    redis: cachedRedis,
    limiter: Ratelimit.fixedWindow(limits.perDay, "1 d"),
    prefix: "gradelys:assistant:day",
  });
  cachedImageDayLimiter = new Ratelimit({
    redis: cachedRedis,
    limiter: Ratelimit.fixedWindow(limits.imagePerDay, "1 d"),
    prefix: "gradelys:assistant:imgday",
  });
  cachedConfigSig = sig;

  return {
    minLimiter: cachedMinLimiter,
    dayLimiter: cachedDayLimiter,
    imageDayLimiter: cachedImageDayLimiter,
  };
}

function checkMemoryBucket(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || now >= existing.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) {
    return false;
  }
  existing.count += 1;
  return true;
}

export async function checkAssistantRateLimit(
  userId: string,
  hasImage: boolean
): Promise<{ allowed: true } | { allowed: false; message: string }> {
  const limits = getLimits();
  const upstash = getUpstashLimiters();

  if (upstash) {
    const minRes = await upstash.minLimiter.limit(userId);
    if (!minRes.success) {
      return {
        allowed: false,
        message: "Tu envoies trop de questions en peu de temps. Attends une minute et réessaie.",
      };
    }

    const dayRes = await upstash.dayLimiter.limit(userId);
    if (!dayRes.success) {
      return {
        allowed: false,
        message: "Tu as atteint ta limite quotidienne de requêtes pour l'assistant rapide.",
      };
    }

    if (hasImage) {
      const imgRes = await upstash.imageDayLimiter.limit(userId);
      if (!imgRes.success) {
        return {
          allowed: false,
          message:
            "Tu as atteint ta limite quotidienne d'analyses d'écran. Tu peux encore poser des questions par texte.",
        };
      }
    }

    return { allowed: true };
  }

  // In-memory fallback
  if (!checkMemoryBucket(`min:${userId}`, limits.perMin, 60_000)) {
    return {
      allowed: false,
      message: "Tu envoies trop de questions en peu de temps. Attends une minute et réessaie.",
    };
  }
  if (!checkMemoryBucket(`day:${userId}`, limits.perDay, 86_400_000)) {
    return {
      allowed: false,
      message: "Tu as atteint ta limite quotidienne de requêtes pour l'assistant rapide.",
    };
  }
  if (hasImage && !checkMemoryBucket(`img:${userId}`, limits.imagePerDay, 86_400_000)) {
    return {
      allowed: false,
      message:
        "Tu as atteint ta limite quotidienne d'analyses d'écran. Tu peux encore poser des questions par texte.",
    };
  }

  return { allowed: true };
}

