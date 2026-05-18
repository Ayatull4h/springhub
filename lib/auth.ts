import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "springhub-dev-secret-key-change-in-production"
);

const SESSION_COOKIE = "session";
const SESSION_DURATION_SEC = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  role: string;
  username: string;
};

/** Hash a plain-text password. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Compare a plain-text password against a stored hash. */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a signed JWT and set it as an httpOnly cookie. */
export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION_SEC}s`)
    .sign(SECRET);

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SEC,
    path: "/",
  });

  return token;
}

/** Destroy the session cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/** Verify and decode the current session from the cookie. Returns null if invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
