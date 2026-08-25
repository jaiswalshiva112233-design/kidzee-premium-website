import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";

function text(value: unknown, maximum = 100) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function GET() {
  try {
    const session = await requireAdmin();
    const [messages, grouped] = await Promise.all([
      prisma.whatsAppAutomationMessage.findMany({
        include: {
          enquiry: { select: { enquiryNumber: true, parentName: true } },
          student: { select: { studentNumber: true, firstName: true, lastName: true } },
          invoice: { select: { invoiceNumber: true } },
          receipt: { select: { receiptNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.whatsAppAutomationMessage.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      role: session.role,
      messages,
      counts: Object.fromEntries(grouped.map((item) => [item.status, item._count._all])),
    });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 500;
    logServerError("Unable to load the WhatsApp delivery log.", error);
    return NextResponse.json(
      { success: false, message: "WhatsApp delivery history is unavailable." },
      { status },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();
    if (session.role !== "OWNER") {
      return NextResponse.json(
        { success: false, message: "Only the owner can retry a failed WhatsApp delivery." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { id?: unknown; action?: unknown };
    const id = text(body.id);
    const action = text(body.action, 30).toUpperCase();
    if (!id || action !== "RETRY") {
      return NextResponse.json(
        { success: false, message: "A valid failed delivery is required." },
        { status: 400 },
      );
    }

    const existing = await prisma.whatsAppAutomationMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "WhatsApp delivery not found." },
        { status: 404 },
      );
    }
    if (!(["FAILED", "CANCELLED"] as const).includes(existing.status as "FAILED" | "CANCELLED")) {
      return NextResponse.json(
        { success: false, message: "Only a failed or cancelled delivery can be retried." },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.whatsAppAutomationMessage.update({
        where: { id },
        data: {
          status: "PENDING",
          attempts: 0,
          nextAttemptAt: new Date(),
          lastAttemptAt: null,
          failedAt: null,
          lastError: null,
          providerMessageId: null,
        },
      }),
      prisma.activityLog.create({
        data: {
          adminUserId: session.userId,
          action: "UPDATED",
          entityType: "WHATSAPP_AUTOMATION",
          entityId: id,
          description: `${existing.type} was placed back in the WhatsApp retry queue by the owner.`,
          previousData: { status: existing.status, attempts: existing.attempts },
          newData: { status: "PENDING", attempts: 0 },
        },
      }),
    ]);

    return GET();
  } catch (error) {
    logServerError("Unable to retry the WhatsApp delivery.", error);
    return NextResponse.json(
      { success: false, message: "The failed WhatsApp delivery could not be retried." },
      { status: 500 },
    );
  }
}
