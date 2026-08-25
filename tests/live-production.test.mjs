import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const schema = read("prisma/schema.prisma");
const campaignApi = read("app/api/admin/marketing/campaign-urls/route.ts");
const campaignRules = read("lib/marketing/campaignUrls.ts");
const campaignUi = read("components/admin/marketing/CampaignUrlBuilder.tsx");
const notification = read("lib/admin/notifications.ts");
const notificationApi = read("app/api/admin/notifications/route.ts");
const worker = read("public/firebase-messaging-sw.js");
const functions = read("functions/src/index.js");
const env = read("scripts/validate-production-env.mjs");
const enquiry = read("app/api/website/enquiry/route.ts");
const careers = read("app/api/website/careers/route.ts");
const attribution = read("lib/marketing/clientAttribution.ts");
const landingApi = read("app/api/admin/growth/landing-pages/route.ts");
const landingManager = read("components/admin/growth/LandingPageManager.tsx");
const landingExperience = read("components/growth/LandingPageExperience.tsx");
const landingPage = read("app/landing/[slug]/page.tsx");

test("campaign URLs are persistent, unique and audited", () => {
  assert.match(schema, /model CampaignUrl/); assert.match(schema, /trackingKey\s+String\s+@unique/); assert.match(campaignApi, /entityType: "CAMPAIGN_URL"/);
});
test("admission destinations cannot use careers", () => assert.match(campaignRules, /purpose === "ADMISSION" && careers/));
test("recruitment destinations must use careers", () => assert.match(campaignRules, /purpose === "RECRUITMENT" && !careers/));
test("campaign URL carries full UTM and CentreOS key", () => {
  for (const key of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","centreos_campaign"]) assert.match(campaignRules, new RegExp(key));
});
test("campaign builder supports all required platforms and purposes", () => {
  for (const value of ["GOOGLE","META","ORGANIC","OLX","REFERRAL","OTHER","ADMISSION","RECRUITMENT","GENERAL"]) assert.match(campaignUi, new RegExp(value));
});
test("campaign performance keeps applications and leads separate", () => {
  assert.match(campaignApi, /leadType: "admission"/); assert.match(campaignApi, /leadType: "recruitment"/); assert.match(campaignApi, /trafficClass: "GENUINE"/);
});
test("persistent attribution never overwrites first touch", () => {
  assert.match(attribution, /stored\?\.firstTouch \?\?/); assert.match(attribution, /campaignTrackingKey/); assert.match(attribution, /localStorage\.setItem/);
});
test("new genuine admission leads create only admission notifications", () => {
  assert.match(enquiry, /result\.created && requestClassification\.trafficClass === "GENUINE"/); assert.match(enquiry, /category: "ADMISSION"/); assert.doesNotMatch(enquiry, /category: "CAREERS"/);
});
test("career applications create recruitment notification only", () => {
  assert.match(careers, /category: "CAREERS"/); assert.doesNotMatch(careers, /category: "ADMISSION"/);
});
test("notification idempotency is per event and recipient", () => {
  assert.match(notification, /idempotencyKey = `\$\{input\.type\}:\$\{input\.eventKey\}:\$\{user\.id\}`/); assert.match(schema, /idempotencyKey\s+String\s+@unique/);
});
test("Centre Head never receives owner-only system or AI alerts", () => {
  assert.match(notification, /input\.ownerOnly && user\.role !== "OWNER"/); assert.match(notification, /const operational = new Set/); assert.match(notification, /ownerOnly: true/);
});
test("notification routing checks Centre Head permissions", () => assert.match(notification, /hasAdminPermissionRequirement/));
test("quiet hours suppress normal push while critical policy remains", () => {
  assert.match(notification, /quietHoursEnabled/); assert.match(notification, /input\.priority !== "CRITICAL"/);
});
test("push delivery retries with exponential delay and limit", () => {
  assert.match(notification, /2 \*\* Math\.max/); assert.match(notification, /attempts: \{ lt: 5 \}/); assert.match(notification, /"RETRY"/);
});
test("device registration belongs to authenticated admin user", () => {
  assert.match(notificationApi, /adminUserId: session\.userId/); assert.match(notificationApi, /permissionStatus: "GRANTED"/);
});
test("push payload contains only privacy-safe notification fields", () => {
  assert.match(notification, /data: \{ title: row\.notification\.title, body: row\.notification\.body, href:/); assert.doesNotMatch(notification, /phone:|childName:|parentName:/);
});
test("notification click deep-links back into CentreOS", () => assert.match(worker, /clients\.openWindow\(href\)/));
test("scheduled notification worker is configured with a secret", () => {
  assert.match(functions, /processCentreNotifications/); assert.match(functions, /secrets: \[notificationCronSecret\]/); assert.match(functions, /every 15 minutes/);
});
test("notification event scan covers required operational categories", () => {
  for (const value of ["MISSED_FOLLOW_UP","VISIT_TODAY","VISIT_MISSED","ADMISSION_DOCUMENTS_PENDING","FEE_OVERDUE","DAYCARE_CHECKOUT_PENDING","EXTRA_DAYCARE_RECORDED","STUDENT_ATTENDANCE_PENDING","WHATSAPP_DELIVERY_FAILED","CAREER_APPLICATION"]) assert.match(notification, new RegExp(value));
});
test("production validation requires Firebase Messaging and scheduler values without printing secrets", () => {
  for (const value of ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID","NEXT_PUBLIC_FIREBASE_APP_ID","NEXT_PUBLIC_FIREBASE_VAPID_KEY","NOTIFICATION_CRON_SECRET"]) assert.match(env, new RegExp(value));
  assert.doesNotMatch(env, /console\.(log|error)\([^\n]*process\.env/);
  assert.match(env, /needs a production value/);
});
test("landing manager supports admission, daycare and recruitment without parallel workflows", () => {
  for (const value of ["ADMISSIONS", "DAYCARE", "RECRUITMENT"]) {
    assert.match(landingManager, new RegExp(value));
    assert.match(landingApi, new RegExp(value));
  }
  assert.match(landingApi, /const PAGE_TYPES = new Set/);
});
test("recruitment landing pages render the career form while admission and daycare reuse the lead form", () => {
  assert.match(landingExperience, /page\.pageType === "RECRUITMENT"/);
  assert.match(landingExperience, /<CareerApplicationForm/);
  assert.match(landingExperience, /<AdmissionForm/);
  assert.match(landingExperience, /page\.pageType === "DAYCARE"/);
});
test("landing conversion reports separate recruitment applications and daycare enquiries", () => {
  assert.match(landingApi, /careerApplication\.findMany/);
  assert.match(landingApi, /landingSlug\(row\.landingPage\)/);
  assert.match(landingApi, /row\.enquiryType === "DAYCARE"/);
});
test("managed landing pages honour Owner-controlled search indexing", () => {
  assert.match(landingPage, /const indexable = content\.indexable === true/);
  assert.match(landingPage, /robots: \{ index: indexable, follow: indexable \}/);
});
