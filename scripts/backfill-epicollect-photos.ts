/**
 * SpringHub — Backfill Foto Epicollect5 (Staging)
 * ===============================================
 * Mengisi foto yang hilang untuk report yang sudah ada (clientCorrelationId = ec5_uuid).
 * Epicollect sudah 199/199 approved + 551 foto lengkap di staging (23×1 + 176×3).
 * Script ini idempotent: hanya download yang kurang, skip yang sudah lengkap.
 *
 * ⚠️ HANYA UNTUK DATABASE STAGING. Ada guard: menolak jika DATABASE_URL bukan staging.
 *
 * Cara menjalankan (dari VPS):
 *   # Dry-run (default):
 *   DATABASE_URL="postgresql://springhub:PASS@127.0.0.1:5433/springhub_staging" \
 *     UPLOAD_DIR="/var/lib/docker/volumes/staging_uploads_staging_data/_data" \
 *     npx tsx scripts/backfill-epicollect-photos.ts
 *
 *   # Apply:
 *   ... npx tsx scripts/backfill-epicollect-photos.ts --apply
 *
 * Default file: public/form-1__pemantauan-mata-air-jaga-semesta.json (23 rec) &
 *               public/form-1__jaga-semesta-spring-tracker-4.json (176 rec)
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// ─── Guard staging ────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes("staging")) {
  console.error("❌ Guard: DATABASE_URL harus mengandung 'staging'. Ditolak untuk mencegah mutasi produksi.");
  console.error(`   DATABASE_URL saat ini: ${(process.env.DATABASE_URL || "").replace(/\/\/[^@/]+@/, "//***@").split("?")[0]}`);
  process.exit(1);
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/data/uploads";
const EPIC_BASE = "https://five.epicollect.net/api/media/jaga-semesta-spring-tracker";
const EPIC_QUERY = "?type=photo&format=entry_original&name=";
const ALLOWED_HOST = "five.epicollect.net";
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

const FILE1 = process.argv.find((a) => a.startsWith("--file1"))?.split("=")[1] || "public/form-1__pemantauan-mata-air-jaga-semesta.json";
const FILE2 = process.argv.find((a) => a.startsWith("--file2"))?.split("=")[1] || "public/form-1__jaga-semesta-spring-tracker-4.json";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function downloadPhoto(url: string, retries = 3): Promise<Buffer | null> {
  let u: URL;
  try { u = new URL(url); } catch { console.warn(`  ⚠️ URL tidak valid: ${url}`); return null; }
  if (u.hostname !== ALLOWED_HOST) {
    console.warn(`  ⚠️ Host tidak di-allowlist: ${u.hostname} (hanya ${ALLOWED_HOST})`);
    return null;
  }
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const len = res.headers.get("content-length");
      if (len && parseInt(len, 10) > MAX_PHOTO_BYTES) throw new Error(`Terlalu besar: ${len} bytes`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_PHOTO_BYTES) throw new Error(`Terlalu besar setelah download: ${buf.length}`);
      if (buf.length < 1000) throw new Error("Terlalu kecil (kemungkinan error page)");
      return buf;
    } catch (err) {
      if (i === retries - 1) {
        console.warn(`  ⚠️ Gagal download (${url.slice(-50)}): ${(err as Error).message}`);
        return null;
      }
      await wait(800 * (i + 1));
    }
  }
  return null;
}

async function processAndSavePhoto(buffer: Buffer, folder = "reports"): Promise<{ storagePath: string; width: number; height: number } | null> {
  try {
    const compressed = await sharp(buffer)
      .resize(1280, 720, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .withMetadata({ exif: undefined })
      .toBuffer();
    const metadata = await sharp(compressed).metadata();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const storagePath = `${folder}/${filename}`;
    const fullDir = path.join(UPLOAD_DIR, folder);
    const fullPath = path.join(UPLOAD_DIR, storagePath);
    await fs.mkdir(fullDir, { recursive: true });
    await fs.writeFile(fullPath, compressed);
    return { storagePath, width: metadata.width ?? 0, height: metadata.height ?? 0 };
  } catch (err) {
    console.warn(`  ⚠️ Gagal proses foto: ${(err as Error).message}`);
    return null;
  }
}

function photoFieldIds(count: number): string[] {
  return ["B2_foto_1", "B3_foto_2", "B4_foto_3"].slice(0, Math.max(count, 1));
}

type EpicRecord = Record<string, unknown>;

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(apply ? "🔥 MODE APPLY — menulis ke database staging!" : "🔍 MODE DRY-RUN — tidak ada yang ditulis.");
  console.log(`   Target: ${process.env.DATABASE_URL!.replace(/\/\/[^@/]+@/, "//***@").split("?")[0]}`);
  console.log(`   Upload dir: ${UPLOAD_DIR}\n`);

  const file1Raw = await fs.readFile(FILE1, "utf8");
  const file2Raw = await fs.readFile(FILE2, "utf8");
  const data1 = (JSON.parse(file1Raw).data || JSON.parse(file1Raw)) as EpicRecord[];
  const data2 = (JSON.parse(file2Raw).data || JSON.parse(file2Raw)) as EpicRecord[];
  console.log(`📄 File 1 (pemantauan): ${data1.length} record`);
  console.log(`📄 File 2 (spring-tracker-4): ${data2.length} record`);

  const epicByUuid = new Map<string, { rec: EpicRecord; photos: string[] }>();
  for (const r of data1) {
    const uuid = str(r.ec5_uuid);
    if (!uuid) continue;
    const p = str(r["9_Foto_mata_air_saat"]);
    epicByUuid.set(uuid, { rec: r, photos: p ? [p] : [] });
  }
  for (const r of data2) {
    const uuid = str(r.ec5_uuid);
    if (!uuid) continue;
    const photos = ["15_Ambil_foto_sudut_", "16_Ambil_foto_sudut_", "17_Ambil_foto_sudut_"]
      .map((k) => str(r[k])).filter((v) => v.startsWith("http"));
    epicByUuid.set(uuid, { rec: r, photos });
  }
  console.log(`📷 Total unik foto di file: ${[...epicByUuid.values()].reduce((n, v) => n + v.photos.length, 0)} (${epicByUuid.size} uuid)\n`);

  // Ambil semua report dengan corr
  const reports = await prisma.report.findMany({
    where: { clientCorrelationId: { not: null } },
    select: { id: true, clientCorrelationId: true, formSlug: true, status: true, _count: { select: { photos: true } } },
  });
  console.log(`📋 Report dengan clientCorrelationId di DB: ${reports.length}`);
  let needBackfill = 0;
  let alreadyComplete = 0;
  let notInFile = 0;
  const todo: Array<{ reportId: string; corr: string; have: number; need: number; photos: string[] }> = [];

  for (const r of reports) {
    const corr = r.clientCorrelationId!;
    const entry = epicByUuid.get(corr);
    if (!entry) { notInFile++; continue; }
    const have = r._count.photos;
    const expected = entry.photos.length;
    if (have >= expected) { alreadyComplete++; continue; }
    if (have < expected) {
      needBackfill++;
      const missingPhotos = entry.photos.slice(have);
      todo.push({ reportId: r.id, corr, have, need: expected - have, photos: missingPhotos });
    }
  }

  console.log(`   Sudah lengkap: ${alreadyComplete}`);
  console.log(`   Perlu backfill: ${needBackfill}`);
  console.log(`   Tidak ada di file: ${notInFile}\n`);

  if (todo.length === 0) {
    console.log("✅ Tidak ada yang perlu di-backfill. Semua foto epicollect sudah lengkap (551/551).");
    await pool.end();
    return;
  }

  console.log(`📦 ${todo.length} report perlu backfill:`);
  for (const t of todo.slice(0, 10)) {
    console.log(` - ${t.corr.slice(0, 8)} have:${t.have} need:${t.need} photos:${t.photos.length}`);
  }
  if (todo.length > 10) console.log(`   ... dan ${todo.length - 10} lagi`);
  console.log("");

  if (!apply) {
    console.log("ℹ️ Dry-run selesai. Jalankan dengan --apply untuk eksekusi.");
    await pool.end();
    return;
  }

  let photosSaved = 0;
  let photosFailed = 0;
  for (const t of todo) {
    console.log(`\n🔧 Report ${t.corr.slice(0, 8)} (${t.reportId.slice(0, 8)}) have:${t.have} need:${t.need}`);
    const existingCount = t.have;
    const photoIds = photoFieldIds(existingCount + t.need);
    for (let i = 0; i < t.photos.length; i++) {
      const url = t.photos[i].startsWith("http") ? t.photos[i] : `${EPIC_BASE}${EPIC_QUERY}${encodeURIComponent(t.photos[i])}`;
      const buf = await downloadPhoto(url);
      if (!buf) { photosFailed++; continue; }
      const saved = await processAndSavePhoto(buf);
      if (!saved) { photosFailed++; continue; }
      const fieldId = photoIds[existingCount + i] ?? `B2_foto_${existingCount + i + 1}`;
      await prisma.reportPhoto.create({
        data: {
          reportId: t.reportId,
          fieldId,
          storagePath: saved.storagePath,
          mimeType: "image/jpeg",
          width: saved.width,
          height: saved.height,
        },
      });
      photosSaved++;
      console.log(`  ✅ Foto ${i + 1}/${t.photos.length} disimpan: ${saved.storagePath}`);
      await wait(150);
    }
  }

  console.log("\n═══════════ RINGKASAN BACKFILL ═══════════");
  console.log(`Report perlu backfill: ${todo.length}`);
  console.log(`Foto tersimpan: ${photosSaved}`);
  console.log(`Foto gagal: ${photosFailed}`);
  console.log("═══════════════════════════════════════════");
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Gagal:", e);
  process.exit(1);
});
