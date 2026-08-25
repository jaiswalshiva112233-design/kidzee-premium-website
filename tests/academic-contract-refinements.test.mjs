import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  academicSessionLabel,
  annualChargeReference,
  prepaidPlanCoversWeekday,
  recurringDaycareAmount,
} from "../lib/admin/academic-contract-rules.ts";
import { calculateChargePricing } from "../lib/admin/charge-pricing.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const recurring = source("lib/admin/recurring-billing.ts");
const daycare = source("app/api/admin/daycare/route.ts");
const catalogue = source("app/api/admin/billing-catalog/route.ts");
const account = source("components/admin/students/StudentAccountWorkspace.tsx");
const schema = source("prisma/schema.prisma");
const migration = source("prisma/migrations/20260825193000_academic_contract_refinements/migration.sql");
const admission = source("app/admin/admissions/page.tsx");
const feesApi = source("app/api/admin/fees/route.ts");
const feesUi = source("components/admin/fees/CollectFeeForm.tsx");
const receipt = source("app/admin/receipts/[id]/page.tsx");

test("academic-session policy charges a mid-session October joiner for 2026-27", () => {
  assert.equal(academicSessionLabel("2026-10", 4), "2026-27");
  assert.deepEqual(
    annualChargeReference({
      period: "2026-10",
      joiningPeriod: "2026-10",
      startMonth: 4,
      policy: "ACADEMIC_SESSION",
    }),
    {
      reference: "2026",
      label: "Academic session 2026-27",
      manualReference: "2026-27",
    },
  );
});

test("the next academic session receives a new annual and kit reference", () => {
  assert.equal(
    annualChargeReference({ period: "2027-04", joiningPeriod: "2026-10", startMonth: 4, policy: "ACADEMIC_SESSION" })?.reference,
    "2027",
  );
});

test("rolling policy advances only after each 12-month contract cycle", () => {
  const beforeAnniversary = annualChargeReference({ period: "2027-09", joiningPeriod: "2026-10", startMonth: 4, policy: "ROLLING_12_MONTHS" });
  const anniversary = annualChargeReference({ period: "2027-10", joiningPeriod: "2026-10", startMonth: 4, policy: "ROLLING_12_MONTHS" });
  assert.equal(beforeAnniversary?.reference, "rolling-2026-10");
  assert.equal(anniversary?.reference, "rolling-2027-10");
  assert.equal(annualChargeReference({ period: "2027-10", joiningPeriod: "2026-10", startMonth: 4, policy: "MANUAL_ONLY" }), null);
});

test("programme fee versions independently snapshot annual, kit and combined-package rules", () => {
  assert.match(schema, /kitFee\s+Decimal\s+@default\(0\)/);
  assert.match(schema, /combineAnnualAndKit\s+Boolean\s+@default\(false\)/);
  assert.match(catalogue, /kitFee[\s\S]*combineAnnualAndKit/);
  assert.match(recurring, /programme-annual-kit:/);
  assert.match(recurring, /programme-kit:/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "kitFee"/);
});

test("Owner can change annual charging policy without code changes", () => {
  assert.match(catalogue, /ACADEMIC_SESSION/);
  assert.match(catalogue, /ROLLING_12_MONTHS/);
  assert.match(catalogue, /MANUAL_ONLY/);
});

test("Thursday and Friday prepaid contract covers only contracted weekdays", () => {
  assert.equal(prepaidPlanCoversWeekday("FLEXIBLE_DAYS", [4, 5], 4), true);
  assert.equal(prepaidPlanCoversWeekday("FLEXIBLE_DAYS", [4, 5], 5), true);
  assert.equal(prepaidPlanCoversWeekday("FLEXIBLE_DAYS", [4, 5], 1), false);
  assert.match(daycare, /invoiceStatus: "CONTRACT_COVERED"/);
  assert.match(daycare, /additionalPlanVisit/);
});

test("₹4,000 weekly contract remains ₹4,000 regardless attendance or month length", () => {
  assert.equal(recurringDaycareAmount({ unitPrice: 4000, monthlyOverride: 4000, billingType: "WEEKLY", weeks: 5, visits: 10 }), 4000);
  assert.doesNotMatch(recurring, /attendanceRecord|attendanceStatus|ABSENT/);
});

test("weekly plans require selected weekdays and keep the monthly plan unchanged", () => {
  assert.match(daycare, /Choose at least one contracted weekday for a weekly daycare plan/);
  assert.match(daycare, /Attendance did not change the contracted fee/);
});

test("combined billing remains authoritative for programme, plans and add-ons", () => {
  assert.match(recurring, /monthly-bundle:\$\{student\.id\}:\$\{key\}/);
  assert.match(recurring, /daycare-session:\$\{session\.id\}:care/);
  assert.match(recurring, /StudentCharge/);
});

test("Student Finance card exposes programme, schedule, annual, kit, upcoming and payment history", () => {
  for (const label of ["Programme", "Weekly schedule", "Annual fee", "Kit fee", "Upcoming bill", "Invoices and payments"]) {
    assert.match(account, new RegExp(label));
  }
});

test("promotion uses the current programme version while historical invoice sources stay immutable", () => {
  assert.match(recurring, /const programme = student\.programmeDefinition/);
  assert.match(recurring, /sourceVersionId: feeVersion\.id/);
  assert.match(recurring, /chargeKey: `programme-annual:/);
});

test("every configured charge supports independent inclusive or exclusive GST snapshots", () => {
  assert.match(schema, /enum PriceType\s*\{[\s\S]*GST_INCLUSIVE[\s\S]*GST_EXCLUSIVE/);
  for (const field of [
    "admissionPriceType",
    "annualPriceType",
    "kitPriceType",
    "monthlyPriceType",
  ]) assert.match(schema, new RegExp(`${field}\\s+PriceType`));
  assert.match(schema, /model FeeInvoiceItem[\s\S]*priceType\s+PriceType/);
  assert.match(migration, /CREATE TYPE "PriceType"/);
});

test("the requested admission contract totals 32000 while inclusive GST stays inside daycare and meals", () => {
  const annualKit = calculateChargePricing({ configuredAmount: 18000, gstApplicable: false, gstRate: 0, priceType: "GST_INCLUSIVE" });
  const preschool = calculateChargePricing({ configuredAmount: 6000, gstApplicable: false, gstRate: 0, priceType: "GST_INCLUSIVE" });
  const daycare = calculateChargePricing({ configuredAmount: 6000, gstApplicable: true, gstRate: 18, priceType: "GST_INCLUSIVE" });
  const meals = calculateChargePricing({ configuredAmount: 2000, gstApplicable: true, gstRate: 5, priceType: "GST_INCLUSIVE" });
  assert.equal(annualKit.totalAmount + preschool.totalAmount + daycare.totalAmount + meals.totalAmount, 32000);
  assert.equal(daycare.cgstAmount + daycare.sgstAmount, 915.25);
  assert.equal(meals.cgstAmount + meals.sgstAmount, 95.24);
  assert.equal(annualKit.cgstAmount + annualKit.sgstAmount + preschool.cgstAmount + preschool.sgstAmount, 0);
});

test("exclusive pricing adds GST while inclusive pricing never increases the configured parent amount", () => {
  assert.equal(calculateChargePricing({ configuredAmount: 100, gstApplicable: true, gstRate: 18, priceType: "GST_EXCLUSIVE" }).totalAmount, 118);
  assert.equal(calculateChargePricing({ configuredAmount: 100, gstApplicable: true, gstRate: 18, priceType: "GST_INCLUSIVE" }).totalAmount, 100);
});

test("confirmed admission prepares the targeted contract bill and the Fees screen cannot create manual normal bills", () => {
  assert.match(admission, /generateRecurringInvoices\([\s\S]*studentId[\s\S]*ignoreAutomaticSetting:\s*true/);
  assert.match(feesApi, /manual bill creation is not available on the collection screen/);
  assert.match(feesUi, /Refresh dues and select the prepared bill for this child/);
  assert.doesNotMatch(feesUi, /Create a\s*separate new\s*charge instead/);
});

test("parent receipt shows final item amounts and keeps statutory GST breakdown internal", () => {
  assert.match(receipt, /GST included wherever applicable/);
  assert.match(receipt, /Statutory tax values remain recorded internally/);
  assert.doesNotMatch(receipt, /label="Taxable value"/);
  assert.doesNotMatch(receipt, /label="CGST included"/);
  assert.doesNotMatch(receipt, /label="SGST included"/);
});
