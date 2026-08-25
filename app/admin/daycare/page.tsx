import {
  CalendarClock,
  ClipboardCheck,
  Clock3,
  Utensils,
} from "lucide-react";
import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import DaycareWorkspace from "@/components/admin/daycare/DaycareWorkspace";
import { getAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminDaycarePage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const canUseDaycare =
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("fees.collect") ||
    session.permissions.includes("fees.settings");

  if (!canUseDaycare) {
    redirect("/admin");
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[34px] bg-[#2D1736] p-6 text-white shadow-[0_26px_80px_rgba(45,23,54,0.22)] sm:p-8 lg:p-10">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#A96DD1]/20 blur-3xl"
          />

          <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#FFD34E]">
                <CalendarClock aria-hidden="true" size={16} />
                Daily Daycare Operations
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] !text-white sm:text-4xl lg:text-5xl">
                Today&apos;s children, care notes and pickups in one place.
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                Check children in and out, record meals, pickup details, extra
                time and emergency care. Monthly daycare billing continues from
                each child&apos;s Student Contract without duplicate entry here.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[590px]">
              <Feature
                icon={ClipboardCheck}
                title="Daily register"
                text="Record each child once with clear visit status."
              />
              <Feature
                icon={Clock3}
                title="Pickup control"
                text="See expected, completed and late pickups quickly."
              />
              <Feature
                icon={Utensils}
                title="Care notes"
                text="Record meals, extra care and parent-ready notes."
              />
            </div>
          </div>
        </section>

        <DaycareWorkspace />
      </div>
    </AdminLayout>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CalendarClock;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/15 bg-white/10 p-4 backdrop-blur">
      <Icon aria-hidden="true" size={19} className="text-[#FFD34E]" />
      <p className="mt-3 text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-white/65">
        {text}
      </p>
    </div>
  );
}
