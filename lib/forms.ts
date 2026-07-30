// SpringHub native field-reporting forms.
//
// These schemas are the single source of truth — consumed by:
//   - app/report/[slug]/page.tsx  (form renderer)
//   - components/sections/spring-map.tsx  (Report Your Contribution panel)
//   - POST /api/reports (Zod validation)
//
// Field-label conventions follow the original Jaga Semesta / Epicollect5
// CSV exports so the data shape stays consistent with prior collections.

import { z } from "zod";

export type FormFieldType =
  | "text"
  | "longtext"
  | "number"
  | "date"
  | "phone"
  | "select"
  | "multiselect"
  | "photo"
  | "location"
  | "link"
  | "province"
  | "email"
  | "checkbox";

export type FormField = {
  id: string;
  label: string;
  labelEn?: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
  optionsEn?: string[];
};

export type FormSchema = {
  slug: string;
  title: string;
  /** Short description shown above the form. */
  description: string;
  /** Indonesian title used in legacy CSV exports — handy for translators. */
  legacyTitle?: string;
  /** Volunteer points awarded on accepted submission. */
  pointsOnSubmit: number;
  /** What the form contributes to (used for activity feed grouping + counters). */
  contributionType:
    | "monitoring"
    | "restoration"
    | "trench"
    | "tree_planting"
    | "seedling_stock";
  fields: FormField[];
};



export const FORMS: FormSchema[] = [
  {
    slug: "spring-monitoring",
    title: "Survei Mata Air",
    legacyTitle: "Spring Survey",
    description:
      "Survei komprehensif kondisi mata air — identitas, lingkungan, pengukuran fisik.",
    pointsOnSubmit: 25,
    contributionType: "monitoring",
    fields: [
      { id: "A1_tanggal", label: "Tanggal Survei", type: "date", required: true },
      { id: "A2_nama_surveyor", label: "Nama Surveyor", type: "text", required: true },
      { id: "A3_wa", label: "Nomor WA", type: "phone", required: true },
      { id: "A4_geotag", label: "Geotag", type: "location", required: true },
      { id: "A5_cek_duplikat", label: "Cek Duplikat (radius 20m)", type: "select", required: true, options: ["Baru", "Kunjungan Ulang"] },
      { id: "A6_kode_spring", label: "Kode SpringHub (jika kunjungan ulang)", type: "text" },
      { id: "B1_nama", label: "Nama Lokal Mata Air", type: "text", required: true },
      { id: "B2_foto_1", label: "Foto 1: Titik Keluar Air (dekat)", type: "photo", required: true },
      { id: "B3_foto_2", label: "Foto 2: Lingkungan Sekitar (5-10 langkah)", type: "photo", required: true },
      { id: "B4_foto_3", label: "Foto 3: Arah Aliran Keluar", type: "photo", required: true },
      { id: "B5_jenis", label: "Jenis/Tipe Mata Air", type: "select", required: true, options: ["Memancar", "Genangan", "Lereng/Tebing", "Celah Batu", "Tidak Yakin"] },
      { id: "B6_aliran", label: "Aliran Air", type: "select", required: true, options: ["Stabil Sepanjang Tahun", "Berkurang saat Kemarau", "Naik Turun", "Kering Total", "Tidak Tahu"] },
      { id: "B7_debit_5th", label: "Perbandingan Debit 5 Tahun Lalu", type: "select", options: ["Bertambah", "Sama", "Berkurang", "Tidak Tahu"] },
      { id: "B8_tahun_kering", label: "Tahun Mulai Kering (jika kering total)", type: "number" },
      { id: "B9_dulu_untuk", label: "Dulu Air Dimanfaatkan Untuk", type: "text" },
      { id: "C1_warna", label: "Warna Air", type: "select", required: true, options: ["Bening", "Agak Keruh", "Keruh", "Kekuningan", "Kehijauan"] },
      { id: "C2_lahan", label: "Pemanfaatan Lahan (radius 50m)", type: "select", required: true, options: ["Pemukiman", "Pertanian", "Lahan Hijau", "Semak Belukar", "Air", "Industri", "Tambang", "Lahan Kosong"] },
      { id: "C3_tutupan", label: "Tutupan Lahan (radius 50m)", type: "select", required: true, options: ["Air", "Pepohonan", "Rerumputan", "Tanaman Pertanian", "Semak", "Area Terbangun", "Lahan Kosong", "Vegetasi Tergenang"] },
      { id: "C4_pemanfaatan", label: "Pemanfaatan Air Saat Ini", type: "multiselect", required: true, options: ["Irigasi", "Air Minum Warga", "Air Minum Desa Lain", "Mandi Cuci", "Kolam Ikan", "Wisata", "Cadangan Kemarau", "Adat", "Tidak Dimanfaatkan", "Tidak Tahu"] },
      { id: "C5_jumlah_kk", label: "Perkiraan Jumlah KK Pengguna", type: "select", options: ["<10 KK", "10-50 KK", "50-100 KK", "100-1000 KK", ">1000 KK", "Tidak Tahu"] },
      { id: "C6_ancaman", label: "Terlihat Ancaman?", type: "select", required: true, options: ["Tidak Ada", "Ya"] },
      { id: "C7_jenis_ancaman", label: "Jenis Ancaman", type: "multiselect", options: ["Pestisida", "Mandi di Sumber", "Toilet <11m", "Sampah Plastik", "Sumur Dalam", "Kandang Ternak", "Bangunan Beton", "Over-ekstraksi", "Tambang", "Lainnya"] },
      { id: "C8_sumber_info", label: "Sumber Informasi", type: "select", required: true, options: ["Observasi Sendiri", "Warga Sekitar", "Orang Tua/Desa", "Kelompok Masyarakat", "Aparat Desa"] },
      { id: "D1_ph", label: "pH Air", type: "text" },
      { id: "D2_suhu", label: "Suhu Air (°C)", type: "text" },
      { id: "D3_tds", label: "TDS (ppm)", type: "text" },
      { id: "D4_ec", label: "EC/DHL (µS/cm)", type: "text" },
      { id: "D5_debit_liter", label: "Debit Air (liter/detik)", type: "text" },
      { id: "D6_debit_visual", label: "Estimasi Debit Visual", type: "select", options: ["Menetes", "Kecil", "Sedang", "Besar", "Tidak Diukur"] },
      { id: "E1_cerita", label: "Cerita/Sejarah/Mitos (opsional)", type: "longtext" },
      { id: "E2_tindak_lanjut", label: "Bersedia Aksi Tindak Lanjut?", type: "select", required: true, options: ["Ya", "Belum Tahu", "Tidak"] },
      { id: "E3_aksi", label: "Aksi yang Dibutuhkan", type: "multiselect", options: ["Pembersihan Sedimen", "Penanaman Pohon", "Pembuatan Rorak", "Perlindungan Regulasi", "Lapor Desa/Dinas", "Lainnya"] },
    ],
  },
  {
    slug: "spring-restoration",
    title: "Restorasi Mata Air",
    legacyTitle: "Spring Restoration",
    description:
      "Satu form untuk satu kegiatan restorasi di satu mata air.",
    pointsOnSubmit: 1000,
    contributionType: "restoration",
    fields: [
      { id: "A_tanggal", label: "Tanggal Kegiatan", type: "date", required: true },
      { id: "A_nama", label: "Nama Koordinator", type: "text", required: true },
      { id: "A_wa", label: "Nomor WA", type: "phone", required: true },
      { id: "A_organisasi", label: "Nama Organisasi/Komunitas", type: "text" },
      { id: "A_geotag", label: "Geotag", type: "location", required: true },
      { id: "S1_spring", label: "Mata Air", type: "text", required: true, placeholder: "Nama atau kode mata air" },
      { id: "S2_kondisi", label: "Kondisi Mata Air Sebelum Restorasi", type: "select", required: true, options: ["Mati/Kering", "Debit Mengecil", "Tertimbun Sedimen", "Tercemar", "Rusak Fisik", "Terbengkalai", "Lainnya"] },
      { id: "S3_foto_sebelum", label: "Foto SEBELUM Restorasi", type: "photo", required: true },
      { id: "S3_foto_sesudah", label: "Foto SESUDAH Restorasi", type: "photo", required: true },
      { id: "S3_foto_proses", label: "Foto Proses Kegiatan", type: "photo" },
      { id: "S4_kegiatan", label: "Jenis Kegiatan Restorasi", type: "multiselect", required: true, options: ["Pembersihan Sedimen", "Pembersihan Sampah", "Pembuatan Rorak", "Pembuatan Embung", "Perlindungan Fisik", "Penanaman Pohon", "Edukasi Masyarakat", "Advokasi Regulasi", "Lainnya"] },
      { id: "S5_relawan", label: "Jumlah Relawan yang Terlibat", type: "number", required: true },
      { id: "S6_durasi", label: "Durasi Kegiatan", type: "select", required: true, options: ["1 Hari", "2-7 Hari", "Lebih dari 7 Hari"] },
    ],
  },
  {
    slug: "trench-development",
    title: "Pembuatan Rorak",
    legacyTitle: "Trench Development",
    description:
      "SATU FORM = SATU RORAK. Ukuran dalam CM.",
    pointsOnSubmit: 500,
    contributionType: "trench",
    fields: [
      { id: "A_tanggal", label: "Tanggal Kegiatan", type: "date", required: true },
      { id: "A_nama", label: "Nama Pelapor", type: "text", required: true },
      { id: "A_wa", label: "Nomor WA", type: "phone", required: true },
      { id: "A_kegiatan", label: "Nama Kegiatan/Organisasi", type: "text" },
      { id: "A_geotag", label: "Geotag", type: "location", required: true },
      { id: "A_akurasi_gps", label: "Akurasi GPS (maks 15m)", type: "number", required: true },
      { id: "A_kode_event", label: "Kode Event", type: "text" },
      { id: "A_kode_spring", label: "Kode Mata Air Terkait", type: "text" },
      { id: "R1_jenis", label: "Jenis Struktur Resapan", type: "select", required: true, options: ["Rorak/Parit Resapan", "Sumur Resapan", "Biopori", "Lainnya"] },
      { id: "R2_bentuk", label: "Bentuk Penampang", type: "select", required: true, options: ["Silinder/Bulat", "Kotak/Persegi"] },
      { id: "R3_diameter", label: "Diameter (cm) — jika silinder", type: "number" },
      { id: "R3_kedalaman_silinder", label: "Kedalaman (cm) — jika silinder", type: "number" },
      { id: "R3_panjang", label: "Panjang (cm) — jika kotak", type: "number" },
      { id: "R3_lebar", label: "Lebar (cm) — jika kotak", type: "number" },
      { id: "R3_kedalaman_kotak", label: "Kedalaman (cm) — jika kotak", type: "number" },
      { id: "R4_foto", label: "Foto Rorak", type: "photo", required: true },
      { id: "R5_posisi", label: "Posisi Rorak", type: "select", required: true, options: ["Area Resapan", "Pinggir Jalan", "Di Antara Tanaman", "Lereng", "Lainnya"] },
      { id: "R6_bahan", label: "Isi Bahan", type: "select", options: ["Kosong", "Batu/Ijuk", "Daun/Seresah/Kompos", "Lainnya"] },
    ],
  },
  {
    slug: "tree-planting",
    title: "Tanam Pohon",
    legacyTitle: "Tree Planting",
    description:
      "SATU FORM = SATU POHON. Catat pohon yang Anda tanam.",
    pointsOnSubmit: 50,
    contributionType: "tree_planting",
    fields: [
      { id: "A_tanggal", label: "Tanggal Kegiatan", type: "date", required: true },
      { id: "A_nama", label: "Nama Pelapor", type: "text", required: true },
      { id: "A_wa", label: "Nomor WA", type: "phone", required: true },
      { id: "A_kegiatan", label: "Nama Kegiatan/Organisasi", type: "text" },
      { id: "A_geotag", label: "Geotag", type: "location", required: true },
      { id: "A_akurasi_gps", label: "Akurasi GPS (maks 15m)", type: "number", required: true },
      { id: "A_kode_event", label: "Kode Event Penanaman", type: "text" },
      { id: "A_kode_spring", label: "Kode Mata Air Terkait", type: "text" },
      { id: "T_nama_lokal", label: "Nama Lokal Pohon", type: "text", required: true },
      { id: "T_nama_ilmiah", label: "Nama Ilmiah", type: "text" },
      { id: "T_foto", label: "Foto Pohon (ajir/marker terlihat)", type: "photo", required: true },
      { id: "T_tinggi", label: "Tinggi Bibit", type: "select", required: true, options: ["<30 cm", "30-100 cm", "100-200 cm", ">200 cm"] },
      { id: "T_sumber", label: "Sumber Bibit", type: "select", required: true, options: ["Pembibitan Sendiri", "Bantuan Dinas", "Tidak Tahu", "Membeli", "Donasi/CSR/Komunitas"] },
      { id: "T_lokasi_tanam", label: "Jenis Lokasi Tanam", type: "select", required: true, options: ["Sekitar Mata Air", "Lahan Kritis", "Pekarangan", "Fasilitas Umum", "Lahan Pertanian", "Bantaran Sungai", "Lainnya"] },
      { id: "T_tag", label: "Nomor Tag Pohon", type: "text" },
      { id: "T_catatan", label: "Catatan", type: "longtext" },
    ],
  },
  {
    slug: "seedling-stock",
    title: "Stok Bibit",
    legacyTitle: "Seedling Stock",
    description:
      "Satu form untuk satu jenis bibit di satu lokasi. 2 arah: Stok Tersedia / Bibit Dibutuhkan.",
    pointsOnSubmit: 100,
    contributionType: "seedling_stock",
    fields: [
      { id: "A_tanggal", label: "Tanggal", type: "date", required: true },
      { id: "A_nama", label: "Nama Narahubung", type: "text", required: true },
      { id: "A_wa", label: "Nomor WA", type: "phone", required: true },
      { id: "A_organisasi", label: "Nama Organisasi/Komunitas", type: "text" },
      { id: "A_geotag", label: "Geotag", type: "location", required: true },
      { id: "A_provinsi", label: "Provinsi", labelEn: "Province", type: "province", required: true },
      { id: "A_entri_baru", label: "Entri Baru atau Pembaruan?", type: "select", required: true, options: ["Entri Baru", "Pembaruan Stok"] },
      { id: "A_kode_stok", label: "Kode Stok (jika pembaruan)", type: "text" },
      { id: "B1_jenis_laporan", label: "Jenis Laporan", type: "select", required: true, options: ["STOK TERSEDIA", "BIBIT DIBUTUHKAN"] },
      { id: "B2_nama_lokal", label: "Nama Lokal Tanaman", type: "text", required: true },
      { id: "B2_nama_ilmiah", label: "Nama Ilmiah", type: "text" },
      { id: "B3_jumlah", label: "Jumlah Bibit", type: "number", required: true },
      { id: "B3_akurasi", label: "Akurasi Jumlah", type: "select", options: ["Angka Pasti", "Perkiraan"] },
      { id: "C1_foto", label: "Foto Bibit", type: "photo", required: true },
      { id: "C2_tinggi", label: "Tinggi Bibit Saat Ini", type: "select", options: ["<30 cm", "30-100 cm", ">100 cm", "Campuran"] },
      { id: "C3_bentuk", label: "Bentuk Bibit", type: "select", options: ["Polybag", "Cabutan", "Biji/Benih", "Hasil Relokasi", "Lainnya"] },
      { id: "C4_kesiapan", label: "Kesiapan Tanam", type: "select", options: ["Siap Tanam Sekarang", "1-2 Minggu Lagi", ">1 Bulan Lagi"] },
    ],
  },
];

export function getForm(slug: string | undefined): FormSchema | undefined {
  return FORMS.find((f) => f.slug === slug);
}

// ─── Zod Validation Schemas ─────────────────────────────────────────────────

const phoneRegex = /^(0[1-9]\d{8,11}|\+62\d{8,13})$/;

export const springMonitoringSchema = z.object({
  A1_tanggal: z.string().min(1, "Tanggal survei wajib diisi"),
  A2_nama_surveyor: z.string().min(1, "Nama surveyor wajib diisi"),
  A3_wa: z.string().min(1, "Nomor WA wajib diisi"),
  A4_geotag_lat: z.string().optional(),
  A4_geotag_lng: z.string().optional(),
  A5_cek_duplikat: z.string().min(1, "Cek duplikat wajib diisi"),
  A6_kode_spring: z.string().optional(),
  B1_nama: z.string().min(1, "Nama lokal mata air wajib diisi"),
  B2_foto_1: z.any().optional(),
  B3_foto_2: z.any().optional(),
  B4_foto_3: z.any().optional(),
  B5_jenis: z.string().min(1, "Jenis mata air wajib diisi"),
  B6_aliran: z.string().min(1, "Aliran air wajib diisi"),
  B7_debit_5th: z.string().optional(),
  B8_tahun_kering: z.string().optional(),
  B9_dulu_untuk: z.string().optional(),
  C1_warna: z.string().min(1, "Warna air wajib diisi"),
  C2_lahan: z.string().min(1, "Pemanfaatan lahan wajib diisi"),
  C3_tutupan: z.string().min(1, "Tutupan lahan wajib diisi"),
  C4_pemanfaatan: z.any().optional(),
  C5_jumlah_kk: z.string().optional(),
  C6_ancaman: z.string().min(1, "Ancaman wajib diisi"),
  C7_jenis_ancaman: z.any().optional(),
  C8_sumber_info: z.string().min(1, "Sumber info wajib diisi"),
  D1_ph: z.string().optional(),
  D2_suhu: z.string().optional(),
  D3_tds: z.string().optional(),
  D4_ec: z.string().optional(),
  D5_debit_liter: z.string().optional(),
  D6_debit_visual: z.string().optional(),
  E1_cerita: z.string().optional(),
  E2_tindak_lanjut: z.string().min(1, "Tindak lanjut wajib diisi"),
  E3_aksi: z.any().optional(),
});

export const springRestorationSchema = z.object({
  A_tanggal: z.string().min(1, "Tanggal kegiatan wajib diisi"),
  A_nama: z.string().min(1, "Nama koordinator wajib diisi"),
  A_wa: z.string().min(1, "Nomor WA wajib diisi"),
  A_organisasi: z.string().optional(),
  A_geotag_lat: z.string().optional(),
  A_geotag_lng: z.string().optional(),
  S1_spring: z.string().min(1, "Nama mata air wajib diisi"),
  S2_kondisi: z.string().min(1, "Kondisi sebelum restorasi wajib diisi"),
  S3_foto_sebelum: z.any().optional(),
  S3_foto_sesudah: z.any().optional(),
  S3_foto_proses: z.any().optional(),
  S4_kegiatan: z.any().optional(),
  S5_relawan: z.coerce.number().min(1, "Jumlah relawan wajib diisi"),
  S6_durasi: z.string().min(1, "Durasi kegiatan wajib diisi"),
});

export const trenchDevelopmentSchema = z.object({
  A_tanggal: z.string().min(1, "Tanggal kegiatan wajib diisi"),
  A_nama: z.string().min(1, "Nama pelapor wajib diisi"),
  A_wa: z.string().min(1, "Nomor WA wajib diisi"),
  A_kegiatan: z.string().optional(),
  A_geotag_lat: z.string().optional(),
  A_geotag_lng: z.string().optional(),
  A_akurasi_gps: z.coerce.number().min(1, "Akurasi GPS wajib diisi"),
  A_kode_event: z.string().optional(),
  A_kode_spring: z.string().optional(),
  R1_jenis: z.string().min(1, "Jenis struktur wajib diisi"),
  R2_bentuk: z.string().min(1, "Bentuk penampang wajib diisi"),
  R3_diameter: z.string().optional(),
  R3_kedalaman_silinder: z.string().optional(),
  R3_panjang: z.string().optional(),
  R3_lebar: z.string().optional(),
  R3_kedalaman_kotak: z.string().optional(),
  R4_foto: z.any().optional(),
  R5_posisi: z.string().min(1, "Posisi rorak wajib diisi"),
  R6_bahan: z.string().optional(),
});

export const treePlantingSchema = z.object({
  A_tanggal: z.string().min(1, "Tanggal kegiatan wajib diisi"),
  A_nama: z.string().min(1, "Nama pelapor wajib diisi"),
  A_wa: z.string().min(1, "Nomor WA wajib diisi"),
  A_kegiatan: z.string().optional(),
  A_geotag_lat: z.string().optional(),
  A_geotag_lng: z.string().optional(),
  A_akurasi_gps: z.coerce.number().min(1, "Akurasi GPS wajib diisi"),
  A_kode_event: z.string().optional(),
  A_kode_spring: z.string().optional(),
  T_nama_lokal: z.string().min(1, "Nama lokal pohon wajib diisi"),
  T_nama_ilmiah: z.string().optional(),
  T_foto: z.any().optional(),
  T_tinggi: z.string().min(1, "Tinggi bibit wajib diisi"),
  T_sumber: z.string().min(1, "Sumber bibit wajib diisi"),
  T_lokasi_tanam: z.string().min(1, "Lokasi tanam wajib diisi"),
  T_tag: z.string().optional(),
  T_catatan: z.string().optional(),
});

export const seedlingStockSchema = z.object({
  A_tanggal: z.string().min(1, "Tanggal wajib diisi"),
  A_nama: z.string().min(1, "Nama narahubung wajib diisi"),
  A_wa: z.string().min(1, "Nomor WA wajib diisi"),
  A_organisasi: z.string().optional(),
  A_geotag_lat: z.string().optional(),
  A_geotag_lng: z.string().optional(),
  A_entri_baru: z.string().min(1, "Entri baru/pembaruan wajib diisi"),
  A_kode_stok: z.string().optional(),
  B1_jenis_laporan: z.string().min(1, "Jenis laporan wajib diisi"),
  B2_nama_lokal: z.string().min(1, "Nama tanaman wajib diisi"),
  B2_nama_ilmiah: z.string().optional(),
  B3_jumlah: z.coerce.number().min(1, "Jumlah bibit wajib diisi"),
  B3_akurasi: z.string().optional(),
  C1_foto: z.any().optional(),
  C2_tinggi: z.string().optional(),
  C3_bentuk: z.string().optional(),
  C4_kesiapan: z.string().optional(),
});

export const formSchemaMap: Record<string, z.ZodObject<z.ZodRawShape>> = {
  "spring-monitoring": springMonitoringSchema,
  "spring-restoration": springRestorationSchema,
  "trench-development": trenchDevelopmentSchema,
  "tree-planting": treePlantingSchema,
  "seedling-stock": seedlingStockSchema,
};

export function getFormSchema(slug: string): z.ZodObject<z.ZodRawShape> | undefined {
  return formSchemaMap[slug];
}

/** Points awarded per form slug (matches AGENTS.md). */
export const POINTS_MAP: Record<string, number> = {
  "spring-monitoring": 100,
  "spring-restoration": 1000,
  "trench-development": 500,
  "tree-planting": 100,
  "seedling-stock": 100,
};

/**
 * Maps a form slug to its i18n key in messages/{locale}.json.
 *
 * Slug → key mapping:
 *   spring-monitoring → form.title.monitoring
 *   spring-restoration → form.title.restoration
 *   trench-development → form.title.trench
 *   tree-planting      → form.title.planting
 *   seedling-stock     → form.title.seedling
 */
export function getFormI18nKey(slug: string): string | undefined {
  const map: Record<string, string> = {
    "spring-monitoring": "form.title.monitoring",
    "spring-restoration": "form.title.restoration",
    "trench-development": "form.title.trench",
    "tree-planting": "form.title.planting",
    "seedling-stock": "form.title.seedling",
  };
  return map[slug];
}

/**
 * Returns the translated form title using the i18n `t()` function.
 * Falls back to `fallbackTitle` if no translation is found.
 */
export function getFormTitle(
  slug: string,
  fallbackTitle: string,
  t: (key: string, fallback?: string) => string
): string {
  const i18nKey = getFormI18nKey(slug);
  if (i18nKey) {
    const translated = t(i18nKey);
    // t() returns the key itself if no translation found — treat as miss
    if (translated && translated !== i18nKey) return translated;
  }
  return fallbackTitle;
}

/**
 * Fetch a single form definition from the API (database first, fallback to static).
 * Client-safe — uses fetch to /api/forms.
 */
export async function fetchForm(slug: string): Promise<FormSchema | undefined> {
  try {
    const res = await fetch("/api/forms");
    const data = await res.json();
    const forms: { slug: string; title: string; description: string; pointsOnSubmit: number; contributionType: string; fields: { fieldId: string; label: string; labelEn?: string; type: string; required: boolean; placeholder: string; helpText: string; options: string; optionsEn?: string }[] }[] = data.forms ?? [];
    const found = forms.find((f: { slug: string }) => f.slug === slug);
    if (found) {
      return {
        slug: found.slug,
        title: found.title,
        description: found.description,
        pointsOnSubmit: found.pointsOnSubmit,
        contributionType: found.contributionType as FormSchema["contributionType"],
        fields: found.fields.map((ff) => ({
          id: ff.fieldId,
          label: ff.label,
          labelEn: ff.labelEn,
          type: ff.type as FormFieldType,
          required: ff.required,
          placeholder: ff.placeholder,
          help: ff.helpText,
          options: (() => { try { return JSON.parse(ff.options || "[]"); } catch { return []; } })(),
          optionsEn: (() => { try { return JSON.parse(ff.optionsEn || "[]"); } catch { return []; } })(),
        })),
      };
    }
  } catch {
    // API unreachable — fallback to static
  }
  return getForm(slug);
}

/**
 * Fetch all active form definitions from the API (database first, fallback to static).
 * Client-safe.
 */
export async function fetchForms(): Promise<FormSchema[]> {
  try {
    const res = await fetch("/api/forms");
    const data = await res.json();
    const forms: { slug: string; title: string; description: string; pointsOnSubmit: number; contributionType: string; fields: { fieldId: string; label: string; labelEn?: string; type: string; required: boolean; placeholder: string; helpText: string; options: string; optionsEn?: string }[] }[] = data.forms ?? [];
    if (forms.length > 0) {
      return forms.map((found) => ({
        slug: found.slug,
        title: found.title,
        description: found.description,
        pointsOnSubmit: found.pointsOnSubmit,
        contributionType: found.contributionType as FormSchema["contributionType"],
        fields: found.fields.map((ff) => ({
          id: ff.fieldId,
          label: ff.label,
          type: ff.type as FormFieldType,
          required: ff.required,
          placeholder: ff.placeholder,
          help: ff.helpText,
          options: (() => { try { return JSON.parse(ff.options || "[]"); } catch { return []; } })(),
        })),
      }));
    }
  } catch {
    // API unreachable — fallback to static
  }
  return FORMS;
}
