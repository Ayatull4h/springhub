import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.profile.findUnique({ where: { email: 'admin@test.com' } });
  if (admin) {
    await prisma.profile.update({ where: { id: admin.id }, data: { points: 25000 } });
    console.log('✅ Admin points updated to 25,000');
  } else {
    console.log('Admin not found');
  }
}
main().finally(() => prisma.$disconnect());
