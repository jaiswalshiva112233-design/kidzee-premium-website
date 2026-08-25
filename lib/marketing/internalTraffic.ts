import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";

export const STAFF_DEVICE_COOKIE = "kidzee_staff_device";
const COOKIE_VERSION = "v1";
const COOKIE_LIFETIME_SECONDS = 60 * 60 * 24 * 365;

export type TrafficClass =
  | "GENUINE"
  | "INTERNAL"
  | "TEST"
  | "AUTOMATED";

export type StaffDeviceMode = "staff" | "test";

function signingSecret() {
  const secret =
    process.env.INTERNAL_DEVICE_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "INTERNAL_DEVICE_SECRET or ADMIN_SESSION_SECRET must be configured.",
    );
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", signingSecret())
    .update(value)
    .digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function createStaffDeviceMarker(
  deviceId: string,
  mode: StaffDeviceMode,
) {
  const expiresAt = Math.floor(Date.now() / 1000) + COOKIE_LIFETIME_SECONDS;
  const payload = `${COOKIE_VERSION}.${deviceId}.${mode}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function readStaffDeviceMarker(value: string | undefined) {
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 5) return null;

  const [version, deviceId, mode, expiresAtText, signature] = parts;
  if (
    version !== COOKIE_VERSION ||
    !/^[A-Za-z0-9_-]{12,80}$/.test(deviceId) ||
    (mode !== "staff" && mode !== "test") ||
    !/^\d+$/.test(expiresAtText)
  ) {
    return null;
  }

  const expiresAt = Number(expiresAtText);
  if (expiresAt <= Math.floor(Date.now() / 1000)) return null;

  const payload = `${version}.${deviceId}.${mode}.${expiresAtText}`;
  if (!safeEqual(sign(payload), signature)) return null;

  return { deviceId, mode: mode as StaffDeviceMode, expiresAt };
}

function normalizeIp(rawValue: string) {
  const first = rawValue.split(",")[0]?.trim() ?? "";
  return first.replace(/^::ffff:/, "");
}

function ipv4Number(value: string) {
  const segments = value.split(".").map(Number);
  if (
    segments.length !== 4 ||
    segments.some((segment) => !Number.isInteger(segment) || segment < 0 || segment > 255)
  ) {
    return null;
  }
  return segments.reduce((result, segment) => (result << 8) + segment, 0) >>> 0;
}

function isIpInCidr(ip: string, cidr: string) {
  const [networkText, bitsText = "32"] = cidr.trim().split("/");
  const ipValue = ipv4Number(ip);
  const networkValue = ipv4Number(networkText);
  const bits = Number(bitsText);

  if (ipValue === null || networkValue === null || bits < 0 || bits > 32) {
    return false;
  }

  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipValue & mask) === (networkValue & mask);
}

function isConfiguredInternalIp(request: NextRequest) {
  const ip = normalizeIp(
    request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "",
  );
  if (!ip) return false;

  return (process.env.INTERNAL_IP_CIDRS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .some((cidr) => isIpInCidr(ip, cidr));
}

function looksAutomated(request: NextRequest) {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() ?? "";
  return /bot|crawler|spider|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp/.test(
    userAgent,
  );
}

export function classifyWebsiteRequest(request: NextRequest): {
  trafficClass: TrafficClass;
  isInternal: boolean;
  isTest: boolean;
  isBot: boolean;
  deviceId: string | null;
} {
  const marker = readStaffDeviceMarker(
    request.cookies.get(STAFF_DEVICE_COOKIE)?.value,
  );
  const isBot = looksAutomated(request);
  const isInternal = Boolean(marker) || isConfiguredInternalIp(request);
  const isTest = marker?.mode === "test";

  const trafficClass: TrafficClass = isTest
    ? "TEST"
    : isInternal
      ? "INTERNAL"
      : isBot
        ? "AUTOMATED"
        : "GENUINE";

  return {
    trafficClass,
    isInternal,
    isTest,
    isBot,
    deviceId: marker?.deviceId ?? null,
  };
}

export const staffDeviceCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_LIFETIME_SECONDS,
};
