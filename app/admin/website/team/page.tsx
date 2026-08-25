import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import WebsiteTeamManager from "@/components/admin/WebsiteTeamManager";
import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminWebsiteTeamPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  if (!(await hasAdminPermission("website.manage"))) {
    redirect("/admin");
  }

  return (
    <AdminLayout>
      <div className="space-y-7">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/admin/website"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:border-[#F6C84B]/60 hover:text-[#F6C84B]"
            >
              <ArrowLeft aria-hidden="true" size={17} />
              Website Manager
            </Link>

            <Link
              href="/about#team"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-4 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD65F]"
            >
              View Public Team
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>

          <div className="mt-7 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <UsersRound aria-hidden="true" size={23} />
                </span>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B] sm:text-sm">
                  Website Team Manager
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Introduce the people children trust
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/72 sm:text-base">
                Add teacher portraits, roles and short introductions. Choose
                who appears on the About page and feature up to nine profiles.
                The homepage keeps the section compact by showing no more than
                three portraits at one time.
              </p>
            </div>

            <div className="flex max-w-md items-start gap-3 rounded-[22px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
              <ShieldCheck
                aria-hidden="true"
                size={21}
                className="mt-0.5 shrink-0 text-[#F6C84B]"
              />
              <p className="text-xs font-semibold leading-5 text-white/72">
                Website profiles are separate from private staff and payroll
                records. Publish only photographs the teacher has approved.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#ECDDAA] bg-[#FFF9E8] px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
              <Sparkles aria-hidden="true" size={18} />
            </span>
            <div>
              <p className="text-sm font-black text-[#493817]">
                Keep every portrait consistent
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#74613A] sm:text-sm">
                Use vertical 4:5 portraits with similar lighting, framing and
                background. Short, factual introductions feel more genuine
                than long biographies.
              </p>
            </div>
          </div>
        </section>

        <WebsiteTeamManager />
      </div>
    </AdminLayout>
  );
}
