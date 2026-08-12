import type { ConnectionOptions } from "bullmq";

type RedisConnection = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
};

/**
 * Parses REDIS_URL / REDIS_QUEUE_URL (redis://user:pass@host:port/db) into a
 * BullMQ-compatible connection object. Preserves credentials + db index —
 * sebelumnya password & db di-buang (bug NOAUTH Redis).
 */
export function redisConnectionFromUrl(url: string | undefined): RedisConnection {
  const fallback: RedisConnection = { host: "localhost", port: 6379 };
  if (!url) return fallback;
  try {
    const u = new URL(url);
    return {
      host: u.hostname || fallback.host,
      port: u.port ? parseInt(u.port, 10) : 6379,
      username: u.username || undefined,
      password: u.password || undefined,
      db: u.pathname && u.pathname.length > 1 ? parseInt(u.pathname.slice(1), 10) : undefined,
    };
  } catch {
    return fallback;
  }
}

export function getRedisConnectionOptions(envKey = "REDIS_QUEUE_URL"): ConnectionOptions {
  return redisConnectionFromUrl(process.env[envKey]);
}
