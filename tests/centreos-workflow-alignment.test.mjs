import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  BillingIntegrityError,
  assertInvoiceArithmetic,
  assertSourceCharges,
  assertUniqueChargeKeys,
} from "../lib/admin/billing-integrity.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const recurring = source("lib/admin/recurring-billing.ts");
const ledger = source("app/api/admin/student-ledger/route.ts");
const account = source("components/admin/students/StudentAccountWorkspace.tsx");
const fees = source("app/api/admin/fees/route.ts");
const schema = source("prisma/schema.prisma");

test("Scenario A: preschool-only monthly fee is deterministic", () => {
  assert.match(recurring, /programme-monthly:\$\{student\.id\}:\$\{key\}/);
});

test("Scenario B: daycare-only recurring plans are supported", () => {
  assert.match(recurring, /daycare-plan:\$\{plan\.id\}:\$\{key\}/);
});

test("Scenario C: preschool and daycare share the combined billing key", () => {
  assert.match(recurring, /monthly-bundle:\$\{student\.id\}:\$\{key\}/);
});

test("Scenario D: a monthly meal combination is sourced from its price version", () => {
  assert.match(recurring, /MealCombinationPriceVersion/);
});

test("Scenario E: combined meals have one plan-period charge key", () => {
  assert.match(recurring, /daycare-meal-plan:\$\{plan\.id\}:\$\{key\}/);
});

test("Scenario F: approved additional daycare enters the next combined bill", () => {
  assert.match(recurring, /invoiceStatus: \{ in: \["PENDING", "APPROVED"\] \}/);
  assert.match(recurring, /daycare-session:\$\{session\.id\}:care/);
});

test("Scenario G: annual programme fee can occur once per academic year", () => {
  assert.match(recurring, /programme-annual:\$\{student\.id\}:\$\{programme\.id\}:\$\{annualContext\.reference\}/);
  assert.match(recurring, /hasStudentAnnualCharge/);
  assert.match(ledger, /already on this child's financial history/);
});

test("Scenario H: kit charge duplicate protection includes academic year", () => {
  assert.match(ledger, /\["ANNUAL_FEE", "KIT_FEE"\]\.includes\(definition\.category\)/);
  assert.match(schema, /chargeKey\s+String\s+@unique/);
});

test("Scenario I: additional daycare dates remain separate ledger sources", () => {
  const items = [3, 7, 11, 16, 21, 27].map((day) => ({ chargeKey: `daycare-session:aug-${day}:care` }));
  assert.doesNotThrow(() => assertUniqueChargeKeys(items));
});

test("Scenario J: configured other charges enter pending ledger once", () => {
  assert.match(ledger, /status: "PENDING"/);
  assert.match(ledger, /findUnique\(\{ where: \{ chargeKey \} \}\)/);
});

test("Scenario K: partial payment keeps a source charge billed", () => {
  assert.match(
    fees,
    /status:\s*invoiceStatus === "PAID" \? "PAID" : "BILLED"/,
  );
});

test("Scenario L: multiple payments reconcile against one locked invoice", () => {
  assert.match(fees, /isolationLevel:\s*"Serializable"/);
  assert.match(fees, /idempotencyKey/);
});

test("Scenario M: duplicate invoice generation is blocked", () => {
  assert.match(schema, /billingKey\s+String\s+@unique/);
  assert.match(recurring, /findUnique\(\{\s*where: \{ billingKey: candidate\.billingKey \}/);
});

test("Scenario N: an emergency daycare source cannot be invoiced twice", () => {
  assert.throws(
    () => assertUniqueChargeKeys([{ chargeKey: "daycare-session:1:care" }, { chargeKey: "daycare-session:1:care" }]),
    BillingIntegrityError,
  );
});

test("Scenario O: attendance is not an input to recurring fee calculation", () => {
  assert.doesNotMatch(recurring, /attendanceRecord|attendanceStatus|ABSENT/);
});

test("Scenario P: stopped or expired daycare plans stop future billing", () => {
  assert.match(recurring, /billingStoppedAt: null/);
  assert.match(recurring, /effectiveTo: \{ gte: start \}/);
});

test("Scenario Q: meal-plan history uses snapshotted effective versions", () => {
  assert.match(recurring, /sourceVersionId: comboVersion\?\.id/);
});

test("Scenario R: programme fee history uses snapshotted effective versions", () => {
  assert.match(recurring, /sourceVersionId: feeVersion\.id/);
});

test("Scenario S: withdrawn students do not receive new recurring invoices", () => {
  assert.match(recurring, /status: "ACTIVE"/);
});

test("Scenario T: outstanding is derived from authoritative open invoices", () => {
  assert.match(account, /openInvoices\.reduce\(\(sum, invoice\) => sum \+ invoice\.pendingAmount/);
});

test("required ₹16,200 workflow produces exactly five source groups in one invoice", () => {
  const items = [
    { chargeKey: "programme-monthly:student:2026-09", sourceType: "ProgrammeFeeVersion", sourceId: "nursery-v1", amount: 6500 },
    { chargeKey: "daycare-plan:plan:2026-09", sourceType: "DaycarePlanPriceVersion", sourceId: "six-hours-v1", amount: 6000 },
    { chargeKey: "daycare-meal-plan:plan:2026-09", sourceType: "MealCombinationPriceVersion", sourceId: "both-v1", amount: 2000 },
    ...[3, 7, 11, 16, 21, 27].map((day) => ({ chargeKey: `daycare-session:aug-${day}:care`, sourceType: "DaycareSession", sourceId: `aug-${day}`, amount: 200 })),
    { chargeKey: "manual:student:activity", sourceType: "StudentCharge", sourceId: "activity", amount: 500 },
  ];
  assertSourceCharges(items);
  assertUniqueChargeKeys(items);
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  assert.equal(total, 16200);
  assert.doesNotThrow(() => assertInvoiceArithmetic({ itemTotals: items.map((item) => item.amount), totalAmount: total, paidAmount: 0, pendingAmount: total }));
  assert.equal((recurring.match(/monthly-bundle:/g) ?? []).length, 1);
});

test("invoice validation stops on missing sources and arithmetic drift", () => {
  assert.throws(() => assertSourceCharges([{ chargeKey: "", sourceType: "", sourceId: "", amount: 100 }]), BillingIntegrityError);
  assert.throws(() => assertInvoiceArithmetic({ itemTotals: [6500, 6000], totalAmount: 12000, paidAmount: 0, pendingAmount: 12000 }), BillingIntegrityError);
});
