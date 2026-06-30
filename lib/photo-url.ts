/**
 * Photo URL helper — single source of truth for building photo URLs.
 *
 * Strategy:
 * 1. If Supabase URL is configured, use Supabase Storage (legacy)
 * 2. If S3_PUBLIC_URL is configured, use S3 (Cloudflare R2)
 * 3. Otherwise, use local filesystem path served by Nginx
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const S3_PUBLIC = process.env.S3_PUBLIC_URL || "";
const UPLOAD_PREFIX = process.env.UPLOAD_URL_PREFIX || "/uploads";

/**
 * Get the base URL prefix for photo storage.
 */
export function getPhotoUrlPrefix(): string {
  if (SUPABASE_URL) {
    return `${SUPABASE_URL}/storage/v1/object/public/photos/`;
  }
  if (S3_PUBLIC) {
    return `${S3_PUBLIC}/`;
  }
  return `${UPLOAD_PREFIX}/`;
}

/**
 * Build a full photo URL from its storage path.
 * Jika storagePath sudah URL lengkap (http/https), return as-is.
 */
export function buildPhotoUrl(storagePath: string): string {
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }
  const prefix = getPhotoUrlPrefix();
  return `${prefix}${storagePath}`;
}

/**
 * Build photo URLs for an array of photo objects.
 */
export function buildPhotoUrls<T extends { storagePath: string }>(
  photos: T[]
): (T & { url: string })[] {
  const prefix = getPhotoUrlPrefix();
  return photos.map((p) => ({
    ...p,
    url: p.storagePath.startsWith("http://") || p.storagePath.startsWith("https://")
      ? p.storagePath
      : `${prefix}${p.storagePath}`,
  }));
}
