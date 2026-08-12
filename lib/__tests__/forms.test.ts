import { describe, it, expect } from "vitest";
import {
  springMonitoringSchema,
  springRestorationSchema,
  trenchDevelopmentSchema,
  treePlantingSchema,
  seedlingStockSchema,
  formSchemaMap,
  getFormI18nKey,
  POINTS_MAP,
} from "../forms";

describe("springMonitoringSchema", () => {
  it("should validate valid input", () => {
    const result = springMonitoringSchema.safeParse({
      A1_tanggal: "2024-01-15",
      A2_nama_surveyor: "Budi Santoso",
      A3_wa: "081234567890",
      A5_cek_duplikat: "Cibeureum",
      A6_kode_spring: "SRG-001",
      B1_nama: "Mata Air Cibeureum",
      B5_jenis: "Mata air",
      B6_aliran: "Mengalir deras",
      B7_debit_5th: "5 liter/detik",
      C1_warna: "Air jernih",
      C2_lahan: "Pemukiman",
      C3_tutupan: "Rindang",
      C4_pemanfaatan: ["Mandiri"],
      C5_jumlah_kk: "50 KK",
      C6_ancaman: "Pencemaran",
      C7_jenis_ancaman: ["Sampah"],
      C8_sumber_info: "Narahubung warga",
      D1_ph: "7",
      E1_cerita: "Cerita sejarah mata air.",
      E2_tindak_lanjut: "Koordinasi warga",
      E3_aksi: ["Lapor"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const result = springMonitoringSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should validate optional fields", () => {
    const result = springMonitoringSchema.safeParse({
      A1_tanggal: "2024-01-15",
      A2_nama_surveyor: "Budi Santoso",
      A3_wa: "081234567890",
      A5_cek_duplikat: "Cibeureum",
      B1_nama: "Mata Air Cibeureum",
      B5_jenis: "Mata air",
      B6_aliran: "Mengalir deras",
      C1_warna: "Air jernih",
      C2_lahan: "Pemukiman",
      C3_tutupan: "Rindang",
      C6_ancaman: "Pencemaran",
      C8_sumber_info: "Narahubung warga",
      E2_tindak_lanjut: "Koordinasi warga",
    });
    expect(result.success).toBe(true);
  });
});

describe("POINTS_MAP", () => {
  it("should have correct point values", () => {
    expect(POINTS_MAP["spring-monitoring"]).toBe(100);
    expect(POINTS_MAP["spring-restoration"]).toBe(1000);
    expect(POINTS_MAP["trench-development"]).toBe(500);
    expect(POINTS_MAP["tree-planting"]).toBe(100);
    expect(POINTS_MAP["seedling-stock"]).toBe(100);
  });

  it("should return undefined for unknown form", () => {
    expect(POINTS_MAP["unknown"]).toBeUndefined();
  });

  it("should have correct key count", () => {
    expect(Object.keys(POINTS_MAP)).toHaveLength(5);
  });

  it("should return correct points for each form slug", () => {
    expect(POINTS_MAP["spring-monitoring"]).toBe(100);
    expect(POINTS_MAP["spring-restoration"]).toBe(1000);
    expect(POINTS_MAP["trench-development"]).toBe(500);
    expect(POINTS_MAP["tree-planting"]).toBe(100);
    expect(POINTS_MAP["seedling-stock"]).toBe(100);
  });
});

describe("springRestorationSchema", () => {
  it("should validate valid restoration input", () => {
    const result = springRestorationSchema.safeParse({
      A_tanggal: "2024-02-20",
      A_nama: "Budi Santoso",
      A_wa: "081234567890",
      A_organisasi: "Komunitas Mata Air",
      S1_spring: "Mata Air Cibeureum",
      S2_kondisi: "Kering",
      S4_kegiatan: ["Edukasi kepada Masyarakat"],
      S5_relawan: 5,
      S6_durasi: "2 jam",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const result = springRestorationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("trenchDevelopmentSchema", () => {
  it("should validate valid trench input", () => {
    const result = trenchDevelopmentSchema.safeParse({
      A_tanggal: "2024-03-10",
      A_nama: "Budi Santoso",
      A_wa: "081234567890",
      A_kegiatan: "Rorak di Cibeureum",
      A_akurasi_gps: 3,
      A_kode_event: "EVT-1",
      A_kode_spring: "SRG-001",
      R1_jenis: "Rorak",
      R2_bentuk: "Persegi",
      R3_panjang: "2 m",
      R5_posisi: "Hulu",
      R6_bahan: "Batu",
    });
    expect(result.success).toBe(true);
  });

  it("should reject zero gps accuracy", () => {
    const result = trenchDevelopmentSchema.safeParse({
      A_tanggal: "2024-03-10",
      A_nama: "Budi Santoso",
      A_wa: "081234567890",
      A_akurasi_gps: 0,
      R1_jenis: "Rorak",
      R2_bentuk: "Persegi",
      R5_posisi: "Hulu",
    });
    expect(result.success).toBe(false);
  });
});

describe("treePlantingSchema", () => {
  it("should validate valid tree planting input", () => {
    const result = treePlantingSchema.safeParse({
      A_tanggal: "2024-04-05",
      A_nama: "Siti Rahma",
      A_wa: "081234567890",
      A_akurasi_gps: 2,
      A_kode_event: "EVT-1",
      A_kode_spring: "SRG-001",
      T_nama_lokal: "Bambu petung",
      T_nama_ilmiah: "Dendrocalamus asper",
      T_tinggi: "50 cm",
      T_sumber: "Balai Benih",
      T_lokasi_tanam: "Hulu Cibeureum",
      T_tag: "Pohon Air",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing volunteer name", () => {
    const result = treePlantingSchema.safeParse({
      A_tanggal: "2024-04-05",
      A_wa: "081234567890",
      A_akurasi_gps: 2,
      T_nama_lokal: "Bambu petung",
      T_tinggi: "50 cm",
      T_sumber: "Balai Benih",
      T_lokasi_tanam: "Hulu Cibeureum",
    });
    expect(result.success).toBe(false);
  });
});

describe("seedlingStockSchema", () => {
  it("should validate valid seedling stock input", () => {
    const result = seedlingStockSchema.safeParse({
      A_tanggal: "2024-05-12",
      A_nama: "Ahmad Fauzi",
      A_wa: "081234567890",
      A_organisasi: "Kelompok Tani Sejahtera",
      A_entri_baru: "Baru",
      A_kode_stok: "STK-001",
      B1_jenis_laporan: "Laporan stok",
      B2_nama_lokal: "Mahoni",
      B2_nama_ilmiah: "Swietenia macrophylla",
      B3_jumlah: 50,
      B3_akurasi: "Estimasi",
      C2_tinggi: "30 cm",
      C3_bentuk: "Tinggi",
      C4_kesiapan: "Siap tanam",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing WA number", () => {
    const result = seedlingStockSchema.safeParse({
      A_tanggal: "2024-05-12",
      A_nama: "Ahmad Fauzi",
      A_entri_baru: "Baru",
      B1_jenis_laporan: "Laporan stok",
      B2_nama_lokal: "Mahoni",
      B3_jumlah: 50,
    });
    expect(result.success).toBe(false);
  });
});

describe("formSchemaMap", () => {
  it("should contain all 5 form schemas", () => {
    expect(Object.keys(formSchemaMap)).toHaveLength(5);
  });

  it("should have spring-monitoring schema", () => {
    expect(formSchemaMap["spring-monitoring"]).toBeDefined();
    expect(formSchemaMap["spring-monitoring"]).toBe(springMonitoringSchema);
  });

  it("should return undefined for unknown slug", () => {
    expect(formSchemaMap["unknown-slug"]).toBeUndefined();
  });
});

describe("getFormI18nKey", () => {
  it("should return correct i18n keys for each form", () => {
    expect(getFormI18nKey("spring-monitoring")).toBe("form.title.monitoring");
    expect(getFormI18nKey("spring-restoration")).toBe("form.title.restoration");
    expect(getFormI18nKey("trench-development")).toBe("form.title.trench");
    expect(getFormI18nKey("tree-planting")).toBe("form.title.planting");
    expect(getFormI18nKey("seedling-stock")).toBe("form.title.seedling");
  });

  it("should return undefined for unknown slug", () => {
    expect(getFormI18nKey("nonexistent-form")).toBeUndefined();
  });
});
