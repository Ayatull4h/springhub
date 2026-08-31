import { NextResponse } from "next/server";
import { listSeedlings } from "@/services/seedlingService";
import { getErrorMessage } from "@/lib/prisma";

export async function list(req: Request, session: any) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await listSeedlings({
      mine: searchParams.get("mine") || undefined,
      species: searchParams.get("species") || undefined,
      province: searchParams.get("province") || undefined,
      userId: session?.userId || null,
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Gagal mengambil data bibit") }, { status: 500 });
  }
}
