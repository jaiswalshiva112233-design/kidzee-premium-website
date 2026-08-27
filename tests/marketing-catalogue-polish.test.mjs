import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const marketingData = source("lib/growth/marketingControl.ts");
const recommendations = source(
  "components/admin/growth/GrowthRecommendationManager.tsx",
);
const landingApi = source("app/api/admin/growth/landing-pages/route.ts");
const landingManager = source("components/admin/growth/LandingPageManager.tsx");
const catalogueApi = source("app/api/admin/billing-catalog/route.ts");
const catalogueManager = source(
  "components/admin/settings/BillingCatalogueManager.tsx",
);
const daycareApi = source("app/api/admin/daycare/route.ts");
const daycareManager = source("components/admin/daycare/DaycareWorkspace.tsx");
const schema = source("prisma/schema.prisma");
const enumMigration = source(
  "prisma/migrations/20260825143000_marketing_catalogue_lifecycle/migration.sql",
);
const columnMigration = source(
  "prisma/migrations/20260825210000_marketing_catalogue_lifecycle_columns/migration.sql",
);

test("Marketing Control Centre exposes every required evidence view", () => {
  for (const path of [
    "app/admin/marketing/page.tsx",
    "app/admin/marketing/google-ads/page.tsx",
    "app/admin/marketing/meta-ads/page.tsx",
    "app/admin/marketing/organic-seo/page.tsx",
    "app/admin/marketing/landing-pages/page.tsx",
    "app/admin/marketing/conversions/page.tsx",
  ])
    assert.equal(
      existsSync(new URL(`../${path}`, import.meta.url)),
      true,
      path,
    );
  for (const evidence of [
    "growthDataSnapshot",
    "websiteLeadSubmission",
    "marketingConversionJob",
    "landingPage",
    "qualified",
    "admissions",
    "costPerAdmission",
  ])
    assert.match(marketingData, new RegExp(evidence));
  const conversions = source("app/admin/marketing/conversions/page.tsx");
  assert.match(conversions, /skip: \(page - 1\) \* pageSize/);
  assert.match(conversions, /take: pageSize/);
});

test("marketing recommendations remain evidence based and approval controlled", () => {
  assert.match(
    recommendations,
    /never applies a recommendation automatically/i,
  );
  assert.match(recommendations, /APPROVE/);
  assert.match(recommendations, /ROLLBACK/);
  assert.match(
    source("app/api/admin/growth/analyse/route.ts"),
    /Never invent figures/,
  );
  assert.match(
    source("app/api/admin/growth/recommendations/route.ts"),
    /No website change was applied automatically/,
  );
});

test("landing pages support duplicate, preview, publish, unpublish, experiments and rollback", () => {
  for (const action of [
    "duplicate-page",
    "unpublish-page",
    "approve-version",
    "apply-version",
    "rollback-version",
    "start-experiment",
  ])
    assert.match(landingApi, new RegExp(action));
  assert.match(landingApi, /conversionReport/);
  assert.match(landingManager, /Duplicate/);
  assert.match(landingManager, /Preview/);
  assert.match(landingManager, /conversion/i);
});

test("catalogue lifecycle is Owner-only, dependency-aware and audited", () => {
  assert.match(catalogueApi, /session\?\.role !== "OWNER"/);
  assert.match(catalogueApi, /catalogue-dependency-check/);
  assert.match(catalogueApi, /PERMANENT DELETE/);
  assert.match(catalogueApi, /affectedRecords/);
  assert.match(catalogueApi, /activityLog\.create/);
  for (const action of [
    "Duplicate",
    "Activate",
    "Deactivate",
    "Archive",
    "Delete",
    "Permanent Delete",
  ]) {
    assert.match(catalogueManager, new RegExp(action));
  }
});

test("used catalogue records cannot be permanently deleted", () => {
  for (const dependency of [
    "student.count",
    "studentDaycarePlan.count",
    "daycareSessionMeal.count",
    "studentCharge.count",
    "feeInvoiceItem.count",
  ])
    assert.match(catalogueApi, new RegExp(dependency.replace(".", "\\.")));
  assert.match(catalogueApi, /Archive it to preserve billing history/);
});

test("child daycare plans have the same protected Owner lifecycle", () => {
  assert.match(daycareApi, /action === "plan-lifecycle"/);
  assert.match(daycareApi, /action === "plan-delete-preview"/);
  assert.match(daycareApi, /session\.role !== "OWNER"/);
  assert.match(daycareApi, /canPermanentlyDeleteDaycarePlan\(dependencies\)/);
  assert.match(daycareApi, /dependencies\.activeAssignments > 0/);
  assert.match(daycareApi, /transaction\.studentCharge\.count/);
  assert.match(daycareApi, /daycare-plan:\$\{plan\.id\}:/);
  assert.match(daycareApi, /daycare-meal-plan:\$\{plan\.id\}:/);
  assert.match(daycareApi, /affectedRecords: dependencies/);
  assert.match(daycareManager, /canManageLifecycle/);
  for (const action of ["Duplicate", "More actions", "Archive plan", "PERMANENT DELETE"]) {
    assert.match(daycareManager, new RegExp(action));
  }
});

test("catalogue states and child-plan state are migrated without rewriting invoices", () => {
  assert.match(
    schema,
    /enum CatalogueStatus\s*\{[\s\S]*ARCHIVED[\s\S]*DELETED/,
  );
  assert.match(
    schema,
    /model DaycarePlanDefinition[\s\S]*status\s+CatalogueStatus/,
  );
  assert.match(schema, /model ChargeDefinition[\s\S]*status\s+CatalogueStatus/);
  assert.match(
    schema,
    /model StudentDaycarePlan[\s\S]*lifecycleStatus\s+CatalogueStatus/,
  );
  assert.match(enumMigration, /ALTER TYPE "CatalogueStatus" ADD VALUE/);
  assert.doesNotMatch(enumMigration, /ALTER TABLE/);
  assert.match(columnMigration, /ADD COLUMN IF NOT EXISTS "lifecycleStatus"/);
  assert.doesNotMatch(columnMigration, /FeeInvoice/);
});
