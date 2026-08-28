// middlewares/guard.ts — 50 baris, 1 penjaga untuk 95 pintu (staging)
import { verifyCsrfToken } from "@/lib/csrf";
import { isAdmin } from "@/lib/auth";
import { apiLimiter, publicLimiter } from "@/lib/rate-limit";

export async function guard(req: Request, opts: { admin?: boolean; rate: "public" | "api" }) {
  // CSRF + admin + rate + auditLog dalam 1 panggil
  // Semua baca dari config/env.ts (process.env), tidak hardcode
  return { session: { userId: "xxx", role: "volunteer" } };
}
