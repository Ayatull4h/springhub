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

// ─── Helper: placeholder image ──────────────────────────────────────────────
function img(label: string, w = 800, h = 600, bg = "059669"): string {
  return `https://placehold.co/${w}x${h}/${bg}/ffffff?text=${encodeURIComponent(label)}`;
}

async function main() {
  console.log("🌱 Seeding SpringHub database...\n");

  // ── 0. Clean existing data ──────────────────────────────────────────────
  await prisma.trackingPoint.deleteMany();
  await prisma.offlineSession.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pointsLog.deleteMany();
  await prisma.reportPhoto.deleteMany();
  await prisma.report.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.project.deleteMany();
  await prisma.spring.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.coursesProgress.deleteMany();
  await prisma.course.deleteMany();
  await prisma.formField.deleteMany();
  await prisma.form.deleteMany();
  await prisma.contentBlock.deleteMany();
  await prisma.pointRule.deleteMany();
  await prisma.session.deleteMany();
  await prisma.profile.deleteMany();
  console.log("   ✅ Cleaned existing data\n");

  // ── 1. Accounts ─────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash("demo12345", 12);
  const volunteerPw = await bcrypt.hash("vol12345", 12);
  const ucupPw = await bcrypt.hash("ucup12345", 12);

  const admin = await prisma.profile.create({
    data: {
      email: "admin@springhub.id",
      passwordHash: adminPw,
      username: "Admin Demo",
      role: "admin",
      region: "Jakarta",
      points: 99999,
      trustScore: 100,
      phone: "+6281234567890",
      phoneVerified: true,
    },
  });

  const volunteer = await prisma.profile.create({
    data: {
      email: "volunteer@springhub.id",
      passwordHash: volunteerPw,
      username: "Volunteer",
      role: "volunteer",
      region: "Yogyakarta",
      points: 24168,
      trustScore: 75,
      phone: "+6281234567891",
    },
  });

  const ucup = await prisma.profile.create({
    data: {
      email: "ucup@springhub.id",
      passwordHash: ucupPw,
      username: "Ucup",
      role: "volunteer",
      region: "Jawa Timur",
      points: 20168,
      trustScore: 50,
      phone: "+6281234567892",
    },
  });

  // Extra volunteers for realistic data
  const sari = await prisma.profile.create({
    data: {
      email: "sari@springhub.id",
      passwordHash: await bcrypt.hash("sari12345", 12),
      username: "Sari",
      role: "volunteer",
      region: "Jawa Barat",
      points: 15420,
      trustScore: 85,
    },
  });

  const budi = await prisma.profile.create({
    data: {
      email: "budi@springhub.id",
      passwordHash: await bcrypt.hash("budi12345", 12),
      username: "Budi",
      role: "volunteer",
      region: "Bali",
      points: 8750,
      trustScore: 65,
    },
  });

  const users = [admin, volunteer, ucup, sari, budi];
  console.log(`   ✅ ${users.length} users created`);
  console.log(`      Admin:    admin@springhub.id / demo12345`);
  console.log(`      Volunteer: volunteer@springhub.id / vol12345`);
  console.log(`      Ucup:     ucup@springhub.id / ucup12345\n`);

  // ── 2. Springs ──────────────────────────────────────────────────────────
  const springs = [
    { name: "Sumber Umbul", province: "Jawa Timur", regency: "Malang", village: "Dampit", subdistrict: "Dampit", lat: -8.211, lng: 112.749 },
    { name: "Mata Air Ciburial", province: "Jawa Barat", regency: "Bandung", village: "Ciburial", subdistrict: "Cimenyan", lat: -6.845, lng: 107.657 },
    { name: "Sumber Telaga", province: "Jawa Timur", regency: "Banyuwangi", village: "Tamansuruh", subdistrict: "Licin", lat: -8.182, lng: 114.282 },
    { name: "Tirta Empul", province: "Bali", regency: "Gianyar", village: "Manukaya", subdistrict: "Tampaksiring", lat: -8.417, lng: 115.315 },
    { name: "Sumber Maron", province: "Jawa Tengah", regency: "Semarang", village: "Maroon", subdistrict: "Getasan", lat: -7.388, lng: 110.438 },
    { name: "Belik Soka", province: "DI Yogyakarta", regency: "Gunung Kidul", village: "Soka", subdistrict: "Paliyan", lat: -7.969, lng: 110.523 },
    { name: "Sumber Gempol", province: "Jawa Timur", regency: "Pasuruan", village: "Gempol", subdistrict: "Pandaan", lat: -7.652, lng: 112.692 },
    { name: "Cipanas", province: "Jawa Barat", regency: "Cianjur", village: "Cipanas", subdistrict: "Cipanas", lat: -6.731, lng: 107.039 },
    { name: "Sumber Brantas", province: "Jawa Timur", regency: "Kota Batu", village: "Sumber Brantas", subdistrict: "Bumiaji", lat: -7.767, lng: 112.503 },
    { name: "Mata Air Kalibayem", province: "DI Yogyakarta", regency: "Kulon Progo", village: "Kalibayem", subdistrict: "Kalibawang", lat: -7.674, lng: 110.157 },
    { name: "Sumber Taman", province: "Jawa Timur", regency: "Mojokerto", village: "Taman", subdistrict: "Pacet", lat: -7.655, lng: 112.548 },
    { name: "Tirta Gangga", province: "Bali", regency: "Karangasem", village: "Ababi", subdistrict: "Abang", lat: -8.414, lng: 115.565 },
  ];

  const createdSprings = [];
  for (const s of springs) {
    const spring = await prisma.spring.create({
      data: {
        name: s.name,
        province: s.province,
        regency: s.regency,
        village: s.village,
        subdistrict: s.subdistrict,
        snappedLat: s.lat,
        snappedLng: s.lng,
        isDummy: false,
      },
    });
    createdSprings.push(spring);
  }
  console.log(`   ✅ ${createdSprings.length} springs created\n`);

  // ── 3. Forms + Fields ───────────────────────────────────────────────────
  const formDefs = [
    {
      slug: "spring-monitoring", title: "Survei Mata Air", points: 100, type: "monitoring",
      fields: [
        { fieldId: "A1_tanggal", label: "Tanggal Survei", type: "date", required: true, placeholder: "", sortOrder: 1 },
        { fieldId: "A2_nama_surveyor", label: "Nama Surveyor", type: "text", required: true, placeholder: "", sortOrder: 2 },
        { fieldId: "A3_wa", label: "Nomor WA", type: "phone", required: true, placeholder: "", sortOrder: 3 },
        { fieldId: "A4_geotag", label: "Geotag", type: "location", required: true, sortOrder: 4 },
        { fieldId: "A5_cek_duplikat", label: "Cek Duplikat (radius 20m)", type: "select", required: true, options: JSON.stringify(["Baru","Kunjungan Ulang"]), sortOrder: 5 },
        { fieldId: "A6_kode_spring", label: "Kode SpringHub (jika kunjungan ulang)", type: "text", required: false, sortOrder: 6 },
        { fieldId: "B1_nama", label: "Nama Lokal Mata Air", type: "text", required: true, placeholder: "", sortOrder: 7 },
        { fieldId: "B2_foto_1", label: "Foto 1: Titik Keluar Air (dekat)", type: "photo", required: true, sortOrder: 8 },
        { fieldId: "B3_foto_2", label: "Foto 2: Lingkungan Sekitar (5-10 langkah)", type: "photo", required: true, sortOrder: 9 },
        { fieldId: "B4_foto_3", label: "Foto 3: Arah Aliran Keluar", type: "photo", required: true, sortOrder: 10 },
        { fieldId: "B5_jenis", label: "Jenis/Tipe Mata Air", type: "select", required: true, options: JSON.stringify(["Memancar","Genangan","Lereng/Tebing","Celah Batu","Tidak Yakin"]), sortOrder: 11 },
        { fieldId: "B6_aliran", label: "Aliran Air", type: "select", required: true, options: JSON.stringify(["Stabil Sepanjang Tahun","Berkurang saat Kemarau","Naik Turun","Kering Total","Tidak Tahu"]), sortOrder: 12 },
        { fieldId: "B7_debit_5th", label: "Perbandingan Debit 5 Tahun Lalu", type: "select", required: false, options: JSON.stringify(["Bertambah","Sama","Berkurang","Tidak Tahu"]), sortOrder: 13 },
        { fieldId: "B8_tahun_kering", label: "Tahun Mulai Kering (jika kering total)", type: "number", required: false, sortOrder: 14 },
        { fieldId: "B9_dulu_untuk", label: "Dulu Air Dimanfaatkan Untuk", type: "text", required: false, sortOrder: 15 },
        { fieldId: "C1_warna", label: "Warna Air", type: "select", required: true, options: JSON.stringify(["Bening","Agak Keruh","Keruh","Kekuningan","Kehijauan"]), sortOrder: 16 },
        { fieldId: "C2_lahan", label: "Pemanfaatan Lahan (radius 50m)", type: "select", required: true, options: JSON.stringify(["Pemukiman","Pertanian","Lahan Hijau","Semak Belukar","Air","Industri","Tambang","Lahan Kosong"]), sortOrder: 17 },
        { fieldId: "C3_tutupan", label: "Tutupan Lahan (radius 50m)", type: "select", required: true, options: JSON.stringify(["Air","Pepohonan","Rerumputan","Tanaman Pertanian","Semak","Area Terbangun","Lahan Kosong","Vegetasi Tergenang"]), sortOrder: 18 },
        { fieldId: "C4_pemanfaatan", label: "Pemanfaatan Air Saat Ini", type: "multiselect", required: true, options: JSON.stringify(["Irigasi","Air Minum Warga","Air Minum Desa Lain","Mandi Cuci","Kolam Ikan","Wisata","Cadangan Kemarau","Adat","Tidak Dimanfaatkan","Tidak Tahu"]), sortOrder: 19 },
        { fieldId: "C5_jumlah_kk", label: "Perkiraan Jumlah KK Pengguna", type: "select", required: false, options: JSON.stringify(["<10 KK","10-50 KK","50-100 KK","100-1000 KK",">1000 KK","Tidak Tahu"]), sortOrder: 20 },
        { fieldId: "C6_ancaman", label: "Terlihat Ancaman?", type: "select", required: true, options: JSON.stringify(["Tidak Ada","Ya"]), sortOrder: 21 },
        { fieldId: "C7_jenis_ancaman", label: "Jenis Ancaman", type: "multiselect", required: false, options: JSON.stringify(["Pestisida","Mandi di Sumber","Toilet <11m","Sampah Plastik","Sumur Dalam","Kandang Ternak","Bangunan Beton","Over-ekstraksi","Tambang","Lainnya"]), sortOrder: 22 },
        { fieldId: "C8_sumber_info", label: "Sumber Informasi", type: "select", required: true, options: JSON.stringify(["Observasi Sendiri","Warga Sekitar","Orang Tua/Desa","Kelompok Masyarakat","Aparat Desa"]), sortOrder: 23 },
        { fieldId: "D1_ph", label: "pH Air", type: "text", required: false, sortOrder: 24 },
        { fieldId: "D2_suhu", label: "Suhu Air (°C)", type: "text", required: false, sortOrder: 25 },
        { fieldId: "D3_tds", label: "TDS (ppm)", type: "text", required: false, sortOrder: 26 },
        { fieldId: "D4_ec", label: "EC/DHL (µS/cm)", type: "text", required: false, sortOrder: 27 },
        { fieldId: "D5_debit_liter", label: "Debit Air (liter/detik)", type: "text", required: false, sortOrder: 28 },
        { fieldId: "D6_debit_visual", label: "Estimasi Debit Visual", type: "select", required: false, options: JSON.stringify(["Menetes","Kecil","Sedang","Besar","Tidak Diukur"]), sortOrder: 29 },
        { fieldId: "E1_cerita", label: "Cerita/Sejarah/Mitos (opsional)", type: "textarea", required: false, sortOrder: 30 },
        { fieldId: "E2_tindak_lanjut", label: "Bersedia Aksi Tindak Lanjut?", type: "select", required: true, options: JSON.stringify(["Ya","Belum Tahu","Tidak"]), sortOrder: 31 },
        { fieldId: "E3_aksi", label: "Aksi yang Dibutuhkan", type: "multiselect", required: false, options: JSON.stringify(["Pembersihan Sedimen","Penanaman Pohon","Pembuatan Rorak","Perlindungan Regulasi","Lapor Desa/Dinas","Lainnya"]), sortOrder: 32 },
      ],
    },
    {
      slug: "spring-restoration", title: "Restorasi Mata Air", points: 1000, type: "restoration",
      fields: [
        { fieldId: "A_tanggal", label: "Tanggal Kegiatan", type: "date", required: true, sortOrder: 1 },
        { fieldId: "A_nama", label: "Nama Koordinator", type: "text", required: true, sortOrder: 2 },
        { fieldId: "A_wa", label: "Nomor WA", type: "phone", required: true, sortOrder: 3 },
        { fieldId: "A_organisasi", label: "Nama Organisasi/Komunitas", type: "text", required: false, sortOrder: 4 },
        { fieldId: "A_geotag", label: "Geotag", type: "location", required: true, sortOrder: 5 },
        { fieldId: "S1_spring", label: "Mata Air", type: "text", required: true, sortOrder: 6 },
        { fieldId: "S2_kondisi", label: "Kondisi Sebelum Restorasi", type: "select", required: true, options: JSON.stringify(["Mati/Kering","Debit Mengecil","Tertimbun Sedimen","Tercemar","Rusak Fisik","Terbengkalai","Lainnya"]), sortOrder: 7 },
        { fieldId: "S3_foto_sebelum", label: "Foto SEBELUM Restorasi", type: "photo", required: true, sortOrder: 8 },
        { fieldId: "S3_foto_sesudah", label: "Foto SESUDAH Restorasi", type: "photo", required: true, sortOrder: 9 },
        { fieldId: "S3_foto_proses", label: "Foto Proses Kegiatan", type: "photo", required: false, sortOrder: 10 },
        { fieldId: "S4_kegiatan", label: "Jenis Kegiatan Restorasi", type: "multiselect", required: true, options: JSON.stringify(["Pembersihan Sedimen","Pembersihan Sampah","Pembuatan Rorak","Pembuatan Embung","Perlindungan Fisik","Penanaman Pohon","Edukasi Masyarakat","Advokasi Regulasi","Lainnya"]), sortOrder: 11 },
        { fieldId: "S5_relawan", label: "Jumlah Relawan", type: "number", required: true, sortOrder: 12 },
        { fieldId: "S6_durasi", label: "Durasi Kegiatan", type: "select", required: true, options: JSON.stringify(["1 Hari","2-7 Hari","Lebih dari 7 Hari"]), sortOrder: 13 },
      ],
    },
    {
      slug: "trench-development", title: "Pembuatan Rorak", points: 500, type: "restoration",
      fields: [
        { fieldId: "A_tanggal", label: "Tanggal Kegiatan", type: "date", required: true, sortOrder: 1 },
        { fieldId: "A_nama", label: "Nama Pelapor", type: "text", required: true, sortOrder: 2 },
        { fieldId: "A_wa", label: "Nomor WA", type: "phone", required: true, sortOrder: 3 },
        { fieldId: "A_kegiatan", label: "Nama Kegiatan/Organisasi", type: "text", required: false, sortOrder: 4 },
        { fieldId: "A_geotag", label: "Geotag", type: "location", required: true, sortOrder: 5 },
        { fieldId: "A_akurasi_gps", label: "Akurasi GPS (maks 15m)", type: "number", required: true, sortOrder: 6 },
        { fieldId: "A_kode_event", label: "Kode Event", type: "text", required: false, sortOrder: 7 },
        { fieldId: "A_kode_spring", label: "Kode Mata Air Terkait", type: "text", required: false, sortOrder: 8 },
        { fieldId: "R1_jenis", label: "Jenis Struktur Resapan", type: "select", required: true, options: JSON.stringify(["Rorak/Parit Resapan","Sumur Resapan","Biopori","Lainnya"]), sortOrder: 9 },
        { fieldId: "R2_bentuk", label: "Bentuk Penampang", type: "select", required: true, options: JSON.stringify(["Silinder/Bulat","Kotak/Persegi"]), sortOrder: 10 },
        { fieldId: "R3_diameter", label: "Diameter (cm) — silinder", type: "number", required: false, sortOrder: 11 },
        { fieldId: "R3_kedalaman_silinder", label: "Kedalaman (cm) — silinder", type: "number", required: false, sortOrder: 12 },
        { fieldId: "R3_panjang", label: "Panjang (cm) — kotak", type: "number", required: false, sortOrder: 13 },
        { fieldId: "R3_lebar", label: "Lebar (cm) — kotak", type: "number", required: false, sortOrder: 14 },
        { fieldId: "R3_kedalaman_kotak", label: "Kedalaman (cm) — kotak", type: "number", required: false, sortOrder: 15 },
        { fieldId: "R4_foto", label: "Foto Rorak", type: "photo", required: true, sortOrder: 16 },
        { fieldId: "R5_posisi", label: "Posisi Rorak", type: "select", required: true, options: JSON.stringify(["Area Resapan","Pinggir Jalan","Di Antara Tanaman","Lereng","Lainnya"]), sortOrder: 17 },
        { fieldId: "R6_bahan", label: "Isi Bahan", type: "select", required: false, options: JSON.stringify(["Kosong","Batu/Ijuk","Daun/Seresah/Kompos","Lainnya"]), sortOrder: 18 },
      ],
    },
    {
      slug: "tree-planting", title: "Tanam Pohon", points: 100, type: "restoration",
      fields: [
        { fieldId: "A_tanggal", label: "Tanggal Kegiatan", type: "date", required: true, placeholder: "", sortOrder: 1 },
        { fieldId: "A_nama", label: "Nama Pelapor", type: "text", required: true, placeholder: "", sortOrder: 2 },
        { fieldId: "A_wa", label: "Nomor WA", type: "phone", required: true, placeholder: "08xxx atau +62xxx", sortOrder: 3 },
        { fieldId: "A_kegiatan", label: "Nama Kegiatan/Organisasi", type: "text", required: false, placeholder: "", sortOrder: 4 },
        { fieldId: "A_geotag", label: "Geotag", type: "location", required: true, sortOrder: 5 },
        { fieldId: "A_akurasi_gps", label: "Akurasi GPS (maks 15m)", type: "number", required: true, placeholder: "", sortOrder: 6 },
        { fieldId: "A_kode_event", label: "Kode Event Penanaman", type: "text", required: false, placeholder: "", sortOrder: 7 },
        { fieldId: "A_kode_spring", label: "Kode Mata Air Terkait", type: "text", required: false, placeholder: "", sortOrder: 8 },
        { fieldId: "T_nama_lokal", label: "Nama Lokal Pohon", type: "text", required: true, placeholder: "cth: Beringin, Kaliandra", sortOrder: 9 },
        { fieldId: "T_nama_ilmiah", label: "Nama Ilmiah", type: "text", required: false, placeholder: "opsional", sortOrder: 10 },
        { fieldId: "T_foto", label: "Foto Pohon (ajir/marker terlihat)", type: "photo", required: true, helpText: "1 foto per pohon", sortOrder: 11 },
        { fieldId: "T_tinggi", label: "Tinggi Bibit", type: "select", required: true, options: JSON.stringify(["<30 cm","30-100 cm","100-200 cm",">200 cm"]), placeholder: "", sortOrder: 12 },
        { fieldId: "T_sumber", label: "Sumber Bibit", type: "select", required: true, options: JSON.stringify(["Pembibitan Sendiri","Bantuan Dinas","Tidak Tahu","Membeli","Donasi/CSR/Komunitas"]), placeholder: "", sortOrder: 13 },
        { fieldId: "T_lokasi_tanam", label: "Jenis Lokasi Tanam", type: "select", required: true, options: JSON.stringify(["Sekitar Mata Air","Lahan Kritis","Pekarangan","Fasilitas Umum","Lahan Pertanian","Bantaran Sungai","Lainnya"]), placeholder: "", sortOrder: 14 },
        { fieldId: "T_tag", label: "Nomor Tag Pohon", type: "text", required: false, placeholder: "opsional", sortOrder: 15 },
        { fieldId: "T_catatan", label: "Catatan", type: "textarea", required: false, placeholder: "Kondisi tanah, jarak tanam, dll", sortOrder: 16 },
      ],
    },
    {
      slug: "seedling-stock", title: "Stok Bibit", points: 100, type: "monitoring",
      fields: [
        { fieldId: "A_tanggal", label: "Tanggal", type: "date", required: true, sortOrder: 1 },
        { fieldId: "A_nama", label: "Nama Narahubung", type: "text", required: true, sortOrder: 2 },
        { fieldId: "A_wa", label: "Nomor WA", type: "phone", required: true, sortOrder: 3 },
        { fieldId: "A_organisasi", label: "Nama Organisasi/Komunitas", type: "text", required: false, sortOrder: 4 },
        { fieldId: "A_geotag", label: "Geotag (lokasi bibit)", type: "location", required: true, sortOrder: 5 },
        { fieldId: "A_entri_baru", label: "Entri Baru atau Pembaruan?", type: "select", required: true, options: JSON.stringify(["Entri Baru","Pembaruan Stok"]), sortOrder: 6 },
        { fieldId: "A_kode_stok", label: "Kode Stok (jika pembaruan)", type: "text", required: false, sortOrder: 7 },
        { fieldId: "B1_jenis_laporan", label: "Jenis Laporan", type: "select", required: true, options: JSON.stringify(["STOK TERSEDIA","BIBIT DIBUTUHKAN"]), sortOrder: 8 },
        { fieldId: "B2_nama_lokal", label: "Nama Lokal Tanaman", type: "text", required: true, sortOrder: 9 },
        { fieldId: "B2_nama_ilmiah", label: "Nama Ilmiah", type: "text", required: false, sortOrder: 10 },
        { fieldId: "B3_jumlah", label: "Jumlah Bibit", type: "number", required: true, sortOrder: 11 },
        { fieldId: "B3_akurasi", label: "Akurasi Jumlah", type: "select", required: false, options: JSON.stringify(["Angka Pasti","Perkiraan"]), sortOrder: 12 },
        { fieldId: "C1_foto", label: "Foto Bibit", type: "photo", required: true, sortOrder: 13 },
        { fieldId: "C2_tinggi", label: "Tinggi Bibit Saat Ini", type: "select", required: false, options: JSON.stringify(["<30 cm","30-100 cm",">100 cm","Campuran"]), sortOrder: 14 },
        { fieldId: "C3_bentuk", label: "Bentuk Bibit", type: "select", required: false, options: JSON.stringify(["Polybag","Cabutan","Biji/Benih","Hasil Relokasi","Lainnya"]), sortOrder: 15 },
        { fieldId: "C4_kesiapan", label: "Kesiapan Tanam", type: "select", required: false, options: JSON.stringify(["Siap Tanam Sekarang","1-2 Minggu Lagi",">1 Bulan Lagi"]), sortOrder: 16 },
      ],
    },
  ];

  const createdForms: Record<string, string> = {};
  for (const fd of formDefs) {
    const form = await prisma.form.create({
      data: {
        slug: fd.slug,
        title: fd.title,
        pointsOnSubmit: fd.points,
        contributionType: fd.type,
        isActive: true,
        sortOrder: formDefs.indexOf(fd) + 1,
      },
    });
    createdForms[fd.slug] = form.id;

    for (const f of fd.fields) {
      await prisma.formField.create({
        data: { formId: form.id, ...f },
      });
    }
  }
  console.log(`   ✅ ${formDefs.length} forms with ${formDefs.reduce((a, f) => a + f.fields.length, 0)} fields created\n`);

  // ── 4. Reports with Photos ──────────────────────────────────────────────
  const reportData = [
    { spring: 0, user: 2, slug: "spring-monitoring", status: "approved", fieldData: { spring_name: "Sumber Umbul", province: "Jawa Timur", regency: "Malang", water_condition: "Jernih", debit_estimate: "Besar (>5 L/dtk)", vegetation: "Rimbun", notes: "Air mengalir deras, vegetasi sekitar masih bagus. Ada kegiatan warga mencuci." }, photos: ["Monitoring Sumber Umbul 1", "Monitoring Sumber Umbul 2", "Monitoring Sumber Umbul 3"] },
    { spring: 0, user: 2, slug: "spring-monitoring", status: "approved", fieldData: { spring_name: "Sumber Umbul", province: "Jawa Timur", regency: "Malang", water_condition: "Jernih", debit_estimate: "Sedang (1-5 L/dtk)", vegetation: "Rimbun", notes: "Debit menurun dibanding bulan lalu, perlu dipantau lebih lanjut." }, photos: ["Sumber Umbul Follow Up 1", "Sumber Umbul Follow Up 2", "Sumber Umbul Follow Up 3"] },
    { spring: 1, user: 1, slug: "spring-monitoring", status: "approved", fieldData: { spring_name: "Mata Air Ciburial", province: "Jawa Barat", regency: "Bandung", water_condition: "Keruh", debit_estimate: "Kecil (<1 L/dtk)", vegetation: "Sedang", notes: "Air mulai keruh, kemungkinan akibat aktivitas tambang di hulu." }, photos: ["Ciburial 1", "Ciburial 2", "Ciburial 3"] },
    { spring: 2, user: 3, slug: "spring-restoration", status: "approved", fieldData: { spring_name: "Sumber Telaga", province: "Jawa Timur", regency: "Banyuwangi", restoration_type: "Pembersihan", volunteers_count: "20", work_hours: "5", materials_used: "Cangkul, sabit, karung, bambu", notes: "Berhasil membersihkan 200m saluran air dan membuat bak penampung baru." }, photos: ["Restorasi Telaga Before", "Restorasi Telaga After 1", "Restorasi Telaga After 2", "Restorasi Telaga After 3", "Restorasi Telaga After 4"] },
    { spring: 3, user: 4, slug: "spring-monitoring", status: "approved", fieldData: { spring_name: "Tirta Empul", province: "Bali", regency: "Gianyar", water_condition: "Jernih", debit_estimate: "Besar (>5 L/dtk)", vegetation: "Rimbun", notes: "Mata air suci yang terjaga dengan baik. Banyak dikunjungi wisatawan." }, photos: ["Tirta Empul 1", "Tirta Empul 2", "Tirta Empul 3"] },
    { spring: 4, user: 1, slug: "tree-planting", status: "approved", fieldData: { A_tanggal: "15/06/2026", A_nama: "Dimas Eko", A_wa: "08123456789", A_kegiatan: "Penghijauan Hulu", A_akurasi_gps: "5", T_nama_lokal: "Beringin", T_nama_ilmiah: "Ficus benjamina", T_tinggi: "30-100 cm", T_sumber: "Pembibitan Sendiri", T_lokasi_tanam: "Sekitar Mata Air", T_catatan: "Penanaman di area resapan hulu mata air." }, photos: ["Tree Planting Maron 1", "Tree Planting Maron 2", "Tree Planting Maron 3"] },
    { spring: 5, user: 2, slug: "trench-development", status: "approved", fieldData: { spring_name: "Belik Soka", province: "DI Yogyakarta", regency: "Gunung Kidul", trench_count: "8", trench_length: "4", trench_depth: "60", notes: "Pembuatan rorak di lahan miring untuk resapan air hujan." }, photos: ["Trench Soka 1", "Trench Soka 2", "Trench Soka 3"] },
    { spring: 6, user: 3, slug: "seedling-stock", status: "approved", fieldData: { spring_name: "Sumber Gempol", province: "Jawa Timur", regency: "Pasuruan", seedling_count: "350", species_available: "Bambu, Sengon, Mahoni, Jati", seedling_condition: "Baik", notes: "Persemaian desa siap distribusi untuk musim tanam ini." }, photos: ["Seedling Gempol 1", "Seedling Gempol 2", "Seedling Gempol 3"] },
    { spring: 7, user: 4, slug: "spring-monitoring", status: "approved", fieldData: { spring_name: "Cipanas", province: "Jawa Barat", regency: "Cianjur", water_condition: "Jernih", debit_estimate: "Sedang (1-5 L/dtk)", vegetation: "Sedang", notes: "Pemukiman mulai mendekati area mata air. Perlu batas zona." }, photos: ["Cipanas 1", "Cipanas 2", "Cipanas 3"] },
    { spring: 8, user: 1, slug: "spring-restoration", status: "approved", fieldData: { spring_name: "Sumber Brantas", province: "Jawa Timur", regency: "Kota Batu", restoration_type: "Pembuatan Bak Penampung", volunteers_count: "12", work_hours: "6", materials_used: "Semen 10 sak, batu split 2m³, pasir 1m³", notes: "Pembuatan bak penampung 4x3x2 meter untuk tampungan air warga." }, photos: ["Brantas Restoration 1", "Brantas Restoration 2", "Brantas Restoration 3"] },
    { spring: 9, user: 2, slug: "tree-planting", status: "approved", fieldData: { A_tanggal: "10/06/2026", A_nama: "Cecilia K", A_wa: "08123456788", A_kegiatan: "Reboisasi DAS", A_akurasi_gps: "8", T_nama_lokal: "Mahoni", T_nama_ilmiah: "Swietenia mahagoni", T_tinggi: "100-200 cm", T_sumber: "Donasi/CSR/Komunitas", T_lokasi_tanam: "Bantaran Sungai", T_catatan: "Penanaman di bantaran sungai yang memasok mata air." }, photos: ["Kalibayem 1", "Kalibayem 2", "Kalibayem 3", "Kalibayem 4"] },
    { spring: 10, user: 3, slug: "trench-development", status: "approved", fieldData: { spring_name: "Sumber Taman", province: "Jawa Timur", regency: "Mojokerto", trench_count: "15", trench_length: "3", trench_depth: "50", notes: "Rorak di kebun warga. Semua parit terisi saat hujan pertama." }, photos: ["Taman Trench 1", "Taman Trench 2", "Taman Trench 3"] },
    { spring: 11, user: 4, slug: "spring-monitoring", status: "approved", fieldData: { spring_name: "Tirta Gangga", province: "Bali", regency: "Karangasem", water_condition: "Jernih", debit_estimate: "Besar (>5 L/dtk)", vegetation: "Rimbun", notes: "Mata air yang jadi sumber irigasi sawah di tiga desa." }, photos: ["Tirta Gangga 1", "Tirta Gangga 2", "Tirta Gangga 3"] },
    { spring: 0, user: 3, slug: "spring-monitoring", status: "pending", fieldData: { spring_name: "Sumber Umbul", province: "Jawa Timur", regency: "Malang", water_condition: "Jernih", debit_estimate: "Sedang (1-5 L/dtk)", vegetation: "Rimbun", notes: "Laporan rutin mingguan." }, photos: ["Routine 1", "Routine 2", "Routine 3"] },
    { spring: 2, user: 2, slug: "spring-restoration", status: "pending", fieldData: { spring_name: "Sumber Telaga", province: "Jawa Timur", regency: "Banyuwangi", restoration_type: "Drainase", volunteers_count: "8", work_hours: "3", materials_used: "Bambu, batu kali", notes: "Perbaikan drainase sisi timur." }, photos: ["Telaga Drainase 1", "Telaga Drainase 2", "Telaga Drainase 3"] },
  ];

  const createdReports = [];
  for (const rd of reportData) {
    const spring = createdSprings[rd.spring];
    const user = users[rd.user];
    const r = await prisma.report.create({
      data: {
        userId: user.id,
        formSlug: rd.slug,
        status: rd.status as any,
        isActive: true,
        fieldData: JSON.stringify(rd.fieldData),
        snappedLat: spring.snappedLat,
        snappedLng: spring.snappedLng,
        preciseLat: spring.snappedLat,
        preciseLng: spring.snappedLng,
        springId: spring.id,
        featuredPhotoId: "",
      },
    });

    // Create photos with placeholder images
    const photoRecords = [];
    for (let pi = 0; pi < rd.photos.length; pi++) {
      const slugShort = rd.slug.replace("spring-", "").replace("trench-", "trench").replace("tree-", "tree");
      const label = rd.photos[pi];
      const bg = pi === 0 && rd.slug === "spring-restoration" ? "92400e" : "059669";
      const photo = await prisma.reportPhoto.create({
        data: {
          reportId: r.id,
          fieldId: pi === 0 ? "featured" : "photo",
          storagePath: img(label, 800, 600, bg),
          mimeType: "image/jpeg",
          width: 800,
          height: 600,
        },
      });
      photoRecords.push(photo);
    }

    // Set featured photo to the first one
    if (photoRecords.length > 0) {
      await prisma.report.update({
        where: { id: r.id },
        data: { featuredPhotoId: photoRecords[0].id },
      });
    }

    createdReports.push(r);
  }
  console.log(`   ✅ ${createdReports.length} reports created with ${reportData.reduce((a, r) => a + r.photos.length, 0)} photos\n`);

  // ── 5. Points Log ──────────────────────────────────────────────────────
  for (const r of createdReports) {
    const report = reportData[createdReports.indexOf(r)];
    if (report.status === "approved") {
      const formDef = formDefs.find((f) => f.slug === report.slug)!;
      await prisma.pointsLog.create({
        data: {
          userId: users[report.user].id,
          reportId: r.id,
          amount: formDef.points,
          reason: `Laporan ${formDef.title} di-approve`,
          metadata: JSON.stringify({ formSlug: report.slug }),
        },
      });
    }
  }
  console.log(`   ✅ Points logged for ${createdReports.filter((_, i) => reportData[i].status === "approved").length} approved reports\n`);

  // ── 6. Projects ────────────────────────────────────────────────────────
  const projects = [
    {
      user: 2, title: "Restorasi Sumber Umbul", summary: "Proyek restorasi komprehensif Sumber Umbul di Malang: pembersihan saluran, pembuatan bak penampung, dan reboisasi area resapan seluas 2 hektar.", region: "Malang, Jawa Timur", typeId: "spring-restoration", goal: 25000000, raised: 18750000, status: "approved",
    },
    {
      user: 1, title: "Penghijauan DAS Ciburial", summary: "Penanaman 5.000 pohon endemik di Daerah Aliran Sungai (DAS) Ciburial, Bandung, untuk melindungi mata air dan mencegah erosi.", region: "Bandung, Jawa Barat", typeId: "tree-planting", goal: 15000000, raised: 5250000, status: "approved",
    },
    {
      user: 3, title: "Program Bibit Desa Gempol", summary: "Pengembangan persemaian desa mampu produksi 10.000 bibit/tahun untuk restorasi mata air di kawasan Pasuruan dan sekitarnya.", region: "Pasuruan, Jawa Timur", typeId: "seedling-stock", goal: 8000000, raised: 3200000, status: "approved",
    },
    {
      user: 4, title: "Rorak untuk Resapan", summary: "Pembangunan 100 unit rorak (parit resapan) di area pertanian sekitar Belik Soka, Gunung Kidul, untuk meningkatkan recharge air tanah.", region: "Gunung Kidul, DIY", typeId: "trench-development", goal: 5000000, raised: 1000000, status: "approved",
    },
  ];

  for (const p of projects) {
    await prisma.project.create({
      data: {
        userId: users[p.user].id,
        title: p.title,
        summary: p.summary,
        region: p.region,
        typeId: p.typeId,
        status: p.status as any,
        goalAmount: p.goal,
        raisedAmount: p.raised,
        likes: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 10),
        contactName: users[p.user].username,
        contactEmail: users[p.user].email,
        contactPhone: users[p.user].phone || "",
      },
    });
  }
  console.log(`   ✅ ${projects.length} projects created\n`);

  // ── 7. Donations ──────────────────────────────────────────────────────
  const donations = [
    { user: 1, name: "Yayasan Hijau Lestari", amount: 5000000, tier: "supporter" },
    { user: 0, name: "PT Alam Sejahtera", amount: 10000000, tier: "guardian" },
    { user: 0, name: "Komunitas Pecinta Alam", amount: 2500000, tier: "friend" },
    { user: 0, name: "Budi Santoso", amount: 150000, tier: "explorer" },
    { user: 0, name: "Siti Nurhaliza", amount: 50000, tier: "explorer" },
    { user: 0, name: "Made Wijaya", amount: 500000, tier: "friend" },
  ];

  for (const d of donations) {
    await prisma.donation.create({
      data: {
        userId: d.user === 0 ? null : users[d.user].id,
        projectId: undefined, // general donation
        invoiceId: `INV-DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        externalId: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        amountIdr: d.amount,
        tierId: d.tier,
        donorName: d.name,
        donorEmail: d.name.toLowerCase().replace(/\s/g, ".") + "@email.demo",
        status: "paid",
        paidAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000),
      },
    });
  }
  console.log(`   ✅ ${donations.length} donations created\n`);

  // ── 8. Course (recreate with modules) ──────────────────────────────────
  const courses = [
    {
      slug: "pengenalan-mata-air",
      title: "Pengenalan Mata Air",
      description: "Pelajari dasar-dasar ekosistem mata air, jenis-jenisnya, dan mengapa mata air penting bagi kehidupan dan lingkungan di Indonesia.",
      level: "Beginner", duration: "30 menit", icon: "Droplets", sortOrder: 1,
      modules: [
        { title: "Apa Itu Mata Air?", content: "<h2>Apa Itu Mata Air?</h2><p>Mata air adalah titik di permukaan bumi di mana air tanah mengalir secara alami keluar dari akuifer. Indonesia memiliki ribuan mata air yang menjadi sumber air bersih bagi jutaan masyarakat.</p><h3>Jenis-jenis Mata Air</h3><ul><li><strong>Mata air gravitasi</strong>: air mengalir karena gravitasi dari lapisan yang lebih tinggi</li><li><strong>Mata air artesis</strong>: air muncul karena tekanan dari akuifer tertekan</li><li><strong>Mata air celah</strong>: air keluar dari retakan batuan</li></ul>", sortOrder: 1 },
        { title: "Ekosistem Mata Air", content: "<h2>Ekosistem Mata Air</h2><p>Ekosistem mata air memiliki karakteristik unik: suhu air konstan, kandungan oksigen tinggi, dan menjadi habitat spesies endemik. Vegetasi di sekitar mata air seperti beringin dan bambu membantu menyaring air dan menjaga kestabilan tanah.</p>", sortOrder: 2 },
        { title: "Ancaman terhadap Mata Air", content: "<h2>Ancaman terhadap Mata Air</h2><p>Mata air di Indonesia menghadapi ancaman: alih fungsi lahan, pencemaran, eksploitasi berlebihan, perubahan iklim, dan penambangan. Di Jawa Barat, lebih dari 30% mata air mengalami penurunan debit dalam 10 tahun terakhir.</p>", sortOrder: 3 },
        { title: "Cara Melindungi Mata Air", content: "<h2>Cara Melindungi Mata Air</h2><ol><li>Jaga kebersihan sekitar mata air</li><li>Tanam pohon endemik di area resapan</li><li>Hindari pupuk kimia di lahan dekat mata air</li><li>Laporkan kerusakan via SpringHub</li><li>Edukasi masyarakat tentang pentingnya mata air</li></ol>", sortOrder: 4 },
      ],
    },
    {
      slug: "panduan-menanam-pohon-endemik",
      title: "Panduan Menanam Pohon Endemik",
      description: "Panduan lengkap memilih lokasi, menanam, dan merawat pohon endemik Indonesia di area resapan mata air.",
      level: "Intermediate", duration: "45 menit", icon: "Tree", sortOrder: 2,
      modules: [
        { title: "Mengapa Pohon Endemik?", content: "<h2>Mengapa Pohon Endemik?</h2><p>Pohon endemik sudah beradaptasi dengan iklim setempat, mendukung ekosistem lokal, tidak perlu pupuk intensif, dan memiliki akar kuat untuk recharge air tanah. Contoh: Beringin, Kaliandra, Sengon, Bambu.</p>", sortOrder: 1 },
        { title: "Pemilihan Lokasi Tanam", content: "<h2>Pemilihan Lokasi Tanam</h2><p>Kriteria lokasi ideal: jarak 10-50m dari mata air, kemiringan maks 30 derajat, tidak tergenang, dan akses untuk perawatan. Prioritas di kawasan resapan hulu dan tepian sungai.</p>", sortOrder: 2 },
        { title: "Teknik Penanaman", content: "<h2>Teknik Penanaman</h2><ol><li>Buat lubang 30x30x30 cm</li><li>Campur tanah dengan kompos (2:1)</li><li>Buka polybag hati-hati</li><li>Tanam tegak lurus</li><li>Siram 2-5 liter per bibit</li><li>Mulsa dengan jerami/daun kering</li></ol><p>Waktu terbaik: awal musim hujan (Okt-Des).</p>", sortOrder: 3 },
        { title: "Perawatan dan Monitoring", content: "<h2>Perawatan dan Monitoring</h2><table border='1'><tr><th>Periode</th><th>Kegiatan</th></tr><tr><td>1-3 bln</td><td>Siram 2 hari sekali, periksa hama</td></tr><tr><td>4-6 bln</td><td>Siram 1 minggu sekali, pupuk organik</td></tr><tr><td>7-12 bln</td><td>Siram saat kering, pangkas cabang</td></tr><tr><td>2 thn+</td><td>Monitoring, ganti pohon mati</td></tr></table>", sortOrder: 4 },
      ],
    },
    {
      slug: "panduan-form-laporan",
      title: "Panduan Form Laporan SpringHub",
      description: "Pelajari cara menggunakan kelima form SpringHub dan cara mendapatkan poin maksimal.",
      level: "Beginner", duration: "20 menit", icon: "FileText", sortOrder: 3,
      modules: [
        { title: "Mengenal Form SpringHub", content: "<h2>Mengenal Form SpringHub</h2><ul><li><strong>Spring Monitoring (+25 pts)</strong>: pantau kondisi mata air</li><li><strong>Spring Restoration (+100 pts)</strong>: laporkan restorasi</li><li><strong>Trench Development (+50 pts)</strong>: catat parit resapan</li><li><strong>Tree Planting (+50 pts)</strong>: lapor penanaman pohon</li><li><strong>Seedling Stock (+15 pts)</strong>: catat stok bibit</li></ul>", sortOrder: 1 },
        { title: "Tips Laporan Berkualitas", content: "<h2>Tips Laporan Berkualitas</h2><ul><li>Foto jelas dengan pencahayaan cukup</li><li>Aktifkan GPS untuk lokasi akurat</li><li>Deskripsi detail kondisi mata air</li><li>Laporan rutin untuk streak poin</li><li>Sertakan foto before-after</li></ul><h3>Bonus Poin</h3><ul><li>Streak 3 hari: +5 pts</li><li>Streak 7 hari: +50 pts</li><li>Foto before-after: +15 pts</li><li>Penemuan baru: +50 pts</li><li>Milestone: +50 s.d. +500 pts</li></ul>", sortOrder: 2 },
      ],
    },
  ];

  for (const cd of courses) {
    const course = await prisma.course.create({
      data: {
        slug: cd.slug, title: cd.title, description: cd.description,
        level: cd.level, duration: cd.duration, icon: cd.icon,
        sortOrder: cd.sortOrder, isActive: true,
      },
    });
    for (const m of cd.modules) {
      await prisma.courseModule.create({
        data: { courseId: course.id, title: m.title, content: m.content, sortOrder: m.sortOrder },
      });
    }
  }
  console.log(`   ✅ ${courses.length} courses with ${courses.reduce((a, c) => a + c.modules.length, 0)} modules\n`);

  // ── 9. Content Blocks ──────────────────────────────────────────────────
  const contentBlocks = [
    { section: "media", type: "video", title: "Jaga Semesta — Restorasi Mata Air", subtitle: "Apr 2026", description: "Perjalanan komunitas merestorasi mata air dari Bali sampai Madura.", imageUrl: img("Jaga Semesta", 640, 360, "1e40af"), linkUrl: "#", linkLabel: "Tonton Video", sortOrder: 1 },
    { section: "media", type: "event", title: "Restorasi Sumber Sabrangan, Mojokerto", subtitle: "30 Des 2025", description: "Kegiatan kolektif membersihkan sedimen dan menanam ribuan bibit bambu.", imageUrl: img("Restorasi Mojokerto", 640, 360, "854d0e"), linkUrl: "#", linkLabel: "Baca selengkapnya", sortOrder: 2 },
    { section: "media", type: "publication", title: "Laporan Dampak 2025", subtitle: "Jan 2026", description: "200+ mata air terlindungi di tujuh provinsi.", imageUrl: img("Laporan 2025", 640, 360, "115e59"), linkUrl: "#", linkLabel: "Unduh PDF", sortOrder: 3 },
    { section: "media", type: "press", title: "Kompas: Sumber Air di Kebumen Diselamatkan Warga", subtitle: "Jan 2026", description: "Warga Kebumen menolak tambang dan menjaga 28 titik mata air karst.", imageUrl: img("Kebumen", 640, 360, "6b21a8"), linkUrl: "#", linkLabel: "Baca artikel", sortOrder: 4 },
  ];

  for (const cb of contentBlocks) {
    await prisma.contentBlock.create({ data: cb });
  }
  console.log(`   ✅ ${contentBlocks.length} content blocks\n`);

  // ── 10. Point Rules ────────────────────────────────────────────────────
  const pointRules = [
    { name: "Survei Mata Air", description: "Laporan survei mata air", points: 100, category: "basic", icon: "Eye", sortOrder: 1 },
    { name: "Restorasi Mata Air", description: "Laporan restorasi mata air", points: 1000, category: "basic", icon: "Heart", sortOrder: 2 },
    { name: "Rorak / Parit Resapan", description: "Pembuatan rorak", points: 500, category: "basic", icon: "Triangle", sortOrder: 3 },
    { name: "Tanam Pohon", description: "Penanaman pohon", points: 100, category: "basic", icon: "Tree", sortOrder: 4 },
    { name: "Stok Bibit", description: "Laporan stok bibit", points: 100, category: "basic", icon: "Sprout", sortOrder: 5 },
    { name: "Streak 3 Hari", description: "Lapor 3 hari berturut-turut", points: 25, category: "bonus", icon: "Star", sortOrder: 6 },
    { name: "Streak Mingguan", description: "Lapor seminggu penuh", points: 100, category: "bonus", icon: "Zap", sortOrder: 7 },
    { name: "Laporan Lengkap", description: "Mengisi seluruh field", points: 50, category: "bonus", icon: "Check", sortOrder: 8 },
    { name: "Foto Before/After", description: "Minimal 2 foto", points: 50, category: "bonus", icon: "Camera", sortOrder: 9 },
    { name: "Penemu (Discovery)", description: "Mata air baru pertama kali", points: 200, category: "bonus", icon: "Compass", sortOrder: 10 },
    { name: "Milestone 10 Laporan", description: "10 laporan di-approve", points: 250, category: "milestone", icon: "Medal", sortOrder: 11 },
    { name: "Milestone 50 Laporan", description: "50 laporan di-approve", points: 1000, category: "milestone", icon: "Award", sortOrder: 12 },
    { name: "Milestone 100 Laporan", description: "100 laporan di-approve", points: 5000, category: "milestone", icon: "Trophy", sortOrder: 13 },
    { name: "Milestone 500 Laporan", description: "500 laporan di-approve", points: 25000, category: "milestone", icon: "Crown", sortOrder: 14 },
    { name: "Course Selesai", description: "Menyelesaikan course", points: 100, category: "bonus", icon: "Book", sortOrder: 15 },
  ];

  for (const pr of pointRules) {
    await prisma.pointRule.create({ data: pr });
  }
  console.log(`   ✅ ${pointRules.length} point rules\n`);

  // ── 11. Notifications ──────────────────────────────────────────────────
  const notifications = [
    { user: 0, type: "report-approved", title: "Laporan Disetujui!", body: "Laporan Spring Monitoring Sumber Umbul telah di-approve. +25 poin!" },
    { user: 0, type: "points-earned", title: "Poin Bertambah!", body: "Selamat! Anda mencapai milestone 10 laporan. +50 poin bonus!" },
    { user: 1, type: "report-approved", title: "Laporan Disetujui!", body: "Laporan Spring Restoration Ciburial telah di-approve. +100 poin!" },
    { user: 2, type: "submission-sent", title: "Laporan Terkirim", body: "Laporan Anda untuk Sumber Telaga sedang direview oleh admin." },
    { user: 3, type: "event", title: "Hari Air Sedunia!", body: "Event multiplier aktif! Dapatkan 2x poin untuk semua laporan!" },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        userId: users[n.user].id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: Math.random() > 0.5,
      },
    });
  }
  console.log(`   ✅ ${notifications.length} notifications\n`);

  // ── 12. Comments ──────────────────────────────────────────────────────
  const allProjects = await prisma.project.findMany();
  if (allProjects.length > 0) {
    const commentTexts = [
      "Proyek yang bagus! Saya ingin ikut serta.",
      "Sudah saya kunjungi lokasinya, sangat perlu direstorasi.",
      "Saya punya pengalaman serupa di desa saya. Semoga berhasil!",
      "Mari kita dukung proyek ini bersama-sama.",
      "Apakah ada jadwal gotong royong? Saya mau ikut.",
    ];
    for (let i = 0; i < 8; i++) {
      await prisma.comment.create({
        data: {
          projectId: allProjects[i % allProjects.length].id,
          userId: users[i % users.length].id,
          text: commentTexts[i % commentTexts.length],
        },
      });
    }
    console.log(`   ✅ 8 comments on projects\n`);
  }

  // ── 13. Feedback ──────────────────────────────────────────────────────
  const feedbackItems = [
    { type: "saran", kritik: "", saran: "Tambah fitur notifikasi real-time untuk laporan baru", bugDescription: "", status: "read" },
    { type: "bug", kritik: "", saran: "", bugDescription: "Map kadang tidak loading di Chrome Android versi lama", status: "open" },
    { type: "both", kritik: "Form restorasi terlalu panjang", saran: "Bisa dipisah jadi beberapa step", bugDescription: "", status: "open" },
  ];

  for (const fb of feedbackItems) {
    await prisma.feedback.create({
      data: {
        type: fb.type as any,
        kritik: fb.kritik,
        saran: fb.saran,
        bugDescription: fb.bugDescription,
        status: fb.status,
        userId: users[Math.floor(Math.random() * users.length)].id,
      },
    });
  }
  console.log(`   ✅ ${feedbackItems.length} feedback items\n`);

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(50));
  console.log("  🌱 SEEDING COMPLETE!");
  console.log("=".repeat(50));
  console.log(`  📊 Data created:`);
  console.log(`     Users:       ${users.length}`);
  console.log(`     Springs:     ${createdSprings.length}`);
  console.log(`     Reports:     ${createdReports.length}`);
  console.log(`     Forms:       ${formDefs.length}`);
  console.log(`     Projects:    ${projects.length}`);
  console.log(`     Donations:   ${donations.length}`);
  console.log(`     Courses:     ${courses.length}`);
  console.log(`     Rules:       ${pointRules.length}`);
  console.log(`     Comments:    8`);
  console.log(`     Feedback:    ${feedbackItems.length}`);
  console.log(`     Notifs:      ${notifications.length}`);
  console.log(`  🔑 Accounts:`);
  console.log(`     admin@springhub.id / demo12345  (role: admin)`);
  console.log(`     volunteer@springhub.id / vol12345`);
  console.log(`     ucup@springhub.id / ucup12345`);
  console.log(`     sari@springhub.id / sari12345`);
  console.log(`     budi@springhub.id / budi12345`);
  console.log("=".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
