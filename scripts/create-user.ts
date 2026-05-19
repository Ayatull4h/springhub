import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("ucup123", 12);

  const user = await prisma.profile.upsert({
    where: { email: "ucup@springhub.id" },
    update: {},
    create: {
      email: "ucup@springhub.id",
      passwordHash: hash,
      username: "Ucup Bensing",
      role: "volunteer",
      region: "Indonesia",
      points: 25000,
      trustScore: 80,
    },
  });

  console.log("✅ User created:", user.username, "-", user.id);
  console.log("   Email: ucup@springhub.id");
  console.log("   Pass: ucup123");
  console.log("   Points:", user.points);
  console.log("   Can submit project: YES (≥ 20.000 pts)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
