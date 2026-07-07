/**
 * SpringHub — Prisma RLS (Row Level Security) Extension
 *
 * Menggunakan Prisma Client Extensions ($extends) untuk auto-filter queries
 * berdasarkan role dan userId dari session.
 *
 * Cara pake:
 *   import { prismaWithRls } from "@/lib/prisma-rls";
 *   import { getAuthContext } from "@/lib/auth-context";
 *
 *   const ctx = getAuthContext(session);
 *   const db = prismaWithRls(ctx);
 *   const reports = await db.report.findMany(); // auto-filter by role
 */

import { prisma } from "./prisma";

export type RlsContext = {
  userId?: string | null;
  role: "user" | "volunteer" | "admin" | "guest";
};

/**
 * Helper: tambah filter where hanya untuk query SELECT/COUNT (bukan CREATE).
 * `$allOperations` termasuk create — yang gak punya `where`.
 */
function addWhere<T extends Record<string, unknown>>(
  args: T,
  filter: Record<string, unknown>
): T {
  // Hanya tambah where jika args sudah punya where (findMany, findFirst, dll)
  // atau args itu sendiri adalah where (count, aggregate)
  if ("where" in args) {
    const currentWhere = (args.where as Record<string, unknown>) || {};
    if ("OR" in filter) {
      // Gabung OR dengan existing where
      Object.assign(args, { where: { ...currentWhere, ...filter } });
    } else {
      Object.assign(args, { where: { ...currentWhere, ...filter } });
    }
  }
  return args;
}

/**
 * Buat extended Prisma client dengan RLS filter berdasarkan context.
 * Setiap request panggil factory ini → context fresh, gak bocor antar request.
 */
export function prismaWithRls(ctx: RlsContext) {
  const isAdmin = ctx.role === "admin";
  const userId = ctx.userId;

  return prisma.$extends({
    name: "springhub-rls",

    query: {
      report: {
        async findMany({ args, query }) {
          if (!isAdmin) {
            const filter: Record<string, unknown> = userId
              ? { userId }
              : { status: "approved", isActive: true };
            addWhere(args, filter);
          }
          return query(args);
        },
        async findFirst({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
        async findUnique({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
        async count({ args, query }) {
          if (!isAdmin) {
            const filter: Record<string, unknown> = userId
              ? { userId }
              : { status: "approved", isActive: true };
            addWhere(args, filter);
          }
          return query(args);
        },
      },

      pointsLog: {
        async findMany({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
        async count({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
      },

      donation: {
        async findMany({ args, query }) {
          if (!isAdmin) {
            addWhere(args, userId ? { userId } : { status: "paid" });
          }
          return query(args);
        },
      },

      project: {
        async findMany({ args, query }) {
          if (!isAdmin) {
            if (userId) {
              addWhere(args, {
                OR: [{ userId }, { status: "published" }],
              });
            } else {
              addWhere(args, { status: "published" });
            }
          }
          return query(args);
        },
      },

      notification: {
        async findMany({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
      },

      coursesProgress: {
        async findMany({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
      },

      offlineSession: {
        async findMany({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
      },

      feedback: {
        async findMany({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
      },
    },
  });
}
