import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

test("deployment uses the complete Prisma migration history", () => {
  const setup = read("setup-and-deploy.ps1");
  assert.match(setup, /prisma", "migrate", "deploy"/);
  assert.match(setup, /prisma", "migrate", "status"/);
  assert.match(setup, /prepare:migrations/);
  assert.doesNotMatch(setup, /prisma", "db", "push"/);
  assert.doesNotMatch(setup, /prisma", "db", "execute"/);
  assert.match(setup, /ConfirmDatabaseBackup/);
});

test("marketing conversion delivery is durable, idempotent and bounded", async () => {
  const source = read("lib", "marketing", "admissionConversions.ts");
  const policy = await import("../lib/marketing/retryPolicy.ts");
  assert.equal(policy.MARKETING_MAX_ATTEMPTS, 8);
  assert.deepEqual(
    [1, 2, 3, 4].map(policy.marketingRetryDelay),
    [300_000, 600_000, 1_200_000, 2_400_000],
  );
  assert.equal(policy.marketingRetryDelay(30), 86_400_000);
  assert.match(source, /`GOOGLE_ADS:\$\{eventType\}:\$\{enquiry\.enquiryNumber\}`/);
  assert.match(source, /`META:\$\{eventType\}:\$\{enquiry\.enquiryNumber\}`/);
  assert.match(source, /enqueueMarketingConversions\(enquiryId, "ADMISSION"\)/);
  assert.match(source, /status: sent \? "SUCCEEDED" : dead \? "DEAD" : "RETRY"/);
  assert.match(source, /activityLog\.create/);
  const functions = read("functions", "src", "index.js");
  assert.match(functions, /retryMarketingConversions/);
  assert.match(functions, /every 15 minutes/);
});

test("persistent attribution keeps separate first and last touch records", () => {
  const source = read("lib", "marketing", "clientAttribution.ts");
  for (const field of [
    "gclid", "gbraid", "wbraid", "fbclid", "fbc", "fbp", "landingPage",
    "referrer", "utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm",
  ]) assert.match(source, new RegExp(`\\b${field}\\b`));
  assert.match(source, /window\.localStorage\.setItem/);
  assert.match(source, /const firstTouch = stored\?\.firstTouch \?\?/);
  assert.match(source, /firstTouch,\s*lastTouch/);
  for (const file of [
    ["components", "AdmissionForm.tsx"],
    ["components", "EnquiryForm.tsx"],
    ["components", "WebsiteAnalytics.tsx"],
    ["components", "mira", "MiraPanel.tsx"],
  ]) assert.match(read(...file), /collectPersistentAttribution/);
});

test("public endpoints use the distributed database rate limiter", () => {
  const limiter = read("lib", "server", "distributedRateLimit.ts");
  assert.match(limiter, /prisma\.rateLimitBucket\.upsert/);
  assert.match(limiter, /count: \{ increment: 1 \}/);
  for (const route of ["enquiry", "analytics", "mira", "careers"]) {
    const source = read("app", "api", "website", route, "route.ts");
    assert.match(source, /consumeDistributedRateLimit/);
    assert.doesNotMatch(source, /new Map\s*</);
  }
});

test("WhatsApp webhook verification fails closed", async () => {
  const source = read("app", "api", "webhooks", "whatsapp", "route.ts");
  const { createHmac } = await import("node:crypto");
  const security = await import("../lib/whatsapp/webhookSecurity.ts");
  const secret = "a-secure-whatsapp-app-secret-value";
  const body = '{"entry":[]}';
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(security.verifyWhatsAppWebhookSignature(body, `sha256=${signature}`, secret), true);
  assert.equal(security.verifyWhatsAppWebhookSignature(`${body}x`, `sha256=${signature}`, secret), false);
  assert.equal(security.verifyWhatsAppWebhookSignature(body, null, secret), false);
  assert.equal(security.verifyWhatsAppWebhookSignature(body, `sha256=${signature}`, "short"), false);
  assert.match(source, /WHATSAPP_APP_SECRET/);
  assert.match(read("lib", "whatsapp", "webhookSecurity.ts"), /timingSafeEqual/);
  assert.match(source, /status: 503/);
  assert.match(source, /application\/json/);
  assert.doesNotMatch(source, /if \(!appSecret\) return true/);
});

test("App Hosting requires only the controlled-trial core while preserving optional integration configuration", () => {
  const hosting = read("apphosting.yaml");
  for (const variable of [
    "DATABASE_URL", "DIRECT_URL", "FIREBASE_PROJECT_ID", "FIREBASE_STORAGE_BUCKET",
    "SANITY_API_WRITE_TOKEN", "ADMIN_SESSION_SECRET", "INTERNAL_DEVICE_SECRET",
    "ADMIN_PANEL_PASSWORD", "BILLING_CRON_SECRET",
  ]) assert.match(hosting, new RegExp(`variable: ${variable}\\b`));
  for (const variable of ["WEBSITE_ANALYTICS_ENABLED", "WEBSITE_ADVERTISING_ENABLED", "WEBSITE_META_PIXEL_ENABLED"]) {
    assert.match(hosting, new RegExp(`variable: ${variable}\\s+value: ["']?false["']?`, "m"));
  }
  for (const variable of ["OPENAI_API_KEY", "WHATSAPP_ACCESS_TOKEN", "META_CONVERSIONS_API_ACCESS_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN", "MARKETING_CRON_SECRET"]) {
    assert.doesNotMatch(hosting, new RegExp(`variable: ${variable}\\b`));
    assert.match(read(".env.example"), new RegExp(`^${variable}=`, "m"));
  }
});
