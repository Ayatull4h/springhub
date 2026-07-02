import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";

export async function GET(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-scheme") || "https";
  const isSecure = proto === "https";
  const token = await generateCsrfToken(isSecure);
  return NextResponse.json({ token });
}
