import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const url = process.env.DATABASE_URL;
    if (!url && process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL is not set");
    }
    globalForPrisma.prisma = new PrismaClient({
      datasourceUrl: url,
    });
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrisma() as any)[prop];
  },
});
