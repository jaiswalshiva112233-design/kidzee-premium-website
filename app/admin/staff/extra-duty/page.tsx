import {
  Banknote,
  Calculator,
  CalendarCheck2,
  Clock3,
  IndianRupee,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import StaffExtraDutyWorkspace from "@/components/admin/staff/StaffExtraDutyWorkspace";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

function getIndiaDateParts() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return {
    date,
    month: date.slice(0, 7),
  };
}

export default async function StaffExtraDutyPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const indiaDate = getIndiaDateParts();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[34px] bg-[#2D1736] text-white shadow-[0_26px_80px_rgba(45,23,54,0.22)]">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 right-1/4 h-64 w-64 rounded-full bg-[#A96DD1]/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-44 w-44 rounded-full bg-[#FFD34E]/10 blur-3xl"
          />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#FFD34E]">
                  <UserRoundCog aria-hidden="true" size={16} />
                  Substitute &amp; Extra Duty
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] !text-white sm:text-4xl lg:text-5xl">
                  Reward additional duty fairly and transparently.
                </h1>

                <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                  Record staff covering an absent colleague after regular duty,
                  calculate payment at the normal hourly salary, obtain owner
                  approval and track when it is paid.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85">
                    <Clock3
                      aria-hidden="true"
                      size={18}
                      className="text-[#FFD34E]"
                    />
                    Exact extra hours
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85">
                    <IndianRupee
                      aria-hidden="true"
                      size={18}
                      className="text-[#FFD34E]"
                    />
                    Normal hourly salary
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85">
                    <ShieldCheck
                      aria-hidden="true"
                      size={18}
                      className="text-[#FFD34E]"
                    />
                    Owner approval
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:w-[300px]">
                <div className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-start gap-3">
                    <Calculator
                      aria-hidden="true"
                      size={21}
                      className="mt-0.5 shrink-0 text-[#FFD34E]"
                    />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFD34E]">
                        Clear calculation
                      </p>
                      <p className="mt-2 text-sm font-bold leading-6 text-white/80">
                        Monthly salary is converted into a normal hourly rate.
                        No overtime multiplier is used.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/admin/staff/attendance"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FFD34E] px-3 text-center text-xs font-black text-[#2D1736] transition hover:bg-[#F5C62E]"
                  >
                    Staff Attendance
                  </Link>
                  <Link
                    href="/admin/staff"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-3 text-center text-xs font-black text-[#5B2A86] transition hover:bg-[#F6F1F8]"
                  >
                    Staff Directory
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={CalendarCheck2}
            title="Attendance Verified"
            description="CentreOS confirms the substitute worked and the covered employee was absent or on leave."
          />
          <FeatureCard
            icon={Calculator}
            title="Automatic Salary"
            description="Normal hourly salary and the final extra-duty amount are calculated from editable settings."
          />
          <FeatureCard
            icon={Banknote}
            title="Approval to Payment"
            description="Move each entry through pending, owner-approved and paid stages with a complete audit trail."
          />
        </section>

        <StaffExtraDutyWorkspace
          initialMonth={indiaDate.month}
          initialDate={indiaDate.date}
        />
      </div>
    </AdminLayout>
  );
}

type FeatureCardProps = {
  icon: typeof UserRoundCog;
  title: string;
  description: string;
};

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <article className="rounded-[26px] border border-[#E7DFEB] bg-white p-5 shadow-[0_12px_35px_rgba(45,23,54,0.05)] sm:p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E7F6] text-[#5B2A86]">
        <Icon aria-hidden="true" size={20} />
      </span>
      <h2 className="mt-4 text-lg font-black text-[#2D1736]">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
        {description}
      </p>
    </article>
  );
}
