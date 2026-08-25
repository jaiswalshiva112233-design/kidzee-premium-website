import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("proxy and sidebar share the central permission policy", () => {
  const proxy = source("proxy.ts");
  const sidebar = source("components/admin/AdminSidebar.tsx");

  assert.match(proxy, /getAdminApiPermission\(pathname\)/);
  assert.match(proxy, /getAdminPagePermission\(pathname\)/);
  assert.match(proxy, /hasAdminPermissionRequirement/);
  assert.match(proxy, /getAdminSessionClaimsFromToken/);
  assert.doesNotMatch(proxy, /getAdminSessionFromToken/);
  assert.doesNotMatch(proxy, /\bgetApiPermission\(/);
  assert.doesNotMatch(proxy, /\bgetPagePermission\(/);
  assert.match(sidebar, /adminNavigationSections/);
  assert.match(sidebar, /canShowAdminNavigationItem/);
});

test("proxy validates signed session claims without querying Prisma", () => {
  const proxy = source("proxy.ts");
  const auth = source("lib/admin/auth.ts");

  assert.match(auth, /export function getAdminSessionClaimsFromToken/);
  assert.match(auth, /permissions: normalisePermissions\(/);
  assert.match(auth, /mustChangePassword:\s*user\.mustChangePassword/);
  assert.doesNotMatch(proxy, /\bprisma\b/);
});

test("enquiry conversion keeps the enquiry linked and reports admission only after confirmation", () => {
  const form = source("components/admin/students/AddStudentForm.tsx");
  const students = source("app/api/admin/students/route.ts");
  const enquiry = source("app/api/admin/enquiries/[id]/route.ts");
  const admissions = source("app/admin/admissions/page.tsx");

  assert.match(form, /enquiryId,/);
  assert.match(students, /enquiryId,[\s\S]*studentId: createdStudent\.id/);
  assert.doesNotMatch(enquiry, /deliverAdmissionConversions/);
  assert.match(admissions, /statusValue === "CONFIRMED"/);
  assert.match(admissions, /deliverAdmissionConversions/);
  assert.match(admissions, /statusValue === "CANCELLED"/);
  assert.match(admissions, /admittedAt: null/);
});

test("student attendance blocks future dates and records the marking administrator", () => {
  const attendance = source("app/api/admin/attendance/route.ts");
  const register = source("components/admin/attendance/AttendanceRegister.tsx");
  const studentPanel = source(
    "components/admin/students/StudentAttendancePanel.tsx",
  );

  assert.match(attendance, /isFutureAttendanceDate/);
  assert.match(attendance, /markedById: session\.userId/);
  assert.match(attendance, /activityLog\.create/);
  assert.match(attendance, /attendanceRecords:\s*\{/);
  assert.match(attendance, /isHistoricalDate/);
  assert.match(register, /max=\{getIndiaDateKey\(\)\}/);
  assert.match(register, /initialStudentId/);
  assert.match(studentPanel, /record\.status === "HALF_DAY" \? total \+ 0\.5/);
});

test("cleanup protects linked students, payroll, and admission relationships", () => {
  const cleanup = source("lib/admin/dataControl.ts");
  const endpoint = source("app/api/admin/data-control/route.ts");

  assert.match(cleanup, /LINKED_STUDENT/);
  assert.match(cleanup, /LINKED_PAYROLL/);
  assert.match(cleanup, /transaction\.admission\.deleteMany/);
  assert.match(cleanup, /admittedAt: null/);
  assert.match(endpoint, /LINKED_STUDENT/);
  assert.match(endpoint, /LINKED_PAYROLL/);
});

test("withdrawing a student closes active daycare plans and future bookings", () => {
  const withdrawal = source(
    "app/api/admin/students/[id]/withdraw/route.ts",
  );

  assert.match(withdrawal, /studentDaycarePlan\.findMany/);
  assert.match(withdrawal, /active: false/);
  assert.match(withdrawal, /daycareSession\.updateMany/);
  assert.match(withdrawal, /feeInvoiceId: null/);
  assert.match(withdrawal, /status: "CANCELLED"/);
});

test("programme changes cannot invalidate an active monthly daycare plan", () => {
  const studentUpdate = source("app/api/admin/students/[id]/route.ts");

  assert.match(studentUpdate, /incompatibleDaycarePlan/);
  assert.match(studentUpdate, /MONTHLY_DAYCARE_ONLY/);
  assert.match(studentUpdate, /MONTHLY_PRESCHOOL_DAYCARE/);
});

test("extra-duty pay is reconciled through payroll only", () => {
  const endpoint = source("app/api/admin/staff-extra-duty/route.ts");
  const workspace = source(
    "components/admin/staff/StaffExtraDutyWorkspace.tsx",
  );

  assert.match(endpoint, /paid through monthly payroll/);
  assert.doesNotMatch(workspace, /onAction\("mark_paid"\)/);
  assert.match(workspace, /Pay through Payroll/);
});

test("payroll cannot be generated in the future or approved before month close", () => {
  const payroll = source("app/api/admin/staff-payroll/route.ts");
  const workspace = source(
    "components/admin/staff/StaffPayrollWorkspace.tsx",
  );

  assert.match(payroll, /Future payroll months cannot be opened/);
  assert.match(payroll, /payroll draft cannot be generated for a future month/i);
  assert.match(payroll, /Approve it after the month ends/);
  assert.match(workspace, /max=\{initialMonth\}/);
});

test("dashboard cards and actions are filtered by the central permission policy", () => {
  const dashboard = source("app/admin/page.tsx");

  assert.match(dashboard, /canAccessAdminPath/);
  assert.match(dashboard, /summaryCards\.filter\(\(card\) => canOpen\(card\.href\)\)/);
  assert.match(dashboard, /dailyActions\.filter\(\(action\) => canOpen\(action\.href\)\)/);
  assert.match(dashboard, /centreTools\.filter\(\(tool\) => canOpen\(tool\.href\)\)/);
});
