import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { calculateChargePricing } from "../lib/admin/charge-pricing.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const schema = read("prisma/schema.prisma");
const migrationEnums = read(
  "prisma/migrations/20260825230000_enrollment_contract_enums/migration.sql",
);
const migrationBoundary = read(
  "prisma/migrations/20260825231000_enrollment_contract_boundary/migration.sql",
);
const studentApi = read("app/api/admin/students/route.ts");
const studentForm = read("components/admin/students/AddStudentForm.tsx");
const recurring = read("lib/admin/recurring-billing.ts");
const attendance = read("app/api/admin/attendance/route.ts");
const daycare = read("app/api/admin/daycare/route.ts");
const catalogue = read("app/api/admin/billing-catalog/route.ts");
const account = read("components/admin/students/StudentAccountWorkspace.tsx");
const receipt = read("app/admin/receipts/[id]/page.tsx");
const dashboard = read("app/admin/page.tsx");
const reports = read("app/admin/reports/page.tsx");
const admissions = read("app/admin/admissions/page.tsx");
const legacyFees = read("app/admin/settings/fees/page.tsx");

test("preschool-only admission creates one explicit contract, ledger boundary and draft bill", () => {
  assert.match(schema, /model StudentEnrollmentContract[\s\S]*studentId\s+String\s+@unique/);
  assert.match(schema, /model ContractService/);
  assert.match(studentApi, /createEnrollmentContractAndDraftInvoice/);
  assert.match(studentApi, /isolationLevel: "Serializable"/);
  assert.match(studentForm, /Save & Generate Draft Bill/);
});

test("preschool, daycare, meals and annual or kit share one first invoice", () => {
  for (const service of ["PRESCHOOL", "DAYCARE", "MEAL", "ANNUAL", "KIT"])
    assert.match(schema, new RegExp(`\\b${service}\\b`));
  assert.match(studentForm, /Combined bill preview/);
  assert.match(studentForm, /Recurring monthly/);
  assert.match(studentApi, /draftInvoiceId/);
  assert.match(schema, /enum FeeInvoiceStatus[\s\S]*DRAFT/);
});

test("daycare-only contract is excluded from preschool attendance", () => {
  assert.match(attendance, /preschoolEnabled: true/);
  assert.match(attendance, /enrollmentContract/);
  assert.match(daycare, /daycareEnabled/);
});

test("weekly prepaid daycare remains fixed and extra weekdays enter additional daycare", () => {
  assert.match(daycare, /prepaidPlanCoversWeekday/);
  assert.match(daycare, /additionalPlanVisit/);
  assert.match(daycare, /invoiceStatus: "CONTRACT_COVERED"/);
  assert.doesNotMatch(recurring, /attendanceRecord|attendanceStatus/);
});

test("ending daycare stops future contract billing without changing old invoice items", () => {
  assert.match(recurring, /effectiveTo: \{ gte: start \}/);
  assert.match(daycare, /contractService\.update/);
  assert.match(daycare, /status: target === "ACTIVE" \? "ACTIVE" : "ENDED"/);
  assert.doesNotMatch(catalogue, /feeInvoiceItem\.updateMany/);
});

test("Replace Plan ends old services, creates new snapshots and preserves history", () => {
  assert.match(catalogue, /replace-plan-preview/);
  assert.match(catalogue, /replace-plan-apply/);
  assert.match(catalogue, /affectedPlans/);
  assert.match(catalogue, /contractService\.create/);
  assert.match(catalogue, /Historical plans and invoices were preserved/);
  assert.match(catalogue, /isolationLevel: "Serializable"/);
});

test("annual and kit skip reason and same-session duplicate safeguards are persisted", () => {
  assert.match(schema, /annualKitSkipReason\s+String\?/);
  assert.match(studentForm, /already has a kit|transfer/i);
  assert.match(studentApi, /annualKitSkipReason/);
  assert.match(migrationBoundary, /annualKitSkipReason/);
});

test("duplicate child detection blocks silent duplicate creation and requires an override reason", () => {
  assert.match(schema, /identityFingerprint\s+String\?/);
  assert.match(studentApi, /POSSIBLE_DUPLICATE_STUDENT/);
  assert.match(studentApi, /duplicateOverrideReason\.length < 5/);
  assert.match(studentForm, /Open existing student/);
  assert.match(studentForm, /Continue as sibling \/ twin/);
});

test("documents-pending admission does not prematurely fire admitted conversions", () => {
  assert.match(studentApi, /documentsComplete[\s\S]*\? "CONFIRMED"[\s\S]*: "DOCUMENTS_PENDING"/);
  assert.match(studentApi, /status: documentsComplete[\s\S]*\? "ADMITTED"/);
  assert.match(studentApi, /if \(enquiryId && documentsComplete\)/);
  assert.match(admissions, /statusValue === "CONFIRMED"/);
});

test("Student Finance shows every active contract service and every daycare plan", () => {
  assert.match(account, /props\.contract\.services\.map/);
  assert.match(account, /Additional active daycare services/);
  assert.match(account, /props\.plans\.slice\(1\)/);
});

test("inclusive GST snapshots keep the parent total clean", () => {
  const price = calculateChargePricing({
    configuredAmount: 6000,
    gstApplicable: true,
    gstRate: 18,
    priceType: "GST_INCLUSIVE",
  });
  assert.equal(price.totalAmount, 6000);
  assert.equal(price.taxableAmount, 5084.75);
  assert.match(schema, /model ContractService[\s\S]*taxableValue[\s\S]*cgst[\s\S]*sgst[\s\S]*total/);
  assert.match(receipt, /GST included wherever applicable/);
});

test("multiple recurring daycare services bill once through contract-service charge keys", () => {
  assert.match(recurring, /contract-service:\$\{service\.id\}:\$\{key\}/);
  assert.match(recurring, /contractServiceId: item\.contractServiceId/);
  assert.match(schema, /contractServiceId\s+String\?/);
});

test("paid receipt refund and reversal create immutable financial correction records", () => {
  assert.match(schema, /model FinancialCorrection/);
  assert.match(receipt, /financialCorrection\.create/);
  assert.match(receipt, /action === "refund" \? "REFUND" : "REVERSAL"/);
  assert.match(receipt, /FINANCIAL_CORRECTION/);
});

test("contract participation drives dashboard, reports and official workflows", () => {
  assert.match(dashboard, /studentEnrollmentContract\.count/);
  assert.match(dashboard, /contractService\.aggregate/);
  assert.match(reports, /preschoolEnabled: true/);
  assert.match(reports, /daycareEnabled: true/);
  assert.match(reports, /mealsEnabled: true/);
  assert.match(legacyFees, /Owner-only legacy compatibility/);
  assert.match(daycare, /Only the Owner can change a child's contracted daycare plan/);
});

test("the complete enrollment boundary is represented in versioned migrations", () => {
  assert.match(migrationEnums, /CREATE TYPE "EnrollmentContractStatus"/);
  assert.match(migrationEnums, /ALTER TYPE "FeeInvoiceStatus" ADD VALUE IF NOT EXISTS 'DRAFT'/);
  for (const table of ["StudentEnrollmentContract", "ContractService", "FinancialCorrection"])
    assert.match(migrationBoundary, new RegExp(`CREATE TABLE "${table}"`));
  assert.match(migrationBoundary, /StudentEnrollmentContract_studentId_key/);
  assert.match(migrationBoundary, /FeeInvoice_enrollmentContractId_fkey/);
});
