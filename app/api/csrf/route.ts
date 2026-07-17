import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";

export async function GET(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-scheme") || "https";
  const isSecure = proto === "https";
  const token = await generateCsrfToken(isSecure);
  const res = NextResponse.json({ token });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  res.headers.set("Surrogate-Control", "no-store");
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  return res;
}
