import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: "public" });

const p = new PrismaClient({ adapter });

const mediaItems = [
  { section: 'media', type: 'video', title: 'Jaga Semesta · Restorasi Mata Air', subtitle: 'Apr 2026', description: 'Tonton perjalanan komunitas merestorasi mata air dari Bali sampai Madura.', imageUrl: 'https://i.ytimg.com/vi/oUDA1loE8BE/maxresdefault.jpg', linkUrl: 'https://www.youtube.com/watch?v=oUDA1loE8BE', linkLabel: 'Watch on YouTube', sortOrder: 1 },
  { section: 'media', type: 'event', title: 'Restorasi Sumber Sabrangan, Mojokerto', subtitle: '30 Des 2025 · Reboisasi · Sumber Jubel', description: 'Kegiatan kolektif membersihkan sedimen dan menanam ribuan bibit bambu di catchment Sumber Jubel.', imageUrl: '', linkUrl: 'https://mojokerto.disway.id/news/read/7545/jaga-mata-air-gelar-tanam-pohon-dan-bersihkan-sumur-resapan-di-area-sumber-jubel-pacet-mojokerto', linkLabel: 'Baca selengkapnya', sortOrder: 2 },
  { section: 'media', type: 'publication', title: 'Laporan Dampak 2025: 200+ Mata Air Terlindungi', subtitle: 'Jan 2026 · Video, 15 menit', description: 'Ringkasan capaian tahunan pemantauan dan restorasi di tujuh provinsi.', imageUrl: 'https://i.ytimg.com/vi/oUDA1loE8BE/maxresdefault.jpg', linkUrl: 'https://www.youtube.com/watch?v=oUDA1loE8BE', linkLabel: 'Tonton video', sortOrder: 3 },
  { section: 'media', type: 'press', title: 'Kompas: Sumber Air di Kebumen Diselamatkan Warga', subtitle: 'Jan 2026 · Kompas.id', description: 'Liputan warga Kebumen menolak tambang dan menjaga 28 titik mata air karst.', imageUrl: '', linkUrl: 'https://interaktif.kompas.id/baca/karst-gombong-selatan-bukan-sekadar-batuan-kapur/', linkLabel: 'Baca artikel', sortOrder: 4 },
];

async function main() {
  for (const item of mediaItems) {
    await p.contentBlock.create({ data: item });
  }
  console.log('✅ Seeded', mediaItems.length, 'media items');
}

main().finally(() => p.$disconnect());
