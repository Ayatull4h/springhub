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
const PATH_REGEX = /^[a-zA-Z0-9_\-/]+\.[a-zA-Z0-9]+$/;

function isValidPath(storagePath: string): boolean {
  // Label strings like "Tree Planting Maron 1" don't have a file extension
  // Valid paths have "reports/" prefix and a file extension like .jpg
  return storagePath.startsWith("http://") ||
         storagePath.startsWith("https://") ||
         (storagePath.includes("/") && PATH_REGEX.test(storagePath.split("/").pop() || ""));
}

export function buildPhotoUrl(storagePath: string): string {
  if (!storagePath || !isValidPath(storagePath)) return "";
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
  return photos.map((p) => ({
    ...p,
    url: buildPhotoUrl(p.storagePath),
  }));
}
