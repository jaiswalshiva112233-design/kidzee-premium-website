import {
  CalendarCheck2,
  CalendarRange,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
  UsersRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import StaffWorkspace, {
  type StaffWorkspaceRecord,
} from "@/components/admin/staff/StaffWorkspace";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const canViewPayroll =
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("payroll.manage");

  const staffRecords = await prisma.staff.findMany({
    orderBy: [
      {
        status: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  const initialStaff: StaffWorkspaceRecord[] = staffRecords.map((staff) => ({
    id: staff.id,
    staffNumber: staff.staffNumber,
    name: staff.name,
    phone: staff.phone,
    alternatePhone: staff.alternatePhone,
    email: staff.email,
    designation: staff.designation,
    joiningDate: staff.joiningDate.toISOString(),
    leavingDate: staff.leavingDate?.toISOString() ?? null,
    status: staff.status,
    monthlySalary: staff.monthlySalary?.toString() ?? null,
    paidLeaveCycle: staff.paidLeaveCycle,
    paidLeaveAllowance: staff.paidLeaveAllowance.toString(),
    address: staff.address,
    emergencyContact: staff.emergencyContact,
    notes: staff.notes,
    createdAt: staff.createdAt.toISOString(),
    updatedAt: staff.updatedAt.toISOString(),
  }));

  return (
    <AdminLayout>
      <div className="space-y-7">
        <section className="overflow-hidden rounded-[32px] bg-[#2D1736] text-white shadow-[0_26px_80px_rgba(45,23,54,0.22)]">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#FFD34E]/15 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#A96DD1]/20 blur-3xl"
            />

            <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#FFD34E]">
                  <GraduationCap aria-hidden="true" size={16} />
                  CentreOS Staff
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] !text-white sm:text-4xl lg:text-5xl">
                  Manage your preschool team with confidence.
                </h1>

                <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                  Maintain teacher, centre head, helper and support-staff
                  records, contact information, employment status and salary
                  details in one secure register.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85">
                    <UsersRound
                      aria-hidden="true"
                      size={18}
                      className="text-[#FFD34E]"
                    />
                    {initialStaff.length} staff records
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85">
                    <ShieldCheck
                      aria-hidden="true"
                      size={18}
                      className="text-[#FFD34E]"
                    />
                    Secure database
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85">
                    <Sparkles
                      aria-hidden="true"
                      size={18}
                      className="text-[#FFD34E]"
                    />
                    Live staff register
                  </span>
                </div>
              </div>

              <div className="space-y-3 xl:w-[300px]">
                <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-[#FFD34E]">
                    Data privacy
                  </p>

                  <p className="mt-3 text-sm font-bold leading-6 text-white/85">
                    Salary information is hidden by default and can be revealed
                    only when required.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Link
                    href="/admin/staff/attendance"
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD34E] px-5 text-sm font-black text-[#2D1736] shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:bg-[#F5C62E]"
                  >
                    <CalendarCheck2 aria-hidden="true" size={19} />
                    Staff Attendance
                  </Link>

                  <Link
                    href="/admin/staff/leave"
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#5B2A86] shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:bg-[#F6F1F8]"
                  >
                    <CalendarRange aria-hidden="true" size={19} />
                    Leave Manager
                  </Link>

                  <Link
                    href="/admin/staff/extra-duty"
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.1)] transition hover:bg-white/15"
                  >
                    <UserRoundCog aria-hidden="true" size={19} />
                    Substitute &amp; Extra Duty
                  </Link>

                  {canViewPayroll ? (
                    <Link
                      href="/admin/staff/payroll"
                      className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-black text-[#173627] shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:bg-emerald-400"
                    >
                      <WalletCards aria-hidden="true" size={19} />
                      Monthly Payroll
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <StaffWorkspace initialStaff={initialStaff} />
      </div>
    </AdminLayout>
  );
}
