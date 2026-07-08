import { redis } from "./redis";

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

// Fallback in-memory store (for Vercel serverless without Redis)
const memoryStores = new Map<string, Map<string, { count: number; resetAt: number }>>();

function getMemoryStore(name: string) {
  if (!memoryStores.has(name)) {
    memoryStores.set(name, new Map());
  }
  return memoryStores.get(name)!;
}

// Cleanup in-memory stores every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of memoryStores) {
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function memoryCheck(storeName: string, key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const store = getMemoryStore(storeName);
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function createRateLimiter(name: string, config: RateLimitConfig) {
  return {
    async check(key: string): Promise<RateLimitResult> {
      // Try Redis first, fallback to in-memory
      try {
        const now = Date.now();
        const windowKey = Math.floor(now / config.windowMs);
        const redisKey = `ratelimit:${name}:${key}:${windowKey}`;

        const count = await redis.incr(redisKey);
        if (count === 1) {
          await redis.pexpire(redisKey, config.windowMs);
        }

        const resetAt = (windowKey + 1) * config.windowMs;
        const remaining = Math.max(0, config.maxRequests - count);

        return {
          allowed: count <= config.maxRequests,
          remaining,
          resetAt,
        };
      } catch {
        // Redis unavailable — use in-memory fallback
        return memoryCheck(`fallback:${name}`, key, config);
      }
    },

    async reset(key: string): Promise<void> {
      try {
        const pattern = `ratelimit:${name}:${key}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch {
        // Reset in-memory
        const store = memoryStores.get(`fallback:${name}`);
        if (store) store.delete(key);
      }
    },
  };
}

export const authLimiter = createRateLimiter("auth", {
  windowMs: 60_000,
  maxRequests: 20,
});

export const apiLimiter = createRateLimiter("api", {
  windowMs: 60_000,
  maxRequests: 60,
});

export const reportLimiter = createRateLimiter("report", {
  windowMs: 60_000,
  maxRequests: 5,
});

export const feedbackLimiter = createRateLimiter("feedback", {
  windowMs: 60_000,
  maxRequests: 3,
});

export const newsletterLimiter = createRateLimiter("newsletter", {
  windowMs: 60_000,
  maxRequests: 3,
});

export const donationLimiter = createRateLimiter("donation", {
  windowMs: 60_000,
  maxRequests: 5,
});

export const uploadLimiter = createRateLimiter("upload", {
  windowMs: 60_000,
  maxRequests: 20,
});

// Login lockout: 5 failed attempts → lock 15 menit
export const loginLockout = createRateLimiter("login-lockout", {
  windowMs: 15 * 60_000,
  maxRequests: 5,
});

// Webhook: 10 requests per 60 detik — cegah flood dari Xendit callback
export const webhookLimiter = createRateLimiter("webhook", {
  windowMs: 60_000,
  maxRequests: 10,
});

// Public API: 30 requests per 10 detik — cegah scraping / spam
export const publicLimiter = createRateLimiter("public", {
  windowMs: 10_000,
  maxRequests: 30,
});
