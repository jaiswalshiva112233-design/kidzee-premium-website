import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getAdminSession } from "@/lib/admin/auth";
import { saveOwnerIntelligenceSnapshot } from "@/lib/admin/owner-intelligence";
import { runSystemHealthChecks } from "@/lib/admin/system-health";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const SETTINGS_KEY = "OWNER_INTELLIGENCE_SETTINGS";
const defaults = { widgets: ["executive", "finance", "marketing", "operations", "forecast", "insights", "audit", "health"], defaultReportFormat: "PDF", forecastMonths: 6, aiVisible: true, marketingVisible: true, notifications: { criticalHealth: true, failedDeliveries: true, outstandingFees: true }, thresholds: { outstandingWarning: 100000, capacityWarningPercent: 85, jobWarningMinutes: 30, healthCriticalMinutes: 120 } };
async function owner() { const session = await getAdminSession(); return session?.role === "OWNER" ? session : null; }
async function settings() { const row = await prisma.centreSetting.findUnique({ where: { key: SETTINGS_KEY } }); return row?.value && typeof row.value === "object" && !Array.isArray(row.value) ? { ...defaults, ...(row.value as Record<string, unknown>) } : defaults; }
function restoreSnapshot(row: { generatedAt: Date; periodStart: Date; periodEnd: Date; metrics: Prisma.JsonValue; forecasts: Prisma.JsonValue; insights: Prisma.JsonValue }) {
  const storedInsights = row.insights && typeof row.insights === "object" && !Array.isArray(row.insights) ? row.insights as Record<string, Prisma.JsonValue> : {};
  return {
    generatedAt: row.generatedAt.toISOString(),
    period: { start: row.periodStart.toISOString(), end: row.periodEnd.toISOString() },
    metrics: row.metrics,
    forecasts: row.forecasts,
    insights: storedInsights.items ?? [],
    health: storedInsights.health ?? [],
  };
}
export async function GET(request: Request) {
  if (!(await owner())) return NextResponse.json({ success: false, message: "Owner access is required." }, { status: 403 });
  const ownerSettings = await settings();
  const refresh = new URL(request.url).searchParams.get("refresh") === "true";
  if (refresh) await runSystemHealthChecks();
  const recent = await prisma.businessIntelligenceSnapshot.findFirst({ where: { generatedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } }, orderBy: { generatedAt: "desc" } });
  const snapshot = recent && !refresh ? restoreSnapshot(recent) : await saveOwnerIntelligenceSnapshot({ forecastMonths: Number(ownerSettings.forecastMonths) });
  return NextResponse.json({ success: true, snapshot, settings: ownerSettings, cached: Boolean(recent && !refresh) }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: Request) {
  const session = await owner(); if (!session) return NextResponse.json({ success: false, message: "Owner access is required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>; const action = typeof body.action === "string" ? body.action : "";
  if (action === "refresh") { const ownerSettings = await settings(); await runSystemHealthChecks(); return NextResponse.json({ success: true, snapshot: await saveOwnerIntelligenceSnapshot({ forecastMonths: Number(ownerSettings.forecastMonths) }), settings: ownerSettings }); }
  if (action !== "save-settings") return NextResponse.json({ success: false, message: "Unknown intelligence action." }, { status: 400 });
  const value: Prisma.InputJsonObject = { widgets: Array.isArray(body.widgets) ? body.widgets.filter((item): item is string => typeof item === "string").slice(0, 20) : defaults.widgets, defaultReportFormat: ["PDF", "CSV", "EXCEL"].includes(String(body.defaultReportFormat)) ? String(body.defaultReportFormat) : "PDF", forecastMonths: Math.min(24, Math.max(3, Math.trunc(Number(body.forecastMonths) || 6))), aiVisible: body.aiVisible !== false, marketingVisible: body.marketingVisible !== false, notifications: body.notifications && typeof body.notifications === "object" && !Array.isArray(body.notifications) ? body.notifications as Prisma.InputJsonObject : defaults.notifications, thresholds: body.thresholds && typeof body.thresholds === "object" && !Array.isArray(body.thresholds) ? body.thresholds as Prisma.InputJsonObject : defaults.thresholds };
  await prisma.$transaction([prisma.centreSetting.upsert({ where: { key: SETTINGS_KEY }, create: { key: SETTINGS_KEY, value, description: "Owner dashboard, report, forecast, notification, audit and health preferences." }, update: { value } }), prisma.activityLog.create({ data: { adminUserId: session.userId, action: "UPDATED", entityType: "OwnerIntelligenceSettings", entityId: SETTINGS_KEY, description: "Owner intelligence preferences were updated.", newData: value } })]);
  return NextResponse.json({ success: true, message: "Owner intelligence settings saved.", settings: await settings() });
}
