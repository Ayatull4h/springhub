import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const logSchema = z.object({
  level: z.enum(["info", "warning", "error", "critical"]).default("error"),
  message: z.string().min(1, "Message wajib diisi"),
  source: z.enum(["frontend", "api", "worker", "database"]).default("frontend"),
  stack: z.string().default(""),
  url: z.string().default(""),
  userId: z.string().default(""),
  metadata: z.string().default("{}"),
});

/**
 * POST /api/log/error
 *
 * Menerima error log dari frontend dan menyimpannya ke database.
 * Tidak membutuhkan auth — sengaja dibuka agar semua error tercatat.
 * Dilindungi rate limiting di Nginx.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = logSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await prisma.appError.create({
      data: parsed.data,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Jangan sampai error logging malah bikin error
    console.error("[ErrorLogger-API]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
