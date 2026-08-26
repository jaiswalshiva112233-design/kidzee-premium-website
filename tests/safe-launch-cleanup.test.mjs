import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const cleanup = source("lib/admin/dataControl.ts");
const endpoint = source("app/api/admin/data-control/route.ts");
const page = source("app/admin/settings/data/page.tsx");
const workspace = source(
  "components/admin/settings/DataControlCenter.tsx",
);

function occursBefore(first, second) {
  const firstIndex = cleanup.indexOf(first);
  const secondIndex = cleanup.indexOf(second);
  assert.notEqual(firstIndex, -1, `Missing ${first}`);
  assert.notEqual(secondIndex, -1, `Missing ${second}`);
  assert.ok(firstIndex < secondIndex, `${first} must occur before ${second}`);
}

test("student cleanup removes contract services and contract before student", () => {
  occursBefore("transaction.contractService.deleteMany", "transaction.studentEnrollmentContract.delete");
  occursBefore("transaction.studentEnrollmentContract.delete", "transaction.student.delete");
});

test("student cleanup removes financial children before invoices and student", () => {
  occursBefore("transaction.financialCorrection.deleteMany", "transaction.receipt.deleteMany");
  occursBefore("transaction.receipt.deleteMany", "transaction.feePayment.deleteMany");
  occursBefore("transaction.feePayment.deleteMany", "transaction.feeInvoice.deleteMany");
  occursBefore("transaction.feeInvoice.deleteMany", "transaction.student.delete");
});

test("student cleanup removes daycare sessions before plans and student", () => {
  occursBefore("transaction.daycareSession.deleteMany", "transaction.studentDaycarePlan.deleteMany");
  occursBefore("transaction.studentDaycarePlan.deleteMany", "transaction.student.delete");
});

test("student cleanup handles admissions and linked enquiries without orphans", () => {
  assert.match(cleanup, /transaction\.admission\.delete/);
  assert.match(cleanup, /if \(options\.deleteEnquiry\)/);
  assert.match(cleanup, /status: "CONTACTED"/);
  assert.match(cleanup, /admittedAt: null/);
});

test("student cleanup handles notification, WhatsApp and activity dependencies", () => {
  assert.match(cleanup, /transaction\.adminNotification\.deleteMany/);
  assert.match(cleanup, /transaction\.whatsAppAutomationMessage\.deleteMany/);
  assert.match(cleanup, /transaction\.activityLog\.deleteMany/);
});

test("paid and corrected history requires explicit test-data confirmation", () => {
  assert.match(cleanup, /protectedFinancialRecords > 0 && !options\.testDataConfirmed/);
  assert.match(cleanup, /DataControlBlockedError/);
  assert.match(endpoint, /status: 409/);
  assert.match(endpoint, /error\.code === "P2003"/);
  assert.match(endpoint, /Delete the linked pre-launch test record first/);
});

test("individual record deletion requires backup and test-data confirmation", () => {
  assert.match(cleanup, /input\.backupConfirmed !== true/);
  assert.match(cleanup, /input\.testDataConfirmed !== true/);
  assert.match(workspace, /recordBackupConfirmed/);
  assert.match(workspace, /recordTestDataConfirmed/);
});

test("bulk deletion requires exact phrase, backup and test-data confirmation", () => {
  assert.match(cleanup, /DATA_CONTROL_CONFIRMATION/);
  assert.match(cleanup, /input\.backupConfirmed !== true/);
  assert.match(cleanup, /TEST_DATA_CONFIRMATION_REQUIRED/);
  assert.match(workspace, /DELETE SELECTED DATA/);
  assert.match(workspace, /testDataConfirmed/);
});

test("cleanup executes all related deletions in one transaction", () => {
  assert.match(cleanup, /prisma\.\$transaction\(async \(transaction\) =>/);
  assert.match(cleanup, /BULK_CLEANUP_TRANSACTION_OPTIONS/);
  assert.match(cleanup, /maxWait:\s*15_000/);
  assert.match(cleanup, /timeout:\s*120_000/);
  assert.match(endpoint, /No partial deletion was kept/);
});

test("catalogue cleanup preserves anything with active or historical dependencies", () => {
  assert.match(cleanup, /sourceDependencyCounts/);
  assert.match(cleanup, /historical invoice dependencies/);
  assert.match(cleanup, /archive or remove dependencies first/);
  assert.match(cleanup, /archive instead/);
});

test("catalogue cleanup supports preschool, daycare, meals, charges and legacy settings", () => {
  for (const section of [
    "preschoolCatalogue",
    "daycareCatalogue",
    "mealCatalogue",
    "otherChargeCatalogue",
    "legacyFeeSettings",
  ]) {
    assert.match(cleanup, new RegExp(section));
    assert.match(workspace, new RegExp(section));
  }
});

test("cleanup preview shows exact student dependencies and protected finance", () => {
  assert.match(workspace, /Review exactly what will be removed/);
  assert.match(workspace, /linkedStudentSummary\(student\.linked\)/);
  assert.match(workspace, /student\.protectedFinancialHistory/);
  assert.match(workspace, /returned to Contacted unless Enquiries is also selected/);
});

test("catalogue preview distinguishes deletion from protected retention", () => {
  assert.match(workspace, /item\.safeToDelete \? "Will delete" : "Protected for now"/);
  assert.match(workspace, /dependencies are checked again after the selected test students/);
});

test("invoice and standalone payment cleanup delete corrections before payment records", () => {
  const invoiceStart = cleanup.indexOf("async function deleteInvoiceBundle");
  const paymentStart = cleanup.indexOf("async function deletePaymentBundle");
  const invoiceBody = cleanup.slice(invoiceStart, paymentStart);
  const paymentBody = cleanup.slice(paymentStart, cleanup.indexOf("async function deleteAllFees"));
  assert.ok(invoiceBody.indexOf("financialCorrection.deleteMany") < invoiceBody.indexOf("receipt.deleteMany"));
  assert.ok(paymentBody.indexOf("financialCorrection.deleteMany") < paymentBody.indexOf("receipt.deleteMany"));
});

test("deleting a visit invoice restores its daycare session to a billable state", () => {
  assert.match(cleanup, /feeInvoiceId: null,[\s\S]*status: "BOOKED"/);
});

test("data cleanup and export remain Owner-only", () => {
  assert.match(endpoint, /await requireOwner\(\)/);
  assert.match(page, /session\.role !== "OWNER"/);
  const exportRoute = source("app/api/admin/data-control/export/route.ts");
  assert.match(exportRoute, /await requireOwner\(\)/);
});

test("backup includes enrollment contracts, corrections and editable catalogues", () => {
  assert.match(cleanup, /enrollmentContract:[\s\S]*services: true/);
  assert.match(cleanup, /financialCorrections: true/);
  assert.match(cleanup, /programmeDefinitions/);
  assert.match(cleanup, /daycarePlanDefinitions/);
  assert.match(cleanup, /mealCombinations/);
  assert.match(cleanup, /legacyDaycareRates/);
});
