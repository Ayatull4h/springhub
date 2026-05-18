import { cookies } from "next/headers";

const GUEST_COOKIE = "guest_session_id";

/**
 * Get or create a guest session ID from the cookie.
 * Guest sessions allow anonymous form submissions that can later be claimed.
 */
export function getGuestId(): string {
  const cookieStore = cookies();
  let guestId = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestId) {
    guestId = crypto.randomUUID();
    cookieStore.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }
  return guestId;
}

/** Get existing guest ID without creating a new one. */
export function getExistingGuestId(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(GUEST_COOKIE)?.value ?? null;
}
