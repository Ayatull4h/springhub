/**
 * SpringHub — Aktivasi Data Staging (Report + Spring)
 * ====================================================
 * Mengaktifkan data yang masih pending di staging:
 *  - Approve report pending yang memenuhi syarat foto (atau semua jika --force)
 *  - Aktifkan spring pending yang "data asli" (bukan test)
 *
 * ⚠️ HANYA UNTUK DATABASE STAGING. Guard menolak jika DATABASE_URL bukan staging.
 *
 * Cara menjalankan (dari VPS):
 *   # Dry-run:
 *   DATABASE_URL="postgresql://springhub:PASS@127.0.0.1:5433/springhub_staging" \
 *     npx tsx scripts/activate-staging-data.ts
 *
 *   # Apply (hanya data asli, approve yang >=3 foto):
 *   ... npx tsx scripts/activate-staging-data.ts --apply
 *
 *   # Apply termasuk approve semua pending (bypass min-3):
 *   ... npx tsx scripts/activate-staging-data.ts --apply --force
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes("staging")) {
  console.error("❌ Guard: DATABASE_URL harus mengandung 'staging'.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Daftar spring "data asli" yang disetujui untuk diaktifkan (8 id, dari audit DB 2026-08-24)
const REAL_SPRING_IDS = [
  "0de284b1-f86b-43b8-b51a-4afa368da7c4", // Sumber Telaga — Jawa Timur
  "1d3e8490-90bd-4be1-8499-e8494fef7efa", // Belik Soka — DIY
  "a3d2ac92-e246-43f6-93c2-e57f0c75c0d5", // Sumber Gempol — Jatim
  "c444b6ff-9169-4395-b454-3f6a675d0182", // Sumber Taman — Jatim
  "c5f45306-773d-49ad-8af3-c539339b2f7e", // Randu Alas (Tanam Pohon) — Jabar (46 reports)
  "cf88523c-5c33-41f6-be69-c2fc053cd080", // Sumber Brantas — Jatim
  "e35bac1b-8621-44ab-ad89-b566dc660042", // Sumber Maron — Jateng
  "39fabc93-69da-4367-9cd3-5e7eb4bc1661", // Mata Air Kalibayem — DIY
];

// Spring kosong (0 report) — JANGAN diaktifkan
const EMPTY_SPRING_IDS = [
  "be5cb7ef-ed5b-47b8-acfc-91fd93c0395a", // Sumber Umbul
  "8805a729-41a0-4476-b93d-f881fa0d46e5", // Mata Air Ciburial
  "7a1a27bc-a931-4bb1-ae28-8955e3dad7fa", // Cipanas
  "bfd009f1-3289-4782-b001-d425cfb6fd3d", // Tirta Gangga
  "dbfe39d4-a2a9-469f-ace0-723094fb83b5", // Tirta Empul
];

async function main() {
  const apply = process.argv.includes("--apply");
  const force = process.argv.includes("--force");
  console.log(apply ? `🔥 MODE APPLY${force ? " + --force (approve semua pending)" : ""}` : "🔍 MODE DRY-RUN");
  console.log(`   Target: ${process.env.DATABASE_URL!.replace(/\/\/[^@/]+@/, "//***@").split("?")[0]}\n`);

  // 1. Pending reports
  const pendingReports = await prisma.report.findMany({
    where: { status: "pending" },
    select: { id: true, formSlug: true, clientCorrelationId: true, springId: true, _count: { select: { photos: true } }, spring: { select: { name: true, status: true } } },
  });
  console.log(`📋 Pending reports: ${pendingReports.length}`);
  for (const r of pendingReports) {
    const ok = r._count.photos >= 3 ? "✅ layak approve" : `⚠️ ${r._count.photos} foto (<3)`;
    console.log(` - ${r.id.slice(0, 8)} ${r.formSlug} photos:${r._count.photos} spring:${r.spring?.name || "-"} (${r.spring?.status}) ${ok}`);
  }

  // 2. Pending springs — tampilkan yang akan diaktifkan
  const pendingSprings = await prisma.spring.findMany({
    where: { status: "pending" },
    select: { id: true, name: true, province: true, _count: { select: { reports: true } } },
    orderBy: { name: "asc" },
  });
  console.log(`\n📍 Pending springs: ${pendingSprings.length}`);
  const toActivate = pendingSprings.filter((s) => REAL_SPRING_IDS.includes(s.id));
  const toSkipEmpty = pendingSprings.filter((s) => EMPTY_SPRING_IDS.includes(s.id));
  const toSkipTest = pendingSprings.filter((s) => !REAL_SPRING_IDS.includes(s.id) && !EMPTY_SPRING_IDS.includes(s.id));
  console.log(`   Akan diaktifkan (data asli, 8):`);
  for (const s of toActivate) console.log(`    ✅ ${s.name} (${s.province || "-"}) reports:${s._count.reports} ${s.id.slice(0, 8)}`);
  console.log(`   Dilewati (kosong 0 report, 5):`);
  for (const s of toSkipEmpty) console.log(`    ⏭️  ${s.name} reports:${s._count.reports}`);
  console.log(`   Dilewati (test/dummy, ${toSkipTest.length}):`);
  for (const s of toSkipTest.slice(0, 8)) console.log(`    ⏭️  ${s.name} (${s.province || "-"})`);
  if (toSkipTest.length > 8) console.log(`      ... dan ${toSkipTest.length - 8} lagi`);

  if (!apply) {
    console.log("\nℹ️ Dry-run selesai. Jalankan dengan --apply untuk eksekusi.");
    await pool.end();
    return;
  }

  // 3. Backup info
  console.log("\n💾 Backup disarankan: docker exec staging-postgres pg_dump -U springhub springhub_staging > backups/staging-`date +%Y%m%d`-pre-activate.dump");

  // 4. Approve pending reports
  const adminId = (await prisma.profile.findUnique({ where: { email: "admin@springhub.id" }, select: { id: true } }))?.id;
  let approved = 0;
  let skipped = 0;
  for (const r of pendingReports) {
    if (!force && r._count.photos < 3) {
      console.log(`⏭️  Skip ${r.id.slice(0, 8)} (${r._count.photos} foto <3, gunakan --force untuk approve semua)`);
      skipped++;
      continue;
    }
    // Approve: update status + reviewedById, buat points log jika ada user
    await prisma.$transaction(async (tx) => {
      await tx.report.update({ where: { id: r.id }, data: { status: "approved", reviewedById: adminId } });
      // Points (sama dengan approve-all route, tapi tanpa notifikasi untuk staging test)
      // Cari user dari report - jika ada, beri points (sesuai lib/points.ts POINTS_MAP)
      const report = await tx.report.findUnique({ where: { id: r.id }, select: { userId: true, formSlug: true } });
      if (report?.userId) {
        const ptsMap: Record<string, number> = {
          "spring-monitoring": 100,
          "spring-restoration": 1000,
          "trench-development": 500,
          "tree-planting": 100,
          "seedling-stock": 100,
        };
        const pts = ptsMap[report.formSlug] || 25;
        const existing = await tx.pointsLog.findFirst({ where: { reportId: r.id } });
        if (!existing) {
          await tx.pointsLog.create({ data: { userId: report.userId, reportId: r.id, amount: pts, reason: `Approved ${report.formSlug} (staging activate)`, metadata: JSON.stringify({ stagingActivate: true }) } });
        }
      }
    });
    console.log(`✅ Approved ${r.id.slice(0, 8)} (${r._count.photos} foto)`);
    approved++;
  }
  // Recalc points per user
  if (approved > 0) {
    const totals = await prisma.pointsLog.groupBy({ by: ["userId"], _sum: { amount: true } });
    const map = new Map(totals.map((t) => [t.userId, t._sum.amount || 0]));
    for (const [userId, total] of map) {
      await prisma.profile.update({ where: { id: userId }, data: { points: total } });
    }
    console.log(`   Points direcalc untuk ${map.size} user`);
  }
  console.log(`📊 Report approved: ${approved}, skipped: ${skipped}`);

  // 5. Aktifkan springs
  let activated = 0;
  for (const id of REAL_SPRING_IDS) {
    const s = pendingSprings.find((x) => x.id === id);
    if (!s) { console.log(`⏭️  ${id.slice(0, 8)} tidak pending (sudah active atau tidak ada)`); continue; }
    await prisma.spring.update({ where: { id }, data: { status: "active" } });
    console.log(`✅ Spring activated: ${s.name} (${s.id.slice(0, 8)})`);
    activated++;
  }
  console.log(`\n📊 Springs activated: ${activated}/${REAL_SPRING_IDS.length}`);

  console.log("\n═══════════ SELESAI ═══════════");
  console.log(`Approved reports: ${approved}`);
  console.log(`Activated springs: ${activated}`);
  console.log("Verifikasi: curl http://localhost:31760/api/springs | jq '.groups | length'");
  await pool.end();
}

main().catch((e) => { console.error("❌ Gagal:", e); process.exit(1); });
