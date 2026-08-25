import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { deliverPendingPushNotifications, scanNotificationEvents } from "@/lib/admin/notifications";

export const dynamic = "force-dynamic"; export const runtime = "nodejs"; export const maxDuration = 60;
function authorized(request: NextRequest) {
  const expected = process.env.NOTIFICATION_CRON_SECRET?.trim() || ""; const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (expected.length < 32 || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ success: false }, { status: 401 });
  const scanned = await scanNotificationEvents(); const delivery = await deliverPendingPushNotifications();
  return NextResponse.json({ success: true, scanned, delivery }, { headers: { "Cache-Control": "no-store" } });
}
