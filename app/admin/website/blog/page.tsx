import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Newspaper,
  ShieldCheck,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import BlogManager from "@/components/admin/BlogManager";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export default async function AdminBlogPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <Link
            href="/admin/website"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:border-[#F6C84B]/60 hover:text-[#F6C84B]"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            Website Manager
          </Link>

          <div className="mt-7 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                <Newspaper aria-hidden="true" size={25} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B] sm:text-sm">
                  Website CMS
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                  Blog Manager
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                  Create helpful parent articles, upload cover photos, control
                  publishing and manage Google and AI search details without
                  editing website files.
                </p>
              </div>
            </div>

            <Link
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD65F]"
            >
              View Public Blog
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </header>

        <section className="rounded-[24px] border border-[#E6DCEB] bg-[#F7F0FA] p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B2A86] shadow-sm">
              <ShieldCheck aria-hidden="true" size={21} />
            </span>
            <div>
              <h2 className="font-black text-[#2D1736]">
                Existing articles remain protected
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#746878]">
                The five original parent guides stay live as safe website
                fallbacks. Articles created here are added to them and can be
                saved privately as drafts before publishing.
              </p>
            </div>
          </div>
        </section>

        <BlogManager />
      </div>
    </AdminLayout>
  );
}

