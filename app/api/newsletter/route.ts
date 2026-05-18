import { NextResponse } from "next/server";

// In-memory newsletter subscriber list (for demo purposes)
const subscribers: string[] = [];

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    if (subscribers.includes(email)) {
      return NextResponse.json({ message: "Email sudah terdaftar" });
    }

    subscribers.push(email);
    console.log(`[Newsletter] New subscriber: ${email} (total: ${subscribers.length})`);

    return NextResponse.json({ success: true, message: "Berhasil mendaftar" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
