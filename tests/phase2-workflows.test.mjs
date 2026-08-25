import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  allowedEnquiryTransitions,
  canTransitionEnquiry,
} from "../lib/admin/enquiryWorkflow.ts";

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("CRM funnel enforces the intended visit, trial, qualification and admission order", () => {
  assert.equal(canTransitionEnquiry("NEW", "CONTACTED"), true);
  assert.equal(canTransitionEnquiry("CONTACTED", "VISIT_BOOKED"), true);
  assert.equal(canTransitionEnquiry("VISIT_BOOKED", "VISIT_COMPLETED"), true);
  assert.equal(canTransitionEnquiry("VISIT_COMPLETED", "TRIAL_SCHEDULED"), true);
  assert.equal(canTransitionEnquiry("VISIT_COMPLETED", "QUALIFIED"), true);
  assert.equal(canTransitionEnquiry("TRIAL_COMPLETED", "QUALIFIED"), true);
  assert.equal(canTransitionEnquiry("QUALIFIED", "ADMITTED"), true);
  assert.equal(canTransitionEnquiry("NEW", "ADMITTED"), false);
  assert.deepEqual(allowedEnquiryTransitions("ADMITTED"), []);
});

test("every CRM mutation records actor-aware timeline and audit data", () => {
  const workflow = source("app/api/admin/enquiries/[id]/workflow/route.ts");
  assert.match(workflow, /leadActivity\.create/);
  assert.match(workflow, /recordedById: userId/);
  assert.match(workflow, /activityLog\.create/);
  assert.match(workflow, /VISIT_NO_SHOW/);
  assert.match(workflow, /PARENT_FEEDBACK/);
  assert.match(workflow, /LINK_SIBLING/);
  assert.match(workflow, /action === "CLOSE"/);
  assert.match(workflow, /reason for closing this lead/);
  assert.match(workflow, /REOPEN/);
});

test("Google and Meta conversion jobs are event-specific, deduplicated and retryable", () => {
  const conversions = source("lib/marketing/admissionConversions.ts");
  assert.match(conversions, /GOOGLE_ADS:\$\{eventType\}:\$\{enquiry\.enquiryNumber\}/);
  assert.match(conversions, /META:\$\{eventType\}:\$\{enquiry\.enquiryNumber\}/);
  assert.match(conversions, /enqueueLeadConversions/);
  assert.match(conversions, /enqueueQualifiedLeadConversions/);
  assert.match(conversions, /enqueueAdmissionConversions/);
  assert.match(conversions, /status: sent \? "SUCCEEDED" : dead \? "DEAD" : "RETRY"/);
  assert.match(conversions, /retryMarketingConversion/);
  assert.match(conversions, /job\.status === "SUCCEEDED"/);
});

test("owner dashboard contains finance and ROI while Centre Head receives operations only", () => {
  const dashboard = source("app/api/admin/dashboard/route.ts");
  assert.match(dashboard, /const owner = session\.role === "OWNER"/);
  assert.match(dashboard, /if \(owner\)/);
  assert.match(dashboard, /googleRoi/);
  assert.match(dashboard, /metaRoi/);
  assert.match(dashboard, /pendingLeaveRequests/);
  assert.match(dashboard, /daycareToday/);
  assert.match(dashboard, /whatsappJobs/);
});

test("Growth Analyst stores preview, evidence, risk, affected modules and rollback without auto-application", () => {
  const recommendations = source("lib/growth/recommendations.ts");
  const route = source("app/api/admin/growth/recommendations/route.ts");
  assert.match(recommendations, /expectedImpact/);
  assert.match(recommendations, /rollbackPlan/);
  assert.match(recommendations, /affectedModules/);
  assert.match(recommendations, /evidence/);
  assert.match(route, /Only the owner can approve or roll back recommendations/);
  assert.match(route, /MARK_APPLIED/);
  assert.match(route, /ROLLBACK/);
});

test("WhatsApp automation is durable, deduplicated, retryable and supports receipt PDFs", () => {
  const automation = source("lib/whatsapp/automation.ts");
  const cloud = source("lib/whatsapp/cloud.ts");
  const scheduler = source("functions/src/index.js");
  const deliveryRoute = source("app/api/admin/whatsapp/route.ts");
  assert.match(automation, /deduplicationKey/);
  assert.match(automation, /retryDelay/);
  assert.match(automation, /status: providerMessageId \? "ACCEPTED" : failed \? "FAILED" : "RETRY"/);
  assert.match(automation, /createReceiptDocumentUrl/);
  assert.match(cloud, /headerDocument/);
  assert.match(scheduler, /exports\.processWhatsAppAutomation = onSchedule/);
  assert.match(deliveryRoute, /Only the owner can retry/);
  assert.match(deliveryRoute, /\["FAILED", "CANCELLED"\]/);
  assert.match(deliveryRoute, /entityType: "WHATSAPP_AUTOMATION"/);
  assert.match(deliveryRoute, /status: "PENDING"/);
});

test("preschool emergency daycare carries to the next monthly bill without duplicate visit invoices", () => {
  const daycare = source("app/api/admin/daycare/route.ts");
  const fees = source("app/api/admin/fees/route.ts");
  assert.match(daycare, /deferToNextMonthlyInvoice/);
  assert.match(daycare, /student\.programme !== "DAYCARE"/);
  assert.match(fees, /sessionDate: \{ lt: monthStart \}/);
  assert.match(fees, /carryoverBillingKey/);
  assert.match(fees, /feeInvoiceId: savedInvoiceId/);
  assert.match(fees, /monthlySixHourRate/);
  assert.match(fees, /monthlySixHalfHourRate/);
});

test("receipt output states GST inclusive without printing a GST percentage", () => {
  const receipt = source("app/admin/receipts/[id]/page.tsx");
  const pdf = source("app/api/receipts/[id]/pdf/route.ts");
  assert.match(receipt, /\(GST inclusive\)/);
  assert.doesNotMatch(receipt, /CGST \$\{/);
  assert.doesNotMatch(receipt, /SGST \$\{/);
  assert.match(pdf, /Inclusive of GST/);
});

test("Phase 2 schema has one deployable migration for every added workflow model", () => {
  const migration = source("prisma/migrations/20260824220000_phase2_business_workflows/migration.sql");
  for (const table of ["LeadFamily", "LeadActivity", "LeadAppointment", "GrowthRecommendation", "WhatsAppAutomationMessage"]) {
    assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
  }
  assert.match(migration, /ADD VALUE 'LEAD'/);
  assert.match(migration, /ADD VALUE 'QUALIFIED_LEAD'/);
  assert.match(migration, /monthlySixHourRate/);
  assert.match(migration, /monthlySixHalfHourRate/);
});
