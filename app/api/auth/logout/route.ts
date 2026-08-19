import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { verifyCsrfToken } from "@/lib/csrf";

export async function POST(request: Request) {
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const proto = request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-scheme") || "https";
  await destroySession(proto === "https");
  return NextResponse.json({ success: true });
}
