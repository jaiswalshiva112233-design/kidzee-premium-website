import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const enquiry = source("app/api/website/enquiry/route.ts");
const careers = source("app/api/website/careers/route.ts");
const careerForm = source("components/careers/CareerApplicationForm.tsx");
const analytics = source("app/api/website/analytics/route.ts");
const consent = source("components/MarketingConsent.tsx");
const conversions = source("lib/marketing/admissionConversions.ts");
const growth = source("lib/growth/analysis.ts");
const marketing = source("lib/growth/marketingControl.ts");
const owner = source("lib/admin/owner-intelligence.ts");
const landing = source("app/api/admin/growth/landing-pages/route.ts");
const aiControl = source("lib/growth/aiControl.ts");
const recommendations = source("app/api/admin/growth/recommendations/route.ts");
const health = source("app/admin/marketing/conversions/page.tsx");
const permissions = source("lib/admin/permissions.ts");
const attribution = source("lib/marketing/clientAttribution.ts");

test("1 admission form creates an explicitly classified admission lead", () => {
  assert.match(enquiry, /leadType:\s*"admission"/);
  assert.match(enquiry, /eventName:\s*"admission_lead_submitted"/);
});

test("2 career form creates a recruitment event", () => {
  assert.match(careers, /leadType:\s*"recruitment"/);
  assert.match(careerForm, /career_application_submitted/);
  assert.match(analytics, /eventScope:\s*scope/);
});

test("3 career submission does not create admission records", () => {
  assert.doesNotMatch(careers, /prisma\.(enquiry|admission|websiteLeadSubmission)\.(create|upsert)/);
  assert.match(careers, /careerApplication\.create/);
});

test("4 admission dashboards and AI count admission submissions only", () => {
  for (const file of [growth, marketing, owner]) assert.match(file, /leadType:\s*"admission"/);
  assert.match(growth, /new Map\(currentSubmissionRows\.map/);
});

test("5 Google admission lead conversion cannot be fired by a career form", () => {
  assert.match(consent, /!enquiryNumber/);
  assert.match(consent, /eventName\.startsWith\("career_"\)/);
  assert.match(conversions, /leadType:\s*"admission"/);
});

test("6 Meta AdmissionLead cannot be fired by a career form", () => {
  assert.match(conversions, /META:\$\{eventType\}:\$\{enquiry\.enquiryNumber\}/);
  assert.match(conversions, /trafficClass:\s*"GENUINE"/);
});

test("7 valid admission conversions are idempotent and delivered once", () => {
  assert.match(conversions, /GOOGLE_ADS:\$\{eventType\}:\$\{enquiry\.enquiryNumber\}/);
  assert.match(conversions, /META:\$\{eventType\}:\$\{enquiry\.enquiryNumber\}/);
  assert.match(conversions, /job\.status === "SUCCEEDED"/);
  for (const field of ["adGroup", "adSet", "adId", "device"]) assert.ok(attribution.includes(field));
});

test("8 final admission conversion retains confirmed-admission gating", () => {
  const admissionPage = source("app/admin/admissions/page.tsx");
  assert.match(admissionPage, /statusValue === "CONFIRMED"/);
  assert.match(admissionPage, /deliverAdmissionConversions/);
});

test("9 internal test and bot traffic is excluded from KPI and AI queries", () => {
  for (const file of [growth, marketing, owner]) {
    assert.match(file, /isInternal:\s*false/);
    assert.match(file, /isTest:\s*false/);
    assert.match(file, /isBot:\s*false/);
  }
});

test("10 landing reports are admission scoped and preserve campaign goals", () => {
  assert.match(landing, /leadType:\s*"admission"/);
  assert.match(landing, /internalTrafficIncluded:\s*false/);
  for (const field of ["campaignSource", "campaignName", "primaryGoal", "secondaryGoal", "conversionEvents", "indexable"]) assert.ok(landing.includes(field));
});

test("11 AI off blocks provider calls without disabling analytics collection", () => {
  assert.match(aiControl, /return \{ enabled: false, updatedAt: null \}/);
  assert.match(aiControl, /if \(!control\.enabled\) return \{ text: null/);
  assert.match(analytics, /activityLog\.create/);
});

test("12 AI input excludes recruitment internal test bot and repeat leads", () => {
  assert.match(growth, /eventScope !== "RECRUITMENT"/);
  assert.match(growth, /new Map\(currentSubmissionRows\.map/);
  assert.match(growth, /isInternal:\s*false/);
});

test("13 recommendation application requires owner approval", () => {
  assert.match(recommendations, /session\.role !== "OWNER"/);
  assert.match(recommendations, /MARK_APPLIED:\s*\{ status: "APPLIED", valid: \["APPROVED"\]/);
});

test("14 applied recommendation audit preserves before and rollback snapshots", () => {
  assert.match(recommendations, /beforeSnapshotPreserved:\s*true/);
  assert.match(recommendations, /rollbackPlan:\s*existing\.rollbackPlan/);
  assert.match(recommendations, /ROLLBACK:\s*\{ status: "ROLLED_BACK", valid: \["APPLIED"\]/);
});

test("15 conversion health treats excluded careers and internal traffic as expected", () => {
  assert.match(health, /Career.*expected/is);
  assert.match(health, /Internal.*expected/is);
  assert.match(health, /missing Google click ID/i);
  assert.match(health, /missing Meta match ID/i);
});

test("16 marketing mutation and internal-device controls remain owner only", () => {
  assert.match(permissions, /path:\s*"\/api\/admin\/growth"[\s\S]*permission:\s*"owner\.only"/);
  assert.match(permissions, /path:\s*"\/api\/admin\/internal-device"[\s\S]*permission:\s*"owner\.only"/);
});
