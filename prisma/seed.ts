import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SpringHub database...");

  // ── 1. Create test users ───────────────────────────────────────────────
  const adminPw = await bcrypt.hash("admin123", 12);
  const volunteerPw = await bcrypt.hash("vol12345", 12);

  const admin = await prisma.profile.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      passwordHash: adminPw,
      username: "Admin",
      role: "admin",
      points: 99999,
      trustScore: 100,
    },
  });

  const volunteer = await prisma.profile.upsert({
    where: { email: "volunteer@test.com" },
    update: {},
    create: {
      email: "volunteer@test.com",
      passwordHash: volunteerPw,
      username: "Volunteer",
      role: "volunteer",
      points: 24168,
      trustScore: 75,
      region: "Yogyakarta",
    },
  });

  console.log(`   ✅ Users: admin@test.com, volunteer@test.com`);

  // ── 2. Create courses with educational content ─────────────────────────
  const courses = [
    {
      slug: "pengenalan-mata-air",
      title: "Pengenalan Mata Air",
      description: "Pelajari dasar-dasar ekosistem mata air, jenis-jenisnya, dan mengapa mata air penting bagi kehidupan dan lingkungan di Indonesia.",
      level: "Beginner",
      duration: "30 menit",
      icon: "Droplets",
      sortOrder: 1,
      modules: [
        {
          title: "Apa Itu Mata Air?",
          content: `<h2>Apa Itu Mata Air?</h2>
<p>Mata air adalah titik di permukaan bumi di mana air tanah mengalir secara alami keluar dari akuifer. Mata air terbentuk ketika permukaan tanah memotong muka air tanah (water table).</p>
<h3>Jenis-jenis Mata Air</h3>
<ul>
<li><strong>Mata air gravitasi</strong>: air mengalir karena gravitasi dari lapisan yang lebih tinggi</li>
<li><strong>Mata air artesis</strong>: air muncul karena tekanan dari akuifer tertekan</li>
<li><strong>Mata air celah</strong>: air keluar dari retakan batuan</li>
<li><strong>Mata air depresi</strong>: air muncul di cekungan yang memotong muka air tanah</li>
</ul>
<h3>Mengapa Mata Air Penting?</h3>
<p>Indonesia memiliki ribuan mata air yang menjadi sumber air bersih bagi jutaan masyarakat, terutama di daerah pedesaan. Mata air juga mendukung ekosistem sungai, sawah, dan keanekaragaman hayati.</p>`,
          sortOrder: 1,
        },
        {
          title: "Ekosistem Mata Air",
          content: `<h2>Ekosistem Mata Air</h2>
<p>Ekosistem mata air memiliki karakteristik unik yang membedakannya dari perairan lainnya:</p>
<ul>
<li>Suhu air relatif konstan sepanjang tahun</li>
<li>Kandungan oksigen tinggi</li>
<li>Habitat bagi spesies endemik yang hanya hidup di mata air</li>
<li>Menjadi sumber kehidupan bagi komunitas tumbuhan dan hewan di sekitarnya</li>
</ul>
<h3>Vegetasi di Sekitar Mata Air</h3>
<p>Pohon-pohon besar seperti beringin, bambu, dan berbagai jenis pohon riparian tumbuh subur di sekitar mata air. Akar pohon membantu menyaring air dan menjaga kestabilan tanah.</p>`,
          sortOrder: 2,
        },
        {
          title: "Ancaman terhadap Mata Air",
          content: `<h2>Ancaman terhadap Mata Air</h2>
<p>Mata air di Indonesia menghadapi berbagai ancaman serius:</p>
<ul>
<li><strong>Alih fungsi lahan</strong>: pembangunan dan konversi hutan menjadi perkebunan</li>
<li><strong>Pencemaran</strong>: limbah domestik, pertanian, dan industri</li>
<li><strong>Eksploitasi berlebihan</strong>: pengambilan air melebihi kapasitas recharge</li>
<li><strong>Perubahan iklim</strong>: perubahan pola curah hujan mempengaruhi recharge air tanah</li>
<li><strong>Penambangan</strong>: tambang di sekitar kawasan resapan merusak akuifer</li>
</ul>
<h3>Studi Kasus</h3>
<p>Di Jawa Barat, lebih dari 30% mata air mengalami penurunan debit dalam 10 tahun terakhir akibat alih fungsi lahan di kawasan resapan.</p>`,
          sortOrder: 3,
        },
        {
          title: "Cara Melindungi Mata Air",
          content: `<h2>Cara Melindungi Mata Air</h2>
<p>Setiap orang bisa berkontribusi dalam perlindungan mata air:</p>
<ol>
<li><strong>Jaga kebersihan</strong>: jangan buang sampah di sekitar mata air</li>
<li><strong>Tanam pohon</strong>: tanam pohon endemik di area resapan</li>
<li><strong>Hindari pupuk kimia</strong>: gunakan pupuk organik di lahan pertanian dekat mata air</li>
<li><strong>Laporkan kerusakan</strong>: gunakan aplikasi SpringHub untuk melaporkan kondisi mata air</li>
<li><strong>Edukasi masyarakat</strong>: sebarkan pengetahuan tentang pentingnya mata air</li>
</ol>
<p>Dengan menggunakan SpringHub, Anda bisa memonitor kondisi mata air, melaporkan perubahan, dan mendapatkan poin untuk setiap kontribusi!</p>`,
          sortOrder: 4,
        },
      ],
    },
    {
      slug: "panduan-menanam-pohon-endemik",
      title: "Panduan Menanam Pohon Endemik",
      description: "Panduan lengkap memilih lokasi, menanam, dan merawat pohon endemik Indonesia di area resapan mata air untuk restorasi lingkungan.",
      level: "Intermediate",
      duration: "45 menit",
      icon: "Tree",
      sortOrder: 2,
      modules: [
        {
          title: "Mengapa Pohon Endemik?",
          content: `<h2>Mengapa Pohon Endemik?</h2>
<p>Pohon endemik adalah spesies asli yang secara alami tumbuh di suatu daerah. Keunggulan menanam pohon endemik:</p>
<ul>
<li><strong>Adaptasi tinggi</strong>: sudah terbiasa dengan iklim dan tanah setempat</li>
<li><strong>Ekosistem seimbang</strong>: mendukung satwa liar lokal (burung, serangga, mamalia)</li>
<li><strong>Perawatan minimal</strong>: tidak perlu pupuk dan pestisida intensif</li>
<li><strong>Akar kuat</strong>: sistem akar dalam membantu recharge air tanah</li>
</ul>
<h3>Contoh Pohon Endemik Indonesia</h3>
<ul>
<li>Beringin (Ficus benjamina) — akar kuat, baik untuk tepi mata air</li>
<li>Kaliandra (Calliandra calothyrsus) — cepat tumbuh, pengikat nitrogen</li>
<li>Sengon (Paraserianthes falcataria) — cepat, kayu ringan, serbaguna</li>
<li>Bambu (berbagai spesies) — akar rapat, cegah erosi, serap air</li>
</ul>`,
          sortOrder: 1,
        },
        {
          title: "Pemilihan Lokasi Tanam",
          content: `<h2>Pemilihan Lokasi Tanam</h2>
<p>Lokasi tanam yang tepat menentukan keberhasilan restorasi:</p>
<h3>Kriteria Lokasi Ideal</h3>
<ul>
<li>Jarak 10-50 meter dari titik mata air</li>
<li>Kemiringan tanah tidak terlalu curam (maks 30 derajat)</li>
<li>Tidak tergenang air</li>
<li>Akses untuk perawatan rutin</li>
<li>Bukan area konflik dengan masyarakat</li>
</ul>
<h3>Area Prioritas</h3>
<ol>
<li>Kawasan resapan di hulu mata air</li>
<li>Tepian sungak yang memasok mata air</li>
<li>Lahan kritis di sekitar mata air</li>
<li>Koridor ekologis antar mata air</li>
</ol>
<p>Gunakan fitur GPS di aplikasi SpringHub untuk menandai lokasi tanam!</p>`,
          sortOrder: 2,
        },
        {
          title: "Teknik Penanaman",
          content: `<h2>Teknik Penanaman</h2>
<h3>Langkah-langkah Penanaman</h3>
<ol>
<li><strong>Buat lubang</strong>: 30x30x30 cm untuk bibit kecil, 50x50x50 cm untuk bibit besar</li>
<li><strong>Campur tanah</strong>: campur tanah galian dengan kompos (2:1)</li>
<li><strong>Buka polybag</strong>: hati-hati jangan merusak akar</li>
<li><strong>Tanam</strong>: posisikan bibit tegak lurus, timbun dengan campuran tanah</li>
<li><strong>Padatkan</strong>: tekan ringan tanah di sekitar pangkal batang</li>
<li><strong>Siram</strong>: siram secukupnya (2-5 liter per bibit)</li>
<li><strong>Mulsa</strong>: tutup permukaan tanah dengan jerami/daun kering</li>
</ol>
<h3>Waktu Tanam Terbaik</h3>
<p>Awal musim hujan (Oktober-Desember) adalah waktu ideal karena bibit akan mendapat air cukup untuk beradaptasi.</p>`,
          sortOrder: 3,
        },
        {
          title: "Perawatan dan Monitoring",
          content: `<h2>Perawatan dan Monitoring</h2>
<h3>Jadwal Perawatan</h3>
<table>
<tr><th>Periode</th><th>Kegiatan</th></tr>
<tr><td>1-3 bulan</td><td>Siram setiap 2 hari (musim kemarau), periksa hama</td></tr>
<tr><td>4-6 bulan</td><td>Siram seminggu sekali, beri pupuk organik</td></tr>
<tr><td>7-12 bulan</td><td>Siram saat kering, pangkas cabang rusak</td></tr>
<tr><td>2 tahun+</td><td>Monitoring pertumbuhan, ganti pohon mati</td></tr>
</table>
<h3>Indikator Sukses</h3>
<ul>
<li>Tingkat hidup bibit > 80% setelah 1 tahun</li>
<li>Tinggi pohon bertambah minimal 50 cm/tahun</li>
<li>Munculnya vegetasi sekunder di sekitar area tanam</li>
<li>Kembalinya satwa liar (burung, kupu-kupu)</li>
</ul>
<p>Catat perkembangan di SpringHub dan dapatkan poin untuk setiap laporan monitoring!</p>`,
          sortOrder: 4,
        },
      ],
    },
    {
      slug: "panduan-form-laporan",
      title: "Panduan Form Laporan SpringHub",
      description: "Pelajari cara menggunakan kelima form SpringHub — monitoring, restorasi, bibit, parit (rorak), dan pohon — serta cara mendapatkan poin maksimal.",
      level: "Beginner",
      duration: "20 menit",
      icon: "FileText",
      sortOrder: 3,
      modules: [
        {
          title: "Mengenal Form SpringHub",
          content: `<h2>Mengenal Form SpringHub</h2>
<p>SpringHub memiliki 5 form laporan yang bisa Anda gunakan:</p>
<ul>
<li><strong>Spring Monitoring (+25 pts)</strong>: pantau kondisi mata air secara berkala</li>
<li><strong>Spring Restoration (+100 pts)</strong>: laporkan kegiatan restorasi yang dilakukan</li>
<li><strong>Trench Development (+50 pts)</strong>: catat pembangunan parit resapan (rorak)</li>
<li><strong>Tree Planting (+50 pts)</strong>: laporkan penanaman pohon</li>
<li><strong>Seedling Stock (+15 pts)</strong>: catat ketersediaan bibit di persemaian</li>
</ul>
<p>Setiap laporan yang di-approve akan memberikan poin sesuai tabel di atas. Kumpulkan poin untuk naik level dan buka akses fitur baru!</p>`,
          sortOrder: 1,
        },
        {
          title: "Tips Laporan Berkualitas",
          content: `<h2>Tips Laporan Berkualitas</h2>
<p>Agar laporan Anda cepat di-approve, ikuti tips berikut:</p>
<ul>
<li><strong>Foto jelas</strong>: ambil foto dengan pencahayaan cukup, sertakan marker/bendera sebagai referensi skala</li>
<li><strong>Lokasi akurat</strong>: aktifkan GPS dan tunggu hingga sinyal stabil sebelum mengambil koordinat</li>
<li><strong>Deskripsi detail</strong>: jelaskan kondisi mata air, vegetasi sekitar, dan aktivitas yang dilakukan</li>
<li><strong>Laporan rutin</strong>: buat laporan mingguan untuk membangun streak poin</li>
<li><strong>Foto before-after</strong>: untuk laporan restorasi, lampirkan foto sebelum dan sesudah</li>
</ul>
<h3>Bonus Poin</h3>
<ul>
<li>Streak 3 hari berturut-turut: +5 pts</li>
<li>Streak 7 hari (seminggu penuh): +50 pts</li>
<li>Foto before-after: +15 pts</li>
<li>Penemuan mata air baru: +50 pts + badge</li>
<li>Milestone 10 laporan: +50 pts</li>
</ul>`,
          sortOrder: 2,
        },
      ],
    },
  ];

  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: { title: courseData.title },
      create: {
        slug: courseData.slug,
        title: courseData.title,
        description: courseData.description,
        level: courseData.level,
        duration: courseData.duration,
        icon: courseData.icon,
        sortOrder: courseData.sortOrder,
        isActive: true,
      },
    });

    // Delete existing modules and recreate
    await prisma.courseModule.deleteMany({ where: { courseId: course.id } });

    for (const mod of courseData.modules) {
      await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: mod.title,
          content: mod.content,
          sortOrder: mod.sortOrder,
        },
      });
    }

    console.log(`   ✅ Course: ${courseData.title} (${courseData.modules.length} modules)`);
  }

  // ── 3. Create media content blocks ────────────────────────────────────
  const mediaItems = [
    {
      section: "media",
      type: "video",
      title: "Jaga Semesta — Restorasi Mata Air",
      subtitle: "Apr 2026",
      description: "Tonton perjalanan komunitas kami merestorasi mata air dari Bali sampai Madura.",
      imageUrl: "",
      linkUrl: "https://www.youtube.com/watch?v=oUDA1loE8BE",
      linkLabel: "Watch on YouTube",
      sortOrder: 1,
    },
    {
      section: "media",
      type: "event",
      title: "Restorasi Mata Air Sumber Sabrangan, Mojokerto",
      subtitle: "9 Feb 2025 · 200 relawan · 5.000 bibit bambu",
      description: "Kegiatan kolektif membersihkan sedimen, memasang flowmeter, dan menanam 5.000 bambu di catchment Sumber Sabrangan.",
      imageUrl: "",
      linkUrl: "/help",
      linkLabel: "Read recap",
      sortOrder: 2,
    },
    {
      section: "media",
      type: "publication",
      title: "Laporan Dampak 2025: 200+ Mata Air Terlindungi",
      subtitle: "Jan 2026 · PDF, 36 hal.",
      description: "Ringkasan capaian tahunan: pemantauan, restorasi, penanaman, dan kemitraan strategis di tujuh provinsi.",
      imageUrl: "",
      linkUrl: "/help",
      linkLabel: "Download report",
      sortOrder: 3,
    },
    {
      section: "media",
      type: "press",
      title: "Kompas: Sumber Air di Kebumen Diselamatkan Warga",
      subtitle: "Jan 2026",
      description: "Liputan media tentang gerakan warga Kebumen menolak tambang dan menjaga 28 titik mata air karst.",
      imageUrl: "",
      linkUrl: "/help",
      linkLabel: "Read article",
      sortOrder: 4,
    },
  ];

  // Clear existing media content and reseed
  await prisma.contentBlock.deleteMany({ where: { section: "media" } });

  for (const item of mediaItems) {
    await prisma.contentBlock.create({
      data: item,
    });
  }

  console.log(`   ✅ Media: ${mediaItems.length} content blocks`);

  // ── 4. Create static form definitions ────────────────────────────────
  const forms = [
    { slug: "spring-monitoring", title: "Spring Monitoring", pointsOnSubmit: 25, contributionType: "monitoring", sortOrder: 1 },
    { slug: "spring-restoration", title: "Spring Restoration", pointsOnSubmit: 100, contributionType: "restoration", sortOrder: 2 },
    { slug: "trench-development", title: "Trench Development", pointsOnSubmit: 50, contributionType: "restoration", sortOrder: 3 },
    { slug: "tree-planting", title: "Tree Planting", pointsOnSubmit: 50, contributionType: "restoration", sortOrder: 4 },
    { slug: "seedling-stock", title: "Seedling Stock", pointsOnSubmit: 15, contributionType: "monitoring", sortOrder: 5 },
  ];

  for (const form of forms) {
    await prisma.form.upsert({
      where: { slug: form.slug },
      update: { title: form.title },
      create: form,
    });
  }

  console.log(`   ✅ Forms: ${forms.length} form definitions`);

  // ── 5. Create point rules ─────────────────────────────────────────---
  const pointRules = [
    { name: "Spring Monitoring", description: "Laporan monitoring mata air", points: 25, category: "basic", sortOrder: 1 },
    { name: "Spring Restoration", description: "Laporan restorasi mata air", points: 100, category: "basic", sortOrder: 2 },
    { name: "Trench Development", description: "Pengembangan parit resapan (rorak)", points: 50, category: "basic", sortOrder: 3 },
    { name: "Tree Planting", description: "Laporan penanaman pohon", points: 50, category: "basic", sortOrder: 4 },
    { name: "Seedling Stock", description: "Laporan stok bibit", points: 15, category: "basic", sortOrder: 5 },
    { name: "Streak 3 Hari", description: "Lapor 3 hari berturut-turut", points: 5, category: "bonus", sortOrder: 6 },
    { name: "Streak Mingguan", description: "Lapor tiap hari seminggu penuh", points: 50, category: "bonus", sortOrder: 7 },
    { name: "Laporan Lengkap", description: "Semua field + foto + notes", points: 10, category: "bonus", sortOrder: 8 },
    { name: "Foto Before/After", description: "Minimal 2 foto", points: 15, category: "bonus", sortOrder: 9 },
    { name: "Penemu (Discovery)", description: "Mata air baru belum ada di map", points: 50, category: "bonus", sortOrder: 10 },
    { name: "Milestone 10 Laporan", description: "10 laporan di-approve", points: 50, category: "milestone", sortOrder: 11 },
    { name: "Milestone 50 Laporan", description: "50 laporan di-approve", points: 250, category: "milestone", sortOrder: 12 },
    { name: "Milestone 100 Laporan", description: "100 laporan di-approve", points: 500, category: "milestone", sortOrder: 13 },
    { name: "Course Selesai", description: "Menyelesaikan course di Learning Hub", points: 25, category: "bonus", sortOrder: 14 },
  ];

  for (const rule of pointRules) {
    await prisma.pointRule.upsert({
      where: { id: rule.name }, // use name as unique lookup
      update: { points: rule.points },
      create: rule,
    });
  }

  console.log(`   ✅ PointRules: ${pointRules.length} rules`);

  console.log("\n✅ Seeding complete!");
  console.log(`   Admin: admin@test.com / admin123`);
  console.log(`   Volunteer: volunteer@test.com / vol12345`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
