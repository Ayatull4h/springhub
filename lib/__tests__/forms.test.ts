import { describe, it, expect } from "vitest";
import { springMonitoringSchema, POINTS_MAP } from "../forms";

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
});

describe("POINTS_MAP", () => {
  it("should have correct point values", () => {
    expect(POINTS_MAP["spring-monitoring"]).toBe(25);
    expect(POINTS_MAP["spring-restoration"]).toBe(100);
    expect(POINTS_MAP["trench-development"]).toBe(50);
    expect(POINTS_MAP["tree-planting"]).toBe(50);
    expect(POINTS_MAP["seedling-stock"]).toBe(15);
  });

  it("should return 0 for unknown form", () => {
    expect(POINTS_MAP["unknown"]).toBeUndefined();
  });
});
