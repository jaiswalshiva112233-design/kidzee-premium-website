import { redirect } from "next/navigation";
import {
  CalendarCheck2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import AttendanceRegister from "@/components/admin/attendance/AttendanceRegister";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

function getIndiaDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

type AdminAttendancePageProps = {
  searchParams: Promise<{
    studentId?: string;
    date?: string;
  }>;
};

export default async function AdminAttendancePage({
  searchParams,
}: AdminAttendancePageProps) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const query = await searchParams;
  const requestedDate =
    /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "")
      ? query.date
      : getIndiaDateKey();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[32px] bg-[#2D1736] px-5 py-8 text-white shadow-[0_24px_70px_rgba(45,23,54,0.2)] sm:px-7 lg:px-9 lg:py-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />

          <div className="pointer-events-none absolute -bottom-28 right-20 h-60 w-60 rounded-full bg-[#F6C84B]/10 blur-2xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <CalendarCheck2
                    aria-hidden="true"
                    size={23}
                  />
                </span>

                <p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B] sm:text-sm">
                  Daily Student Register
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                Attendance
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                Mark preschool attendance for children with an active
                preschool service. Daycare-only children remain in the Daycare
                register, while children using both services appear in both.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/55">
                Today
              </p>

              <p className="mt-2 text-lg font-black text-white">
                {new Intl.DateTimeFormat("en-IN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Kolkata",
                }).format(new Date())}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            icon={ClipboardCheck}
            title="Quick Marking"
            description="Mark all students present and update only the exceptions."
          />

          <FeatureCard
            icon={Clock3}
            title="Check-in & Check-out"
            description="Record attendance timing for present, late and half-day students."
          />

          <FeatureCard
            icon={GraduationCap}
            title="Programme Filters"
            description="Class filters come from each child’s active preschool contract."
          />

          <FeatureCard
            icon={ShieldCheck}
            title="Secure Records"
            description="Each student has one attendance record per date to prevent duplicates."
          />
        </section>

        <AttendanceRegister
          initialDate={requestedDate}
          initialStudentId={query.studentId?.trim() || undefined}
        />
      </div>
    </AdminLayout>
  );
}

type FeatureCardProps = {
  icon: typeof CalendarCheck2;
  title: string;
  description: string;
};

function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <article className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_12px_35px_rgba(45,23,54,0.05)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
        <Icon
          aria-hidden="true"
          size={20}
        />
      </span>

      <h2 className="mt-4 text-lg font-black text-[#2D1736]">
        {title}
      </h2>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
        {description}
      </p>
    </article>
  );
}
