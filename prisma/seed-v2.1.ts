import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SURVEI_MATA_AIR = {
  slug: "spring-survey",
  title: "Survei Mata Air",
  points: 25,
  type: "monitoring",
  fields: `
    A1_tanggal:date:true::Tanggal Survei
    A2_nama_surveyor:text:true::Nama Surveyor
    A3_wa:phone:true::Nomor WA
    A4_geotag:location:true::Geotag
    A5_cek_duplikat:select:true:["Baru","Kunjungan Ulang"]:Cek Duplikat (radius 250m)
    A6_kode_spring:text:false::Kode SpringHub (jika kunjungan ulang)
    B1_nama:text:true::Nama Lokal Mata Air
    B2_foto_1:photo:true::Foto 1: Titik Keluar Air (dekat)
    B3_foto_2:photo:true::Foto 2: Lingkungan Sekitar (5-10 langkah)
    B4_foto_3:photo:true::Foto 3: Arah Aliran Keluar
    B5_jenis:select:true:["Memancar","Genangan","Lereng/Tebing","Celah Batu","Tidak Yakin"]:Jenis/Tipe Mata Air
    B6_aliran:select:true:["Stabil Sepanjang Tahun","Berkurang saat Kemarau","Naik Turun","Kering Total","Tidak Tahu"]:Aliran Air
    B7_debit_5th:select:false:["Bertambah","Sama","Berkurang","Tidak Tahu"]:Perbandingan Debit 5 Tahun Lalu
    B8_tahun_kering:number:false::Tahun Mulai Kering (jika kering total)
    B9_dulu_untuk:text:false::Dulu Air Dimanfaatkan Untuk
    C1_warna:select:true:["Bening","Agak Keruh","Keruh","Kekuningan","Kehijauan"]:Warna Air
    C2_lahan:select:true:["Pemukiman","Pertanian","Lahan Hijau","Semak Belukar","Air","Industri","Tambang","Lahan Kosong"]:Pemanfaatan Lahan (radius 50m)
    C3_tutupan:select:true:["Air","Pepohonan","Rerumputan","Tanaman Pertanian","Semak","Area Terbangun","Lahan Kosong","Vegetasi Tergenang"]:Tutupan Lahan (radius 50m, Dynamic World)
    C4_pemanfaatan:multiselect:true:["Irigasi","Air Minum Warga","Air Minum Desa Lain","Mandi Cuci","Kolam Ikan","Wisata","Cadangan Kemarau","Adat","Tidak Dimanfaatkan","Tidak Tahu"]:Pemanfaatan Air Saat Ini
    C5_jumlah_kk:select:false:["<10 KK","10-50 KK","50-100 KK","100-1000 KK",">1000 KK","Tidak Tahu"]:Perkiraan Jumlah KK Pengguna
    C6_ancaman:select:true:["Tidak Ada","Ya"]:Terlihat Ancaman?
    C7_jenis_ancaman:multiselect:false:["Pestisida","Mandi di Sumber","Toilet <11m","Sampah Plastik","Sumur Dalam","Kandang Ternak","Bangunan Beton","Over-ekstraksi","Tambang","Lainnya"]:Jenis Ancaman
    C8_sumber_info:select:true:["Observasi Sendiri","Warga Sekitar","Orang Tua/Desa","Kelompok Masyarakat","Aparat Desa"]:Sumber Informasi
    D1_ph:number:false::pH Air
    D2_suhu:number:false::Suhu Air (°C)
    D3_tds:number:false::TDS (ppm)
    D4_ec:number:false::EC/DHL (µS/cm)
    D5_debit_liter:number:false::Debit Air (liter/detik)
    D6_debit_visual:select:false:["Menetes","Kecil","Sedang","Besar","Tidak Diukur"]:Estimasi Debit Visual
    E1_cerita:textarea:false::Cerita/Sejarah/Mitos (opsional)
    E2_tindak_lanjut:select:true:["Ya","Belum Tahu","Tidak"]:Bersedia Aksi Tindak Lanjut?
    E3_aksi:multiselect:false:["Pembersihan Sedimen","Penanaman Pohon","Pembuatan Rorak","Perlindungan Regulasi","Lapor Desa/Dinas","Lainnya"]:Aksi yang Dibutuhkan
  `.trim().split("\n").filter(Boolean).map((line, i) => {
    const [fieldId, type, requiredStr, optionsStr, ...labelParts] = line.split(":");
    const label = labelParts.join(":");
    return {
      fieldId: fieldId.trim(),
      label: label.trim(),
      type: type.trim(),
      required: requiredStr.trim() === "true",
      options: optionsStr?.trim() ? JSON.stringify(JSON.parse(optionsStr.trim())) : "[]",
      sortOrder: i + 1,
    };
  }),
};

const RESTORASI = {
  slug: "spring-restoration",
  title: "Laporan Restorasi",
  points: 100,
  type: "restoration",
  fields: `
    A_tanggal:date:true::Tanggal Kegiatan
    A_nama:text:true::Nama Koordinator
    A_wa:phone:true::Nomor WA
    A_organisasi:text:false::Nama Organisasi/Komunitas
    A_geotag:location:true::Geotag
    A_kode_event:text:false::Kode Event
    B_spring_code:text:true::Kode SpringHub atau Nama Mata Air
    B_kondisi:select:true:["Mati/Kering","Debit Mengecil","Tertimbun Sedimen","Tercemar","Rusak Fisik","Terbengkalai"]:Kondisi Sebelum Restorasi
    B_foto_sebelum:photo:true::Foto SEBELUM Restorasi
    B_foto_sesudah:photo:true::Foto SESUDAH Restorasi
    B_foto_proses:photo:false::Foto Proses Kegiatan
    C_kegiatan:multiselect:true::Jenis Kegiatan Restorasi
  `.trim().split("\n").filter(Boolean).map((line, i) => {
    const [fieldId, type, requiredStr, optionsStr, ...labelParts] = line.split(":");
    const label = labelParts.join(":");
    return {
      fieldId: fieldId.trim(),
      label: label.trim(),
      type: type.trim(),
      required: requiredStr.trim() === "true",
      options: optionsStr?.trim() ? JSON.stringify(JSON.parse(optionsStr.trim())) : "[]",
      sortOrder: i + 1,
    };
  }),
};

const TANAM_POHON = {
  slug: "tree-planting",
  title: "Tanam Pohon",
  points: 50,
  type: "restoration",
  note: "SATU FORM = SATU POHON",
  fields: `
    A_tanggal:date:true::Tanggal Kegiatan
    A_nama:text:true::Nama Pelapor
    A_wa:phone:true::Nomor WA
    A_kegiatan:text:false::Nama Kegiatan/Organisasi
    A_geotag:location:true::Geotag (tap lokasi pohon)
    A_akurasi_gps:number:true::Akurasi GPS (maks 15m)
    A_kode_event:text:false::Kode Event Penanaman
    A_kode_spring:text:false::Kode Mata Air Terkait
    T_nama_lokal:text:true::Nama Lokal Pohon
    T_nama_ilmiah:text:false::Nama Ilmiah (opsional)
    T_foto:photo:true::Foto Pohon (ajir/marker terlihat)
    T_tinggi:select:true:["<30 cm","30-100 cm","100-200 cm",">200 cm"]:Tinggi Bibit
    T_sumber:select:true:["Pembibitan Sendiri","Membeli","Donasi/CSR","Bantuan Dinas","Tidak Tahu"]:Sumber Bibit
    T_lokasi_tanam:select:true::Jenis Lokasi Tanam
  `.trim().split("\n").filter(Boolean).map((line, i) => {
    const [fieldId, type, requiredStr, optionsStr, ...labelParts] = line.split(":");
    const label = labelParts.join(":");
    return {
      fieldId: fieldId.trim(),
      label: label.trim(),
      type: type.trim(),
      required: requiredStr.trim() === "true",
      options: optionsStr?.trim() ? JSON.stringify(JSON.parse(optionsStr.trim())) : "[]",
      sortOrder: i + 1,
    };
  }),
};

const RORAK = {
  slug: "trench-development",
  title: "Pembuatan Rorak",
  points: 50,
  type: "restoration",
  note: "SATU FORM = SATU RORAK. Ukuran dalam CM.",
  fields: `
    A_tanggal:date:true::Tanggal Kegiatan
    A_nama:text:true::Nama Pelapor
    A_wa:phone:true::Nomor WA
    A_kegiatan:text:false::Nama Kegiatan/Organisasi
    A_geotag:location:true::Geotag
    A_akurasi_gps:number:true::Akurasi GPS (maks 15m)
    A_kode_event:text:false::Kode Event
    A_kode_spring:text:false::Kode Mata Air Terkait
    R_jenis:select:true:["Rorak/Parit Resapan","Sumur Resapan","Biopori","Lainnya"]:Jenis Struktur Resapan
    R_bentuk:select:true:["Silinder/Bulat","Kotak/Persegi"]:Bentuk Penampang
    R_diameter:number:false::Diameter (cm) — jika silinder
    R_kedalaman_silinder:number:false::Kedalaman (cm) — jika silinder
    R_panjang:number:false::Panjang (cm) — jika kotak
    R_lebar:number:false::Lebar (cm) — jika kotak
    R_kedalaman_kotak:number:false::Kedalaman (cm) — jika kotak
    R_foto:photo:true::Foto Rorak
  `.trim().split("\n").filter(Boolean).map((line, i) => {
    const [fieldId, type, requiredStr, optionsStr, ...labelParts] = line.split(":");
    const label = labelParts.join(":");
    return {
      fieldId: fieldId.trim(),
      label: label.trim(),
      type: type.trim(),
      required: requiredStr.trim() === "true",
      options: optionsStr?.trim() ? JSON.stringify(JSON.parse(optionsStr.trim())) : "[]",
      sortOrder: i + 1,
    };
  }),
};

const STOK_BIBIT = {
  slug: "seedling-stock",
  title: "Stok Bibit",
  points: 15,
  type: "monitoring",
  note: "2 ARAH: Stok Tersedia / Bibit Dibutuhkan",
  fields: `
    A_tanggal:date:true::Tanggal
    A_nama:text:true::Nama Narahubung
    A_wa:phone:true::Nomor WA
    A_organisasi:text:false::Nama Organisasi/Komunitas
    A_geotag:location:true::Geotag (lokasi bibit)
    A_entri_baru:select:true:["Entri Baru","Pembaruan Stok"]:Entri Baru atau Pembaruan?
    A_kode_stok:text:false::Kode Stok (jika pembaruan)
    B_jenis_laporan:select:true:["STOK TERSEDIA","BIBIT DIBUTUHKAN"]:Jenis Laporan
    B_nama_lokal:text:true::Nama Lokal Tanaman
    B_nama_ilmiah:text:false::Nama Ilmiah (opsional)
    B_jumlah:number:true::Jumlah Bibit
    B_akurasi:select:false:["Angka Pasti","Perkiraan"]:Akurasi Jumlah
    C_foto:photo:false::Foto Bibit
  `.trim().split("\n").filter(Boolean).map((line, i) => {
    const [fieldId, type, requiredStr, optionsStr, ...labelParts] = line.split(":");
    const label = labelParts.join(":");
    return {
      fieldId: fieldId.trim(),
      label: label.trim(),
      type: type.trim(),
      required: requiredStr.trim() === "true",
      options: optionsStr?.trim() ? JSON.stringify(JSON.parse(optionsStr.trim())) : "[]",
      sortOrder: i + 1,
    };
  }),
};

const KOLABORASI = {
  slug: "kolaborasi-kemitraan",
  title: "Kolaborasi Kemitraan",
  points: 0,
  type: "partnership",
  note: "Publik, tanpa login. Untuk mitra/CSR.",
  fields: `
    K1_jenis:select:true:["Perusahaan/CSR","LSM/NGO","Pemerintah","Sekolah/Kampus","Komunitas","Media","Individu","Lainnya"]:Jenis Organisasi
    K2_organisasi:text:true::Nama Organisasi
    K2_website:text:false::Website/Media Sosial
    K2_kontak:text:true::Nama Kontak
    K2_jabatan:text:true::Jabatan
    K2_email:email:true::Email
    K2_wa:phone:true::Nomor WA
    K2_kota:text:true::Kota/Kabupaten Domisili
    K3_kolaborasi:multiselect:true:["Pendanaan/Sponsorship","Adopsi Mata Air","Employee Volunteering","Donasi Bibit/Alat","Kemitraan Riset","Program Edukasi","Publikasi/Media","Dukungan Teknologi","Lainnya"]:Bentuk Kolaborasi
    K4_cerita:textarea:true::Ceritakan Ide Kolaborasi Anda
  `.trim().split("\n").filter(Boolean).map((line, i) => {
    const [fieldId, type, requiredStr, optionsStr, ...labelParts] = line.split(":");
    const label = labelParts.join(":");
    return {
      fieldId: fieldId.trim(),
      label: label.trim(),
      type: type.trim(),
      required: requiredStr.trim() === "true",
      options: optionsStr?.trim() ? JSON.stringify(JSON.parse(optionsStr.trim())) : "[]",
      sortOrder: i + 1,
    };
  }),
};

async function main() {
  console.log("🌱 Seeding v2.1 forms...\n");

  const allForms = [SURVEI_MATA_AIR, RESTORASI, TANAM_POHON, RORAK, STOK_BIBIT, KOLABORASI];

  for (const fd of allForms) {
    // Upsert form (create or update)
    const existing = await prisma.form.findUnique({ where: { slug: fd.slug } });

    if (existing) {
      console.log(`   📝 Updating form: ${fd.slug} (${fd.title})`);

      // Delete old fields
      await prisma.formField.deleteMany({ where: { formId: existing.id } });

      // Update form
      await prisma.form.update({
        where: { id: existing.id },
        data: {
          title: fd.title,
          pointsOnSubmit: fd.points,
          contributionType: fd.type,
        },
      });

      // Create new fields
      for (const f of fd.fields) {
        await prisma.formField.create({
          data: { formId: existing.id, ...f },
        });
      }
    } else {
      console.log(`   ✅ Creating form: ${fd.slug} (${fd.title})`);

      const form = await prisma.form.create({
        data: {
          slug: fd.slug,
          title: fd.title,
          pointsOnSubmit: fd.points,
          contributionType: fd.type,
          isActive: true,
          sortOrder: allForms.indexOf(fd) + 1,
        },
      });

      for (const f of fd.fields) {
        await prisma.formField.create({
          data: { formId: form.id, ...f },
        });
      }
    }
  }

  console.log(`\n   ✅ ${allForms.length} forms updated/created successfully!`);
  console.log(`   🆕 New: spring-survey, kolaborasi-kemitraan`);
  console.log(`   🔄 Updated: spring-restoration, tree-planting, trench-development, seedling-stock`);
  console.log(`   ❌ Kept (unchanged): project-submission\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
