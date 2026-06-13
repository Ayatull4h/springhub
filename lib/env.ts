/**
 * Environment variable validation — runs at module import time.
 * Provides typed, validated access to all env vars with safe defaults.
 *
 * Inspired by industry patterns (T3 Env, create-t3-app).
 */

import { z } from "zod";

const envSchema = z.object({
  // ── Critical — app will not function without these ─────────────────────
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // ── High — features will break without these ──────────────────────────
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  XENDIT_SECRET_KEY: z.string().optional(),
  XENDIT_WEBHOOK_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_QUEUE_URL: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  // ── Medium — nice to have ────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("https://springhub.vercel.app"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["log", "smtp", "resend"]).optional().default("log"),
  SMTP_HOST: z.string().optional().default("smtp.hostinger.com"),
  SMTP_PORT: z.coerce.number().optional().default(465),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("noreply@springhub.id"),
  EMAIL_API_KEY: z.string().optional().default(""),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).optional().default("info"),
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});

type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;
let _validationError: string | null = null;
let _missingCritical: string[] = [];

/**
 * Validate environment variables. Call once at app startup.
 * Throws immediately if critical vars are missing.
 * Logs warnings for non-critical missing vars.
 */
export function validateEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten();
    const fieldErrors = errors.fieldErrors;

    // Separate critical vs non-critical
    const criticalFields = ["DATABASE_URL", "JWT_SECRET", "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

    for (const field of criticalFields) {
      if (fieldErrors[field]) {
        _missingCritical.push(field);
      }
    }

    _validationError = Object.entries(fieldErrors)
      .filter(([, msgs]) => msgs && msgs.length > 0)
      .map(([key, msgs]) => `  • ${key}: ${msgs?.join(", ")}`)
      .join("\n");

    // If critical vars missing, throw immediately
    if (_missingCritical.length > 0) {
      const msg = `❌ Critical environment variables missing or invalid:\n${
        _missingCritical.map((k) => `  • ${k}`).join("\n")
      }\n\nFull validation errors:\n${_validationError}`;
      console.error(msg);
      throw new Error(msg);
    }

    // Non-critical — log warning but don't crash
    console.warn(
      `⚠️  Non-critical environment variables missing or invalid:\n${_validationError}`
    );
  }

  _env = result.data as Env;
  return _env;
}

/**
 * Get validated env vars. Safe to call anywhere after app init.
 */
export function env(): Env {
  if (!_env) {
    return validateEnv();
  }
  return _env;
}

export { _missingCritical as missingCriticalEnvVars, _validationError as envValidationError };
