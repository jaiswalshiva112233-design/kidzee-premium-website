import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { register } from "node:module";
import test from "node:test";
register(new URL("./test-loader.mjs", import.meta.url).href);
const { collectPersistentAttribution } = await import("../lib/marketing/clientAttribution.ts");
const { sendGoogleConversion, formatE164Phone, checkGoogleAdsSheetHealth } = await import("../lib/marketing/googleAdsConversions.ts");
const { enqueueMarketingConversions } = await import("../lib/marketing/admissionConversions.ts");

function browser(t, href, referrer = "") {
  const storage = new Map();
  const storageApi = { getItem: (k) => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) };
  const oldWindow = globalThis.window, oldDocument = globalThis.document;
  globalThis.window = { location: { href }, localStorage: storageApi, sessionStorage: storageApi };
  globalThis.document = { cookie: "", referrer };
  t.after(() => { globalThis.window = oldWindow; globalThis.document = oldDocument; });
  return (url, ref) => { window.location.href = url; document.referrer = ref; };
}

test("paid click and original landing page survive internal navigation even with a stale Meta cookie", (t) => {
  const navigate = browser(t, "https://example.com/landing?gclid=real_click_123&utm_source=google&utm_medium=cpc", "https://google.com/");
  const first = collectPersistentAttribution();
  document.cookie = "_fbc=old_meta_click";
  navigate("https://example.com/admissions", first.pageUrl);
  const next = collectPersistentAttribution();
  assert.equal(next.gclid, "real_click_123");
  assert.equal(next.landingPage, first.landingPage);
  assert.equal(next.pageUrl, "https://example.com/admissions");
});

test("a new acquisition replaces the last touch without mixing an old Google click into Meta", (t) => {
  const navigate = browser(t, "https://example.com/?gclid=google_click&utm_source=google&utm_medium=cpc");
  collectPersistentAttribution();
  navigate("https://example.com/?fbclid=meta_click&utm_source=facebook&utm_medium=paid", "https://facebook.com/");
  const next = collectPersistentAttribution();
  assert.equal(next.gclid, "");
  assert.equal(next.fbclid, "meta_click");
  assert.equal(next.firstTouch.gclid, "google_click");
});

test("a Google source label and historic click ID cannot queue an event without an eligible consented submission", async () => {
  const writes = [];
  const enquiry = { id: "e", enquiryNumber: "ENQ-TEST", source: "GOOGLE_ADS", status: "QUALIFIED", createdAt: new Date(), qualifiedAt: new Date(), latestGclid: "old_click", websiteSubmissions: [] };
  const db = { enquiry: { findUnique: async () => enquiry }, marketingConversionJob: { upsert: async (job) => writes.push(job) } };
  assert.deepEqual(await enqueueMarketingConversions("e", "QUALIFIED_LEAD", db), { eligible: false, queued: 0 });
  assert.equal(writes.length, 0);
  enquiry.websiteSubmissions = [{ source: "GOOGLE_ADS", gbraid: "consented_braid" }];
  assert.deepEqual(await enqueueMarketingConversions("e", "QUALIFIED_LEAD", db), { eligible: true, queued: 1 });
  assert.equal(writes[0].create.payload.gclid, null);
  assert.equal(writes[0].create.payload.gbraid, "consented_braid");
  assert.deepEqual(writes[0].update, {});
});

const event = { enquiryNumber: "ENQ-SYNTHETIC", conversionTime: new Date("2026-10-23T01:02:03.456Z"), gclid: "synthetic_click_id", gbraid: null, wbraid: null, phone: "09876543210", email: null };
function environment(t, sheet = "") {
  const values = { GOOGLE_ADS_SHEET_WEBHOOK_URL: sheet, GOOGLE_ADS_SHEET_WEBHOOK_SECRET: "synthetic-test-secret-at-least-32-characters", GOOGLE_ADS_CUSTOMER_ID: "1234567890", GOOGLE_ADS_LEAD_CONVERSION_ACTION_ID: "111", GOOGLE_ADS_DEVELOPER_TOKEN: "synthetic", GOOGLE_ADS_CLIENT_ID: "synthetic", GOOGLE_ADS_CLIENT_SECRET: "synthetic", GOOGLE_ADS_REFRESH_TOKEN: "synthetic" };
  const saved = Object.fromEntries(Object.keys(values).map(k=>[k, process.env[k]]));
  Object.assign(process.env, values);
  t.after(() => { for(const k of Object.keys(values)) saved[k] === undefined ? delete process.env[k] : process.env[k] = saved[k]; });
}

test("phone normalization retains the plus and country code required before hashing", () => {
  assert.equal(formatE164Phone("09876543210"), "+919876543210");
  assert.equal(formatE164Phone("+91 98765 43210"), "+919876543210");
  assert.equal(formatE164Phone("invalid"), "");
});

test("a Sheet timeout stays on the same idempotent transport and never falls through to a second action", async (t) => {
  environment(t, "https://script.google.com/macros/s/synthetic/exec");
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url) => { requests.push(String(url)); throw new Error("timeout after append"); });
  const result = await sendGoogleConversion("LEAD", event);
  assert.equal(result.sent, false);
  assert.equal(result.reason, "sheet_delivery_failed");
  assert.equal(requests.length, 1);
});

test("an unconfigured transport cannot send a parent record to an embedded fallback destination", async (t) => {
  environment(t);
  delete process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls++; throw new Error("unexpected"); });
  assert.equal((await sendGoogleConversion("LEAD", event)).reason, "not_configured");
  assert.equal(calls, 0);
});

test("Google upload success requires a populated per-row result, uses E164 hashes and stable order IDs", async (t) => {
  environment(t);
  let responseBody = {};
  const uploads = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (String(url).includes("oauth2.googleapis.com")) return Response.json({ access_token: "synthetic" });
    uploads.push(JSON.parse(options.body));
    return Response.json(responseBody);
  });
  assert.equal((await sendGoogleConversion("LEAD", event)).sent, false);
  responseBody = { results: [{ conversionAction: "customers/1234567890/conversionActions/111" }] };
  assert.equal((await sendGoogleConversion("LEAD", event)).sent, true);
  const conversion = uploads[1].conversions[0];
  assert.equal(conversion.orderId, "ENQ-SYNTHETIC");
  assert.equal(conversion.conversionDateTime, "2026-10-23 01:02:03+00:00");
  assert.equal(conversion.userIdentifiers[0].hashedPhoneNumber, createHash("sha256").update("+919876543210").digest("hex"));
  responseBody.partialFailureError = { code: 3 };
  assert.equal((await sendGoogleConversion("LEAD", event)).sent, false);
});


test("connection probes send no lead data and require an explicit healthy response", async t => {
  environment(t, "https://script.google.com/macros/s/synthetic/exec");
  const requests = [];
  let payload = { status: "success", healthy: true };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return { ok: true, json: async () => payload };
  });
  assert.equal(await checkGoogleAdsSheetHealth(), "VERIFIED");
  assert.deepEqual(Object.keys(requests[0].body).sort(), ["action", "secret"]);
  assert.equal(requests[0].body.action, "health");
  payload = { status: "success" };
  assert.equal(await checkGoogleAdsSheetHealth(), "UNAVAILABLE");
});

test("connection probes cannot transmit credentials to an untrusted destination", async t => {
  environment(t, "https://example.com/macros/s/synthetic/exec");
  t.mock.method(globalThis, "fetch", async () => { throw new Error("Must not fetch"); });
  assert.equal(await checkGoogleAdsSheetHealth(), "NOT_CONFIGURED");
});
