import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function getRedis(): Redis {
  if (!globalForRedis.redis) {
    if (!process.env.REDIS_URL) {
      const noop = new Proxy({} as Redis, {
        get: () => () => Promise.reject(new Error("Redis not configured")),
      });
      globalForRedis.redis = noop;
      return globalForRedis.redis;
    }
    globalForRedis.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    globalForRedis.redis.on("error", () => {});
  }
  return globalForRedis.redis;
}

export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return (getRedis() as any)[prop];
  },
});
