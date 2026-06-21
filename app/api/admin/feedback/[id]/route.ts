import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!["open", "read", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await prisma.feedback.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin feedback update error::", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal mengupdate data.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
