/**
 * JWT key rotation mechanism.
 *
 * Mendukung multiple keys untuk rotasi tanpa invalidate session yang ada.
 * - JWT_SECRET: key UTAMA (digunakan untuk sign)
 * - JWT_SECRET_PREVIOUS: key LAMA (hanya untuk verifikasi, grace period)
 *
 * Rotasi: ganti JWT_SECRET → pindahkan yang lama ke JWT_SECRET_PREVIOUS
 * Semua token yang ditandatangani dengan key LAMA masih valid sampai expired.
 */

function toBytes(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function getJwtSecrets(): { current: Uint8Array; previous: Uint8Array | null } {
  const current = process.env.JWT_SECRET;
  if (!current) {
    throw new Error(
      "JWT_SECRET environment variable is not set. " +
      "Generate one with: openssl rand -base64 32"
    );
  }
  const previous = process.env.JWT_SECRET_PREVIOUS;
  return {
    current: toBytes(current),
    previous: previous ? toBytes(previous) : null,
  };
}

// ——— Backward compat ——— //
export function getJwtSecret(): Uint8Array {
  return getJwtSecrets().current;
}

/**
 * Verify JWT against current + previous keys.
 * Returns the first successful verification, or null if none match.
 */
export async function verifyJwtWithRotation<T>(
  token: string,
  verifyFn: (secret: Uint8Array) => Promise<T>
): Promise<{ payload: T; keyUsed: "current" | "previous" } | null> {
  const { current, previous } = getJwtSecrets();

  try {
    const payload = await verifyFn(current);
    return { payload, keyUsed: "current" };
  } catch {
    if (previous) {
      try {
        const payload = await verifyFn(previous);
        return { payload, keyUsed: "previous" };
      } catch {
        return null;
      }
    }
    return null;
  }
}
