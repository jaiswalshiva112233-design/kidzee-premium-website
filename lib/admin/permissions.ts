export type AdminRole = "OWNER" | "CENTRE_HEAD";

export type AdminPermissionRequirement =
  | string
  | readonly string[];

export type AdminPermissionSubject = {
  role: AdminRole;
  permissions: readonly string[];
};

type PermissionRule = {
  path: string;
  permission: AdminPermissionRequirement;
};

export const ADMIN_PAGE_PERMISSION_RULES = [
  { path: "/admin/notifications", permission: "dashboard.view" },
  { path: "/admin/intelligence", permission: "owner.only" },
  { path: "/admin/marketing", permission: "owner.only" },
  {
    path: "/admin/whatsapp",
    permission: ["fees.collect", "receipts.view"],
  },
  { path: "/admin/growth", permission: "owner.only" },
  { path: "/admin/careers", permission: "staff.view" },
  {
    path: "/admin/daycare",
    permission: ["fees.collect", "fees.settings"],
  },
  {
    path: "/admin/calendar",
    permission: ["dashboard.view", "centre.settings"],
  },
  { path: "/admin/settings/data", permission: "owner.only" },
  { path: "/admin/settings/access", permission: "owner.only" },
  { path: "/admin/settings/billing", permission: "owner.only" },
  { path: "/admin/settings/integrations", permission: "owner.only" },
  { path: "/admin/settings/fees", permission: "owner.only" },
  { path: "/admin/settings/security", permission: "security.self" },
  {
    path: "/admin/reports/ca-export",
    permission: "ca_export.download",
  },
  { path: "/admin/settings", permission: "centre.settings" },
  { path: "/admin/website", permission: "website.manage" },
  { path: "/admin/media", permission: "website.manage" },
  { path: "/admin/enquiries", permission: "enquiries.manage" },
  { path: "/admin/admissions", permission: "admissions.manage" },
  { path: "/admin/students", permission: "students.manage" },
  { path: "/admin/attendance", permission: "attendance.manage" },
  { path: "/admin/fees", permission: "fees.collect" },
  { path: "/admin/revenue", permission: "reports.view" },
  { path: "/admin/receipts", permission: "receipts.view" },
  { path: "/admin/expenses", permission: "expenses.manage" },
  { path: "/admin/reports", permission: "reports.view" },
  { path: "/admin/staff/payroll", permission: "payroll.manage" },
  { path: "/admin/staff", permission: "staff.view" },
  { path: "/admin", permission: "dashboard.view" },
] as const satisfies readonly PermissionRule[];

export const ADMIN_API_PERMISSION_RULES = [
  { path: "/api/admin/notifications", permission: "dashboard.view" },
  { path: "/api/admin/intelligence", permission: "owner.only" },
  { path: "/api/admin/marketing", permission: "owner.only" },
  { path: "/api/admin/dashboard", permission: "dashboard.view" },
  { path: "/api/admin/search", permission: "dashboard.view" },
  {
    path: "/api/admin/whatsapp",
    permission: ["fees.collect", "receipts.view"],
  },
  { path: "/api/admin/growth", permission: "owner.only" },
  { path: "/api/admin/careers", permission: "staff.view" },
  {
    path: "/api/admin/daycare",
    permission: ["fees.collect", "fees.settings"],
  },
  {
    path: "/api/admin/calendar",
    permission: ["dashboard.view", "centre.settings"],
  },
  { path: "/api/admin/gallery", permission: "website.manage" },
  { path: "/api/admin/website-analytics", permission: "website.manage" },
  { path: "/api/admin/website-operations", permission: "website.manage" },
  { path: "/api/admin/website-blog", permission: "website.manage" },
  { path: "/api/admin/website-contact", permission: "website.manage" },
  {
    path: "/api/admin/website-content-settings",
    permission: "website.manage",
  },
  {
    path: "/api/admin/website-programme-settings",
    permission: "website.manage",
  },
  { path: "/api/admin/website-seo", permission: "website.manage" },
  { path: "/api/admin/website-settings", permission: "website.manage" },
  { path: "/api/admin/website-team", permission: "website.manage" },
  {
    path: "/api/admin/internal-device",
    permission: "owner.only",
  },
  {
    path: "/api/admin/reports/ca-export",
    permission: "ca_export.download",
  },
  {
    path: "/api/admin/settings/receipt-numbering",
    permission: "centre.settings",
  },
  {
    path: "/api/admin/settings/school-profile",
    permission: "centre.settings",
  },
  { path: "/api/admin/attendance", permission: "attendance.manage" },
  { path: "/api/admin/enquiries", permission: "enquiries.manage" },
  { path: "/api/admin/expenses", permission: "expenses.manage" },
  { path: "/api/admin/fees", permission: "fees.collect" },
  { path: "/api/admin/media", permission: "website.manage" },
  { path: "/api/admin/staff-payroll", permission: "payroll.manage" },
  { path: "/api/admin/staff-attendance", permission: "staff.view" },
  { path: "/api/admin/staff-leave", permission: "staff.view" },
  { path: "/api/admin/staff-extra-duty", permission: "staff.view" },
  { path: "/api/admin/staff", permission: "staff.view" },
  {
    path: "/api/admin/student-documents",
    permission: "students.manage",
  },
  {
    path: "/api/admin/student-ledger",
    permission: ["fees.collect", "students.manage"],
  },
  { path: "/api/admin/students", permission: "students.manage" },
] as const satisfies readonly PermissionRule[];

export function matchesAdminPath(pathname: string, rulePath: string) {
  return pathname === rulePath || pathname.startsWith(`${rulePath}/`);
}

function permissionForPath(
  pathname: string,
  rules: readonly PermissionRule[],
) {
  return (
    rules.find(({ path }) => matchesAdminPath(pathname, path))?.permission ??
    "owner.only"
  );
}

export function getAdminPagePermission(pathname: string) {
  return permissionForPath(pathname, ADMIN_PAGE_PERMISSION_RULES);
}

export function getAdminApiPermission(pathname: string) {
  return permissionForPath(pathname, ADMIN_API_PERMISSION_RULES);
}

export function hasAdminPermissionRequirement(
  subject: AdminPermissionSubject,
  requirement: AdminPermissionRequirement,
) {
  if (subject.role === "OWNER") {
    return true;
  }

  const requirements = Array.isArray(requirement)
    ? requirement
    : [requirement];

  if (requirements.includes("security.self")) {
    return true;
  }

  if (requirements.includes("owner.only")) {
    return false;
  }

  return (
    subject.permissions.includes("*") ||
    requirements.some((permission) =>
      subject.permissions.includes(permission),
    )
  );
}

export function canAccessAdminPath(
  pathname: string,
  subject: AdminPermissionSubject,
) {
  return hasAdminPermissionRequirement(
    subject,
    getAdminPagePermission(pathname),
  );
}
