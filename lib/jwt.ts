/**
 * Shared JWT secret key for the entire application.
 *
 * Reads from JWT_SECRET environment variable and THROWS if unset.
 * No hardcoded fallback — every environment MUST provide this value.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. " +
      "Generate one with: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(secret);
}
