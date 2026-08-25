import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Owner catalogues make programmes, daycare plans, meals and future prices configurable", async () => {
  const [schema, route, manager] = await Promise.all([
    read("prisma/schema.prisma"),
    read("app/api/admin/billing-catalog/route.ts"),
    read("components/admin/settings/BillingCatalogueManager.tsx"),
  ]);
  for (const model of [
    "ProgrammeDefinition",
    "ProgrammeFeeVersion",
    "DaycarePlanDefinition",
    "DaycarePlanPriceVersion",
    "MealDefinition",
    "MealPriceVersion",
    "MealCombination",
    "MealCombinationPriceVersion",
  ]) assert.match(schema, new RegExp(`model ${model}\\b`));
  assert.match(route, /Only the Owner can change the billing catalogue/);
  assert.match(route, /effectiveTo/);
  assert.match(route, /defaultInvoiceMode/);
  assert.match(manager, /Programmes/);
  assert.match(manager, /Daycare plans/i);
  assert.match(manager, /Meals/);
  assert.match(manager, /future fee versions/i);
});

test("student enrolment and editing use Owner-created programme definitions", async () => {
  const files = await Promise.all([
    read("components/admin/students/AddStudentForm.tsx"),
    read("components/admin/students/EditStudentForm.tsx"),
    read("app/api/admin/students/route.ts"),
    read("app/api/admin/students/[id]/route.ts"),
  ]);
  for (const source of files) assert.match(source, /programmeDefinitionId/);
  assert.match(files[2], /configured capacity/);
  assert.match(files[3], /configured capacity/);
});

test("recurring billing combines configured preschool, daycare, meals and emergency ledger entries", async () => {
  const source = await read("lib/admin/recurring-billing.ts");
  assert.match(source, /programme-monthly:/);
  assert.match(source, /daycare-plan:/);
  assert.match(source, /daycare-meal-plan:/);
  assert.match(source, /daycare-session:/);
  assert.match(source, /monthly-bundle:/);
  assert.match(source, /legacyProgrammeKey/);
  assert.match(source, /status: "ACTIVE"/);
  assert.match(source, /billingStoppedAt: null/);
  assert.match(source, /chargeKey/);
  assert.match(source, /isolationLevel: "Serializable"/);
});

test("emergency daycare requires approval, preserves exact meals and supports pre-invoice Owner edits", async () => {
  const [schema, route, workspace] = await Promise.all([
    read("prisma/schema.prisma"),
    read("app/api/admin/daycare/route.ts"),
    read("components/admin/daycare/DaycareWorkspace.tsx"),
  ]);
  assert.match(schema, /model DaycareSessionMeal/);
  assert.match(schema, /approvedById/);
  assert.match(schema, /pickupPerson/);
  assert.match(route, /action === "approve-session"/);
  assert.match(route, /action === "update-ledger"/);
  assert.match(route, /PENDING_APPROVAL/);
  assert.match(route, /selectedMeals/);
  assert.match(workspace, /Approve/);
  assert.match(workspace, /Edit Ledger/);
  assert.match(workspace, /Pickup person/);
});

test("one-click receipt delivery uses the existing durable WhatsApp Cloud queue", async () => {
  const [route, automation, action] = await Promise.all([
    read("app/api/admin/whatsapp/receipt/route.ts"),
    read("lib/whatsapp/automation.ts"),
    read("components/admin/receipts/ReceiptQuickActions.tsx"),
  ]);
  assert.match(route, /queueReceiptWhatsApp/);
  assert.match(route, /sendWhatsAppAutomationMessage/);
  assert.match(automation, /maxAttempts/);
  assert.match(action, /Send PDF on WhatsApp/);
});

test("production scheduler invokes idempotent recurring invoice generation", async () => {
  const [endpoint, functions, hosting, environment] = await Promise.all([
    read("app/api/internal/recurring-billing/route.ts"),
    read("functions/src/index.js"),
    read("apphosting.yaml"),
    read("scripts/validate-production-env.mjs"),
  ]);
  assert.match(endpoint, /BILLING_CRON_SECRET/);
  assert.match(endpoint, /timingSafeEqual/);
  assert.match(functions, /generateMonthlyCentreInvoices/);
  assert.match(functions, /schedule: "every day 00:10"/);
  assert.match(hosting, /BILLING_CRON_SECRET/);
  assert.match(environment, /BILLING_CRON_SECRET/);
});

test("the configurable billing schema is fully represented in a deployable migration", async () => {
  const migration = await read(
    "prisma/migrations/20260824233000_configurable_billing_catalog/migration.sql",
  );
  for (const table of [
    "ProgrammeDefinition",
    "ProgrammeFeeVersion",
    "DaycarePlanDefinition",
    "DaycarePlanPriceVersion",
    "MealDefinition",
    "MealPriceVersion",
    "MealCombination",
    "MealCombinationPriceVersion",
    "DaycareSessionMeal",
  ]) assert.match(migration, new RegExp(`CREATE TABLE \\\"${table}\\\"`));
  assert.match(migration, /FeeInvoiceItem_chargeKey_key/);
  assert.match(migration, /programmeDefinitionId/);
  assert.match(migration, /pickupPerson/);
});
