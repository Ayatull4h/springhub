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
  | "province";

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
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

const restorationActivityOptions = [
  "Edukasi kepada Masyarakat",
  "Pembersihan Sedimen / Lumpur",
  "Pembuatan Rorak / Parit Buntu",
  "Menanam Pohon",
];

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
      { id: "D1_ph", label: "pH Air", type: "number" },
      { id: "D2_suhu", label: "Suhu Air (°C)", type: "number" },
      { id: "D3_tds", label: "TDS (ppm)", type: "number" },
      { id: "D4_ec", label: "EC/DHL (µS/cm)", type: "number" },
      { id: "D5_debit_liter", label: "Debit Air (liter/detik)", type: "number" },
      { id: "D6_debit_visual", label: "Estimasi Debit Visual", type: "select", options: ["Menetes", "Kecil", "Sedang", "Besar", "Tidak Diukur"] },
      { id: "E1_cerita", label: "Cerita/Sejarah/Mitos (opsional)", type: "longtext" },
      { id: "E2_tindak_lanjut", label: "Bersedia Aksi Tindak Lanjut?", type: "select", required: true, options: ["Ya", "Belum Tahu", "Tidak"] },
      { id: "E3_aksi", label: "Aksi yang Dibutuhkan", type: "multiselect", options: ["Pembersihan Sedimen", "Penanaman Pohon", "Pembuatan Rorak", "Perlindungan Regulasi", "Lapor Desa/Dinas", "Lainnya"] },
    ],
  },
  {
    slug: "spring-restoration",
    title: "Spring Restoration",
    legacyTitle: "Restorasi Mata Air",
    description:
      "Report a restoration activity — what was done, before/after photos, volunteer turnout, and any measurements taken.",
    pointsOnSubmit: 100,
    contributionType: "restoration",
    fields: [
      { id: "spring_name", label: "Nama mata air", type: "text", required: true },
      { id: "province", label: "Provinsi", type: "province", required: true },
      { id: "regency", label: "Kota / Kabupaten", type: "text", required: true },
      { id: "date", label: "Tanggal kegiatan", type: "date", required: true },
      { id: "location", label: "Tag lokasi mata air", type: "location", required: true },
      { id: "activity_types", label: "Jenis kegiatan yang dilakukan", type: "multiselect", required: true, options: restorationActivityOptions },
      { id: "photo_before", label: "Foto mata air sebelum kegiatan", type: "photo" },
      { id: "photo_after", label: "Foto mata air sesudah kegiatan", type: "photo", required: true },
      { id: "volunteer_count", label: "Berapa orang relawan ikut serta?", type: "number", required: true },
      { id: "measurement", label: "Jika bisa mengukur (m³ sedimen, debit, dst)", type: "number", help: "Opsional. Volume sedimen yang diangkat, atau debit setelah restorasi." },
      { id: "notes", label: "Catatan kondisi & perubahan", type: "longtext" },
      { id: "coordinator_phone", label: "Nomor HP koordinator", type: "phone" },
    ],
  },
  {
    slug: "trench-development",
    title: "Trench Development",
    legacyTitle: "Gali Rorak",
    description:
      "Log infiltration trenches you've dug. These help groundwater recharge in the spring's catchment area.",
    pointsOnSubmit: 50,
    contributionType: "trench",
    fields: [
      { id: "volunteer_name", label: "Nama Anda", type: "text", required: true },
      { id: "province", label: "Provinsi", type: "province", required: true },
      { id: "regency", label: "Kota / Kabupaten", type: "text", required: true },
      { id: "date", label: "Tanggal kegiatan", type: "date", required: true },
      { id: "trench_count", label: "Jumlah rorak yang dibuat", type: "number", required: true },
      { id: "location", label: "Lokasi pembuatan rorak", type: "location", required: true },
      { id: "photo", label: "Foto rorak", type: "photo", required: true },
      { id: "dimensions", label: "Catatan dimensi rorak (P × L × D)", type: "longtext", placeholder: "e.g. 100 × 50 × 50 cm" },
    ],
  },
  {
    slug: "tree-planting",
    title: "Tanam Pohon",
    legacyTitle: "Tree Planting",
    description:
      "SATU FORM = SATU POHON. Catat pohon yang Anda tanam di sekitar mata air.",
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
    title: "Tree Seedling Stock",
    legacyTitle: "Stok Bibit",
    description:
      "Update SpringHub on the seedlings available at your nursery, so we can match them with planting projects.",
    pointsOnSubmit: 15,
    contributionType: "seedling_stock",
    fields: [
      { id: "species", label: "Jenis tanaman", type: "text", required: true },
      { id: "count", label: "Jumlah bibit", type: "number", required: true },
      { id: "photo", label: "Foto bibit", type: "photo", required: true },
      { id: "province", label: "Provinsi", type: "province", required: true },
      { id: "regency", label: "Kota / Kabupaten lokasi", type: "text", required: true },
      { id: "contact_name", label: "Nama narahubung", type: "text", required: true },
      { id: "contact_phone", label: "Nomor HP narahubung", type: "phone", required: true },
      { id: "location", label: "Lokasi bibit", type: "location", required: true },
      { id: "date", label: "Tanggal update", type: "date", required: true },
      { id: "notes", label: "Keterangan tambahan", type: "longtext" },
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
  spring_name: z.string().min(1, "Nama mata air wajib diisi"),
  province: z.string().min(1, "Provinsi wajib dipilih"),
  regency: z.string().min(1, "Kota/Kabupaten wajib diisi"),
  date: z.string().min(1, "Tanggal kegiatan wajib diisi"),
  location_lat: z.string().optional(),
  location_lng: z.string().optional(),
  activity_types: z.array(z.string()).optional(),
  photo_before: z.any().optional(),
  photo_after: z.any().optional(),
  volunteer_count: z.coerce.number().optional(),
  measurement: z.coerce.number().optional(),
  notes: z.string().optional(),
  coordinator_phone: z.string().regex(phoneRegex, "Format nomor HP tidak valid").optional().or(z.literal("")),
});

export const trenchDevelopmentSchema = z.object({
  volunteer_name: z.string().min(1, "Nama Anda wajib diisi"),
  province: z.string().min(1, "Provinsi wajib dipilih"),
  regency: z.string().min(1, "Kota/Kabupaten wajib diisi"),
  date: z.string().min(1, "Tanggal kegiatan wajib diisi"),
  trench_count: z.coerce.number().min(1, "Jumlah rorak wajib diisi"),
  location_lat: z.string().optional(),
  location_lng: z.string().optional(),
  photo: z.any().optional(),
  dimensions: z.string().optional(),
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
  species: z.string().min(1, "Jenis tanaman wajib diisi"),
  count: z.coerce.number().min(1, "Jumlah bibit wajib diisi"),
  photo: z.any().optional(),
  province: z.string().min(1, "Provinsi wajib dipilih"),
  regency: z.string().min(1, "Kota/Kabupaten wajib diisi"),
  contact_name: z.string().min(1, "Nama narahubung wajib diisi"),
  contact_phone: z.string().regex(phoneRegex, "Format nomor HP tidak valid"),
  location_lat: z.string().optional(),
  location_lng: z.string().optional(),
  date: z.string().min(1, "Tanggal update wajib diisi"),
  notes: z.string().optional(),
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
    const forms: { slug: string; title: string; description: string; pointsOnSubmit: number; contributionType: string; fields: { fieldId: string; label: string; type: string; required: boolean; placeholder: string; helpText: string; options: string }[] }[] = data.forms ?? [];
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
          type: ff.type as FormFieldType,
          required: ff.required,
          placeholder: ff.placeholder,
          help: ff.helpText,
          options: (() => { try { return JSON.parse(ff.options || "[]"); } catch { return []; } })(),
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
    const forms: { slug: string; title: string; description: string; pointsOnSubmit: number; contributionType: string; fields: { fieldId: string; label: string; type: string; required: boolean; placeholder: string; helpText: string; options: string }[] }[] = data.forms ?? [];
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
