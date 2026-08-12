/**
 * SpringHub — Fix Orphan Reports (Dirgapala data repair)
 * ======================================================
 * Tujuan: "Menghidupkan" laporan publik yang tidak terlihat karena tidak punya
 * springId. Laporan yang memenuhi kriteria:
 *   - springId IS NULL
 *   - status = 'approved' AND isActive = true
 *   - snappedLat / snappedLng NOT NULL
 * dikelompokkan per klaster koordinat (grid ~0.1 km, 3 desimal). Untuk setiap
 * klaster (min. 3 laporan) yang TIDAK memiliki spring aktif/pending maupun
 * MapPoint dalam radius 0.02 derajat (~2 km):
 *   1. buat Spring baru (status 'active', nama dari mode spring_name/B1_nama,
 *      fallback "Mata Air Klaster (lat, lng)"),
 *   2. tautkan SEMUA laporan klaster ke spring itu (springId + mapPointId),
 *   3. buat MapPoint (tipe diturunkan dari formSlug dominan klaster).
 * Idempotent: klaster yang sudah punya spring/MapPoint di radius di-skip.
 *
 * ⚠️⚠️⚠️ PENTING — JANGAN PERNAH DIJALANKAN TERHADAP DATABASE PRODUKSI ⚠️⚠️⚠️
 * Script ini menulis ke DATABASE_URL yang sedang aktif di environment.
 * WAJIB diuji di STAGING dulu. Cara menjalankan (pilih salah satu):
 *
 *   # Dry-run (default, TIDAK menulis apa pun):
 *   DOTENV_CONFIG_PATH=.env.staging npx tsx scripts/fix-orphan-reports.ts --dry-run
 *
 *   # Apply (menulis ke DB staging):
 *   DOTENV_CONFIG_PATH=.env.staging npx tsx scripts/fix-orphan-reports.ts --apply
 *
 *   # Alternatif tanpa file .env.staging:
 *   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" \
 *     npx tsx scripts/fix-orphan-reports.ts --dry-run
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// ─── Konfigurasi (bisa disesuaikan) ──────────────────────────────────────────
const MIN_CLUSTER_SIZE = 3; // klaster minimal 3 laporan
const CLUSTER_DECIMALS = 3; // grid klaster ≈ 0.1 km
const SKIP_RADIUS_DEG = 0.02; // spring/MapPoint dalam radius ini → skip klaster
const NAME_KEYS = ["spring_name", "B1_nama"];
const PROVINCE_KEYS = ["province", "B1_provinsi", "provinsi"];
const REGENCY_KEYS = ["regency", "B2_kabupaten_kota", "kabupaten_kota"];

const FORM_TO_TYPE: Record<string, string> = {
  "spring-monitoring": "spring",
  "spring-restoration": "spring",
  "trench-development": "trench",
  "tree-planting": "tree-planting",
  "seedling-stock": "seedling",
};
const TYPE_NAMES: Record<string, string> = {
  spring: "Mata Air",
  "tree-planting": "Tanam Pohon",
  trench: "Parit Resapan",
  seedling: "Penyemaian",
  conservation: "Konservasi",
};

// ─── Setup koneksi (pola sama dengan prisma/seed.ts) ───────────────────────
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Tipe & helper ───────────────────────────────────────────────────────────
type Cluster = {
  key: string;
  lat: number; // pusat klaster (dibulatkan 3 desimal)
  lng: number;
  reports: Array<{ id: string; formSlug: string; fieldData: string }>;
};

function round3(n: number): number {
  return Math.round(n * 10 ** CLUSTER_DECIMALS) / 10 ** CLUSTER_DECIMALS;
}

function parseFieldData(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function modeOf(values: string[]): string {
  const counts = new Map<string, number>();
  let best = "";
  let bestCount = 0;
  for (const v of values) {
    if (!v) continue;
    const c = (counts.get(v) ?? 0) + 1;
    counts.set(v, c);
    if (c > bestCount) {
      bestCount = c;
      best = v;
    }
  }
  return best;
}

function withinRadius(
  items: Array<{ snappedLat: number | null; snappedLng: number | null }>,
  lat: number,
  lng: number
): boolean {
  return items.some(
    (p) =>
      Math.abs((p.snappedLat ?? 0) - lat) <= SKIP_RADIUS_DEG &&
      Math.abs((p.snappedLng ?? 0) - lng) <= SKIP_RADIUS_DEG
  );
}

/** slug unik MapPoint: "klaster-7-623-110-349" (+ suffix jika tabrakan). */
function clusterSlug(lat: number, lng: number): string {
  const p = (n: number) => Math.abs(n).toFixed(CLUSTER_DECIMALS).replace(".", "-");
  return `klaster-${p(lat)}-${p(lng)}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const apply = process.argv.includes("--apply");
  const dryRun = process.argv.includes("--dry-run");
  console.log(
    apply
      ? "🔥 MODE APPLY — akan menulis ke database!"
      : `🔍 MODE DRY-RUN${dryRun ? "" : " (default)"} — tidak ada yang ditulis.`
  );
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL tidak ditemukan. Lihat header script ini.");
    process.exit(1);
  }
  console.log(`   Target: ${process.env.DATABASE_URL.replace(/\/\/[^@/]+@/, "//***@").split("?")[0]}\n`);

  // 1. Ambil semua laporan yatim yang memenuhi kriteria publik
  const orphans = await prisma.report.findMany({
    where: {
      springId: null,
      status: "approved",
      isActive: true,
      snappedLat: { not: null },
      snappedLng: { not: null },
    },
    select: { id: true, formSlug: true, fieldData: true, snappedLat: true, snappedLng: true },
  });
  console.log(`📋 ${orphans.length} laporan approved+aktif tanpa springId\n`);

  // 2. Kelompokkan per klaster (grid 3 desimal)
  const clusterMap = new Map<string, Cluster>();
  for (const r of orphans) {
    const lat = round3(r.snappedLat as number);
    const lng = round3(r.snappedLng as number);
    const key = `${lat},${lng}`;
    let c = clusterMap.get(key);
    if (!c) {
      c = { key, lat, lng, reports: [] };
      clusterMap.set(key, c);
    }
    c.reports.push({ id: r.id, formSlug: r.formSlug, fieldData: r.fieldData });
  }

  // 3. Ambil spring aktif/pending & semua MapPoint (sekali saja) untuk pengecekan radius
  const springsNear = await prisma.spring.findMany({
    where: { status: { in: ["active", "pending"] }, snappedLat: { not: null }, snappedLng: { not: null } },
    select: { id: true, snappedLat: true, snappedLng: true },
  });
  const mapPointsNear = await prisma.mapPoint.findMany({
    where: { snappedLat: { not: null }, snappedLng: { not: null } },
    select: { id: true, snappedLat: true, snappedLng: true },
  });

  let skippedSmall = 0;
  let skippedSpring = 0;
  let skippedMapPoint = 0;
  let plannedOrDone = 0;
  let totalLinked = 0;

  const clusters = [...clusterMap.values()].sort((a, b) => b.reports.length - a.reports.length);
  for (const c of clusters) {
    const reportIds = c.reports.map((r) => r.id);

    if (c.reports.length < MIN_CLUSTER_SIZE) {
      console.log(`⏭️  Klaster (${c.lat}, ${c.lng}) — ${c.reports.length} laporan < ${MIN_CLUSTER_SIZE}, di-skip`);
      skippedSmall++;
      continue;
    }

    const springNearby = withinRadius(springsNear, c.lat, c.lng);
    const mapPointNearby = withinRadius(mapPointsNear, c.lat, c.lng);
    if (springNearby || mapPointNearby) {
      console.log(
        `⏭️  Klaster (${c.lat}, ${c.lng}) — ${c.reports.length} laporan, di-skip (` +
          `${springNearby ? "spring di radius" : ""}${springNearby && mapPointNearby ? " + " : ""}${mapPointNearby ? "MapPoint di radius" : ""})`
      );
      if (springNearby) skippedSpring++;
      if (mapPointNearby) skippedMapPoint++;
      continue;
    }

    // Data agregat klaster (mode dari fieldData)
    const datas = c.reports.map((r) => parseFieldData(r.fieldData));
    const name =
      modeOf(datas.map((d) => pickString(d, NAME_KEYS))) ||
      `Mata Air Klaster (${c.lat}, ${c.lng})`;
    const province = modeOf(datas.map((d) => pickString(d, PROVINCE_KEYS)));
    const regency = modeOf(datas.map((d) => pickString(d, REGENCY_KEYS)));
    const formSlug = modeOf(c.reports.map((r) => r.formSlug)) || "spring-monitoring";
    const typeSlug = FORM_TO_TYPE[formSlug] ?? "spring";

    console.log(
      `📍 Klaster (${c.lat}, ${c.lng}) — ${c.reports.length} laporan (${formSlug})`
    );
    console.log(`   spring   : "${name}" (${province || "?"} / ${regency || "?"})`);
    console.log(`   mappoint : type=${typeSlug}, slug=${clusterSlug(c.lat, c.lng)}`);

    if (apply) {
      // Cari/verifikasi MapPointType — buat jika belum ada (idempotent)
      let type = await prisma.mapPointType.findUnique({ where: { slug: typeSlug } });
      if (!type) {
        type = await prisma.mapPointType.create({
          data: {
            slug: typeSlug,
            name: TYPE_NAMES[typeSlug] ?? typeSlug,
            description: "",
            icon: "MapPin",
          },
        });
        console.log(`   ✅ MapPointType "${typeSlug}" dibuat`);
      }

      // Satu transaksi per klaster: spring + tautkan laporan + mappoint
      await prisma.$transaction(async (tx) => {
        const spring = await tx.spring.create({
          data: {
            name,
            snappedLat: c.lat,
            snappedLng: c.lng,
            province,
            regency,
            village: "",
            subdistrict: "",
            status: "active",
          },
        });

        // MapPoint dibuat dulu (reuse id spring, sama seperti
        // migrations-20260701-map-system.sql) karena Report.mapPointId
        // punya FK ke MapPoint.
        let slug = clusterSlug(c.lat, c.lng);
        let i = 2;
        while (await tx.mapPoint.findUnique({ where: { slug } })) {
          slug = `${clusterSlug(c.lat, c.lng)}-${i++}`;
        }

        await tx.mapPoint.create({
          data: {
            id: spring.id,
            typeId: type!.id,
            name,
            slug,
            snappedLat: c.lat,
            snappedLng: c.lng,
            province,
            regency,
            village: "",
            subdistrict: "",
            description: "",
            isActive: true,
          },
        });

        await tx.report.updateMany({
          where: { id: { in: reportIds } },
          data: { springId: spring.id },
        });
        await tx.report.updateMany({
          where: { id: { in: reportIds }, mapPointId: null },
          data: { mapPointId: spring.id },
        });
      });
      totalLinked += reportIds.length;
      plannedOrDone++;
      console.log(`   ✅ Spring dibuat, ${reportIds.length} laporan ditautkan, MapPoint dibuat`);
    } else {
      plannedOrDone++;
      totalLinked += reportIds.length;
      console.log(`   🔜 (dry-run) akan buat spring + tautkan ${reportIds.length} laporan + MapPoint`);
    }
    console.log("");
  }

  // ─── Ringkasan ─────────────────────────────────────────────────────────────
  console.log("════════════════════════════════════════════");
  console.log("RINGKASAN");
  console.log(`  Klaster ditemukan        : ${clusters.length}`);
  console.log(`  Klaster < ${MIN_CLUSTER_SIZE} laporan      : ${skippedSmall}`);
  console.log(`  Klaster di-skip (spring) : ${skippedSpring}`);
  console.log(`  Klaster di-skip (MapPoint): ${skippedMapPoint}`);
  console.log(
    `  ${apply ? "DIPROSES (apply)" : "Direncanakan (dry-run)"}: ${plannedOrDone} klaster / ${totalLinked} laporan ditautkan`
  );
  console.log(apply ? "✅ Selesai — data tertulis." : "ℹ️  Tidak ada data yang ditulis. Jalankan dengan --apply untuk eksekusi.");
}

main()
  .catch((e) => {
    console.error("❌ Gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
