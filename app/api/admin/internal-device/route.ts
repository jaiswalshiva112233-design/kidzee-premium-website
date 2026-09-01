import { createHash, randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import {
  createStaffDeviceMarker,
  readStaffDeviceMarker,
  STAFF_DEVICE_COOKIE,
  staffDeviceCookieOptions,
  type StaffDeviceMode,
} from "@/lib/marketing/internalTraffic";
import { publicPersistenceError } from "@/lib/admin/public-persistence-error";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DeviceRecord = {
  id: string;
  label: string;
  mode: StaffDeviceMode;
  addedBy: string;
  addedAt: string;
};

const SETTINGS_KEY = "internal-staff-devices";
const identityHash = (value: string) => createHash("sha256").update(value).digest("hex");

function recordsFromValue(value: unknown): DeviceRecord[] {
  if (!value || typeof value !== "object" || !("devices" in value)) return [];
  const devices = (value as { devices?: unknown }).devices;
  if (!Array.isArray(devices)) return [];
  return devices.filter((device): device is DeviceRecord => {
    if (!device || typeof device !== "object") return false;
    const item = device as Partial<DeviceRecord>;
    return (
      typeof item.id === "string" &&
      typeof item.label === "string" &&
      (item.mode === "staff" || item.mode === "test") &&
      typeof item.addedBy === "string" &&
      typeof item.addedAt === "string"
    );
  });
}

async function getDevices() {
  const [identities, setting] = await Promise.all([
    prisma.internalTrafficIdentity.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.centreSetting.findUnique({ where: { key: SETTINGS_KEY } }),
  ]);
  if (identities.length) return identities.map((item) => { const metadata = item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata) ? item.metadata as Record<string, unknown> : {}; return { id: item.id, label: item.label, mode: metadata.mode === "test" ? "test" as const : "staff" as const, addedBy: typeof metadata.addedBy === "string" ? metadata.addedBy : "Owner", addedAt: item.createdAt.toISOString() }; });
  return recordsFromValue(setting?.value);
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (session.role !== "OWNER") {
      return NextResponse.json(
        { success: false, message: "Owner access is required." },
        { status: 403 },
      );
    }
    const devices = await getDevices();
    const marker = readStaffDeviceMarker(
      request.cookies.get(STAFF_DEVICE_COOKIE)?.value,
    );

    return NextResponse.json(
      { success: true, marker, devices },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (session.role !== "OWNER") {
      return NextResponse.json(
        { success: false, message: "Owner access is required." },
        { status: 403 },
      );
    }
    const body = (await request.json()) as { action?: unknown; label?: unknown };
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "remove") {
      const current = readStaffDeviceMarker(
        request.cookies.get(STAFF_DEVICE_COOKIE)?.value,
      );
      const response = NextResponse.json({ success: true, marker: null });
      response.cookies.set(STAFF_DEVICE_COOKIE, "", {
        ...staffDeviceCookieOptions,
        maxAge: 0,
      });

      if (current) {
        await prisma.internalTrafficIdentity.updateMany({ where: { identifierHash: identityHash(current.deviceId) }, data: { active: false } });
      }
      return response;
    }

    const mode: StaffDeviceMode = action === "test" ? "test" : "staff";
    const existing = readStaffDeviceMarker(
      request.cookies.get(STAFF_DEVICE_COOKIE)?.value,
    );
    const deviceId = existing?.deviceId ?? randomBytes(18).toString("base64url");
    const label =
      typeof body.label === "string" && body.label.trim()
        ? body.label.trim().slice(0, 80)
        : `${session.name}'s device`;

    await prisma.internalTrafficIdentity.upsert({
      where: { identifierHash: identityHash(deviceId) },
      create: { type: "COOKIE", label, identifierHash: identityHash(deviceId), metadata: { mode, addedBy: session.name }, active: true, addedById: session.userId, lastSeenAt: new Date() },
      update: { label, metadata: { mode, addedBy: session.name }, active: true, addedById: session.userId, lastSeenAt: new Date() },
    });

    const markerValue = createStaffDeviceMarker(deviceId, mode);
    const response = NextResponse.json({
      success: true,
      marker: { deviceId, mode },
      message:
        mode === "test"
          ? "Test Mode is active. This device will not count as genuine traffic."
          : "This device is marked as staff and excluded from genuine traffic.",
    });
    response.cookies.set(STAFF_DEVICE_COOKIE, markerValue, staffDeviceCookieOptions);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    if (message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, message: "Your session has expired. Please sign in again." },
        { status: 401 },
      );
    }
    console.error("Unable to update the internal traffic device:", error);
    const persistenceError = publicPersistenceError(
      error,
      "This device setting could not be saved. Please try again or contact the Owner.",
    );
    return NextResponse.json(
      { success: false, message: persistenceError.message },
      { status: persistenceError.status },
    );
  }
}
