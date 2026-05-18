import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const cleanPath = dbUrl.replace(/^file:/, "").replace(/^\.\//, "");
const absolutePath = path.resolve(process.cwd(), cleanPath);

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: `file:${absolutePath}`,
  }),
});

async function main() {
  console.log("Seeding database...");

  const hash = await bcrypt.hash("test123", 12);

  // Create volunteer
  const volunteer = await prisma.profile.upsert({
    where: { email: "volunteer@test.com" },
    update: {},
    create: {
      email: "volunteer@test.com",
      passwordHash: hash,
      username: "Maya Putri",
      role: "volunteer",
      region: "Yogyakarta",
      points: 1250,
      trustScore: 50,
    },
  });

  // Create admin
  const admin = await prisma.profile.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      passwordHash: hash,
      username: "Admin SpringHub",
      role: "admin",
      region: "Jakarta",
      points: 0,
      trustScore: 100,
    },
  });

  console.log(`✓ Users created: volunteer@test.com, admin@test.com`);

  // Create seed reports
  const report1 = await prisma.report.create({
    data: {
      userId: volunteer.id,
      formSlug: "spring-monitoring",
      status: "approved",
      fieldData: JSON.stringify({
        spring_name: "Mata Air Cibeureum",
        regency: "Bogor",
        date: "2026-05-10",
        flow_condition: "Mengalir deras",
        water_quality: "Air jernih",
        cleanliness: "Bebas dari sampah plastik",
        notes: "Kondisi mata air masih baik, debit air melimpah.",
      }),
      preciseLat: -6.6447,
      preciseLng: 106.7892,
      snappedLat: -6.615,
      snappedLng: 106.785,
      reviewedById: admin.id,
    },
  });

  const report2 = await prisma.report.create({
    data: {
      userId: volunteer.id,
      formSlug: "spring-restoration",
      status: "pending",
      fieldData: JSON.stringify({
        spring_name: "Mata Air Sebatu",
        regency: "Gianyar, Bali",
        date: "2026-05-12",
        activity_types: ["Pembersihan Sedimen / Lumpur", "Menanam Pohon"],
        volunteer_count: "15",
        notes: "Kegiatan restorasi bersama komunitas desa.",
      }),
      preciseLat: -8.4231,
      preciseLng: 115.2779,
      snappedLat: -8.415,
      snappedLng: 115.275,
    },
  });

  const report3 = await prisma.report.create({
    data: {
      userId: volunteer.id,
      formSlug: "tree-planting",
      status: "approved",
      fieldData: JSON.stringify({
        volunteer_name: "Maya Putri",
        regency: "Bedugul, Bali",
        date: "2026-05-08",
        tree_count: "25",
        tree_species: "Bambu petung, Beringin",
        notes: "Penanaman di area catchment mata air.",
      }),
      preciseLat: -8.2750,
      preciseLng: 115.1670,
      snappedLat: -8.28,
      snappedLng: 115.17,
      reviewedById: admin.id,
    },
  });

  // Award points for approved reports
  await prisma.pointsLog.create({
    data: {
      userId: volunteer.id,
      reportId: report1.id,
      amount: 25,
      reason: "Laporan disetujui: spring-monitoring",
      metadata: JSON.stringify({ formSlug: "spring-monitoring", approved: true }),
    },
  });

  await prisma.pointsLog.create({
    data: {
      userId: volunteer.id,
      reportId: report3.id,
      amount: 50,
      reason: "Laporan disetujui: tree-planting",
      metadata: JSON.stringify({ formSlug: "tree-planting", approved: true }),
    },
  });

  // Create a project
  await prisma.project.create({
    data: {
      userId: volunteer.id,
      title: "Restorasi Mata Air Ciburuy",
      summary:
        "Pembersihan sedimen dan penanaman kembali riparian di sekitar mata air yang melayani 200+ keluarga.",
      region: "Bogor, Jawa Barat",
      typeId: "spring_restoration",
      status: "approved",
      goalAmount: 50000000,
      raisedAmount: 12000000,
    },
  });

  // Create dummy donations
  await prisma.donation.create({
    data: {
      userId: volunteer.id,
      invoiceId: "INV-DEMO-001",
      externalId: "springhub-INV-DEMO-001",
      amountIdr: 150000,
      tierId: "sediment",
      donorName: "Maya Putri",
      donorEmail: "volunteer@test.com",
      status: "paid",
      paidAt: new Date("2026-05-01"),
    },
  });

  await prisma.donation.create({
    data: {
      amountIdr: 75000,
      tierId: "trench",
      donorName: "Guest Donor",
      donorEmail: "guest@example.com",
      status: "pending",
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  // ─── PointRule seed data ──────────────────────────────────────────────
  const pointRules = [
    { name: "Spring Monitoring", description: "Melaporkan kondisi mata air", points: 25, category: "basic", icon: "Eye", sortOrder: 1 },
    { name: "Spring Restoration", description: "Melaporkan kegiatan restorasi", points: 100, category: "basic", icon: "Wrench", sortOrder: 2 },
    { name: "Trench Development", description: "Membuat rorak/parit resapan", points: 50, category: "basic", icon: "Trench", sortOrder: 3 },
    { name: "Tree Planting", description: "Menanam pohon", points: 50, category: "basic", icon: "TreePine", sortOrder: 4 },
    { name: "Seedling Stock", description: "Melaporkan stok bibit", points: 15, category: "basic", icon: "Sprout", sortOrder: 5 },
    { name: "Streak Harian", description: "Lapor 3 hari berturut-turut", points: 5, category: "bonus", icon: "Flame", sortOrder: 6 },
    { name: "Streak Mingguan", description: "Lapor setiap hari dalam seminggu", points: 50, category: "bonus", icon: "CalendarCheck", sortOrder: 7 },
    { name: "Laporan Lengkap", description: "Mengisi semua field + foto + notes", points: 10, category: "bonus", icon: "ClipboardCheck", sortOrder: 8 },
    { name: "Foto Before/After", description: "Mengirim minimal 2 foto", points: 15, category: "bonus", icon: "Camera", sortOrder: 9 },
    { name: "Penemu (Discovery)", description: "Melaporkan mata air baru", points: 50, category: "bonus", icon: "Compass", sortOrder: 10 },
    { name: "Milestone 10 Laporan", description: "Mencapai 10 laporan", points: 50, category: "milestone", icon: "Award", sortOrder: 11 },
    { name: "Milestone 50 Laporan", description: "Mencapai 50 laporan", points: 250, category: "milestone", icon: "Trophy", sortOrder: 12 },
    { name: "Milestone 100 Laporan", description: "Mencapai 100 laporan", points: 500, category: "milestone", icon: "Crown", sortOrder: 13 },
    { name: "Course Selesai", description: "Menyelesaikan course di Learning Hub", points: 25, category: "bonus", icon: "BookOpen", sortOrder: 14 },
    { name: "Threshold 20.000 Poin", description: "Mencapai 20.000 poin", points: 1000, category: "milestone", icon: "Gem", sortOrder: 15 },
  ];

  for (const rule of pointRules) {
    await prisma.pointRule.upsert({
      where: { id: rule.name },
      update: {},
      create: {
        name: rule.name,
        description: rule.description,
        points: rule.points,
        category: rule.category,
        icon: rule.icon,
        sortOrder: rule.sortOrder,
      },
    });
  }
  console.log(`✓ ${pointRules.length} point rules created`);

  // ─── Course seed data ──────────────────────────────────────────────────
  const courses = [
    {
      slug: "spring-conservation-basics",
      title: "Spring Conservation Basics",
      description: "Learn the fundamentals of spring ecosystems and conservation techniques used across Indonesia.",
      level: "Beginner",
      duration: "45 min",
      icon: "Droplets",
      sortOrder: 1,
    },
    {
      slug: "endemic-tree-planting",
      title: "Endemic Tree Planting Guide",
      description: "Master site-selection, planting, and care for Indonesia's native tree species in watershed areas.",
      level: "Intermediate",
      duration: "60 min",
      icon: "TreePine",
      sortOrder: 2,
    },
    {
      slug: "field-reporting-forms",
      title: "Field Reporting with SpringHub Forms",
      description: "Walk through the five SpringHub forms — monitoring, restoration, trench, tree planting, and seedling stock.",
      level: "Beginner",
      duration: "30 min",
      icon: "ClipboardList",
      sortOrder: 3,
    },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {},
      create: course,
    });
  }
  console.log(`✓ ${courses.length} courses created`);

  console.log("✓ 3 reports, 1 project, 2 donations created");
  console.log("✓ Seeding complete!");
  console.log("\nTest accounts:");
  console.log("  Volunteer: volunteer@test.com / test123 (1,250 pts)");
  console.log("  Admin:     admin@test.com / test123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
