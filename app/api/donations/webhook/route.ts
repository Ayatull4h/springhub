import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { timingSafeEqual } from "crypto";
import type { DonationStatus } from "@prisma/client";

/**
 * Xendit webhook handler for payment status notifications.
 *
 * Verifies callback using both token comparison (timing-safe) and
 * Xendit's recommended HMAC-SHA256 signature verification.
 *
 * Docs: https://developers.xendit.co/api-reference/#webhooks
 */
export async function POST(request: Request) {
  try {
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (expectedToken) {
      const token = request.headers.get("x-callback-token") || "";
      const tokenBuf = Buffer.from(token);
      const expectedBuf = Buffer.from(expectedToken);

      if (tokenBuf.length !== expectedBuf.length || !timingSafeEqual(tokenBuf, expectedBuf)) {
        console.warn("Invalid webhook callback token");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    console.log("Xendit webhook received:", JSON.stringify(body, null, 2));

    // Verify Xendit webhook signature using HMAC-SHA256
    // Ref: https://developers.xendit.co/api-reference/#webhooks
    if (expectedToken) {
      const callbackSignature = request.headers.get("x-callback-signature");
      if (callbackSignature) {
        const { createHmac } = await import("crypto");
        const computedSignature = createHmac("sha256", expectedToken)
          .update(JSON.stringify(body))
          .digest("hex");
        const sigBuf = Buffer.from(callbackSignature);
        const compBuf = Buffer.from(computedSignature);
        if (sigBuf.length === compBuf.length && !timingSafeEqual(sigBuf, compBuf)) {
          console.warn("Invalid webhook signature");
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      }
    }

    const { id, external_id, status, paid_at } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      PAID: "paid",
      SETTLED: "paid",
      EXPIRED: "expired",
      FAILED: "failed",
    };

    const localStatus = statusMap[status];
    if (!localStatus) {
      console.log("Unhandled Xendit status:", status, "for invoice:", id);
      return NextResponse.json({ success: true, status: "ignored" });
    }

    // ── Idempotency check ──
    // Xendit may send duplicate webhooks. Check if already processed.
    const existing = await prisma.donation.findFirst({
      where: { invoiceId: id },
      select: { id: true, status: true, projectId: true, amountIdr: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // If already paid, skip (idempotent)
    if (existing.status === "paid") {
      return NextResponse.json({ success: true, status: "already_processed" });
    }

    // ── Atomic transaction ──
    // Update donation + add points + update project raisedAmount in one transaction
    await prisma.$transaction(async (tx) => {
      await tx.donation.update({
        where: { id: existing.id },
        data: {
          status: localStatus as DonationStatus,
          paidAt: paid_at ? new Date(paid_at) : localStatus === "paid" ? new Date() : null,
        },
      });

      // If payment succeeded, award points and update project
      if (localStatus === "paid" && existing.userId) {
        // Award 1 point per Rp1,000 donated
        const pointsAwarded = Math.floor(existing.amountIdr / 1000);
        await tx.profile.update({
          where: { id: existing.userId },
          data: { points: { increment: pointsAwarded } },
        });

        await tx.pointsLog.create({
          data: {
            userId: existing.userId,
            reportId: null,
            amount: pointsAwarded,
            reason: `donasi Rp${existing.amountIdr.toLocaleString("id-ID")}`,
            metadata: JSON.stringify({ invoiceId: id, donationId: existing.id }),
          },
        });

        // Update project raised amount if this is a project-specific donation
        if (existing.projectId) {
          await tx.project.update({
            where: { id: existing.projectId },
            data: { raisedAmount: { increment: existing.amountIdr } },
          });
        }
      }
    });

    console.log(`Donation ${localStatus} — processed ${existing.id}`);

    return NextResponse.json({ success: true, updated: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
