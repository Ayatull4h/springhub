import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Seed data DUMMY — data demo agar website terlihat hidup.
 * Semua data ditandai isDummy=true sehingga admin bisa membedakan.
 * Data report menggunakan fieldData JSON yang sesuai dengan form masing-masing.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────
function randomCoord(base: number, range: number): number {
  return Math.round((base + (Math.random() - 0.5) * range) * 10000) / 10000;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d;
}

// ─── Springs ────────────────────────────────────────────────────────────────
const SPRINGS = [
  { name: "Mata Air Sumber Jalatunda", province: "Jawa Tengah", regency: "Banjarnegara", village: "Pekasiran", subdistrict: "Batur", lat: -7.2032, lng: 109.8701 },
  { name: "Mata Air Tuk Bening", province: "DI Yogyakarta", regency: "Gunung Kidul", village: "Plembutan", subdistrict: "Playen", lat: -7.9528, lng: 110.5367 },
  { name: "Mata Air Sendang Biru", province: "Jawa Timur", regency: "Malang", village: "Sumbermanjing", subdistrict: "Sumbermanjing Wetan", lat: -8.3050, lng: 112.6845 },
  { name: "Mata Air Cipamingkis", province: "Jawa Barat", regency: "Bogor", village: "Sukamakmur", subdistrict: "Sukamakmur", lat: -6.6078, lng: 107.0032 },
  { name: "Mata Air Sumber Maron", province: "Jawa Tengah", regency: "Klaten", village: "Kemalang", subdistrict: "Kemalang", lat: -7.6321, lng: 110.5678 },
  { name: "Mata Air Umbul Ponggok", province: "Jawa Tengah", regency: "Klaten", village: "Ponggok", subdistrict: "Polanharjo", lat: -7.6150, lng: 110.6740 },
  { name: "Mata Air Sumberawan", province: "Jawa Timur", regency: "Malang", village: "Toyomarto", subdistrict: "Singosari", lat: -7.8701, lng: 112.6543 },
  { name: "Mata Air Curug Cimahi", province: "Jawa Barat", regency: "Bandung Barat", village: "Cimahi", subdistrict: "Cimahi Selatan", lat: -6.8821, lng: 107.5423 },
  { name: "Mata Air Sumber Gempong", province: "Jawa Timur", regency: "Pasuruan", village: "Wonorejo", subdistrict: "Lumbang", lat: -7.8213, lng: 112.9876 },
  { name: "Mata Air Tuk Sanga", province: "DI Yogyakarta", regency: "Bantul", village: "Sriharjo", subdistrict: "Imogiri", lat: -7.9210, lng: 110.3892 },
];

// ─── Form field data templates ──────────────────────────────────────────────
function monitoringData(name: string, province: string, regency: string) {
  return JSON.stringify({
    spring_name: name,
    province,
    regency,
    village: pick(["Sumberjo", "Wonorejo", "Sukamaju", "Mulyosari", "Argomulyo"]),
    spring_type: pick(["Gravitasi", "Artesis", "Celah", "Depresi"]),
    water_flow: pick(["Lancar", "Sedang", "Menurun", "Kering"]),
    water_quality: pick(["Jernih", "Keruh", "Bening", "Berbau"]),
    water_color: pick(["Bening", "Kekuningan", "Kecoklatan"]),
    water_temperature: pick(["Dingin", "Sejuk", "Normal", "Hangat"]),
    vegetation_condition: pick(["Rimbun", "Sedang", "Gundul"]),
    notes: pick([
      "Kondisi air masih baik, vegetasi sekitar rimbun.",
      "Debit mulai menurun, perlu penanaman di hulu.",
      "Vegetasi masih bagus, ada beberapa sampah plastik.",
      "Air jernih, banyak ikan kecil. Warga rutin bersih-bersih.",
      "Terdapat kerusakan ringan di bibir mata air akibat erosi.",
    ]),
  });
}

function restorationData(name: string, province: string, regency: string) {
  return JSON.stringify({
    spring_name: name,
    province,
    regency,
    village: pick(["Sumberjo", "Wonorejo", "Sukamaju", "Mulyosari", "Argomulyo"]),
    restoration_type: pick(["Pembersihan", "Penataan", "Penguatan tebing", "Pembuatan sumur resapan"]),
    people_involved: String(Math.floor(Math.random() * 30) + 10),
    volume_work: String(Math.floor(Math.random() * 5) + 1),
    unit: pick(["m³", "meter", "kg", "karung"]),
    notes: pick([
      "Pembersihan sedimentasi dan sampah di sekitar mata air.",
      "Penataan batu dan pembuatan saluran drainase.",
      "Pembuatan sumur resapan di hulu mata air.",
      "Penguatan tebing dengan bronjong dan tanaman vetiver.",
      "Pembersihan sumber mata air dari enceng gondok dan sampah.",
    ]),
  });
}

function trenchData(name: string, province: string, regency: string) {
  return JSON.stringify({
    province,
    regency,
    village: pick(["Sumberjo", "Wonorejo", "Sukamaju", "Mulyosari", "Argomulyo"]),
    trench_length: String(Math.floor(Math.random() * 50) + 10),
    trench_width: String(Math.floor(Math.random() * 3) + 1),
    trench_depth: String(Math.floor(Math.random() * 2) + 1),
    trench_location: pick(["Hulu", "Tengah", "Hilir", "Samping jalan"]),
    notes: pick([
      "Rorak baru digali untuk menampung air hujan.",
      "Perbaikan rorak yang rusak akibat longsor.",
      "Pembuatan rorak baru di area resapan.",
      "Pembersihan rorak dari sedimentasi.",
    ]),
  });
}

function plantingData(name: string, province: string, regency: string) {
  return JSON.stringify({
    spring_name: name,
    province,
    regency,
    village: pick(["Sumberjo", "Wonorejo", "Sukamaju", "Mulyosari", "Argomulyo"]),
    tree_count: String(Math.floor(Math.random() * 100) + 20),
    tree_species: pick(["Beringin", "Kaliandra", "Sengon", "Bambu", "Jati", "Mahoni", "Pulai", "Gmelina"]),
    planting_area: String(Math.floor(Math.random() * 500) + 50),
    area_unit: "m²",
    notes: pick([
      "Penanaman bibit pohon endemik di area resapan.",
      "Penanaman bambu di tepi mata air untuk cegah erosi.",
      "Penanaman kaliandra dan sengon di lahan kritis.",
      "Reboisasi area hulu mata air dengan pohon lokal.",
      "Penanaman pohon buah-buahan untuk konservasi + ekonomi.",
    ]),
  });
}

function seedlingData(name: string, province: string, regency: string) {
  return JSON.stringify({
    province,
    regency,
    village: pick(["Sumberjo", "Wonorejo", "Sukamaju", "Mulyosari", "Argomulyo"]),
    seedling_type: pick(["Kaliandra", "Sengon", "Bambu", "Mahoni", "Beringin", "Jati"]),
    seedling_count: String(Math.floor(Math.random() * 500) + 50),
    seedling_quality: pick(["Baik", "Sedang", "Premium"]),
    seedling_source: pick(["Persemaian desa", "Dinas Kehutanan", "Kelompok Tani", "Bibit mandiri"]),
    notes: pick([
      "Stok bibit siap salur untuk musim tanam.",
      "Bibit baru dari persemaian, kualitas baik.",
      "Bibit telah melalui seleksi dan siap tanam.",
    ]),
  });
}

async function main() {
  console.log("🌱 Seeding DUMMY data for SpringHub...");

  // ── 1. Get or create test users ──────────────────────────────────────
  const ucupPw = await bcrypt.hash("ucup123", 12);
  const ucup = await prisma.profile.upsert({
    where: { email: "ucup@springhub.id" },
    update: {},
    create: {
      email: "ucup@springhub.id",
      passwordHash: ucupPw,
      username: "Ucup",
      role: "volunteer",
      points: 25000,
      trustScore: 90,
      region: "Yogyakarta",
      phone: "08123456789",
    },
  });
  console.log(`   ✅ User: ucup@springhub.id / ucup123 (${ucup.points} pts)`);

  const vol2 = await prisma.profile.findUnique({ where: { email: "volunteer@springhub.id" } });
  const users = [ucup, vol2].filter(Boolean);

  if (users.length === 0) {
    console.log("   ⚠️  No volunteer users found. Run prisma/seed.ts first.");
    return;
  }

  // ── 2. Create springs ─────────────────────────────────────────────────
  let springCreated = 0;
  const springRecords: Array<{ id: string; name: string; province: string; regency: string; lat: number; lng: number }> = [];

  for (const s of SPRINGS) {
    const existing = await prisma.spring.findFirst({
      where: { name: s.name },
    });
    if (existing) {
      springRecords.push({ ...existing, ...s });
      continue;
    }
    const spring = await prisma.spring.create({
      data: {
        name: s.name,
        snappedLat: s.lat,
        snappedLng: s.lng,
        province: s.province,
        regency: s.regency,
        village: s.village,
        subdistrict: s.subdistrict,
        isDummy: true,
      },
    });
    springRecords.push({ ...spring, ...s });
    springCreated++;
  }
  console.log(`   ✅ Springs: ${springCreated} created, ${springRecords.length} total`);

  // ── 3. Create dummy reports ───────────────────────────────────────────
  const formSlugs = ["spring-monitoring", "spring-restoration", "trench-development", "tree-planting", "seedling-stock"];
  let reportCreated = 0;

  for (let i = 0; i < 25; i++) {
    const spring = pick(springRecords);
    const formSlug = pick(formSlugs);
    const user = pick(users);
    if (!user) continue;

    // Generate field data based on form type
    let fieldData: string;
    switch (formSlug) {
      case "spring-monitoring": fieldData = monitoringData(spring.name, spring.province, spring.regency); break;
      case "spring-restoration": fieldData = restorationData(spring.name, spring.province, spring.regency); break;
      case "trench-development": fieldData = trenchData(spring.name, spring.province, spring.regency); break;
      case "tree-planting": fieldData = plantingData(spring.name, spring.province, spring.regency); break;
      case "seedling-stock": fieldData = seedlingData(spring.name, spring.province, spring.regency); break;
      default: fieldData = "{}";
    }

    // 70% approved, 20% pending, 10% rejected
    const statusRoll = Math.random();
    const status = statusRoll < 0.7 ? "approved" : statusRoll < 0.9 ? "pending" : "rejected" as const;

    const report = await prisma.report.create({
      data: {
        userId: user.id,
        formSlug,
        status,
        isActive: true,
        isDummy: true,
        fieldData,
        snappedLat: spring.lat,
        snappedLng: spring.lng,
        springId: spring.id,
        createdAt: randomDate(90),
      },
    });
    reportCreated++;

    // Award points for approved reports
    if (status === "approved") {
      const ptsMap: Record<string, number> = {
        "spring-monitoring": 25,
        "spring-restoration": 100,
        "trench-development": 50,
        "tree-planting": 50,
        "seedling-stock": 15,
      };
      const pts = ptsMap[formSlug] || 25;
      await prisma.pointsLog.create({
        data: {
          userId: user.id,
          reportId: report.id,
          amount: pts,
          reason: `Dummy: Approved ${formSlug}`,
          metadata: JSON.stringify({ isDummy: true, springName: spring.name }),
          createdAt: report.createdAt,
        },
      });
    }

    // Notification for some reports
    if (Math.random() < 0.4) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: status === "approved" ? "report-approved" : "report-rejected",
          title: status === "approved" ? "Laporan Anda disetujui! 🎉" : "Laporan Anda ditolak",
          body: `Laporan ${formSlug} di ${spring.name} telah ${status === "approved" ? "disetujui" : "ditolak"}.`,
          link: "/profile",
          createdAt: report.createdAt,
        },
      });
    }
  }
  console.log(`   ✅ Reports: ${reportCreated} dummy reports created`);

  // ── 4. Add points to ucup for dummy milestone ─────────────────────────
  const ucupProfile = await prisma.profile.findUnique({ where: { email: "ucup@springhub.id" } });
  if (ucupProfile && ucupProfile.points < 25000) {
    await prisma.profile.update({
      where: { id: ucupProfile.id },
      data: { points: 25000 },
    });
  }

  // ── 5. Summary ────────────────────────────────────────────────────────
  const totalSprings = await prisma.spring.count();
  const totalReports = await prisma.report.count();
  const dummyReports = await prisma.report.count({ where: { isDummy: true } });
  const approvedReports = await prisma.report.count({ where: { status: "approved" } });

  console.log("");
  console.log("✅ Seeding dummy selesai!");
  console.log(`   Total springs : ${totalSprings}`);
  console.log(`   Total reports : ${totalReports} (${dummyReports} dummy, ${approvedReports} approved)`);
  console.log(`   User: ucup@springhub.id / ucup123 (${ucup?.points || 25000} pts)`);
  console.log("");
  console.log("⚠️  Semua data dummy ditandai isDummy=true.");
  console.log("   Di admin panel, data dummy akan muncul dengan badge [Demo].");
}

main()
  .catch((e) => {
    console.error("Dummy seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
