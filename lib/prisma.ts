import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

function getPool(): pg.Pool {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      maxUses: 3000,
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
