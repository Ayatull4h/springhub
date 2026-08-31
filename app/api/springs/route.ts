import { NextResponse } from "next/server";
import { getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { guard } from "@/middlewares/guard";
import { listActiveSprings } from "@/services/springService";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    try { await guard(request, { rate: "public", csrf: false }); } catch (e) { if (e instanceof Response) return e; throw e; }
    const data = await listActiveSprings();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Springs list error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
