import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const logSchema = z.object({
  level: z.enum(["info", "warning", "error", "critical"]).default("error"),
  message: z.string().min(1, "Message wajib diisi").max(2000),
  source: z.enum(["frontend", "api", "worker", "database"]).default("frontend"),
  stack: z.string().max(10000).default(""),
  url: z.string().max(2000).default(""),
  userId: z.string().max(200).default(""),
  metadata: z.string().max(10000).default("{}"),
});

/**
 * POST /api/log/error
 *
 * Menerima error log dari frontend dan menyimpannya ke database.
 * Tetap terbuka (guest juga boleh log) tapi dibatasi ukuran + rate limit.
 */
export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limitCheck = await apiLimiter.check(`log-error:${ip}`);
    if (!limitCheck.allowed) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await request.json();
    const parsed = logSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const data = parsed.data;
    // Tolak null bytes / karakter kontrol pada isi log
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(data.message + data.stack + data.url)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await prisma.appError.create({
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Jangan sampai error logging malah bikin error
    console.error("[ErrorLogger-API]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
