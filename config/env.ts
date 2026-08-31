/**
 * SpringHub — Config terpusat (staging)
 * Semua rahasia baca 1x dari env, tidak hardcode di route.
 * Staging pakai .env.staging (5433), prod pakai .env.production (5432) — terisolasi.
 */

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  REDIS_URL: process.env.REDIS_URL || "",
  REDIS_QUEUE_URL: process.env.REDIS_QUEUE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_SECRET_PREVIOUS: process.env.JWT_SECRET_PREVIOUS || "",
  XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY || "",
  XENDIT_WEBHOOK_TOKEN: process.env.XENDIT_WEBHOOK_TOKEN || "",
  S3_ENDPOINT: process.env.S3_ENDPOINT || "",
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || "",
  S3_SECRET_KEY: process.env.S3_SECRET_KEY || "",
  S3_BUCKET: process.env.S3_BUCKET || "",
  ADMIN_IPS: process.env.ADMIN_ALLOWED_IPS || "",
  RATE_PUBLIC: process.env.RATE_PUBLIC || "30/10000",
  RATE_API: process.env.RATE_API || "60/60000",
} as const;

export function assertEnv(name: keyof typeof env, value: string) {
  if (!value) throw new Error(`${name} belum di-set di env`);
  return value;
}
