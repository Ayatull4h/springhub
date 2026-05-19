import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding full demo data...");

  // ─── SPRING REPORTS for map markers ───
  const springs = [
    { slug: "spring-monitoring", name: "Mata Air Cibeureum", lat: -6.6447, lng: 106.7892, region: "Bogor, Jawa Barat" },
    { slug: "spring-monitoring", name: "Sumber Beratan", lat: -8.2750, lng: 115.1670, region: "Bedugul, Bali" },
    { slug: "spring-restoration", name: "Mata Air Sebatu", lat: -8.4231, lng: 115.2779, region: "Gianyar, Bali" },
    { slug: "spring-monitoring", name: "Mata Air Umbul Ponggok", lat: -7.6891, lng: 110.6472, region: "Klaten, Jawa Tengah" },
    { slug: "spring-monitoring", name: "Mata Air Cikahuripan", lat: -6.9210, lng: 106.9270, region: "Sukabumi, Jawa Barat" },
    { slug: "spring-monitoring", name: "Mata Air Senjoyo", lat: -7.2389, lng: 110.5063, region: "Semarang, Jawa Tengah" },
    { slug: "spring-monitoring", name: "Mata Air Tirtha Empul", lat: -8.4152, lng: 115.3155, region: "Tampaksiring, Bali" },
    { slug: "spring-restoration", name: "Sumber Maron", lat: -7.7790, lng: 110.3150, region: "Klaten, Jawa Tengah" },
    { slug: "spring-monitoring", name: "Mata Air Banyu Biru", lat: -7.5600, lng: 112.7100, region: "Pasuruan, Jawa Timur" },
    { slug: "spring-monitoring", name: "Mata Air Wae Rebo", lat: -8.8200, lng: 120.3100, region: "Manggarai, NTT" },
    { slug: "spring-monitoring", name: "Sumberawan", lat: -7.8470, lng: 112.5280, region: "Malang, Jawa Timur" },
    { slug: "tree-planting", name: "Hutan Bambu Ciwalu", lat: -6.9500, lng: 107.5800, region: "Bandung, Jawa Barat" },
    { slug: "trench-development", name: "Rorak Sendang", lat: -7.6800, lng: 110.6300, region: "Klaten, Jawa Tengah" },
    { slug: "spring-monitoring", name: "Mata Air Pancuran 7", lat: -7.2200, lng: 109.9000, region: "Banjarnegara, Jateng" },
    { slug: "spring-restoration", name: "Mata Air Kalibening", lat: -7.3500, lng: 109.6800, region: "Banjarnegara, Jateng" },
  ];

  let reportCount = 0;
  for (const s of springs) {
    const snappedLat = Math.round(s.lat * 200) / 200;
    const snappedLng = Math.round(s.lng * 200) / 200;

    const fieldData = JSON.stringify({
      spring_name: s.name,
      regency: s.region,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "Laporan demo — data dummy untuk tampilan website.",
    });

    await prisma.report.create({
      data: {
        userId: null,
        formSlug: s.slug,
        status: "approved",
        fieldData,
        preciseLat: s.lat,
        preciseLng: s.lng,
        snappedLat,
        snappedLng,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
    reportCount++;
  }
  console.log(`✓ ${reportCount} spring reports created (map markers)`);

  // ─── UPDATE PROFILE POINTS ───
  const volunteer = await prisma.profile.findUnique({ where: { email: "volunteer@test.com" } });
  if (volunteer) {
    await prisma.profile.update({
      where: { id: volunteer.id },
      data: { points: 1250, trustScore: 60 },
    });
  }

  const admin = await prisma.profile.findUnique({ where: { email: "admin@test.com" } });
  if (admin) {
    await prisma.profile.update({
      where: { id: admin.id },
      data: { points: 0, trustScore: 100 },
    });
  }

  // Create some points log entries for demo
  const demoLogs = [
    { email: "volunteer@test.com", amount: 25, reason: "Spring Monitoring - Cibeureum" },
    { email: "volunteer@test.com", amount: 100, reason: "Spring Restoration - Sebatu" },
    { email: "volunteer@test.com", amount: 50, reason: "Tree Planting - Ciwalu" },
    { email: "volunteer@test.com", amount: 50, reason: "Trench Development - Sendang" },
    { email: "volunteer@test.com", amount: 10, reason: "Bonus: Laporan Lengkap" },
    { email: "volunteer@test.com", amount: 25, reason: "Spring Monitoring - Pancuran 7" },
    { email: "volunteer@test.com", amount: 15, reason: "Seedling Stock" },
  ];

  for (const log of demoLogs) {
    const user = await prisma.profile.findUnique({ where: { email: log.email } });
    if (user) {
      await prisma.pointsLog.create({
        data: { userId: user.id, amount: log.amount, reason: log.reason, metadata: "{}" },
      });
    }
  }
  console.log(`✓ ${demoLogs.length} points log entries created`);

  console.log("\n✅ Demo data seeding complete!");
  console.log("📍 Map markers: 15 springs across Indonesia");
  console.log("📊 Stats will now show real data");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
