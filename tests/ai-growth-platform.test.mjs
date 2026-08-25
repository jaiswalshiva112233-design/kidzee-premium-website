import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("AI control defaults off and gates every external request", () => {
  const source = read("lib/growth/aiControl.ts");
  assert.match(source, /return \{ enabled: false/);
  assert.match(source, /if \(!control\.enabled\) return/);
  assert.match(source, /apiKeyEnvVar/);
});

test("website, ads, chat, MIRA, Terra and Luna routes are configurable", () => {
  const migration = read("prisma/migrations/20260825010000_ai_growth_platform/migration.sql");
  for (const scope of ["WEBSITE", "ADS", "CHAT", "MIRA", "TERRA", "LUNA"]) assert.match(migration, new RegExp(`'${scope}'`));
  assert.doesNotMatch(migration, /sk-[A-Za-z0-9]/);
});

test("landing pages use preview approval apply rollback and experiments", () => {
  const route = read("app/api/admin/growth/landing-pages/route.ts");
  for (const action of ["create-version", "approve-version", "apply-version", "rollback-version", "start-experiment", "complete-experiment"]) assert.match(route, new RegExp(action));
  assert.match(route, /versionNumber < version\.versionNumber/);
});

test("landing identity reaches admission submission and funnel storage", () => {
  assert.match(read("components/AdmissionForm.tsx"), /growthExperimentId/);
  assert.match(read("app/api/website/enquiry/route.ts"), /collectGrowthContext/);
  assert.match(read("components/growth/LandingPageExperience.tsx"), /LANDING_VARIANT_VIEW/);
});

test("internal and test traffic is collected but genuine reports filter it", () => {
  assert.doesNotMatch(read("components/WebsiteAnalytics.tsx"), /internal-status/);
  assert.match(read("app/api/website/analytics/route.ts"), /classifyWebsiteRequest/);
  assert.match(read("lib/growth/analysis.ts"), /filter\(genuineEvent\)/);
});

test("growth collection captures conversion and quality signals", () => {
  const client = read("components/WebsiteAnalytics.tsx");
  const server = read("app/api/website/analytics/route.ts");
  for (const event of ["SCROLL_DEPTH", "SESSION_ENGAGEMENT", "BROKEN_IMAGE", "LANDING_VARIANT_VIEW", "WEB_VITAL", "FORM_SUBMITTED"]) { assert.match(client, new RegExp(event)); assert.match(server, new RegExp(event)); }
});

test("daily scheduler synchronizes all supported admission-growth sources", () => {
  const sync = read("lib/growth/sourceSync.ts");
  for (const source of ["GOOGLE_ANALYTICS", "SEARCH_CONSOLE", "GOOGLE_ADS", "META_ADS", "GBP", "PAGESPEED"]) assert.match(sync, new RegExp(source));
  assert.match(read("functions/src/index.js"), /synchronizeGrowthSources/);
  assert.match(read("app/api/internal/growth-sync/route.ts"), /timingSafeEqual/);
});

test("AI answers preserve evidence and never auto-apply changes", () => {
  const analyse = read("app/api/admin/growth/analyse/route.ts");
  assert.match(analyse, /Use only the supplied evidence/);
  assert.match(analyse, /never changes the website or ads automatically|never claim to apply them/i);
  assert.match(analyse, /growthAnalysisRun\.create/);
});

test("published landing pages are discoverable and versioned in the database", () => {
  assert.match(read("app/sitemap.ts"), /landingPage\.findMany/);
  const schema = read("prisma/schema.prisma");
  for (const model of ["AiModelRoute", "GrowthDataSnapshot", "GrowthAnalysisRun", "LandingPage", "GrowthExperiment", "InternalTrafficIdentity"]) assert.match(schema, new RegExp(`model ${model}`));
});
