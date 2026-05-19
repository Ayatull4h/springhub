import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("DATABASE_URL not set — running in build/static mode. DB calls will fail at this point.");
  }
  return new PrismaClient();
}

const prismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaProxy = new Proxy(prismaClient, {
  get(target, prop) {
    if (!process.env.DATABASE_URL && typeof prop === "string") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (target as any)[prop] = (...args: unknown[]) => {
        console.warn(`prisma.${String(prop)}() called during build — no DATABASE_URL`);
        return Promise.resolve(null);
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (target as any)[prop];
  },
}) as typeof prismaClient;

export const prisma = prismaProxy;
