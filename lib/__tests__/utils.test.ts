import { describe, it, expect } from "vitest";
import { cn, formatNumber } from "../utils";

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });
  it("should handle tailwind conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
  it("should handle empty strings", () => {
    expect(cn("px-4", "")).toBe("px-4");
  });
  it("should handle undefined values", () => {
    expect(cn("px-4", undefined)).toBe("px-4");
  });
  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });
  it("should handle array inputs", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });
  it("should handle mixed inputs", () => {
    expect(cn("px-4", ["py-2", "text-center"], false && "hidden")).toBe("px-4 py-2 text-center");
  });
});

describe("formatNumber", () => {
  it("should format number with Indonesian locale", () => {
    expect(formatNumber(24168)).toBe("24.168");
  });
  it("should format zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
  it("should format large numbers", () => {
    expect(formatNumber(1000000)).toBe("1.000.000");
  });
  it("should format number with thousands separator", () => {
    expect(formatNumber(1000)).toBe("1.000");
  });
});
