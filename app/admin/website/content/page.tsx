import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, FilePenLine, ShieldCheck } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import WebsiteContentManager from "@/components/admin/WebsiteContentManager";
import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminWebsiteContentPage() {
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
            <Link href="/admin/website" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:text-[#F6C84B]">
              <ArrowLeft aria-hidden="true" size={17} />
              Website
            </Link>
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#F6C84B] px-4 text-sm font-black text-[#2D1736] transition hover:bg-[#FFD65F]">
              View Website
              <ArrowRight aria-hidden="true" size={17} />
            </a>
          </div>

          <div className="mt-7 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <FilePenLine aria-hidden="true" size={23} />
                </span>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B] sm:text-sm">
                  Admissions & Website Text
                </p>
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Update the next admission year without code
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/72 sm:text-base">
                Change the academic year, admission status, main headlines and
                important buttons from one clear page.
              </p>
            </div>

            <div className="flex max-w-md items-start gap-3 rounded-[22px] border border-white/12 bg-white/8 p-4">
              <ShieldCheck aria-hidden="true" size={21} className="mt-0.5 shrink-0 text-[#F6C84B]" />
              <p className="text-xs font-semibold leading-5 text-white/72">
                Published wording is cleaned and length-limited so the website
                stays readable on phone and desktop.
              </p>
            </div>
          </div>
        </section>

        <WebsiteContentManager />
      </div>
    </AdminLayout>
  );
}
