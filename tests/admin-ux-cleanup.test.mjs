import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Centre Head receives one operational navigation without Owner advanced tools", () => {
  const navigation = source("components/admin/adminNavigation.ts");
  const permissions = source("lib/admin/permissions.ts");

  assert.match(navigation, /title: "Daily Work"/);
  assert.match(navigation, /label: "Admissions"/);
  assert.match(navigation, /label: "Fees & Payments"/);
  assert.match(navigation, /label: "Receipts"/);
  assert.match(navigation, /item\.ownerOnly && user\.role !== "OWNER"/);
  assert.match(permissions, /path: "\/admin\/settings\/billing", permission: "owner\.only"/);
  assert.match(permissions, /path: "\/admin\/settings\/integrations", permission: "owner\.only"/);
  assert.match(permissions, /path: "\/admin\/settings\/fees", permission: "owner\.only"/);
});

test("Owner navigation retains advanced billing, permissions, integrations and legacy access", () => {
  const navigation = source("components/admin/adminNavigation.ts");

  for (const label of [
    "Billing Catalogue",
    "User Permissions",
    "Integrations",
    "Data & History",
    "Legacy Compatibility",
    "Owner Intelligence",
  ]) {
    assert.match(navigation, new RegExp(`label: "${label}"`));
  }
  assert.match(navigation, /if \(user\.role === "OWNER"\) return true/);
});

test("dashboard uses contract participation and keeps careers separate from admission leads", () => {
  const dashboard = source("app/admin/page.tsx");

  assert.match(dashboard, /studentEnrollmentContract\.count/);
  assert.match(dashboard, /preschoolEnabled: true/);
  assert.match(dashboard, /daycareEnabled: true/);
  assert.match(dashboard, /mealsEnabled: true/);
  assert.match(dashboard, /careerApplication\.count/);
  assert.match(dashboard, /title: "New Job Applicants"/);
  assert.doesNotMatch(dashboard, /<LiveOperationsDashboard/);
  assert.match(dashboard, /value: `\$\{studentAttendanceToday\}\/\$\{preschoolStrength\}`/);
});

test("student register exposes contract services, fee state and required filters", () => {
  const register = source("components/admin/students/StudentRegister.tsx");
  const page = source("app/admin/students/page.tsx");

  for (const filter of [
    "PRESCHOOL",
    "DAYCARE",
    "BOTH",
    "DAYCARE_ONLY",
    "FEE_PENDING",
    "DOCUMENTS_PENDING",
    "ADMISSION_STARTED",
    "INACTIVE",
  ]) {
    assert.match(register, new RegExp(`\\b${filter}\\b`));
  }
  assert.match(register, /ServiceBadge label="Preschool"/);
  assert.match(register, /ServiceBadge label="Daycare"/);
  assert.match(register, /ServiceBadge label="Meals"/);
  assert.match(page, /student\.enrollmentContract\?\.preschoolEnabled/);
  assert.match(page, /student\.enrollmentContract\?\.daycareEnabled/);
});

test("student profile is a clear contract and finance hub with every active daycare plan", () => {
  const profile = source("app/admin/students/[id]/page.tsx");
  const workspace = source("components/admin/students/StudentAccountWorkspace.tsx");

  assert.match(profile, /label: "Contract & Services"/);
  assert.match(profile, /label: "Fees & Receipts"/);
  assert.match(profile, /Contract \{student\.enrollmentContract\.status/);
  assert.match(profile, /Last payment:/);
  assert.match(profile, /Source:/);
  assert.match(profile, /plans=\{accountData\.plans\}/);
  assert.match(workspace, /props\.plans\.slice\(1\)\.map/);
});

test("Fees and Payments collects prepared bills and cannot create recurring fees manually", () => {
  const page = source("app/admin/fees/page.tsx");
  const form = source("components/admin/fees/CollectFeeForm.tsx");

  assert.match(page, /Fees & Payments/);
  assert.match(page, /Normal recurring fees come only from the Student/);
  assert.match(form, /if \(!selectedInvoice\)/);
  assert.match(form, /Normal recurring fees cannot be entered manually here/);
  assert.match(form, /title="Open invoices"/);
  assert.doesNotMatch(form, /Select an open\s*invoice or create a\s*new charge/);
});

test("Daycare is operations-first and contract or rate controls remain permission gated", () => {
  const page = source("app/admin/daycare/page.tsx");
  const workspace = source("components/admin/daycare/DaycareWorkspace.tsx");

  assert.match(page, /Daily Daycare Operations/);
  assert.match(page, /Monthly daycare billing continues from/);
  assert.match(workspace, /canManageContracts \|\| canManageRates/);
  assert.match(workspace, /canManageContracts[\s\S]*Contract Plan Adjustments/);
  assert.match(workspace, /canManageRates[\s\S]*Legacy Daycare Rates/);
  assert.match(workspace, /Care, nap, homework or parent update notes/);
  assert.match(workspace, /No active daycare students yet\. Add daycare from Student Contract/);
});

test("preschool attendance remains contract based and daycare-only children stay out", () => {
  const route = source("app/api/admin/attendance/route.ts");
  const page = source("app/admin/attendance/page.tsx");

  assert.match(route, /preschoolEnabled: true/);
  assert.match(route, /enrollmentContract/);
  assert.match(page, /Daycare-only children remain in the Daycare/);
});

test("reports use contract strength and isolate recruitment reporting", () => {
  const reports = source("app/admin/reports/page.tsx");

  assert.match(reports, /studentEnrollmentContract\.count/);
  assert.match(reports, /title="Careers pipeline"/);
  assert.match(reports, /careerApplication\.groupBy/);
  assert.match(reports, /never included in admissions/);
});

test("global search returns one child profile with service badges and separate careers", () => {
  const endpoint = source("app/api/admin/search/route.ts");
  const search = source("components/admin/AdminGlobalSearch.tsx");

  assert.match(endpoint, /programmeDefinition/);
  assert.match(endpoint, /contract\?\.preschoolEnabled \? "Preschool"/);
  assert.match(endpoint, /contract\?\.daycareEnabled \? "Daycare"/);
  assert.match(endpoint, /studentId: null/);
  assert.match(endpoint, /invoiceNumber: \{ contains: query/);
  assert.match(endpoint, /receiptNumber: \{ contains: query/);
  assert.doesNotMatch(endpoint, /feeInvoice\.findMany\([\s\S]*firstName: \{ contains: query/);
  assert.match(search, /CAREER: "Career Applicant"/);
});

test("mobile navigation and daily actions keep large tap targets without page-wide tables", () => {
  const layout = source("components/admin/AdminLayout.tsx");
  const students = source("components/admin/students/StudentRegister.tsx");
  const fees = source("components/admin/fees/CollectFeeForm.tsx");
  const daycare = source("components/admin/daycare/DaycareWorkspace.tsx");

  assert.match(layout, /max-w-\[350px\]/);
  assert.match(layout, /min-h-13/);
  assert.match(layout, /AdminGlobalSearch/);
  assert.match(students, /min-h-12/);
  assert.match(fees, /min-h-12/);
  assert.match(daycare, /min-h-12/);
});
