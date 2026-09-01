import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  externalResetMatrix,
  prismaResetMatrix,
  schemaModelNames,
  validateResetMatrix,
} from "../scripts/centreos-clean-slate-reset.mjs";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "scripts", "centreos-clean-slate-reset.mjs"), "utf8");

test("clean-slate matrix classifies every Prisma model exactly once", () => {
  const schemaModels = schemaModelNames();
  const coverage = validateResetMatrix(schemaModels);
  assert.equal(schemaModels.length, 75);
  assert.equal(prismaResetMatrix.length, 75);
  assert.equal(new Set(prismaResetMatrix.map((entry) => entry.model)).size, 75);
  assert.equal(coverage.totalModels, 75);
});

test("Owner auth, centre settings and public website sources are preserved", () => {
  const byModel = new Map(prismaResetMatrix.map((entry) => [entry.model, entry]));
  assert.equal(byModel.get("AdminCredential")?.classification, "PRESERVE");
  assert.equal(byModel.get("AdminUser")?.classification, "PARTIAL");
  assert.match(byModel.get("AdminUser")?.preserveWhere ?? "", /OWNER/);
  assert.equal(byModel.get("CentreSetting")?.classification, "PRESERVE");

  assert.equal(byModel.get("LandingPage")?.classification, "PRESERVE");
  assert.equal(byModel.get("StoredFile")?.classification, "PARTIAL");
  assert.match(byModel.get("StoredFile")?.preserveWhere ?? "", /WEBSITE_GALLERY/);
  assert.ok(externalResetMatrix.filter((entry) => entry.source.startsWith("Sanity:")).every((entry) => entry.classification === "PRESERVE"));
});

test("all pre-launch billing, daycare and meal catalogues are reset", () => {
  const byModel = new Map(prismaResetMatrix.map((entry) => [entry.model, entry]));
  const catalogueModels = [
    "ProgrammeFeeSetting", "ProgrammeDefinition", "ProgrammeFeeVersion",
    "DaycarePlanDefinition", "DaycarePlanPriceVersion", "DaycareRateSetting",
    "MealDefinition", "MealPriceVersion", "MealCombination",
    "MealCombinationItem", "MealCombinationPriceVersion", "ChargeDefinition",
  ];
  for (const model of catalogueModels) {
    assert.equal(byModel.get(model)?.classification, "RESET", model);
  }
  assert.equal(byModel.get("LateFeeSetting")?.classification, "PRESERVE");
});

test("operational workflows, private storage and mirrors are reset candidates", () => {
  const required = [
    "Enquiry", "Admission", "Student", "StudentAttendance", "StudentDaycarePlan",
    "DaycareSession", "FeeInvoice", "FeePayment", "Receipt", "Expense", "Staff",
    "StaffAttendance", "StaffPayroll", "MarketingConversionJob", "ActivityLog",
  ];
  for (const model of required) assert.equal(prismaResetMatrix.find((entry) => entry.model === model)?.reset, true, model);
  assert.equal(externalResetMatrix.find((entry) => entry.source === "Firebase Storage: private/students/**")?.classification, "RESET");
  assert.ok(externalResetMatrix.filter((entry) => entry.source.startsWith("Firestore:")).every((entry) => entry.classification === "RESET"));
});

test("Stage B is locked behind all destructive safety gates", () => {
  assert.match(source, /RESET CENTREOS OPERATIONAL DATA/);
  assert.match(source, /--owner-email/);
  assert.match(source, /--backup-verified/);
  assert.match(source, /--external-reset-verified/);
  assert.match(source, /--allow-production/);
  assert.match(source, /BEGIN ISOLATION LEVEL SERIALIZABLE/);
  assert.match(source, /BEGIN READ ONLY/);
  assert.match(source, /Concurrent-change safety stop/);
  assert.match(source, /PRE-LAUNCH TEST DATA HARD RESET COMPLETED/);
  assert.match(source, /SYSTEM_RESET/);
  assert.doesNotMatch(source, /TRUNCATE/i);
});

test("reset order is explicit and unique for every resettable model", () => {
  const resetEntries = prismaResetMatrix.filter((entry) => entry.reset);
  const orders = resetEntries.map((entry) => entry.safeResetOrder);
  assert.ok(orders.every((order) => Number.isInteger(order) && order > 0));
  assert.equal(new Set(orders).size, orders.length);
  assert.ok(resetEntries.find((entry) => entry.model === "PushNotificationDelivery").safeResetOrder < resetEntries.find((entry) => entry.model === "AdminNotification").safeResetOrder);
  assert.ok(resetEntries.find((entry) => entry.model === "FinancialCorrection").safeResetOrder < resetEntries.find((entry) => entry.model === "FeeInvoice").safeResetOrder);
  assert.ok(resetEntries.find((entry) => entry.model === "FeeInvoiceItem").safeResetOrder < resetEntries.find((entry) => entry.model === "FeeInvoice").safeResetOrder);
});
