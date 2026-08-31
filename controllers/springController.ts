import { NextResponse } from "next/server";
import { listActiveSprings, getSpringDetail } from "@/services/springService";
import { getErrorMessage, isDatabaseError } from "@/lib/prisma";
import { buildPhotoUrl } from "@/lib/photo-url";

export async function listSprings() {
  try {
    const data = await listActiveSprings();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Terjadi kesalahan.") }, { status: isDatabaseError(error) ? 503 : 500 });
  }
}

export async function detailSpring(id: string) {
  try {
    const spring = await getSpringDetail(id);
    if (!spring) return NextResponse.json({ error: "Spring not found" }, { status: 404 });
    // ... enrich logic as before (nearbyReports, stats) — keep existing for now
    return NextResponse.json({ spring });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Terjadi kesalahan.") }, { status: isDatabaseError(error) ? 503 : 500 });
  }
}
