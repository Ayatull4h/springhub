import { describe, it, expect } from "vitest";
import { detectMimeFromBuffer } from "../upload-photo";
import { HEIC_BRANDS, isHeicBrand } from "../heic";

function buf(bytes: number[]): Buffer {
  return Buffer.from(bytes);
}

describe("detectMimeFromBuffer", () => {
  it("mendeteksi JPEG (FF D8 FF)", () => {
    expect(detectMimeFromBuffer(buf([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("image/jpeg");
  });
  it("mendeteksi PNG (89 50 4E 47)", () => {
    expect(detectMimeFromBuffer(buf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe("image/png");
  });
  it("mendeteksi WebP (RIFF....WEBP)", () => {
    expect(
      detectMimeFromBuffer(buf([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))
    ).toBe("image/webp");
  });
  it("mendeteksi GIF", () => {
    expect(detectMimeFromBuffer(buf([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe("image/gif");
  });
  it("mendeteksi BMP", () => {
    expect(detectMimeFromBuffer(buf([0x42, 0x4d, 0x36, 0, 0, 0]))).toBe("image/bmp");
  });
  it("mendeteksi HEIC dari semua brand umum (ftyp heic/heix/hevc/mif1/msf1)", () => {
    for (const brand of ["heic", "heix", "hevc", "hevx", "mif1", "msf1"]) {
      const b = Buffer.alloc(12);
      b.write("ftyp", 4);
      b.write(brand, 8);
      expect(detectMimeFromBuffer(b)).toBe("image/heic");
    }
  });
  it("mendeteksi brand heic nyata dari file iPhone (byte 0-11)", () => {
    // Sampel asli: 00 00 00 1c 66 74 79 70 68 65 69 63
    const b = Buffer.from([0, 0, 0, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
    expect(detectMimeFromBuffer(b)).toBe("image/heic");
  });
  it("default ke image/jpeg untuk byte tak dikenal (lebih longgar, ikut Chrome Android)", () => {
    expect(detectMimeFromBuffer(buf([0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
  });
  it("tidak salah mengira ftyp non-gambar sebagai HEIC", () => {
    const b = Buffer.alloc(12);
    b.write("ftyp", 4);
    b.write("mp42", 8); // video MP4 — bukan HEIC
    expect(detectMimeFromBuffer(b)).not.toBe("image/heic");
  });
  it("mendeteksi AVIF terpisah dari HEIC (sharp decode native)", () => {
    const b = Buffer.alloc(12);
    b.write("ftyp", 4);
    b.write("avif", 8);
    expect(detectMimeFromBuffer(b)).toBe("image/avif");
  });
  it("menolak RIFF yang bukan WebP (mis. WAV audio)", () => {
    const b = Buffer.alloc(12);
    b.write("RIFF", 0);
    b.write("WAVE", 8);
    expect(detectMimeFromBuffer(b)).not.toBe("image/webp");
  });
  it("menolak buffer kosong/rusak dengan pesan jelas", () => {
    expect(() => detectMimeFromBuffer(Buffer.alloc(0))).toThrow("kosong atau rusak");
    expect(() => detectMimeFromBuffer(buf([0xff, 0xd8]))).toThrow("kosong atau rusak");
  });
  it("daftar brand client & server satu sumber (tidak drift lagi)", () => {
    // hevx pernah hanya ada di satu sisi -> sharp 500. Kunci di sini:
    for (const brand of ["heic", "heix", "hevc", "hevx", "mif1", "msf1"]) {
      expect(isHeicBrand(brand)).toBe(true);
      const b = Buffer.alloc(12);
      b.write("ftyp", 4);
      b.write(brand, 8);
      expect(detectMimeFromBuffer(b)).toBe("image/heic");
    }
    expect(HEIC_BRANDS).not.toContain("avif");
    expect(isHeicBrand("mp42")).toBe(false);
  });
});
