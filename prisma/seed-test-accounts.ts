import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔐 Seeding test accounts...");

  // Upsert admin@springhub.id
  const adminPw = await bcrypt.hash("admin123", 12);
  const admin = await prisma.profile.upsert({
    where: { email: "admin@springhub.id" },
    update: { passwordHash: adminPw },
    create: {
      email: "admin@springhub.id",
      passwordHash: adminPw,
      username: "Admin",
      role: "admin",
      points: 99999,
      trustScore: 100,
    },
  });
  console.log(`   ✅ Admin: ${admin.email} (id: ${admin.id})`);

  // Upsert volunteer@springhub.id
  const volPw = await bcrypt.hash("vol123", 12);
  const volunteer = await prisma.profile.upsert({
    where: { email: "volunteer@springhub.id" },
    update: { passwordHash: volPw },
    create: {
      email: "volunteer@springhub.id",
      passwordHash: volPw,
      username: "Volunteer",
      role: "volunteer",
      points: 25000,
      trustScore: 75,
      region: "Yogyakarta",
    },
  });
  console.log(`   ✅ Volunteer: ${volunteer.email} (id: ${volunteer.id})`);

  console.log("\n✅ Test accounts seeded successfully!");
  console.log("   Admin:     admin@springhub.id / admin123");
  console.log("   Volunteer: volunteer@springhub.id / vol123");
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
