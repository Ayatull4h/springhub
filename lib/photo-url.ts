const S3_PUBLIC = process.env.S3_PUBLIC_URL || "";
const UPLOAD_PREFIX = process.env.UPLOAD_URL_PREFIX || "/uploads";

export function getPhotoUrlPrefix(): string {
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
