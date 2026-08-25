import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  HeartHandshake,
  ImagePlus,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import WebsiteMediaManager from "@/components/admin/WebsiteMediaManager";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { daycareMediaSlots } from "@/lib/admin/mediaSlots";

export default async function AdminDaycarePage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
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
                <HeartHandshake aria-hidden="true" size={25} />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B] sm:text-sm">
                  Website management
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                  Daycare Page
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                  Manage the main Daycare photograph now. The seasonal daycare
                  meal plan will be added as a separate editable section after
                  its menu is available.
                </p>
              </div>
            </div>

            <Link
              href="/daycare"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD65F]"
            >
              View Daycare Page
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-[24px] border border-[#E6DCEB] bg-white p-5 shadow-[0_12px_34px_rgba(45,23,54,0.05)]">
            <ImagePlus
              aria-hidden="true"
              size={22}
              className="text-[#5B2A86]"
            />
            <h2 className="mt-4 font-black text-[#2D1736]">
              Main photo connected
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#746878]">
              Uploading here updates the large photograph at the top of the
              public Daycare page.
            </p>
          </article>

          <article className="rounded-[24px] border border-[#E6DCEB] bg-[#F7F0FA] p-5">
            <Clock3
              aria-hidden="true"
              size={22}
              className="text-[#5B2A86]"
            />
            <h2 className="mt-4 font-black text-[#2D1736]">
              Daycare until 7:00 PM
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#746878]">
              Current public information covers the flexible afternoon routine,
              rest, play and homework support.
            </p>
          </article>

          <article className="rounded-[24px] border border-[#E6DCEB] bg-white p-5">
            <UtensilsCrossed
              aria-hidden="true"
              size={22}
              className="text-[#5B2A86]"
            />
            <h2 className="mt-4 font-black text-[#2D1736]">
              Meal plan kept separate
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#746878]">
              Lunch, snacks and seasonal menu information will have dedicated
              controls instead of being hidden inside a photo field.
            </p>
          </article>
        </section>

        <section className="rounded-[24px] border border-[#E6DCEB] bg-[#F7F0FA] p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B2A86] shadow-sm">
              <ShieldCheck aria-hidden="true" size={21} />
            </span>
            <div>
              <h2 className="font-black text-[#2D1736]">
                Safe replacement and restore
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#746878]">
                The current photo stays visible until a replacement is
                published. You can restore the original photograph at any time.
              </p>
            </div>
          </div>
        </section>

        <WebsiteMediaManager
          slots={daycareMediaSlots}
          pageLabel="Daycare page"
          introduction="Choose a real daycare photograph, review its preview and publish it. Use a clear description that explains what the child is doing."
        />
      </div>
    </AdminLayout>
  );
}

