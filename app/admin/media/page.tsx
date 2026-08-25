import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Images,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import HomepageMediaManager from "@/components/admin/HomepageMediaManager";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export default async function AdminMediaPage() {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="rounded-[30px] bg-[#2D1736] px-6 py-8 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-8 lg:px-10">
          <Link
            href="/admin/website"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:border-[#F6C84B]/60 hover:text-[#F6C84B]"
          >
            <ArrowLeft
              aria-hidden="true"
              size={17}
            />

            Website Overview
          </Link>

          <div className="mt-7 flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
              <Images
                aria-hidden="true"
                size={24}
              />
            </span>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.15em] text-[#F6C84B]">
                Website management
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                Homepage Photos
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
                Replace homepage photographs
                without opening folders,
                changing filenames or editing
                website code.
              </p>
            </div>
          </div>
        </header>

        <section>
          <HomepageMediaManager />
        </section>
      </div>
    </AdminLayout>
  );
}