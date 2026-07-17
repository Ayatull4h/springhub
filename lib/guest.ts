import { cookies } from "next/headers";

const GUEST_COOKIE = "guest_session_id";

export function getGuestId(): string {
  const cookieStore = cookies();
  let guestId = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestId) {
    guestId = crypto.randomUUID();
    cookieStore.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days (reduced from 30)
      path: "/",
    });
  }
  return guestId;
}

export function getExistingGuestId(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(GUEST_COOKIE)?.value ?? null;
}
