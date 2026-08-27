import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canPermanentlyDeleteDaycarePlan,
  daycareLifecycleStopAt,
  daycarePlanHistoricalDependencyCount,
} from "../lib/admin/daycare-rules.ts";

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const daycareApi = source("app/api/admin/daycare/route.ts");
const daycareWorkspace = source(
  "components/admin/daycare/DaycareWorkspace.tsx",
);
const publicErrors = source("lib/admin/public-persistence-error.ts");
const withdrawalApi = source(
  "app/api/admin/students/[id]/withdraw/route.ts",
);
const enrollmentContract = source("lib/admin/enrollment-contract.ts");

const unusedDependencies = {
  activeAssignments: 0,
  attendanceRecords: 0,
  invoiceItems: 0,
  ledgerCharges: 0,
  contractLinks: 0,
  auditRecords: 2,
};

test("future-dated daycare lifecycle actions satisfy the billing stop constraint", () => {
  const effectiveFrom = new Date("2026-09-01T00:00:00.000Z");
  const actionAt = new Date("2026-08-27T00:00:00.000Z");
  assert.equal(
    daycareLifecycleStopAt(effectiveFrom, actionAt).toISOString(),
    effectiveFrom.toISOString(),
  );
  assert.match(daycareApi, /billingStoppedAt: target === "ACTIVE" \? null : billingStoppedAt/);
});

test("already-started daycare plans stop at the audited action time", () => {
  const effectiveFrom = new Date("2026-08-01T00:00:00.000Z");
  const actionAt = new Date("2026-08-27T00:00:00.000Z");
  assert.equal(
    daycareLifecycleStopAt(effectiveFrom, actionAt).toISOString(),
    actionAt.toISOString(),
  );
});

test("only inactive unused unlinked child plans can be permanently deleted", () => {
  assert.equal(daycarePlanHistoricalDependencyCount(unusedDependencies), 0);
  assert.equal(canPermanentlyDeleteDaycarePlan(unusedDependencies), true);
  for (const changed of [
    { activeAssignments: 1 },
    { attendanceRecords: 1 },
    { invoiceItems: 1 },
    { ledgerCharges: 1 },
    { contractLinks: 1 },
  ]) {
    const dependencies = { ...unusedDependencies, ...changed };
    assert.equal(canPermanentlyDeleteDaycarePlan(dependencies), false);
  }
});

test("delete review is server-side, dependency-aware and race protected", () => {
  assert.match(daycareApi, /action === "plan-delete-preview"/);
  assert.match(
    daycareApi,
    /daycarePlanDependencies\(\s*transaction,\s*existing,\s*\)/,
  );
  assert.match(daycareApi, /attendanceRecords/);
  assert.match(daycareApi, /invoiceItems/);
  assert.match(daycareApi, /ledgerCharges/);
  assert.match(daycareApi, /contractLinks/);
  assert.match(daycareApi, /deleteMany\(\{[\s\S]*active: false/);
  assert.match(daycareApi, /isolationLevel: "Serializable"/);
  assert.match(daycareApi, /This plan changed after the deletion review/);
});

test("archive changes lifecycle only and preserves catalogue and history fields", () => {
  const lifecycleStart = daycareApi.indexOf('if (action === "plan-lifecycle")');
  const lifecycleEnd = daycareApi.indexOf('if (action === "save-rates")');
  const lifecycle = daycareApi.slice(lifecycleStart, lifecycleEnd);
  assert.match(lifecycle, /lifecycleStatus: target/);
  assert.match(lifecycle, /active: target === "ACTIVE"/);
  assert.doesNotMatch(lifecycle, /planType:/);
  assert.doesNotMatch(lifecycle, /billingMode:/);
  assert.doesNotMatch(lifecycle, /foodOption:/);
  assert.doesNotMatch(lifecycle, /monthlyFeeOverride:/);
  assert.doesNotMatch(lifecycle, /daycareSession\.delete/);
  assert.doesNotMatch(lifecycle, /feeInvoiceItem\.delete/);
});

test("daycare lifecycle UX exposes one contextual menu and one intelligent delete modal", () => {
  assert.match(daycareWorkspace, /More actions/);
  assert.match(daycareWorkspace, /action: "plan-delete-preview"/);
  assert.match(daycareWorkspace, /This plan is active for a child/);
  assert.match(daycareWorkspace, /This plan has centre history/);
  assert.match(daycareWorkspace, /Delete this unused plan permanently/);
  assert.match(daycareWorkspace, /View child profile/);
  assert.match(daycareWorkspace, /Archive plan/);
  assert.match(daycareWorkspace, /Delete permanently/);
  assert.doesNotMatch(daycareWorkspace, /removeRecord\("plan"/);
});

test("raw Prisma and PostgreSQL errors are translated before reaching daycare UI", () => {
  for (const code of ["P2002", "P2003", "P2004", "P2025", "P2034", "23514"]) {
    assert.match(publicErrors, new RegExp(code));
  }
  assert.match(daycareApi, /publicPersistenceError\(/);
  assert.match(daycareApi, /error instanceof DaycareRequestError/);
  assert.doesNotMatch(
    daycareApi,
    /error instanceof Error\s*\?\s*error\.message/,
  );
});

test("withdrawal and contract creation respect daycare database constraints", () => {
  assert.match(withdrawalApi, /leavingDate < plan\.effectiveFrom/);
  assert.match(withdrawalApi, /lifecycleStatus: "INACTIVE"/);
  assert.match(enrollmentContract, /selectedPlanType === "FLEXIBLE_DAYS"/);
  assert.match(enrollmentContract, /includedDays:[\s\S]*\? definition\.maximumVisits[\s\S]*: null/);
});
