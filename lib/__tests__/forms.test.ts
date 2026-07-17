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
      spring_name: "Mata Air Cibeureum",
      province: "Jawa Barat",
      regency: "Bandung",
      date: "2024-01-15",
      flow_condition: "Mengalir deras",
      water_quality: "Air jernih",
      cleanliness: "Bebas dari sampah plastik",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const result = springMonitoringSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should validate optional fields", () => {
    const result = springMonitoringSchema.safeParse({
      spring_name: "Mata Air Cibeureum",
      province: "Jawa Barat",
      regency: "Bandung",
      date: "2024-01-15",
      flow_condition: "Mengalir deras",
      water_quality: "Air jernih",
      cleanliness: "Bebas dari sampah plastik",
      village: "",
      subdistrict: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("POINTS_MAP", () => {
  it("should have correct point values", () => {
    expect(POINTS_MAP["spring-monitoring"]).toBe(25);
    expect(POINTS_MAP["spring-restoration"]).toBe(100);
    expect(POINTS_MAP["trench-development"]).toBe(50);
    expect(POINTS_MAP["tree-planting"]).toBe(50);
    expect(POINTS_MAP["seedling-stock"]).toBe(15);
  });

  it("should return undefined for unknown form", () => {
    expect(POINTS_MAP["unknown"]).toBeUndefined();
  });

  it("should have correct key count", () => {
    expect(Object.keys(POINTS_MAP)).toHaveLength(5);
  });

  it("should return correct points for each form slug", () => {
    expect(POINTS_MAP["spring-monitoring"]).toBe(25);
    expect(POINTS_MAP["spring-restoration"]).toBe(100);
    expect(POINTS_MAP["trench-development"]).toBe(50);
    expect(POINTS_MAP["tree-planting"]).toBe(50);
    expect(POINTS_MAP["seedling-stock"]).toBe(15);
  });
});

describe("springRestorationSchema", () => {
  it("should validate valid restoration input", () => {
    const result = springRestorationSchema.safeParse({
      spring_name: "Mata Air Cibeureum",
      province: "Jawa Barat",
      regency: "Bandung",
      date: "2024-02-20",
      activity_types: ["Edukasi kepada Masyarakat"],
      photo_after: "photo.jpg",
      volunteer_count: 5,
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
      volunteer_name: "Budi Santoso",
      province: "Jawa Tengah",
      regency: "Wonosobo",
      date: "2024-03-10",
      trench_count: 3,
    });
    expect(result.success).toBe(true);
  });

  it("should reject zero trench count", () => {
    const result = trenchDevelopmentSchema.safeParse({
      volunteer_name: "Budi Santoso",
      province: "Jawa Tengah",
      regency: "Wonosobo",
      date: "2024-03-10",
      trench_count: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("treePlantingSchema", () => {
  it("should validate valid tree planting input", () => {
    const result = treePlantingSchema.safeParse({
      volunteer_name: "Siti Rahma",
      province: "Jawa Barat",
      regency: "Bogor",
      date: "2024-04-05",
      tree_count: 10,
      tree_species: "Bambu petung",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing volunteer name", () => {
    const result = treePlantingSchema.safeParse({
      province: "Jawa Barat",
      regency: "Bogor",
      date: "2024-04-05",
      tree_count: 10,
    });
    expect(result.success).toBe(false);
  });
});

describe("seedlingStockSchema", () => {
  it("should validate valid seedling stock input", () => {
    const result = seedlingStockSchema.safeParse({
      species: "Bibit Mahoni",
      count: 50,
      province: "Jawa Timur",
      regency: "Malang",
      contact_name: "Ahmad Fauzi",
      contact_phone: "081234567890",
      date: "2024-05-12",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid contact phone", () => {
    const result = seedlingStockSchema.safeParse({
      species: "Bibit Mahoni",
      count: 50,
      province: "Jawa Timur",
      regency: "Malang",
      contact_name: "Ahmad Fauzi",
      contact_phone: "12345",
      date: "2024-05-12",
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
