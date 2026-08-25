import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import StaffPayrollWorkspace from "@/components/admin/staff/StaffPayrollWorkspace";
import { getAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

function getIndiaMonthKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

export default async function StaffPayrollPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const canViewPayroll =
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("payroll.manage");

  if (!canViewPayroll) {
    redirect("/admin/staff");
  }

  return (
    <AdminLayout>
      <StaffPayrollWorkspace
        initialMonth={getIndiaMonthKey()}
      />
    </AdminLayout>
  );
}
