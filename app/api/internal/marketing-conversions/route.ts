import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  enqueuePendingAdmissionConversions,
  processAdmissionConversionQueue,
} from "@/lib/marketing/admissionConversions";
import { logServerError } from "@/lib/server/safeLogging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorised(request: Request) {
  const secret = process.env.MARKETING_CRON_SECRET?.trim() ?? "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (secret.length < 32 || supplied.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const discovered = await enqueuePendingAdmissionConversions(100);
    const result = await processAdmissionConversionQueue({ limit: 50 });
    return NextResponse.json({ success: true, discovered, ...result });
  } catch (error) {
    logServerError("Scheduled marketing conversion processing failed.", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
