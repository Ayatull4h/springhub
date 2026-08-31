/**
 * Guard — 1 penjaga untuk 95 pintu (staging)
 * Dipakai: const { session } = await guard(req, { admin, rate })
 * Baca semua dari config/env.ts, tidak hardcode.
 */
import { verifyCsrfToken } from "@/lib/csrf";
import { getSession, isAdmin, isAdminIpAllowed } from "@/lib/auth";
import { apiLimiter, publicLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

type GuardOpts = {
  admin?: boolean;
  rate?: "public" | "api" | false;
  csrf?: boolean;
};

export async function guard(
  req: Request,
  opts: GuardOpts = {}
): Promise<{ session: Awaited<ReturnType<typeof getSession>>; ip: string }> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

  if (opts.csrf !== false) {
    const token = req.headers.get("x-csrf-token");
    if (!token || !(await verifyCsrfToken(token))) {
      throw new Response(JSON.stringify({ error: "Invalid CSRF" }), { status: 403 });
    }
  }

  const session = await getSession();

  if (opts.admin && !(await isAdmin())) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  if (opts.admin) {
    // IP whitelist untuk admin (fail-closed jika ADMIN_IPS di-set)
    const allowed = isAdminIpAllowed(req as any);
    if (!allowed) throw new Response(JSON.stringify({ error: "Access denied: IP not allowed" }), { status: 403 });
  }

  if (opts.rate) {
    const limiter = opts.rate === "public" ? publicLimiter : apiLimiter;
    const key = session?.userId ? `${opts.rate}:${session.userId}` : `${opts.rate}:${ip}`;
    const lim = await limiter.check(key);
    if (!lim.allowed) throw new Response(JSON.stringify({ error: "Terlalu banyak permintaan." }), { status: 429 });
  }

  return { session, ip };
}
