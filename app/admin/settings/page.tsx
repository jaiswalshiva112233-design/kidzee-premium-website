import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  CircleDollarSign,
  DatabaseBackup,
  PlugZap,
  KeyRound,
  ReceiptText,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import ReceiptNumberingSettings from "@/components/admin/settings/ReceiptNumberingSettings";
import SchoolInformationSettings from "@/components/admin/settings/SchoolInformationSettings";
import {
  getAdminSession,
  hasAdminPermission,
} from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const canManageCentreSettings =
    await hasAdminPermission("centre.settings");

  if (
    session.role !== "OWNER" &&
    !canManageCentreSettings
  ) {
    redirect("/admin");
  }

  const isOwner = session.role === "OWNER";
  const canManageFeeSettings = isOwner;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_24px_70px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
              <Settings
                aria-hidden="true"
                size={27}
              />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B]">
                CentreOS Configuration
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Settings
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/70">
                Manage centre information, receipt details,
                secure user access, branding, contact
                information and continuous numbering.
              </p>
            </div>
          </div>
        </section>

        <section
          className={[
            "grid gap-4",
            "md:grid-cols-2 xl:grid-cols-4",
          ].join(" ")}
        >
          <SettingsOverviewCard
            icon={Building2}
            title="School Profile"
            description="Contact details, address, centre head, legal information and bank details."
            href="#school-information"
          />

          {canManageFeeSettings ? (
            <SettingsOverviewCard
              icon={CircleDollarSign}
              title="Legacy Fees & Late Fee"
              description="Owner-only compatibility for old fee records. Use Billing Catalogue for all new pricing."
              href="/admin/settings/fees"
              badge="Legacy · Owner only"
            />
          ) : null}

          {isOwner ? (
            <SettingsOverviewCard
              icon={Settings}
              title="Billing Catalogue"
              description="Create programmes, daycare plans, meals, combinations and future prices."
              href="/admin/settings/billing"
              badge="Owner only"
            />
          ) : null}

          <SettingsOverviewCard
            icon={ReceiptText}
            title="Receipt Configuration"
            description="Receipt numbering, footer, terms, logo, stamp, signature and QR preferences."
            href="#receipt-numbering"
          />

          <SettingsOverviewCard
            icon={KeyRound}
            title="Password & Security"
            description="Change your password and protect your administrator account."
            href="/admin/settings/security"
          />

          {isOwner ? (
            <SettingsOverviewCard
              icon={PlugZap}
              title="Integrations & Traffic"
              description="Firebase, AI, analytics, ads, WhatsApp and staff-device exclusion in one place."
              href="/admin/settings/integrations"
              badge="Owner only"
            />
          ) : null}

          {isOwner ? (
            <SettingsOverviewCard
              icon={UsersRound}
              title="Admin Access"
              description="Create Centre Head accounts and control exactly what they can manage."
              href="/admin/settings/access"
              badge="Owner only"
            />
          ) : null}

          {isOwner ? (
            <SettingsOverviewCard
              icon={DatabaseBackup}
              title="Data & History"
              description="Back up, review and permanently remove test records and linked history before launch."
              href="/admin/settings/data"
              badge="Owner only"
            />
          ) : null}
        </section>

        <nav
          aria-label="Settings sections"
          className="sticky top-4 z-20 overflow-x-auto rounded-2xl border border-[#E9E2ED] bg-white/95 p-2 shadow-[0_10px_30px_rgba(45,23,54,0.06)] backdrop-blur"
        >
          <div className="flex min-w-max gap-2">
            <a
              href="#school-information"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white transition hover:bg-[#4B206F]"
            >
              <Building2
                aria-hidden="true"
                size={15}
              />
              School Information
            </a>

            <a
              href="#receipt-numbering"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#DDD2E2] bg-white px-4 text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
            >
              <ReceiptText
                aria-hidden="true"
                size={15}
              />
              Receipt Numbering
            </a>

            {canManageFeeSettings ? (
              <Link
                href="/admin/settings/fees"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#DDD2E2] bg-white px-4 text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
              >
                <CircleDollarSign aria-hidden="true" size={15} />
                Legacy Fees
              </Link>
            ) : null}

            <Link
              href="/admin/settings/security"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#DDD2E2] bg-white px-4 text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
            >
              <ShieldCheck
                aria-hidden="true"
                size={15}
              />
              Password & Security
            </Link>

            {isOwner ? (
              <Link
                href="/admin/settings/access"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#F6C84B] bg-[#FFF8E1] px-4 text-xs font-black text-[#6B4C00] transition hover:bg-[#FFF1BD]"
              >
                <UsersRound
                  aria-hidden="true"
                  size={15}
                />
                Admin Access
              </Link>
            ) : null}

            {isOwner ? (
              <Link
                href="/admin/settings/data"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-black text-red-700 transition hover:bg-red-100"
              >
                <DatabaseBackup aria-hidden="true" size={15} />
                Data & History
              </Link>
            ) : null}
          </div>
        </nav>

        <section
          id="school-information"
          className="scroll-mt-24"
        >
          <SchoolInformationSettings />
        </section>

        <section
          id="receipt-numbering"
          className="scroll-mt-24"
        >
          <ReceiptNumberingSettings />
        </section>
      </div>
    </AdminLayout>
  );
}

type SettingsOverviewCardProps = {
  icon: typeof Building2;
  title: string;
  description: string;
  href: string;
  badge?: string;
};

function SettingsOverviewCard({
  icon: Icon,
  title,
  description,
  href,
  badge,
}: SettingsOverviewCardProps) {
  const className =
    "group block rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_12px_35px_rgba(45,23,54,0.05)] transition duration-200 hover:-translate-y-1 hover:border-[#CDB9D8] hover:shadow-[0_18px_45px_rgba(45,23,54,0.09)]";

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86] transition group-hover:bg-[#5B2A86] group-hover:text-white">
          <Icon
            aria-hidden="true"
            size={20}
          />
        </span>

        {badge ? (
          <span className="rounded-full bg-[#FFF2C5] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#765600]">
            {badge}
          </span>
        ) : null}
      </div>

      <h2 className="mt-4 text-lg font-black text-[#2D1736]">
        {title}
      </h2>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
        {description}
      </p>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-[#6A328F]">
        Open Settings →
      </p>
    </>
  );

  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
