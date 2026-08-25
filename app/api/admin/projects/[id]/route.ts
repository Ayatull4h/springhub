import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/sanitize";
import { verifyCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

const STATUS_LABELS: Record<string, string> = {
  under_review: "Sedang Ditinjau",
  approved: "Disetujui",
  rejected: "Ditolak",
  completed: "Selesai",
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { status, note, featuredPhotoId } = body;

    const validStatuses = ["under_review", "approved", "rejected", "completed"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: " + validStatuses.join(", ") },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (featuredPhotoId) updateData.featuredPhotoId = featuredPhotoId;

    const project = await prisma.project.update({
      where: { id: (await params).id },
      data: updateData,
      include: { user: { select: { email: true, username: true } } },
    });

    // Send email notification to project owner (M-2: escape semua input user)
    if (project.user?.email) {
      const label = STATUS_LABELS[status] || status;
      const safeTitle = escapeHtml(project.title);
      const safeUsername = escapeHtml(project.user.username || "");
      const safeNote = note ? escapeHtml(String(note)) : "";
      const subject = `Proyek "${safeTitle}" — ${label}`;
      const html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Status Proyek Diperbarui</h2>
          <p style="color: #475569;">Halo <strong>${safeUsername}</strong>,</p>
          <p style="color: #475569;">Proyek <strong>"${safeTitle}"</strong> sekarang berstatus: <strong>${label}</strong>.</p>
          ${safeNote ? `<p style="color: #475569;">Catatan admin: ${safeNote}</p>` : ""}
          <p style="color: #94a3b8; font-size: 12px;">Login untuk melihat detail: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/projects</p>
        </div>
      `;
      await sendEmail({ to: project.user.email, subject, html }).catch(() => {});
    }
    auditLog("patch project", "patch project");


    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("PATCH /api/admin/projects/[id] error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
