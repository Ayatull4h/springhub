import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getJwtSecret } from "@/lib/jwt";

const SECRET = getJwtSecret();
const CSRF_COOKIE = "csrf_token";

export async function GET(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-scheme") || "https";
  const isSecure = proto === "https";

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(SECRET);

  const res = NextResponse.json({ token });
  res.headers.set("Set-Cookie", `${CSRF_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600; ${isSecure ? "Secure;" : ""}`);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  res.headers.set("Surrogate-Control", "no-store");
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  return res;
}
