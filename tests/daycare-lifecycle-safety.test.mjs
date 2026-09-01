import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canPermanentlyDeleteDaycarePlan,
  daycareLifecycleStopAt,
  daycarePlanHistoricalDependencyCount,
  daycareServiceEndAt,
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
const billingCatalogueApi = source("app/api/admin/billing-catalog/route.ts");
const billingCatalogueManager = source(
  "components/admin/settings/BillingCatalogueManager.tsx",
);
const staffPayrollApi = source("app/api/admin/staff-payroll/route.ts");
const dataControlApi = source("app/api/admin/data-control/route.ts");
const billingIntegrity = source("lib/admin/billing-integrity.ts");
const calendarApi = source("app/api/admin/calendar/route.ts");
const landingPagesApi = source(
  "app/api/admin/growth/landing-pages/route.ts",
);
const growthControlApi = source("app/api/admin/growth/control/route.ts");
const internalDeviceApi = source("app/api/admin/internal-device/route.ts");
const whatsappDocumentApi = source(
  "app/api/admin/whatsapp/send-document/route.ts",
);

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

test("ending linked services never extends an earlier configured end date", () => {
  const effectiveFrom = new Date("2026-08-01T00:00:00.000Z");
  const configuredEnd = new Date("2026-08-20T00:00:00.000Z");
  const actionAt = new Date("2026-08-27T00:00:00.000Z");
  assert.equal(
    daycareServiceEndAt(effectiveFrom, configuredEnd, actionAt).toISOString(),
    configuredEnd.toISOString(),
  );
  assert.match(daycareApi, /daycareServiceEndAt\(/);
});

test("ending linked services repairs an invalid legacy end before its start", () => {
  const effectiveFrom = new Date("2026-08-10T00:00:00.000Z");
  const invalidLegacyEnd = new Date("2026-08-05T00:00:00.000Z");
  const actionAt = new Date("2026-08-27T00:00:00.000Z");
  assert.equal(
    daycareServiceEndAt(
      effectiveFrom,
      invalidLegacyEnd,
      actionAt,
    ).toISOString(),
    effectiveFrom.toISOString(),
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
  ]) {
    const dependencies = { ...unusedDependencies, ...changed };
    assert.equal(canPermanentlyDeleteDaycarePlan(dependencies), false);
  }
  assert.equal(
    canPermanentlyDeleteDaycarePlan({
      ...unusedDependencies,
      contractLinks: 1,
    }),
    true,
    "an unused contract link is implementation plumbing, not history",
  );
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
  assert.match(daycareApi, /linkedPlanMealServices\(/);
  assert.match(daycareApi, /studentDaycarePlanId/);
  assert.match(daycareApi, /invoiceItems: \{ none: \{\} \}/);
  assert.match(daycareApi, /ledgerCharges: \{ none: \{\} \}/);
  assert.match(daycareApi, /DAYCARE_FINANCIAL_CATEGORIES/);
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

test("only paused plans can resume and linked services resume inside the lifecycle transaction", () => {
  const lifecycleStart = daycareApi.indexOf('if (action === "plan-lifecycle")');
  const lifecycleEnd = daycareApi.indexOf('if (action === "save-rates")');
  const lifecycle = daycareApi.slice(lifecycleStart, lifecycleEnd);
  assert.match(lifecycle, /existing\.lifecycleStatus !== "INACTIVE"/);
  assert.match(lifecycle, /Archived plans remain preserved for history/);
  assert.match(lifecycle, /billingStoppedAt: target === "ACTIVE" \? null/);
  assert.match(lifecycle, /status: target === "ACTIVE" \? "ACTIVE" : "ENDED"/);
  assert.match(lifecycle, /status: "ACTIVE",[\s\S]*effectiveTo: existing\.effectiveTo/);
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
  assert.match(daycareWorkspace, />\s*Pause\s*</);
  assert.match(daycareWorkspace, />\s*Resume\s*</);
  assert.match(daycareWorkspace, />\s*Remove\s*</);
  assert.doesNotMatch(
    daycareWorkspace,
    /changePlanLifecycle\(plan, "ARCHIVE"\)/,
  );
  assert.match(daycareWorkspace, /lifecycleSavingRef\.current/);
  assert.match(daycareWorkspace, /deleteReviewLoadingRef\.current/);
  assert.match(daycareWorkspace, /Replace plan/);
  assert.match(billingCatalogueManager, /oldPlanId/);
  assert.match(billingCatalogueManager, /daycare-plan-replacement/);
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
  assert.match(enrollmentContract, /includedDays == null \|\| includedDays < 1 \|\| includedDays > 31/);
  assert.match(billingCatalogueApi, /maximumVisits == null \|\| maximumVisits < 1 \|\| maximumVisits > 31/);
});

test("technical persistence details are translated in related operational screens", () => {
  assert.match(staffPayrollApi, /publicPersistenceError\(/);
  assert.doesNotMatch(
    staffPayrollApi,
    /previewError\s*=\s*[\s\S]{0,80}error instanceof Error[\s\S]{0,80}error\.message/,
  );
  assert.doesNotMatch(
    dataControlApi,
    /message:\s*`Cleanup is blocked by \$\{model\}: \$\{relation\}/,
  );
  assert.doesNotMatch(billingIntegrity, /\$\{item\.chargeKey\}/);
  for (const api of [
    calendarApi,
    landingPagesApi,
    growthControlApi,
    internalDeviceApi,
    whatsappDocumentApi,
  ]) {
    assert.match(api, /publicPersistenceError\(/);
  }
  assert.match(landingPagesApi, /LandingPageRequestError/);
  assert.match(growthControlApi, /GrowthControlRequestError/);
  assert.match(calendarApi, /CalendarRequestError/);
  assert.match(growthControlApi, /Number\.isFinite\(maxOutputTokens\)/);
  assert.match(growthControlApi, /Number\.isInteger\(monthlyCallLimit\)/);
  assert.match(landingPagesApi, /Number\.isFinite\(allocation\)/);
  assert.match(landingPagesApi, /Number\.isInteger\(allocation\)/);
  assert.match(calendarApi, /SAFE_CALENDAR_IMPORT_MESSAGES\.has\(importMessage\)/);
  assert.doesNotMatch(
    calendarApi,
    /throw new CalendarRequestError\(\s*error instanceof Error\s*\?\s*error\.message/,
  );
  assert.match(calendarApi, /error instanceof CalendarRequestError \|\| error instanceof SyntaxError/);
  assert.match(landingPagesApi, /error instanceof LandingPageRequestError \|\| error instanceof SyntaxError/);
  assert.match(growthControlApi, /Enter a valid HTTPS AI provider URL/);
  assert.match(whatsappDocumentApi, /status: 503/);
});
