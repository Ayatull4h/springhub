import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-scheme") || "https";
  await destroySession(proto === "https");
  return NextResponse.json({ success: true });
}
