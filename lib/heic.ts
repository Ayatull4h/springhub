/**
 * Satu-satunya sumber kebenaran untuk brand HEIC/HEIF (ftyp box).
 * Dipakai client (lib/compress-image.ts) dan server (lib/upload-photo.ts)
 * agar tidak drift lagi (kasus: brand hevx pernah hanya ada di satu sisi).
 * AVIF sengaja TIDAK di sini — sharp decode AVIF native, tanpa heic-convert.
 */
export const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "mif1", "msf1"] as const;

export function isHeicBrand(brand: string): boolean {
  return (HEIC_BRANDS as readonly string[]).includes(brand.toLowerCase());
}
