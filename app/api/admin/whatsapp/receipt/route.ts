import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";
import { queueReceiptWhatsApp, sendWhatsAppAutomationMessage } from "@/lib/whatsapp/automation";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json() as { receiptId?: unknown };
    const receiptId = typeof body.receiptId === "string" ? body.receiptId.trim() : "";
    if (!receiptId) return NextResponse.json({ success: false, message: "Choose a receipt." }, { status: 400 });
    const job = await queueReceiptWhatsApp(receiptId);
    if (!job) return NextResponse.json({ success: false, message: "Add a valid primary guardian WhatsApp number first." }, { status: 409 });
    if (job.status === "SENT") return NextResponse.json({ success: true, message: "This receipt was already accepted by WhatsApp." });
    await prisma.whatsAppAutomationMessage.update({
      where: { id: job.id },
      data: { status: "RETRY", nextAttemptAt: new Date(), lastError: null },
    });
    const result = await sendWhatsAppAutomationMessage(job.id);
    await prisma.activityLog.create({
      data: {
        adminUserId: session.userId,
        action: "UPDATED",
        entityType: "WhatsAppAutomationMessage",
        entityId: job.id,
        description: result.sent ? "Receipt PDF accepted by WhatsApp." : "Receipt PDF delivery queued for automatic retry.",
      },
    });
    return NextResponse.json({
      success: result.sent,
      message: result.sent ? "Receipt PDF accepted by WhatsApp." : "WhatsApp could not accept the receipt yet. Automatic retry has been scheduled.",
    }, { status: result.sent ? 200 : 202 });
  } catch (error) {
    logServerError("Receipt WhatsApp delivery failed.", error);
    return NextResponse.json({ success: false, message: "The receipt could not be sent. It remains available in the delivery log for retry." }, { status: 500 });
  }
}
