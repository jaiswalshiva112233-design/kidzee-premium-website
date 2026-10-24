import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeGoogleAdsSnapshot } from "@/lib/marketing/googleAdsSnapshot";
import { logServerError } from "@/lib/server/safeLogging";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const secret = process.env.GOOGLE_ADS_SNAPSHOT_SECRET?.trim() ?? "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expected = Buffer.from(secret), actual = Buffer.from(supplied);
  if (expected.length < 32 || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  const text = await request.text();
  if (text.length > 500000) return NextResponse.json({ success: false }, { status: 413 });
  let snapshot;
  try {
    snapshot = normalizeGoogleAdsSnapshot(JSON.parse(text), process.env.GOOGLE_ADS_CUSTOMER_ID ?? "");
  } catch {
    return NextResponse.json({ success: false, message: "Snapshot account, period or metrics are invalid." }, { status: 400 });
  }
  try {
    const key = "GOOGLE_ADS:campaign-performance:" + snapshot.periodEnd.toISOString().slice(0,10);
    const data = { metrics: snapshot.metrics, periodStart: snapshot.periodStart, periodEnd: snapshot.periodEnd,
      dimensions: { provenance: "AUTOMATED_SYNC", customerId: snapshot.customerId, currency: "INR", timeZone: "Asia/Kolkata" }, collectedAt: new Date() };
    await prisma.growthDataSnapshot.upsert({ where: { deduplicationKey: key },
      create: { source: "GOOGLE_ADS", dataset: "campaign-performance", deduplicationKey: key, ...data }, update: data });
    return NextResponse.json({ success: true, campaigns: snapshot.metrics.campaigns.length });
  } catch (error) {
    logServerError("Google Ads snapshot persistence failed.", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
