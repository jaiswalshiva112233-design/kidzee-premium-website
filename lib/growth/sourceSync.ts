import "server-only";

import { createHash } from "node:crypto";
import type { GrowthDataSource, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { buildGrowthSnapshot } from "@/lib/growth/analysis";
import { logServerError } from "@/lib/server/safeLogging";

type Connector = { source: GrowthDataSource; dataset: string; urlEnv: string; tokenEnv?: string; extraHeaders?: () => Record<string, string> };
const connectors: Connector[] = [
  { source: "GOOGLE_ANALYTICS", dataset: "ga4-admission-funnel", urlEnv: "GROWTH_GA4_DATA_URL", tokenEnv: "GOOGLE_ANALYTICS_ACCESS_TOKEN" },
  { source: "SEARCH_CONSOLE", dataset: "search-performance", urlEnv: "GROWTH_SEARCH_CONSOLE_DATA_URL", tokenEnv: "GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN" },
  { source: "GOOGLE_ADS", dataset: "campaign-performance", urlEnv: "GROWTH_GOOGLE_ADS_DATA_URL", tokenEnv: "GOOGLE_ADS_ACCESS_TOKEN", extraHeaders: () => ({ "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim() ?? "" }) },
  { source: "META_ADS", dataset: "campaign-performance", urlEnv: "GROWTH_META_DATA_URL", tokenEnv: "META_CONVERSIONS_API_ACCESS_TOKEN" },
  { source: "GBP", dataset: "local-profile-performance", urlEnv: "GROWTH_GBP_DATA_URL", tokenEnv: "GOOGLE_BUSINESS_PROFILE_ACCESS_TOKEN" },
  { source: "PAGESPEED", dataset: "pagespeed-insights", urlEnv: "GROWTH_PAGESPEED_DATA_URL", tokenEnv: "GOOGLE_PAGESPEED_API_KEY" },
  { source: "MANUAL", dataset: "competitor-and-keyword-evidence", urlEnv: "GROWTH_COMPETITOR_DATA_URL", tokenEnv: "GROWTH_COMPETITOR_ACCESS_TOKEN" },
];

function json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue; }
function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

async function save(source: GrowthDataSource, dataset: string, metrics: unknown, periodStart: Date, periodEnd: Date) {
  const key = `${source}:${dataset}:${periodStart.toISOString().slice(0, 10)}:${hash(metrics)}`;
  await prisma.growthDataSnapshot.upsert({
    where: { deduplicationKey: key },
    create: { source, dataset, deduplicationKey: key, periodStart, periodEnd, dimensions: { centre: "Kidzee Sector 12B Dwarka" }, metrics: json(metrics) },
    update: { metrics: json(metrics), collectedAt: new Date() },
  });
}

async function syncConnector(connector: Connector, from: Date, to: Date) {
  const rawUrl = process.env[connector.urlEnv]?.trim();
  if (!rawUrl) return { source: connector.source, status: "NOT_CONFIGURED" };
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error(`${connector.urlEnv} must use HTTPS.`);
  url.searchParams.set("from", from.toISOString());
  url.searchParams.set("to", to.toISOString());
  const token = connector.tokenEnv ? process.env[connector.tokenEnv]?.trim() : "";
  const response = await fetch(url, { headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(connector.extraHeaders?.() ?? {}) }, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${connector.source} returned ${response.status}.`);
  const payload = await response.json();
  await save(connector.source, connector.dataset, payload, from, to);
  return { source: connector.source, status: "COLLECTED" };
}

export async function syncGrowthSources() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 86_400_000);
  const centreOs = await buildGrowthSnapshot(30);
  await save("CENTREOS", "admission-funnel", centreOs, from, to);
  const baseUrl = (process.env.CENTREOS_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://kidzeedwarka.com").replace(/\/$/, "");
  const monitoredPaths = ["/", "/about", "/programmes", "/daycare", "/admissions", "/gallery", "/contact"];
  const health = [];
  for (const path of monitoredPaths) {
    const startedAt = Date.now();
    try {
      const response = await fetch(`${baseUrl}${path}`, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(15_000) });
      const html = response.ok ? await response.text() : "";
      const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
      const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1]?.trim() ?? "";
      const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
      const internalLinkCount = (html.match(/<a[^>]+href=["']\/(?!\/)/gi) ?? []).length;
      health.push({
        path,
        status: response.status,
        responseMs: Date.now() - startedAt,
        title,
        description,
        hasTitle: title.length > 0,
        hasDescription: description.length > 0,
        h1Count,
        hasH1: h1Count === 1,
        hasCanonical: /<link[^>]+rel=["']canonical["']/i.test(html),
        noIndex: /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html),
        internalLinkCount,
        imageCount: (html.match(/<img[\s>]/gi) ?? []).length,
      });
    } catch { health.push({ path, status: 0, responseMs: Date.now() - startedAt, title: "", description: "", hasTitle: false, hasDescription: false, h1Count: 0, hasH1: false, hasCanonical: false, noIndex: false, internalLinkCount: 0, imageCount: 0 }); }
  }
  await save("WEBSITE", "scheduled-site-health", {
    pages: health,
    brokenPages: health.filter((item) => item.status < 200 || item.status >= 400).length,
    missingTitles: health.filter((item) => !item.hasTitle).length,
    missingDescriptions: health.filter((item) => !item.hasDescription).length,
    headingIssues: health.filter((item) => item.h1Count !== 1).length,
    missingCanonical: health.filter((item) => !item.hasCanonical).length,
    slowPages: health.filter((item) => item.responseMs > 2_500).length,
    weakInternalLinks: health.filter((item) => item.internalLinkCount < 2).length,
  }, from, to);
  const results = [];
  for (const connector of connectors) {
    try { results.push(await syncConnector(connector, from, to)); }
    catch (error) { logServerError(`Growth source ${connector.source} could not be synchronized.`, error); results.push({ source: connector.source, status: "FAILED" }); }
  }
  return { centreOs: "COLLECTED", results };
}
