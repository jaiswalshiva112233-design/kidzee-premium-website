import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { logServerError } from "@/lib/server/safeLogging";
import { discoverWhatsAppAutomation, processWhatsAppAutomationQueue } from "@/lib/whatsapp/automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorised(request: Request) {
  const expected = process.env.WHATSAPP_CRON_SECRET?.trim() ?? "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return expected.length >= 32 && supplied.length === expected.length && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export async function POST(request: Request) {
  if (!authorised(request)) return NextResponse.json({ success: false }, { status: 401 });
  try {
    const discovered = await discoverWhatsAppAutomation();
    const result = await processWhatsAppAutomationQueue(50);
    return NextResponse.json({ success: true, discovered, ...result });
  } catch (error) {
    logServerError("Scheduled WhatsApp automation failed.", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
