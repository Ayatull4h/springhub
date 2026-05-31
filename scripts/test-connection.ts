import { prisma } from "../lib/prisma";

async function main() {
  const result = await prisma.$queryRaw<[{ ok: number }]>`SELECT 1 as ok`;
  console.log("DB OK:", result[0].ok);

  const userCount = await prisma.profile.count();
  console.log("Users in DB:", userCount);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("DB Error:", e);
  process.exit(1);
});
