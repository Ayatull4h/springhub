/**
 * SpringHub — Auth Context Helper
 *
 * Ekstrak user context (userId + role) dari session untuk Prisma RLS.
 * Dipanggil di awal setiap route handler.
 */

import { getSession } from "./auth";
import type { RlsContext } from "./prisma-rls";

/**
 * Dapetin RLS context dari session.
 * Panggil di awal setiap route handler:
 *   const ctx = await getRlsContext();
 *   const db = prismaWithRls(ctx);
 */
export async function getRlsContext(): Promise<RlsContext> {
  const session = await getSession();

  if (!session) {
    return { role: "guest" };
  }

  if (session.role === "admin") {
    return { userId: session.userId, role: "admin" };
  }

  if (session.role === "volunteer") {
    return { userId: session.userId, role: "volunteer" };
  }

  return { userId: session.userId, role: "user" };
}

/**
 * Buat RLS context dari session yang sudah diketahui.
 * Untuk route yang sudah punya session object.
 */
export function rlsContextFromSession(session: { userId: string; role: string } | null): RlsContext {
  if (!session) return { role: "guest" };
  if (session.role === "admin") return { userId: session.userId, role: "admin" };
  if (session.role === "volunteer") return { userId: session.userId, role: "volunteer" };
  return { userId: session.userId, role: "user" };
}
