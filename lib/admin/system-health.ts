import "server-only";

import type { Prisma, SystemHealthStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type Check = { service: string; status: SystemHealthStatus; summary: string; details?: Prisma.InputJsonObject };
const configured = (names: string[]) => names.every((name) => Boolean(process.env[name]?.trim()));

async function endpoint(service: string, url: string | undefined): Promise<Check> {
  if (!url || !url.startsWith("https://")) return { service, status: "WARNING", summary: "Production endpoint is not configured." };
  const started = Date.now();
  try { const response = await fetch(url, { method: "HEAD", redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(10_000) }); const durationMs = Date.now() - started; return { service, status: response.status < 400 ? durationMs < 3_000 ? "HEALTHY" : "WARNING" : "CRITICAL", summary: response.status < 400 ? `Responded in ${durationMs} ms.` : `Returned HTTP ${response.status}.`, details: { statusCode: response.status, durationMs } }; }
  catch { return { service, status: "CRITICAL", summary: "The configured endpoint did not respond." }; }
}

export async function runSystemHealthChecks() {
  const started = Date.now(); const now = new Date(); let database: Check;
  try { await prisma.$queryRaw`SELECT 1`; database = { service: "Database", status: "HEALTHY", summary: "Database query completed successfully." }; }
  catch { database = { service: "Database", status: "CRITICAL", summary: "Database query failed." }; }
  const sourceRows = await prisma.growthDataSnapshot.findMany({ orderBy: { collectedAt: "desc" }, distinct: ["source"], select: { source: true, collectedAt: true } }).catch(() => []);
  const source = new Map<string, Date>(sourceRows.map((row) => [row.source, row.collectedAt]));
  const sourceCheck = (service: string, key: string): Check => { const last = source.get(key); if (!last) return { service, status: "WARNING", summary: "No synchronized data has been received." }; const age = now.getTime() - last.getTime(); return { service, status: age < 48 * 60 * 60 * 1000 ? "HEALTHY" : age < 96 * 60 * 60 * 1000 ? "WARNING" : "CRITICAL", summary: `Last synchronized ${last.toISOString()}.` }; };
  const base = (process.env.CENTREOS_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const [lockedUsers, latestJob, ownerSetting] = await Promise.all([
    prisma.adminUser.count({ where: { lockedUntil: { gt: now } } }).catch(() => 0),
    prisma.scheduledJobHeartbeat.findFirst({ orderBy: { lastSucceededAt: "desc" } }).catch(() => null),
    prisma.centreSetting.findUnique({ where: { key: "OWNER_INTELLIGENCE_SETTINGS" }, select: { value: true } }).catch(() => null),
  ]);
  const ownerValue = ownerSetting?.value && typeof ownerSetting.value === "object" && !Array.isArray(ownerSetting.value) ? ownerSetting.value as Record<string, unknown> : {};
  const thresholds = ownerValue.thresholds && typeof ownerValue.thresholds === "object" && !Array.isArray(ownerValue.thresholds) ? ownerValue.thresholds as Record<string, unknown> : {};
  const jobWarningMs = Math.max(5, Number(thresholds.jobWarningMinutes) || 30) * 60 * 1000;
  const jobCriticalMs = Math.max(10, Number(thresholds.healthCriticalMinutes) || 120) * 60 * 1000;
  const environmentReady = configured(["DATABASE_URL", "DIRECT_URL", "ADMIN_SESSION_SECRET", "CENTREOS_BASE_URL", "FIREBASE_PROJECT_ID", "FIREBASE_STORAGE_BUCKET"]);
  const webhookReady = configured(["WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET"]);
  const backgroundAge = latestJob?.lastSucceededAt ? now.getTime() - latestJob.lastSucceededAt.getTime() : Number.POSITIVE_INFINITY;
  const checks: Check[] = [database, await endpoint("Website", base ? `${base}/` : undefined), await endpoint("Panel", base ? `${base}/admin/login` : undefined), await endpoint("Media Worker", process.env.MEDIA_WORKER_URL),
    { service: "Firebase", status: configured(["FIREBASE_PROJECT_ID", "FIREBASE_STORAGE_BUCKET"]) ? "HEALTHY" : "WARNING", summary: configured(["FIREBASE_PROJECT_ID", "FIREBASE_STORAGE_BUCKET"]) ? "Firebase project and storage are configured." : "Firebase configuration is incomplete." },
    { service: "Functions", status: configured(["GROWTH_SYNC_SECRET", "CENTREOS_BASE_URL"]) ? "HEALTHY" : "WARNING", summary: configured(["GROWTH_SYNC_SECRET", "CENTREOS_BASE_URL"]) ? "Scheduled Functions configuration is present." : "Scheduled Functions configuration is incomplete." },
    { service: "Storage", status: configured(["FIREBASE_STORAGE_BUCKET"]) ? "HEALTHY" : "WARNING", summary: configured(["FIREBASE_STORAGE_BUCKET"]) ? "Storage bucket is configured." : "Storage bucket is missing." },
    { service: "AI", status: configured(["OPENAI_API_KEY"]) ? "HEALTHY" : "WARNING", summary: configured(["OPENAI_API_KEY"]) ? "Default server-side AI credential is configured; Owner routing remains authoritative." : "Default AI credential is not configured." },
    { service: "WhatsApp", status: configured(["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_APP_SECRET"]) ? "HEALTHY" : "WARNING", summary: configured(["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_APP_SECRET"]) ? "WhatsApp Cloud API and webhook security are configured." : "WhatsApp production configuration is incomplete." },
    { service: "Sanity", status: configured(["NEXT_PUBLIC_SANITY_PROJECT_ID", "SANITY_API_WRITE_TOKEN"]) ? "HEALTHY" : "WARNING", summary: configured(["NEXT_PUBLIC_SANITY_PROJECT_ID", "SANITY_API_WRITE_TOKEN"]) ? "Sanity read/write configuration is present." : "Sanity configuration is incomplete." },
    { service: "Environment", status: environmentReady ? "HEALTHY" : "CRITICAL", summary: environmentReady ? "Required runtime configuration is present." : "Required production environment configuration is incomplete." },
    { service: "Webhook Status", status: webhookReady ? "HEALTHY" : "CRITICAL", summary: webhookReady ? "Webhook verification and signature secrets are configured." : "Webhook security configuration is incomplete." },
    { service: "Deployment", status: base.startsWith("https://") ? "HEALTHY" : "WARNING", summary: base.startsWith("https://") ? `Production HTTPS origin is configured.` : "Production HTTPS origin is not configured." },
    { service: "Security Events", status: lockedUsers > 0 ? "WARNING" : "HEALTHY", summary: lockedUsers > 0 ? `${lockedUsers} admin account lockout${lockedUsers === 1 ? "" : "s"} currently require review.` : "No active admin account lockouts." },
    { service: "Background Jobs", status: backgroundAge < jobWarningMs ? "HEALTHY" : backgroundAge < jobCriticalMs ? "WARNING" : "CRITICAL", summary: latestJob?.lastSucceededAt ? `Latest successful job completed ${latestJob.lastSucceededAt.toISOString()}.` : "No successful scheduled-job heartbeat is available yet." },
    { service: "API Errors", status: "UNKNOWN", summary: "Application failures are recorded by provider-safe server logging; production log counts become available after deployment." },
    sourceCheck("GA4", "GOOGLE_ANALYTICS"), sourceCheck("Search Console", "SEARCH_CONSOLE"), sourceCheck("Google Ads", "GOOGLE_ADS"), sourceCheck("Meta", "META_ADS"), sourceCheck("Google Business Profile", "GBP")];
  await prisma.$transaction(checks.map((check) => prisma.systemHealthCheck.create({ data: { service: check.service, status: check.status, summary: check.summary, details: check.details } })));
  const status: SystemHealthStatus = checks.some((check) => check.status === "CRITICAL") ? "CRITICAL" : checks.some((check) => check.status === "WARNING") ? "WARNING" : "HEALTHY";
  await prisma.scheduledJobHeartbeat.upsert({ where: { jobName: "owner-system-health" }, create: { jobName: "owner-system-health", status, lastStartedAt: new Date(started), lastSucceededAt: new Date(), durationMs: Date.now() - started }, update: { status, lastStartedAt: new Date(started), lastSucceededAt: new Date(), lastError: null, durationMs: Date.now() - started } });
  return checks;
}
