import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Xendit webhook handler for payment success notifications.
 *
 * Xendit sends callbacks for invoice status changes (PAID, SETTLED, EXPIRED, FAILED).
 * This endpoint verifies the callback token, maps Xendit statuses to our internal
 * DonationStatus enum, and updates the donation record accordingly.
 *
 * Docs: https://developers.xendit.co/api-reference/#webhooks
 */
export async function POST(request: Request) {
  try {
    // ── Verify callback token ──
    const token = request.headers.get("x-callback-token");
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (expectedToken && token !== expectedToken) {
      console.warn("Invalid webhook callback token:", token);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Xendit webhook received:", JSON.stringify(body, null, 2));

    const { id, external_id, status, paid_at } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });
    }

    // ── Map Xendit status ke enum lokal ──
    const statusMap: Record<string, string> = {
      PAID: "paid",
      SETTLED: "paid",
      EXPIRED: "expired",
      FAILED: "failed",
    };

    const localStatus = statusMap[status];
    if (!localStatus) {
      // Unknown status — still acknowledge receipt so Xendit doesn't retry
      console.log("Unhandled Xendit status:", status, "for invoice:", id);
      return NextResponse.json({ success: true, status: "ignored" });
    }

    // ── Update donation record ──
    // Xendit v2 invoice webhook sends `id` as the invoice ID
    const donation = await prisma.donation.updateMany({
      where: { invoiceId: id },
      data: {
        status: localStatus as any,
        paidAt: paid_at ? new Date(paid_at) : localStatus === "paid" ? new Date() : null,
      },
    });

    console.log(`Donation ${localStatus} — updated ${donation.count} record(s)`);

    return NextResponse.json({ success: true, updated: donation.count });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
