import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Owner intelligence persistence is represented by an additive migration", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260825120000_owner_intelligence_platform/migration.sql");
  for (const model of ["BusinessIntelligenceSnapshot", "SystemHealthCheck", "ScheduledJobHeartbeat"]) assert.match(schema, new RegExp(`model ${model}`));
  for (const table of ["BusinessIntelligenceSnapshot", "SystemHealthCheck", "ScheduledJobHeartbeat"]) assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test("Owner Intelligence is owner-only at page, API and navigation policy", () => {
  const page = read("app/admin/intelligence/page.tsx");
  const api = read("app/api/admin/intelligence/route.ts");
  const permissions = read("lib/admin/permissions.ts");
  assert.match(page, /session\.role !== "OWNER"/);
  assert.match(api, /session\?\.role === "OWNER"/);
  assert.match(permissions, /path: "\/admin\/intelligence", permission: "owner\.only"/);
  assert.match(permissions, /path: "\/api\/admin\/intelligence", permission: "owner\.only"/);
});

test("Cached dashboard reads persisted snapshot without recalculating all metrics", () => {
  const api = read("app/api/admin/intelligence/route.ts");
  assert.match(api, /recent && !refresh \? restoreSnapshot\(recent\)/);
  assert.doesNotMatch(api, /recent && !refresh \? await buildOwnerIntelligence/);
  assert.match(api, /15 \* 60 \* 1000/);
});

test("Executive, marketing, finance, forecast, audit, health and settings are visible", () => {
  const component = read("components/admin/intelligence/OwnerIntelligenceDashboard.tsx");
  for (const text of ["Lead and admission funnel", "Marketing intelligence", "Six-month cashflow", "Forecasts are planning estimates", "Intelligence Report Centre", "Live system health", "Scheduled jobs", "Owner settings"]) assert.ok(component.includes(text), `${text} is missing`);
  for (const metric of ["enquiriesToday", "googleAdsToday", "metaToday", "visitToAdmission", "studentPresent", "teacherPresent", "upcomingBirthdays", "pendingFeeCollection"]) assert.ok(component.includes(metric), `${metric} is missing`);
});

test("Forecasts disclose confidence, historical basis and no guarantee", () => {
  const intelligence = read("lib/admin/owner-intelligence.ts");
  for (const forecast of ["Expected admissions", "Expected revenue", "Expected expenses", "Expected collection", "Outstanding recovery", "Expected occupancy", "Programme demand", "Daycare demand", "Available capacity", "Estimated retention", "Teacher requirement"]) assert.ok(intelligence.includes(forecast), `${forecast} is missing`);
  assert.match(intelligence, /confidence/);
  assert.match(intelligence, /historicalBasis/);
  assert.match(intelligence, /guarantee: false/);
});

test("Reports support PDF, Excel, CSV and applicable business filters", () => {
  const route = read("app/api/admin/intelligence/export/route.ts");
  const caRoute = read("app/api/admin/reports/ca-export/route.ts");
  for (const format of ["application/pdf", "application/vnd.ms-excel", "text/csv"]) { assert.ok(route.includes(format)); assert.ok(caRoute.includes(format)); }
  for (const filter of ["from", "to", "programme", "teacher", "campaign", "landingPage"]) assert.match(route, new RegExp(`get\\(\\"${filter}\\"\\)`));
  assert.match(route, /trafficClass: "GENUINE"/);
});

test("System health and the protected scheduled refresh cover launch services", () => {
  const health = read("lib/admin/system-health.ts");
  const functions = read("functions/src/index.js");
  const environment = read("scripts/validate-production-env.mjs");
  for (const service of ["Website", "Panel", "Database", "Firebase", "Functions", "Storage", "AI", "WhatsApp", "Sanity", "GA4", "Search Console", "Google Ads", "Meta", "Google Business Profile", "Media Worker", "Environment", "Webhook Status", "Deployment", "Security Events", "Background Jobs", "API Errors"]) assert.ok(health.includes(`"${service}"`), `${service} is missing`);
  assert.match(functions, /refreshOwnerIntelligence = onSchedule/);
  assert.match(functions, /every 15 minutes/);
  assert.match(functions, /OWNER_INTELLIGENCE_CRON_SECRET/);
  assert.match(environment, /required\("OWNER_INTELLIGENCE_CRON_SECRET", 32\)/);
});
