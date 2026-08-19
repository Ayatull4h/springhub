/**
 * SpringHub — Import Data Epicollect5 ke Staging
 * ==============================================
 * Mengimpor export Epicollect5 (format form-1 lama "pemantauan-mata-air" dan
 * baru "jaga-semesta-spring-tracker-4") ke database STAGING sebagai Report
 * form "spring-monitoring" + ReportPhoto + Spring (pending).
 *
 * Fitur:
 *   - Mapping field Epicollect5 → fieldId SpringHub (B1_nama, A1_tanggal, dst)
 *   - Download foto asli dari five.epicollect.net (publik, tanpa login)
 *   - Foto diproses ulang: resize 720p + watermark (konsisten dgn aplikasi)
 *   - Akun pemilik: epicollect@springhub.id (dibuat otomatis bila belum ada)
 *   - Idempotent: clientCorrelationId = ec5_uuid (import ulang tidak duplikat)
 *   - Spring dibuat status pending + di-dedupe (nama mirip dalam grid ±0.001)
 *
 * ⚠️ HANYA UNTUK DATABASE STAGING. Jangan dijalankan ke produksi.
 *
 * Cara menjalankan (dari VPS):
 *   # Dry-run (default, tidak menulis apa pun):
 *   DATABASE_URL="postgresql://springhub:PASS@127.0.0.1:5433/springhub_staging" \
 *     UPLOAD_DIR="/var/lib/docker/volumes/staging_uploads_staging_data/_data" \
 *     npx tsx scripts/import-epicollect.ts
 *
 *   # Apply (menulis ke staging):
 *   ... npx tsx scripts/import-epicollect.ts --apply
 *
 *   # Argumen opsional: --file1 <path> --file2 <path> (default /tmp/file1.json, /tmp/file2.json)
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

// ─── Konfigurasi ─────────────────────────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/data/uploads";
const UPLOAD_PREFIX = process.env.UPLOAD_URL_PREFIX || "/uploads";
const IMPORT_EMAIL = "epicollect@springhub.id";
const IMPORT_USERNAME = "epicollect-import";
const IMPORT_PASSWORD = "epicollect12345";
const EPIC_BASE = "https://five.epicollect.net/api/media/jaga-semesta-spring-tracker";
const EPIC_QUERY = "?type=photo&format=entry_original&name=";

const FILE1 = process.argv.find((a) => a.startsWith("--file1"))?.split("=")[1] || "/tmp/file1.json";
const FILE2 = process.argv.find((a) => a.startsWith("--file2"))?.split("=")[1] || "/tmp/file2.json";

// ─── Setup koneksi ───────────────────────────────────────────────────────────
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Mapping nilai ───────────────────────────────────────────────────────────
const MAP_ALIRAN: Record<string, string> = {
  "Tetap": "Stabil Sepanjang Tahun",
  "Berkurang": "Berkurang saat Kemarau",
  "Bertambah": "Stabil Sepanjang Tahun",
  "Tidak tahu": "Tidak Tahu",
  "Mata air hilang/mati/kering": "Kering Total",
  "Mata air Mengalir deras": "Stabil Sepanjang Tahun",
  "mata air tidak mengalir/mati": "Kering Total",
  "Mata air mengalir kecil sekali": "Berkurang saat Kemarau",
};

const MAP_JANGKA: Record<string, string> = {
  "Jumlah air berkurang saat musim tertentu": "Berkurang",
  "debit/aliran air fluktuatif (kadang banyak, kadang sedikit)": "Naik Turun",
  "Debit/Aliran air tetap sepanjang tahun": "Sama",
  "Tidak tahu": "Tidak Tahu",
  "Mata air mati, jadi saat ini kering sepanjang tahun": "Berkurang",
};

const MAP_JENIS: Record<string, string> = {
  "air keluar dari tanah/lereng/tebing": "Lereng/Tebing",
  "Air keluar dari celah batu": "Celah Batu",
  "air memancar/menyembur (umbul/mudal)": "Memancar",
  "air menggenang di cekungan": "Genangan",
  "Tidak yakin mata air ini kategori yang mana": "Tidak Yakin",
};

const MAP_TUTUPAN: Record<string, string> = {
  "Bangunan": "Area Terbangun",
  "pepohonan (baik hutan maupun pekarangan)": "Pepohonan",
  "Lahan basah (mangrove, rawa, sawah)": "Vegetasi Tergenang",
};

const MAP_LAHAN: Record<string, string> = {
  "Lahan Pemukiman": "Pemukiman",
  "Lahan terbuka hijau (kawasan lindung atau konservasi)": "Lahan Hijau",
  "Lahan Pertanian (sawah dan perkebunan)": "Pertanian",
  "Lahan Industri": "Industri",
  "Semak belukar": "Semak Belukar",
  "Badan air (sungai, danau) dan Bantaran sungai": "Air",
  "Lahan kosong (tidak ada vegetasi)": "Lahan Kosong",
  "Lahan Pertambangan": "Tambang",
};

const MAP_PEMANFAATAN: Record<string, string> = {
  "Mandi, Renang dan cuci baju": "Mandi Cuci",
  "Irigasi pertanian": "Irigasi",
  "Tidak dimanfaatkan/dibiarkan": "Tidak Dimanfaatkan",
  "Air minum desa di lokasi mata air (warga sekitar)": "Air Minum Warga",
  "Kolam ikan": "Kolam Ikan",
  "Air minum warga desa lain atau kota lain": "Air Minum Desa Lain",
  "Wisata": "Wisata",
  "Mata air mari/kering jadi tidak dimanfaatkan lagi": "Tidak Dimanfaatkan",
  "Tidak Tahu": "Tidak Tahu",
  "Cadangan sumber air saat kemarau": "Cadangan Kemarau",
};

const MAP_KK: Record<string, string> = {
  "100 - 1000 KK (1 dusun - 1 Desa)": "100-1000 KK",
  "tidak tahu": "Tidak Tahu",
  "50 - 100 KK (1 RW)": "50-100 KK",
  "﹥1000 KK (lebih dari 1 desa)": ">1000 KK",
  "Mata air mati jadi tidak bisa dimanfaatkan": "Tidak Tahu",
  "﹤10 KK": "<10 KK",
  "10 – 50 KK (1 RT)": "10-50 KK",
};

const MAP_ANCAMAN: Record<string, string> = {
  "Aktivitas orang mandi, cuci baju/karpet/motor di titik mata air keluar": "Mandi di Sumber",
  "Ada Toilet, jamban, atau septic tank dalam jarak kurang dari 11 meter": "Toilet <11m",
  "Debit/aliran mata air berkurang hingga mati": "Over-ekstraksi",
  "Adanya pengeboran sumur tanah dalam di desa yang sama dengan Lokasi mata air": "Sumur Dalam",
  "Bangunan beton/semen/bangunan permanen menggangu sumber air": "Bangunan Beton",
  "Ada aktivitas atau sawah dengan penyemprotan pestisida/pupuk kimia": "Pestisida",
  "Sampah plastik, popok, atau sampah rumah tangga di sekitar sumber": "Sampah Plastik",
  "Kandang ternak atau kotoran hewan terbuka": "Kandang Ternak",
  "Pengambilan air berlebih (pipanisasi besar atau komersial)": "Over-ekstraksi",
  "Aktivitas pertambangan": "Tambang",
  "ada sampah plastik sedikit": "Sampah Plastik",
};

const MAP_SUMBER: Record<string, string> = {
  "Observasi sendiri (sering mengunjungi atau karena lokasi tinggal sekitar mata air)": "Observasi Sendiri",
  "Warga Sekitar": "Warga Sekitar",
  "Kelompok masyarakat (PKK, Karang taruna, TAGANA)": "Kelompok Masyarakat",
  "Orang tua/tetua desa tersebut": "Orang Tua/Desa",
  "Aparat desa (kades, kaur atau ketua RT/RW)": "Aparat Desa",
};

const MAP_AKSI: Record<string, string> = {
  "Pembersihan mata air dari sedimen/endapan lumpur dan sampah": "Pembersihan Sedimen",
  "Penanaman pohon atau pembuatan rorak di sekitar mata air dan area tangkapan/resapan air hujan": "Penanaman Pohon",
  "Rekomendasi perlindungan mata air melalui regulasi semacam perdes dam lainnya": "Perlindungan Regulasi",
  "Pelaporan ke desa atau dinas mengenai kondisi mata air": "Lapor Desa/Dinas",
  "Lainnya": "Lainnya",
};

// ─── Helper ──────────────────────────────────────────────────────────────────
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** "29/07/2026" → "2026-07-29" */
function normalizeDate(d: string): string {
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return d;
}

/** 6281578051957 → "+6281578051957"; 81809441276 → "+6281809441276" */
function normalizePhone(v: unknown): string {
  const s = str(v).replace(/\D/g, "");
  if (!s) return "";
  if (s.startsWith("62")) return `+${s}`;
  if (s.startsWith("0")) return `+62${s.slice(1)}`;
  if (s.startsWith("8")) return `+628${s}`;
  return s;
}

function mapVal(value: unknown, map: Record<string, string>): string {
  const key = str(value);
  if (!key) return "";
  if (map[key]) return map[key];
  const found = Object.keys(map).find((k) => key.toLowerCase().includes(k.toLowerCase()));
  return found ? map[found] : key;
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadPhoto(url: string, retries = 3): Promise<Buffer | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) throw new Error("Terlalu kecil (kemungkinan error page)");
      return buf;
    } catch (err) {
      if (i === retries - 1) {
        console.warn(`  ⚠️ Gagal download foto (${url.slice(-40)}): ${(err as Error).message}`);
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

/** Buat ReportPhoto records (3 slot: B2/B3/B4), min 3 foto jika tersedia */
function photoFieldIds(count: number): string[] {
  return ["B2_foto_1", "B3_foto_2", "B4_foto_3"].slice(0, Math.max(count, 1));
}

// ─── Mapping record → fieldData ──────────────────────────────────────────────
type EpicRecord = Record<string, unknown>;

function mapFile1(r: EpicRecord) {
  const lokasi = (r["10_Lokasi_mata_air_l"] as { latitude?: number; longitude?: number }) || {};
  const kebersihan = str(r["8_Kondisi_kebersihan"]?.[0]);
  const ancaman = kebersihan && /sampah/.test(kebersihan.toLowerCase()) ? ["Sampah Plastik"] : [];
  const creatorEmail = str(r.created_by);
  const creatorName = creatorEmail && creatorEmail !== "n/a" ? creatorEmail.split("@")[0] : "Volunteer Epicollect";
  return {
    A1_tanggal: normalizeDate(str(r["5_Tanggal_pemantauan"])),
    A2_nama_surveyor: creatorName,
    A3_wa: "",
    A4_geotag_lat: lokasi.latitude?.toString() ?? "",
    A4_geotag_lng: lokasi.longitude?.toString() ?? "",
    A5_cek_duplikat: "Baru",
    B1_nama: str(r["1_Nama_mata_air"]),
    B5_jenis: "",
    B6_aliran: mapVal(r["6_Kondisi_debitalira"]?.[0], MAP_ALIRAN),
    C1_warna: mapVal(r["7_Kondisi_kualitas_m"]?.[0], {
      "Air jernih": "Bening",
      "Air agak keruh": "Agak Keruh",
    }),
    C2_lahan: "",
    C3_tutupan: "",
    C4_pemanfaatan: [],
    C5_jumlah_kk: "",
    C6_ancaman: ancaman.length ? "Ya" : "Tidak Ada",
    C7_jenis_ancaman: ancaman,
    C8_sumber_info: "",
    D1_ph: "",
    D2_suhu: "",
    D3_tds: "",
    D4_ec: "",
    D5_debit_liter: "",
    E1_cerita: str(r["11_Beri_catatan_peng"]),
    E2_tindak_lanjut: "Belum Tahu",
    E3_aksi: [],
    village: str(r["2_Desa_lokasi_mata_a"]),
    subdistrict: str(r["3_Kecamatan_lokasi_m"]),
    regency: str(r["4_Kotakabupaten_loka"]),
  };
}

function mapFile2(r: EpicRecord) {
  const koordinat = (r["3_Masukkan_koordinat"] as { latitude?: number; longitude?: number }) || {};
  const ancamanRaw = Array.isArray(r["14_Apakah_Anda_melih"])
    ? (r["14_Apakah_Anda_melih"] as string[]).filter((x) => !/Tidak terlihat ancaman/.test(x))
    : [];
  const ancaman = ancamanRaw.map((x) => mapVal(x, MAP_ANCAMAN)).filter(Boolean);
  const pemanfaatan = (Array.isArray(r["12_Apa_pemanfaatan_u"])
    ? (r["12_Apa_pemanfaatan_u"] as string[]).map((x) => mapVal(x, MAP_PEMANFAATAN))
    : []).filter(Boolean);
  const aksi = (Array.isArray(r["27_Hal_yang_bisa_dil"])
    ? (r["27_Hal_yang_bisa_dil"] as string[]).map((x) => mapVal(x, MAP_AKSI))
    : []).filter(Boolean);
  return {
    A1_tanggal: normalizeDate(str(r["1_Waktu_perekaman_da"])),
    A2_nama_surveyor: str(r["4_Masukkan_nama_anda"]),
    A3_wa: normalizePhone(r["5_Masukkan_nomor_HPW"]),
    A4_geotag_lat: koordinat.latitude?.toString() ?? "",
    A4_geotag_lng: koordinat.longitude?.toString() ?? "",
    A5_cek_duplikat: "Baru",
    B1_nama: str(r["2_Nama_lokal_mata_ai"]),
    B5_jenis: mapVal(r["9_Jenistipe_Mata_Air"], MAP_JENIS),
    B6_aliran: mapVal(r["7_Bagaimana_kondisi_"], MAP_ALIRAN),
    B7_debit_5th: mapVal(r["8_Dalam_jangka_waktu"], MAP_JANGKA),
    C1_warna: mapVal(r["6_Warna_air"], { Bening: "Bening", "Agak keruh": "Agak Keruh", Kekuningan: "Kekuningan" }),
    C2_lahan: mapVal(r["11_Apa_jenis_penggun"], MAP_LAHAN),
    C3_tutupan: mapVal(r["10_Apa_jenis_Tutupan"], MAP_TUTUPAN),
    C4_pemanfaatan: pemanfaatan,
    C5_jumlah_kk: mapVal(r["13_Berapa_jumlah_kep"], MAP_KK),
    C6_ancaman: ancaman.length ? "Ya" : "Tidak Ada",
    C7_jenis_ancaman: ancaman,
    C8_sumber_info: mapVal(r["18_Dari_mana_anda_me"], MAP_SUMBER),
    D1_ph: str(r["21_Salinitas_atau_pH"]),
    D2_suhu: str(r["22_Suhu_Air_Contoh_C"]),
    D3_tds: str(r["23_TDS_air__contoh_p"]),
    D4_ec: str(r["24_EC_atau_DHL_Air_c"]),
    D5_debit_liter: str(r["25_Debit_air__contoh"]).replace(/^-$/, ""),
    E1_cerita: str(r["19_Info_tambahan_Apa"]),
    E2_tindak_lanjut: str(r["20_Apakah_kamu_memba"]) === "Ya" ? "Ya" : "Belum Tahu",
    E3_aksi: aksi,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const apply = process.argv.includes("--apply");
  console.log(apply ? "🔥 MODE APPLY — menulis ke database!" : "🔍 MODE DRY-RUN — tidak ada yang ditulis.");
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL tidak ditemukan. Lihat header script ini.");
    process.exit(1);
  }
  console.log(`   Target: ${process.env.DATABASE_URL.replace(/\/\/[^@/]+@/, "//***@").split("?")[0]}`);
  console.log(`   Upload dir: ${UPLOAD_DIR}\n`);

  const file1Raw = await fs.readFile(FILE1, "utf8").catch((e) => { console.error(`❌ Tidak bisa baca ${FILE1}: ${e.message}`); process.exit(1); });
  const file2Raw = await fs.readFile(FILE2, "utf8").catch((e) => { console.error(`❌ Tidak bisa baca ${FILE2}: ${e.message}`); process.exit(1); });
  const data1 = JSON.parse(file1Raw).data as EpicRecord[];
  const data2 = JSON.parse(file2Raw).data as EpicRecord[];
  console.log(`📄 File 1 (pemantauan): ${data1.length} record`);
  console.log(`📄 File 2 (spring-tracker-4): ${data2.length} record`);

  // Hitung foto unik
  const photoUrls = new Set<string>();
  for (const r of data1) photoUrls.add(`${EPIC_BASE}${EPIC_QUERY}${encodeURIComponent(str(r["9_Foto_mata_air_saat"]))}`);
  for (const r of data2) {
    for (const k of ["15_Ambil_foto_sudut_", "16_Ambil_foto_sudut_", "17_Ambil_foto_sudut_"]) {
      const v = str(r[k]);
      if (v.startsWith("http")) photoUrls.add(v);
    }
  }
  console.log(`📷 Total foto unik yang akan didownload: ${photoUrls.size}\n`);

  // Buat/cek akun importer
  let importer: { id: string } | null = null;
  if (apply) {
    importer = await prisma.profile.findUnique({ where: { email: IMPORT_EMAIL }, select: { id: true } });
    if (!importer) {
      const passwordHash = await bcrypt.hash(IMPORT_PASSWORD, 12);
      importer = await prisma.profile.create({
        data: {
          email: IMPORT_EMAIL,
          passwordHash,
          username: IMPORT_USERNAME,
          role: "volunteer",
          region: "Data Epicollect5",
          trustScore: 60,
        },
        select: { id: true },
      });
      console.log(`👤 Akun ${IMPORT_EMAIL} dibuat (password: ${IMPORT_PASSWORD})`);
    }
  }

  // Proses semua record
  const all = [
    ...data1.map((r) => ({ rec: r, data: mapFile1(r), photos: [str(r["9_Foto_mata_air_saat"])] })),
    ...data2.map((r) => ({
      rec: r,
      data: mapFile2(r),
      photos: ["15_Ambil_foto_sudut_", "16_Ambil_foto_sudut_", "17_Ambil_foto_sudut_"]
        .map((k) => str(r[k])).filter((v) => v.startsWith("http")),
    })),
  ];
  console.log(`📦 Total record yang akan diproses: ${all.length}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;
  let photosSaved = 0;
  let photosFailed = 0;

  for (let i = 0; i < all.length; i++) {
    const { rec, data, photos } = all[i];
    const corrId = str(rec.ec5_uuid).slice(0, 100);
    const label = `${i + 1}/${all.length} "${data.B1_nama || "?"}" (${str(rec.ec5_uuid).slice(0, 8)})`;

    if (!corrId) { console.warn(`⚠️ ${label} — tanpa ec5_uuid, skip`); skipped++; continue; }

    if (apply) {
      const existing = await prisma.report.findFirst({ where: { clientCorrelationId: corrId }, select: { id: true } });
      if (existing) { console.log(`⏭️  ${label} — sudah ada, skip`); skipped++; continue; }
    }

    const preciseLat = parseFloat(str(data.A4_geotag_lat));
    const preciseLng = parseFloat(str(data.A4_geotag_lng));
    if (isNaN(preciseLat) || isNaN(preciseLng)) {
      console.warn(`⚠️ ${label} — tanpa koordinat valid, skip`);
      skipped++;
      continue;
    }
    // Snap ke grid perlindungan 5km (sama dengan form spring-monitoring)
    const snapped = snap(preciseLat, preciseLng);

    if (apply) {
      // Download + proses foto (max 3)
      const savedPhotos: Array<{ fieldId: string; storagePath: string; mimeType: string; width: number; height: number }> = [];
      const photoIds = photoFieldIds(photos.length);
      for (let p = 0; p < photos.length && p < 3; p++) {
        const url = photos[p].startsWith("http") ? photos[p] : `${EPIC_BASE}${EPIC_QUERY}${encodeURIComponent(photos[p])}`;
        const buf = await downloadPhoto(url);
        if (!buf) { photosFailed++; continue; }
        const saved = await processAndSavePhoto(buf);
        if (!saved) { photosFailed++; continue; }
        savedPhotos.push({
          fieldId: photoIds[p] ?? "B2_foto_1",
          storagePath: saved.storagePath,
          mimeType: "image/jpeg",
          width: saved.width,
          height: saved.height,
        });
        photosSaved++;
        await wait(120); // throttle, hindari rate-limit Epicollect5
      }

      const report = await prisma.report.create({
        data: {
          userId: importer!.id,
          formSlug: "spring-monitoring",
          status: "pending",
          isActive: true,
          fieldData: JSON.stringify(data),
          preciseLat,
          preciseLng,
          snappedLat: snapped.lat,
          snappedLng: snapped.lng,
          clientCorrelationId: corrId,
          createdAt: rec.created_at ? new Date(rec.created_at as string) : undefined,
        },
      });

      if (savedPhotos.length) {
        await prisma.reportPhoto.createMany({
          data: savedPhotos.map((ph) => ({ ...ph, reportId: report.id })),
        });
      }

      // Buat/link Spring (pending) — dedupe: nama mirip dalam grid ±0.001
      const springName = data.B1_nama;
      if (springName && snapped.lat !== null) {
        const existingSpring = await prisma.spring.findFirst({
          where: {
            status: { in: ["pending", "active"] },
            snappedLat: { gte: snapped.lat - 0.001, lte: snapped.lat + 0.001 },
            snappedLng: { gte: snapped.lng - 0.001, lte: snapped.lng + 0.001 },
            name: { contains: springName, mode: "insensitive" },
          },
          select: { id: true },
        });
        if (existingSpring) {
          await prisma.report.update({ where: { id: report.id }, data: { springId: existingSpring.id } });
        } else {
          const newSpring = await prisma.spring.create({
            data: {
              name: springName,
              snappedLat: snapped.lat,
              snappedLng: snapped.lng,
              province: str(data.province),
              regency: str(data.regency),
              village: str(data.village),
              subdistrict: str(data.subdistrict),
              status: "pending",
            },
            select: { id: true },
          });
          await prisma.report.update({ where: { id: report.id }, data: { springId: newSpring.id } });
        }
      }

      created++;
      console.log(`✅ ${label} — report + ${savedPhotos.length} foto` + (created % 25 === 0 ? ` (${created} total)` : ""));
    } else {
      // Dry-run: cukup hitung foto unik yang perlu di-download
      created++;
    }
  }

  console.log("\n═══════════ RINGKASAN ═══════════");
  console.log(`Report dibuat: ${created}`);
  console.log(`Skip (duplikat/tanpa uuid): ${skipped}`);
  console.log(`Gagal: ${failed}`);
  if (apply) {
    console.log(`Foto tersimpan: ${photosSaved}`);
    console.log(`Foto gagal: ${photosFailed}`);
    console.log(`Total unik foto di Epicollect5: ${photoUrls.size}`);
  }
  console.log("═════════════════════════════════");
  await pool.end();
}

/** Snap ke grid perlindungan (5km) — sama dengan lib/geo.ts */
function snap(lat: number, lng: number) {
  const DEG = 0.045;
  return {
    lat: Math.round(lat / DEG) * DEG,
    lng: Math.round(lng / DEG) * DEG,
  };
}

main().catch((e) => {
  console.error("❌ Gagal:", e);
  process.exit(1);
});
