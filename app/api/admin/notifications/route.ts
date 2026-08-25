import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { defaultCategoriesForRole, NOTIFICATION_CATEGORIES } from "@/lib/admin/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function text(value: unknown, max = 200) { return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : ""; }
function categories(value: unknown, fallback: string[]) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && NOTIFICATION_CATEGORIES.includes(item as never)) : fallback; }

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const filter = request.nextUrl.searchParams.get("filter") || "ALL";
  const category = request.nextUrl.searchParams.get("category") || "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const where = { recipientUserId: session.userId, ...(filter === "UNREAD" ? { readAt: null } : {}), ...(filter === "IMPORTANT" ? { important: true } : {}), ...(filter === "TODAY" ? { createdAt: { gte: today } } : {}), ...(category && NOTIFICATION_CATEGORIES.includes(category as never) ? { category } : {}) };
  const [items, unreadCount, devices, preference] = await Promise.all([
    prisma.adminNotification.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.adminNotification.count({ where: { recipientUserId: session.userId, readAt: null } }),
    prisma.pushDevice.findMany({ where: { adminUserId: session.userId, active: true }, orderBy: { lastActiveAt: "desc" }, select: { id: true, deviceName: true, browser: true, permissionStatus: true, lastActiveAt: true, enabledCategories: true } }),
    prisma.notificationPreference.findUnique({ where: { adminUserId: session.userId } }),
  ]);
  return NextResponse.json({ success: true, items, unreadCount, devices, preference: preference || { enabledCategories: defaultCategoriesForRole(session.role), quietHoursEnabled: false, quietStart: "19:00", quietEnd: "08:30", detailedContentEnabled: false }, publicConfig: { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "", authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "", projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "", storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "", messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "", appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "", vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "" } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>; const action = text(body.action, 40);
  if (action === "register-device") {
    const token = text(body.token, 4096); const deviceName = text(body.deviceName, 80) || "Chrome device"; const browser = text(body.browser, 80) || "Chrome";
    if (token.length < 20) return NextResponse.json({ success: false, message: "Notification token is invalid." }, { status: 400 });
    const enabledCategories = categories(body.enabledCategories, defaultCategoriesForRole(session.role));
    const device = await prisma.pushDevice.upsert({ where: { token }, create: { adminUserId: session.userId, role: session.role, token, deviceName, browser, enabledCategories, permissionStatus: "GRANTED" }, update: { adminUserId: session.userId, role: session.role, deviceName, browser, enabledCategories, permissionStatus: "GRANTED", active: true, lastActiveAt: new Date() } });
    await prisma.activityLog.create({ data: { adminUserId: session.userId, action: "UPDATED", entityType: "PUSH_DEVICE", entityId: device.id, description: "Registered a Chrome device for CentreOS notifications.", newData: { role: session.role, deviceName, permissionStatus: "GRANTED" } } });
    return NextResponse.json({ success: true, device: { id: device.id, deviceName: device.deviceName } });
  }
  if (action === "preferences") {
    const enabledCategories = categories(body.enabledCategories, defaultCategoriesForRole(session.role));
    const quietStart = text(body.quietStart, 5); const quietEnd = text(body.quietEnd, 5);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(quietStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(quietEnd)) return NextResponse.json({ success: false, message: "Quiet-hour times are invalid." }, { status: 400 });
    const preference = await prisma.notificationPreference.upsert({ where: { adminUserId: session.userId }, create: { adminUserId: session.userId, enabledCategories, quietHoursEnabled: body.quietHoursEnabled === true, quietStart, quietEnd, detailedContentEnabled: session.role === "OWNER" && body.detailedContentEnabled === true }, update: { enabledCategories, quietHoursEnabled: body.quietHoursEnabled === true, quietStart, quietEnd, detailedContentEnabled: session.role === "OWNER" && body.detailedContentEnabled === true } });
    await prisma.pushDevice.updateMany({ where: { adminUserId: session.userId, active: true }, data: { enabledCategories } });
    return NextResponse.json({ success: true, preference });
  }
  if (action === "mark-read") {
    const id = text(body.id, 100);
    if (id) await prisma.adminNotification.updateMany({ where: { id, recipientUserId: session.userId }, data: { readAt: new Date() } });
    else await prisma.adminNotification.updateMany({ where: { recipientUserId: session.userId, readAt: null }, data: { readAt: new Date() } });
    return NextResponse.json({ success: true });
  }
  if (action === "snooze") {
    const id = text(body.id, 100); const until = new Date(text(body.until, 50));
    if (!id || Number.isNaN(until.getTime()) || until <= new Date()) return NextResponse.json({ success: false, message: "Choose a valid future snooze time." }, { status: 400 });
    await prisma.adminNotification.updateMany({ where: { id, recipientUserId: session.userId }, data: { snoozedUntil: until } });
    return NextResponse.json({ success: true });
  }
  if (action === "disable-device") {
    const id = text(body.id, 100); await prisma.pushDevice.updateMany({ where: { id, adminUserId: session.userId }, data: { active: false, permissionStatus: "DISABLED" } });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false, message: "Unsupported notification action." }, { status: 400 });
}
