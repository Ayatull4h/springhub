import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: "public" });

const p = new PrismaClient({ adapter });

const mediaItems = [
  { section: 'media', type: 'video', title: 'Jaga Semesta · Restorasi Mata Air', subtitle: 'Apr 2026', description: 'Tonton perjalanan komunitas merestorasi mata air dari Bali sampai Madura.', imageUrl: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=250&fit=crop', linkUrl: 'https://youtu.be/oUDA1loE8BE', linkLabel: 'Watch on YouTube', sortOrder: 1 },
  { section: 'media', type: 'event', title: 'Restorasi Sumber Sabrangan', subtitle: '9 Feb 2025 · 200 relawan', description: 'Kegiatan kolektif membersihkan sedimen dan menanam 5000 bambu.', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop', linkUrl: '/help', linkLabel: 'Read recap', sortOrder: 2 },
  { section: 'media', type: 'publication', title: 'Laporan Dampak 2025', subtitle: 'Jan 2026 · PDF, 36 hal.', description: 'Ringkasan capaian tahunan pemantauan dan restorasi di tujuh provinsi.', imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=250&fit=crop', linkUrl: '/help', linkLabel: 'Download report', sortOrder: 3 },
  { section: 'media', type: 'press', title: 'Kompas: Kebumen Selamatkan Mata Air', subtitle: 'Jan 2026', description: 'Liputan warga Kebumen menolak tambang dan menjaga 28 titik mata air.', imageUrl: 'https://images.unsplash.com/photo-1552799446-159ba9523315?w=400&h=250&fit=crop', linkUrl: '/help', linkLabel: 'Read article', sortOrder: 4 },
];

async function main() {
  for (const item of mediaItems) {
    await p.contentBlock.create({ data: item });
  }
  console.log('✅ Seeded', mediaItems.length, 'media items');
}

main().finally(() => p.$disconnect());
