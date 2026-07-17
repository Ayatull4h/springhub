/**
 * SpringHub — In-App Error Logger
 *
 * Menggantikan Sentry untuk development / staging.
 * Semua error disimpan ke tabel AppError di PostgreSQL.
 *
 * Usage (frontend):
 *   import { logError } from "@/lib/error-logger";
 *   logError("Gagal load data", { source: "frontend", url: "/dashboard" });
 *
 * Usage (API route):
 *   import { logError } from "@/lib/error-logger";
 *   await logError("Database connection failed", { source: "api", level: "critical" });
 */

export type ErrorLogInput = {
  message: string;
  level?: "info" | "warning" | "error" | "critical";
  source?: "frontend" | "api" | "worker" | "database";
  stack?: string;
  url?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Log error ke database via API (frontend) atau langsung (backend).
 * Auto-detects environment — uses direct fetch in browser, await in server.
 */
export async function logError(input: ErrorLogInput): Promise<void> {
  const { message, level = "error", source = "frontend", stack = "", url = "", userId = "", metadata = {} } = input;

  // Always log to console regardless of environment
  const prefix = `[${level.toUpperCase()}][${source}]`;
  if (level === "critical") {
    console.error(prefix, message, metadata, stack);
  } else if (level === "error") {
    console.error(prefix, message, metadata);
  } else if (level === "warning") {
    console.warn(prefix, message, metadata);
  } else {
    console.log(prefix, message, metadata);
  }

  const payload = {
    level,
    message,
    source,
    stack: stack.slice(0, 2000), // limit stack trace length
    url: url.slice(0, 500),
    userId: userId.slice(0, 100),
    metadata: JSON.stringify(metadata).slice(0, 5000),
  };

  try {
    if (typeof window !== "undefined") {
      // Frontend — POST via fetch (fire-and-forget)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch("/api/log/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } else {
      // Server-side — import prisma directly
      const { prisma } = await import("@/lib/prisma");
      await prisma.appError.create({ data: payload }).catch((e: Error) => {
        console.error("[ErrorLogger] Failed to save to DB:", e.message);
      });
    }
  } catch (err) {
    // Silent fail — error logger tidak boleh bikin error baru
    console.debug("[ErrorLogger] Failed to send:", err);
  }
}

/**
 * Setup global error handlers for uncaught exceptions and unhandled rejections.
 * Call once on app mount (client-side).
 */
export function setupGlobalErrorLogger(): void {
  if (typeof window === "undefined") return;

  // Pastikan hanya di-setup sekali
  if ((window as unknown as Record<string, boolean>).__ERROR_LOGGER_SETUP) return;
  (window as unknown as Record<string, boolean>).__ERROR_LOGGER_SETUP = true;

  window.addEventListener("error", (event) => {
    logError({
      message: event.message || "Uncaught Error",
      level: "critical",
      source: "frontend",
      stack: event.error?.stack || "",
      url: window.location.href,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    logError({
      message: reason?.message || "Unhandled Promise Rejection",
      level: "error",
      source: "frontend",
      stack: reason?.stack || "",
      url: window.location.href,
    });
  });

  console.log("[ErrorLogger] Global error handlers registered");
}
