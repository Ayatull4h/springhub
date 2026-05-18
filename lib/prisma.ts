import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// Resolve the database path relative to project root.
// DATABASE_URL in .env is "file:./dev.db" which Prisma interprets as
// relative to the project root (not the prisma/ directory).
const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const cleanPath = dbUrl.replace(/^file:/, "").replace(/^\.\//, "");
const absolutePath = path.resolve(process.cwd(), cleanPath);

const adapter = new PrismaLibSql({
  url: `file:${absolutePath}`,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
