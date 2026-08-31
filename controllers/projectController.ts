import { NextResponse } from "next/server";
import { listProjects } from "@/services/projectService";
import { getErrorMessage } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

export async function list(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1), 200);
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10) || 1, 1);
    const data = await listProjects({ limit, page });
    return NextResponse.json(data);
  } catch (err) {
    await logError({ message: "Projects GET error", level: "error", source: "api", stack: err instanceof Error ? err.stack : "" }).catch(() => {});
    return NextResponse.json({ projects: [] }, { status: 200 });
  }
}
