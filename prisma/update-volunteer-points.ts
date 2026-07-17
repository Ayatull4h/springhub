import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.profile.updateMany({
    where: { email: "volunteer@springhub.id" },
    data: { points: 10000 },
  });
  console.log(`Updated ${result.count} volunteer@springhub.id to 10,000 points`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
