import { redis } from "./redis";

function cacheKey(prefix: string, key: string): string {
  return `cache:${prefix}:${key}`;
}

export async function getOrSet<T>(
  prefix: string,
  key: string,
  fetch: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const redisKey = cacheKey(prefix, key);
  const cached = await redis.get(redisKey);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const data = await fetch();

  await redis.setex(redisKey, ttlSeconds, JSON.stringify(data));

  return data;
}

export async function invalidateCache(prefix: string): Promise<void> {
  const pattern = `cache:${prefix}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function invalidateAllCache(): Promise<void> {
  const keys = await redis.keys("cache:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
