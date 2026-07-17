import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

function getPool(): pg.Pool {
  if (!globalForPrisma.pool) {
    // Ensure PgBouncer transaction mode params are always present
    let dbUrl = process.env.DATABASE_URL || "";
    if (!dbUrl.includes("pgbouncer=true")) {
      const sep = dbUrl.includes("?") ? "&" : "?";
      dbUrl += `${sep}pgbouncer=true&connection_limit=3`;
    }
    globalForPrisma.pool = new pg.Pool({
      connectionString: dbUrl,
      max: 3,
      idleTimeoutMillis: 30000,  // 30s — biar ga ganti-ganti terus pas traffic normal
      connectionTimeoutMillis: 10000, // 10s — kasih waktu lebih buat cold start
    });
  }
  return globalForPrisma.pool;
}

const adapter = new PrismaPg(getPool(), { schema: "public" });

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = getPrisma();

/**
 * Get a user-friendly error message from an unknown error.
 * Handles Prisma, JWT, Zod, and generic errors gracefully.
 * Automatically logs all errors to AppError table (fire-and-forget).
 */
export function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan. Silakan coba lagi."): string {
  // Log error ke AppError secara asynchronous
  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    import("@/lib/error-logger").then(({ logError }) => {
      logError({
        message: msg.slice(0, 500),
        level: "error",
        source: "api",
        stack: stack?.slice(0, 2000) || "",
        metadata: { fallback },
      }).catch(() => {});
    }).catch(() => {});
  }

  if (typeof error === "string") return error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P1001") return "Database tidak tersedia. Silakan coba lagi.";
    if (error.code === "P1002") return "Koneksi database timed out. Silakan refresh.";
    if (error.code === "P1017") return "Koneksi database terputus.";
    if (error.code === "P2002") return "Data sudah ada.";
    if (error.code === "P2025") return "Data tidak ditemukan.";
    return "Gangguan database. Silakan coba lagi.";
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Gagal terhubung ke database.";
  }
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return "Database error fatal.";
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return "Data yang dikirim tidak valid.";
  }
  if (error instanceof SyntaxError) {
    return "Format request tidak valid.";
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * Check if an error is a database-related error (Prisma errors).
 */
export function isDatabaseError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientValidationError
  );
}
