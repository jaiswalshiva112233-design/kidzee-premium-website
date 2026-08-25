import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { safeFirestoreMirror } from "@/lib/firebase/firestoreRest";
import { sendWhatsAppDocument } from "@/lib/whatsapp/cloud";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = (await request.json()) as { to?: unknown; documentUrl?: unknown; filename?: unknown; caption?: unknown; idempotencyKey?: unknown };
    const to = typeof body.to === "string" ? body.to : "";
    const documentUrl = typeof body.documentUrl === "string" ? body.documentUrl : "";
    const filename = typeof body.filename === "string" ? body.filename : "fee-receipt.pdf";
    const caption = typeof body.caption === "string" ? body.caption : "Fee receipt from Kidzee Sector 12 Dwarka";
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 120) : "";
    if (!idempotencyKey || !documentUrl.startsWith("https://")) return NextResponse.json({ success: false, message: "A secure receipt URL and idempotency key are required." }, { status: 400 });
    const result = await sendWhatsAppDocument({ to, documentUrl, filename, caption });
    await safeFirestoreMirror("whatsappMessages", idempotencyKey, {
      idempotencyKey, to: to.replace(/\d(?=\d{4})/g, "*"), filename, status: "ACCEPTED",
      providerMessageId: result.messages?.[0]?.id ?? null, sentBy: session.userId, sentAt: new Date(),
    });
    return NextResponse.json({ success: true, message: "Receipt accepted by WhatsApp." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhatsApp send failed.";
    const status = message === "UNAUTHENTICATED" ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
