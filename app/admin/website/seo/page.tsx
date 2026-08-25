import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  FileImage,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import WebsiteSeoManager from "@/components/admin/WebsiteSeoManager";
import WebsiteTrackingManager from "@/components/admin/WebsiteTrackingManager";
import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminSEOPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const canManageWebsite =
    await hasAdminPermission("website.manage");

  if (!canManageWebsite) {
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
              Website
            </Link>

            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-4 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD65F]"
            >
              View Website
              <ArrowRight aria-hidden="true" size={17} />
            </a>
          </div>

          <div className="mt-7 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <SearchCheck aria-hidden="true" size={23} />
                </span>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B] sm:text-sm">
                  SEO & Tracking Manager
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Control how parents find and share your website
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/72 sm:text-base">
                Edit search titles, descriptions, topics and sharing images,
                then connect Google, Meta and search-verification accounts—all
                without editing website code.
              </p>
            </div>

            <div className="flex max-w-md items-start gap-3 rounded-[22px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
              <ShieldCheck
                aria-hidden="true"
                size={21}
                className="mt-0.5 shrink-0 text-[#F6C84B]"
              />

              <p className="text-xs font-semibold leading-5 text-white/72">
                Only administrators with Website Manager permission can view or
                change these settings. Marketing trackers remain consent
                protected on the public website.
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
                Page SEO is ready now; account IDs can be added later
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-[#74613A] sm:text-sm">
                The existing launch-ready search details remain active until you
                save a change. Empty Google or Meta settings do not affect the
                public website.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <a
            href="#page-seo"
            className="group flex items-center justify-between gap-4 rounded-[24px] border border-[#E2D6E7] bg-white p-5 shadow-[0_12px_34px_rgba(45,23,54,0.05)] transition hover:-translate-y-0.5 hover:border-[#CBB8D4]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <FileImage aria-hidden="true" size={20} />
              </span>
              <span>
                <span className="block text-sm font-black text-[#2D1736]">
                  Page SEO & sharing
                </span>
                <span className="mt-1 block text-xs font-semibold text-[#817585]">
                  Titles, descriptions, topics and images
                </span>
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="text-[#5B2A86] transition group-hover:translate-x-1"
              size={18}
            />
          </a>

          <a
            href="#tracking-connections"
            className="group flex items-center justify-between gap-4 rounded-[24px] border border-[#E2D6E7] bg-white p-5 shadow-[0_12px_34px_rgba(45,23,54,0.05)] transition hover:-translate-y-0.5 hover:border-[#CBB8D4]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2765A4]">
                <BarChart3 aria-hidden="true" size={20} />
              </span>
              <span>
                <span className="block text-sm font-black text-[#2D1736]">
                  Tracking connections
                </span>
                <span className="mt-1 block text-xs font-semibold text-[#817585]">
                  Google, Meta, Search Console and Bing
                </span>
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="text-[#2765A4] transition group-hover:translate-x-1"
              size={18}
            />
          </a>
        </section>

        <section id="page-seo" className="scroll-mt-5 space-y-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
              Section 1
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
              Page SEO and sharing previews
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
              Select one public page at a time. Changes affect that page&apos;s
              preferred Google, WhatsApp and social-sharing preview.
            </p>
          </div>

          <WebsiteSeoManager />
        </section>

        <section
          id="tracking-connections"
          className="scroll-mt-5 space-y-5 border-t border-[#E2D9E6] pt-8"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2765A4]">
              Section 2
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
              Google, Meta and search connections
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
              Add these IDs only after the related accounts are created. Optional
              marketing tools remain disabled until both you and the visitor
              allow them.
            </p>
          </div>

          <WebsiteTrackingManager />
        </section>
      </div>
    </AdminLayout>
  );
}
