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

const flowOptions = [
  "Mengalir deras",
  "Mengalir kecil",
  "Mengalir kecil sekali",
  "Tidak mengalir / mati",
];

const qualityOptions = ["Air jernih", "Air agak keruh", "Air keruh"];

const cleanlinessOptions = [
  "Bebas dari sampah plastik",
  "Ada sampah plastik sedikit",
  "Banyak sampah plastik",
];

const restorationActivityOptions = [
  "Edukasi kepada Masyarakat",
  "Pembersihan Sedimen / Lumpur",
  "Pembuatan Rorak / Parit Buntu",
  "Menanam Pohon",
];

export const FORMS: FormSchema[] = [
  {
    slug: "spring-monitoring",
    title: "Spring Monitoring",
    legacyTitle: "Pemantauan Mata Air",
    description:
      "Log a spring's current condition — flow, water quality, cleanliness, and a geo-tagged photo.",
    pointsOnSubmit: 25,
    contributionType: "monitoring",
    fields: [
      { id: "spring_name", label: "Nama mata air", type: "text", required: true, placeholder: "e.g. Mata Air Cibeureum" },
      { id: "village", label: "Desa", type: "text" },
      { id: "subdistrict", label: "Kecamatan", type: "text" },
      { id: "province", label: "Provinsi", type: "province", required: true },
      { id: "regency", label: "Kota / Kabupaten", type: "text", required: true },
      { id: "date", label: "Tanggal pemantauan", type: "date", required: true },
      { id: "flow_condition", label: "Kondisi debit / aliran", type: "select", required: true, options: flowOptions },
      { id: "water_quality", label: "Kondisi kualitas air", type: "select", required: true, options: qualityOptions },
      { id: "cleanliness", label: "Kondisi kebersihan", type: "select", required: true, options: cleanlinessOptions },
      { id: "photo", label: "Foto mata air", type: "photo", required: true, help: "Rekam tampilan utama mata air saat ini." },
      { id: "location", label: "Lokasi mata air", type: "location", required: true, help: "Akan di-snap ke grid 5 km sebelum dipublikasikan." },
      { id: "notes", label: "Catatan pengamatan", type: "longtext", placeholder: "Sejarah mata air, kondisi sekitar, kebutuhan masyarakat…" },
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
    title: "Tree Planting",
    legacyTitle: "Tanam Pohon",
    description:
      "Log endemic / native trees you've planted around a spring or its recharge area.",
    pointsOnSubmit: 50,
    contributionType: "tree_planting",
    fields: [
      { id: "volunteer_name", label: "Nama Anda", type: "text", required: true },
      { id: "province", label: "Provinsi", type: "province", required: true },
      { id: "regency", label: "Kota / Kabupaten", type: "text", required: true },
      { id: "date", label: "Tanggal kegiatan", type: "date", required: true },
      { id: "tree_count", label: "Jumlah pohon yang ditanam", type: "number", required: true },
      { id: "tree_species", label: "Jenis tanaman", type: "text", placeholder: "e.g. Bambu petung, Beringin, Ficus" },
      { id: "location", label: "Lokasi penanaman", type: "location", required: true },
      { id: "photo", label: "Foto pohon yang ditanam", type: "photo", required: true },
      { id: "notes", label: "Catatan tambahan", type: "longtext" },
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
  spring_name: z.string().min(1, "Nama mata air wajib diisi"),
  province: z.string().min(1, "Provinsi wajib dipilih"),
  village: z.string().optional(),
  subdistrict: z.string().optional(),
  regency: z.string().min(1, "Kota/Kabupaten wajib diisi"),
  date: z.string().min(1, "Tanggal pemantauan wajib diisi"),
  flow_condition: z.string().min(1, "Kondisi debit wajib dipilih"),
  water_quality: z.string().min(1, "Kondisi kualitas air wajib dipilih"),
  cleanliness: z.string().min(1, "Kondisi kebersihan wajib dipilih"),
  photo: z.any().optional(),
  location_lat: z.string().optional(),
  location_lng: z.string().optional(),
  notes: z.string().optional(),
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
  volunteer_name: z.string().min(1, "Nama Anda wajib diisi"),
  province: z.string().min(1, "Provinsi wajib dipilih"),
  regency: z.string().min(1, "Kota/Kabupaten wajib diisi"),
  date: z.string().min(1, "Tanggal kegiatan wajib diisi"),
  tree_count: z.coerce.number().min(1, "Jumlah pohon wajib diisi"),
  tree_species: z.string().optional(),
  location_lat: z.string().optional(),
  location_lng: z.string().optional(),
  photo: z.any().optional(),
  notes: z.string().optional(),
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
  "spring-monitoring": 25,
  "spring-restoration": 100,
  "trench-development": 50,
  "tree-planting": 50,
  "seedling-stock": 15,
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
