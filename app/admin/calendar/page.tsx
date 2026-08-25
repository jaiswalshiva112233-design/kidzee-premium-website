import { CalendarDays, FileUp, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import CalendarWorkspace from "@/components/admin/calendar/CalendarWorkspace";
import { getAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const canView =
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("dashboard.view");

  if (!canView) {
    redirect("/admin");
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[34px] bg-[#2D1736] p-6 text-white shadow-[0_26px_80px_rgba(45,23,54,0.22)] sm:p-8 lg:p-10">
          <div aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#A96DD1]/20 blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#FFD34E]">
                <CalendarDays aria-hidden="true" size={16} />
                Centre Calendar
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] !text-white sm:text-4xl lg:text-5xl">
                Every holiday, celebration and deadline in one place.
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                Upload the yearly Kidzee calendar, review imported dates and keep tomorrow’s work visible on the CentreOS dashboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[390px]">
              <Feature icon={FileUp} title="PDF import" text="Replace the active calendar every year." />
              <Feature icon={Sparkles} title="Daily reminders" text="Tomorrow’s events appear automatically." />
            </div>
          </div>
        </section>

        <CalendarWorkspace />
      </div>
    </AdminLayout>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CalendarDays;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/15 bg-white/10 p-4 backdrop-blur">
      <Icon aria-hidden="true" size={19} className="text-[#FFD34E]" />
      <p className="mt-3 text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-white/65">{text}</p>
    </div>
  );
}
