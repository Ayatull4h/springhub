import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { getJwtSecret } from "./jwt";

const SECRET = getJwtSecret();

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export async function generateCsrfToken(): Promise<string> {
  const token = await new SignJWT({} as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(SECRET);

  const cookieStore = cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600,
    path: "/",
  });

  return token;
}

export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get(CSRF_COOKIE)?.value ?? null;
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  const cookieStore = cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  if (!cookieToken || !token) return false;

  try {
    await jwtVerify(token, SECRET);
    await jwtVerify(cookieToken, SECRET);
    return token === cookieToken;
  } catch {
    return false;
  }
}

export { CSRF_HEADER };
