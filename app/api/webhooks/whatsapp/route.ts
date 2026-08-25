import { NextRequest, NextResponse } from "next/server";

import { safeFirestoreMirror } from "@/lib/firebase/firestoreRest";
import { prisma } from "@/lib/prisma";
import {
  verifyWhatsAppWebhookSignature,
  verifyWhatsAppWebhookToken,
} from "@/lib/whatsapp/webhookSecurity";

export function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const validToken = verifyWhatsAppWebhookToken(
    token,
    process.env.WHATSAPP_VERIFY_TOKEN,
  );
  if (mode === "subscribe" && validToken && challenge && challenge.length <= 500) return new NextResponse(challenge, { status: 200 });
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return new NextResponse("Unsupported media type", { status: 415 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 2_000_000) {
    return new NextResponse("Payload too large", { status: 413 });
  }
  const raw = await request.text();
  const secret = process.env.WHATSAPP_APP_SECRET?.trim();
  if (!secret || secret.length < 32) return new NextResponse("Webhook unavailable", { status: 503 });
  const valid = verifyWhatsAppWebhookSignature(
    raw,
    request.headers.get("x-hub-signature-256"),
    secret,
  );
  if (!valid) return new NextResponse("Invalid signature", { status: 401 });
  try {
    const body = JSON.parse(raw) as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ id?: string; from?: string; timestamp?: string; type?: string }>; statuses?: Array<{ id?: string; status?: string; timestamp?: string }> } }> }> };
    if (!Array.isArray(body.entry) || body.entry.length > 100) throw new Error("Invalid entries");
    for (const entry of body.entry) for (const change of entry.changes ?? []) {
      const messages = change.value?.messages ?? [];
      const statuses = change.value?.statuses ?? [];
      if (messages.length > 200 || statuses.length > 500) throw new Error("Webhook batch is too large");
      for (const message of messages) if (message.id) await safeFirestoreMirror("whatsappInbound", message.id, { id: message.id, from: message.from ?? null, type: message.type ?? null, receivedAt: new Date(Number(message.timestamp ?? 0) * 1000 || Date.now()) });
      for (const status of statuses) if (status.id) {
        const occurredAt = new Date(Number(status.timestamp ?? 0) * 1000 || Date.now());
        await safeFirestoreMirror("whatsappMessageStatus", `${status.id}_${status.status ?? "unknown"}`, { messageId: status.id, status: status.status ?? "unknown", occurredAt });
        const mapped = status.status === "sent"
          ? "SENT"
          : status.status === "delivered"
            ? "DELIVERED"
            : status.status === "read"
              ? "READ"
              : status.status === "failed"
                ? "FAILED"
                : null;
        if (mapped) {
          await prisma.whatsAppAutomationMessage.updateMany({
            where: { providerMessageId: status.id },
            data: {
              status: mapped,
              sentAt: mapped === "SENT" ? occurredAt : undefined,
              deliveredAt: mapped === "DELIVERED" ? occurredAt : undefined,
              readAt: mapped === "READ" ? occurredAt : undefined,
              failedAt: mapped === "FAILED" ? occurredAt : undefined,
              lastError: mapped === "FAILED" ? "WhatsApp reported delivery failure." : null,
            },
          });
        }
      }
    }
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch {
    return new NextResponse("Invalid payload", { status: 400 });
  }
}
