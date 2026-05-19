import { describe, it, expect } from "vitest";
import { snapToProtectionGrid, distanceKm, visibleLocation } from "../geo";

describe("snapToProtectionGrid", () => {
  it("should snap coordinates to 5km grid", () => {
    const result = snapToProtectionGrid({ lat: -7.515, lng: 109.98 });
    expect(result.lat).toBeCloseTo(-7.515, 3);
    expect(result.lng).toBeCloseTo(109.98, 3);
  });
  it("should round to nearest grid center", () => {
    const result = snapToProtectionGrid({ lat: -7.49, lng: 110.04 });
    expect(result.lat).toBeCloseTo(-7.47, 2);
    expect(result.lng).toBeCloseTo(110.025, 3);
  });
});

describe("distanceKm", () => {
  it("should calculate distance between two points", () => {
    const dist = distanceKm(
      { lat: -6.2146, lng: 106.8451 },
      { lat: -7.7972, lng: 110.3688 }
    );
    expect(dist).toBeGreaterThan(400);
    expect(dist).toBeLessThan(450);
  });
  it("should return 0 for same point", () => {
    const dist = distanceKm({ lat: -7.5, lng: 110.0 }, { lat: -7.5, lng: 110.0 });
    expect(dist).toBe(0);
  });
});

describe("visibleLocation", () => {
  it("should return snapped location for public", () => {
    const result = visibleLocation(
      { lat: -7.49, lng: 110.04 },
      "public"
    );
    expect(result.lat).toBeCloseTo(-7.47, 2);
  });
  it("should return precise location for admin", () => {
    const result = visibleLocation(
      { lat: -7.5, lng: 110.0 },
      "admin"
    );
    expect(result).toEqual({ lat: -7.5, lng: 110.0 });
  });
});
