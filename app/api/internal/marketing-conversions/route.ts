import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  enqueuePendingAdmissionConversions,
  enqueuePendingQualifiedLeadConversions,
  processAdmissionConversionQueue,
} from "@/lib/marketing/admissionConversions";
import { deliverPendingFirestoreMirrors } from "@/lib/firebase/firestoreRest";
import { prisma } from "@/lib/prisma";
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

  const started = new Date();
  const jobName = "marketing-conversion-delivery";
  try {
    const discovered = await enqueuePendingAdmissionConversions(100);
    const qualifiedDiscovered = await enqueuePendingQualifiedLeadConversions(100);
    const result = await processAdmissionConversionQueue({ limit: 50 });
    const firestoreMirrors = await deliverPendingFirestoreMirrors(50);
    const unresolved = await prisma.marketingConversionJob.count({ where: { status: { in: ["DEAD", "RETRY"] } } });
    const heartbeat = { status: unresolved > 0 ? "WARNING" as const : "HEALTHY" as const,
      lastStartedAt: started, lastSucceededAt: new Date(), durationMs: Date.now() - started.getTime(),
      lastError: null, metadata: { ...result, unresolved } };
    await prisma.scheduledJobHeartbeat.upsert({ where: { jobName }, create: { jobName, ...heartbeat }, update: heartbeat });
    return NextResponse.json({ success: true, discovered, qualifiedDiscovered, firestoreMirrors, ...result });
  } catch (error) {
    logServerError("Scheduled marketing conversion processing failed.", error);
    await prisma.scheduledJobHeartbeat.upsert({ where: { jobName },
      create: { jobName, status: "CRITICAL", lastFailedAt: new Date(), lastError: "Conversion processing failed." },
      update: { status: "CRITICAL", lastFailedAt: new Date(), lastError: "Conversion processing failed." },
    }).catch(() => undefined);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
