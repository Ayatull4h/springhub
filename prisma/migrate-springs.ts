// One-time migration: create Spring records from existing reports
// Run: npx tsx prisma/migrate-springs.ts

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  maxUses: 7500,
});
const adapter = new PrismaPg(pool, { schema: "public" });

const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log("Starting spring migration from existing reports...");

  // Ambil semua report yang punya spring_name
  const reports = await prisma.report.findMany({
    where: { status: "approved" },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${reports.length} approved reports`);

  const springMap = new Map<string, string>(); // key → Spring ID

  for (const report of reports) {
    let fieldData: Record<string, unknown> = {};
    try { fieldData = JSON.parse(report.fieldData); } catch { continue; }

    const springName = (fieldData?.spring_name as string || "").trim();
    if (!springName) continue;
    if (!report.snappedLat || !report.snappedLng) continue;

    // Buat key unik: snapped lat/lng + nama (case insensitive)
    const key = `${report.snappedLat.toFixed(3)}_${report.snappedLng.toFixed(3)}_${springName.toLowerCase()}`;

    if (springMap.has(key)) {
      // Link ke spring yang sudah ada
      await prisma.report.update({
        where: { id: report.id },
        data: { springId: springMap.get(key)! },
      });
    } else {
      // Buat spring baru
      const spring = await prisma.spring.create({
        data: {
          name: springName,
          snappedLat: report.snappedLat,
          snappedLng: report.snappedLng,
          province: (fieldData?.province as string) || "",
          regency: (fieldData?.regency as string) || "",
          village: (fieldData?.village as string) || "",
          subdistrict: (fieldData?.subdistrict as string) || "",
        },
      });

      await prisma.report.update({
        where: { id: report.id },
        data: { springId: spring.id },
      });

      springMap.set(key, spring.id);
      console.log(`  Created spring: ${spring.name} (${report.snappedLat}, ${report.snappedLng})`);
    }
  }

  const totalSprings = await prisma.spring.count();
  console.log(`\nDone! Created ${totalSprings} springs from ${reports.length} reports.`);
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
