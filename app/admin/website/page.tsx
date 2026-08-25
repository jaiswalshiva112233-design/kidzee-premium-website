import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  Building2,
  ContactRound,
  FilePenLine,
  GalleryHorizontalEnd,
  Globe2,
  Images,
  Newspaper,
  Megaphone,
  SearchCheck,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { isAdminAuthenticated } from "@/lib/admin/auth";

const websiteSections = [
  {
    title: "Central Operations",
    description:
      "Manage campaign defaults, UTM defaults, approved MIRA knowledge, SEO fallbacks and website notices.",
    href: "/admin/website/operations",
    icon: Settings2,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#F2E8F7] text-[#5B2A86]",
  },
  {
    title: "Admissions & Page Text",
    description:
      "Update the academic year, admission status, main website headlines and important buttons from one place.",
    href: "/admin/website/content",
    icon: FilePenLine,
    status: "Yearly update",
    statusStyle: "bg-amber-50 text-amber-700 border-amber-200",
    accentStyle: "bg-[#FFF3D5] text-[#8A6100]",
  },
  {
    title: "Homepage",
    description:
      "Manage homepage photographs, including the hero, programmes, daycare, facilities and gallery preview.",
    href: "/admin/media",
    icon: Images,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#F2E8F7] text-[#5B2A86]",
  },
  {
    title: "Website Analytics",
    description:
      "Review anonymous visitors, popular pages, Call and WhatsApp clicks, submitted leads and advertising campaigns.",
    href: "/admin/website/analytics",
    icon: BarChart3,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#EAF3FF] text-[#2765A4]",
  },
  {
    title: "About Page",
    description:
      "Manage centre photographs, learning-environment images and other media used on the About page.",
    href: "/admin/website/about",
    icon: Building2,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#FFF3CF] text-[#876000]",
  },
  {
    title: "Website Team",
    description:
      "Add teacher portraits, roles and introductions, then choose who appears on the About page and homepage.",
    href: "/admin/website/team",
    icon: UsersRound,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#F3ECFF] text-[#6E45A8]",
  },
  {
    title: "Programmes",
    description:
      "Manage photographs for Playgroup, Nursery, Junior KG and Senior KG programme pages.",
    href: "/admin/website/programmes",
    icon: BookOpenText,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#EAF3FF] text-[#2765A4]",
  },
  {
    title: "Daycare",
    description:
      "Manage the public daycare photograph and prepare the separate seasonal meal-plan section.",
    href: "/admin/website/daycare",
    icon: Sparkles,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#FFF0E8] text-[#A65325]",
  },
  {
    title: "Gallery",
    description:
      "Upload, organise and manage photographs and videos shown in the website gallery.",
    href: "/admin/website/gallery",
    icon: GalleryHorizontalEnd,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#E9F8F2] text-[#28755D]",
  },
  {
    title: "Contact Page",
    description:
      "Change the shared phone, WhatsApp, email, address, map, social links and centre timings.",
    href: "/admin/website/contact",
    icon: ContactRound,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#F3ECFF] text-[#6E45A8]",
  },
  {
    title: "Blog",
    description:
      "Create, edit and publish parent articles with cover photos, structured content and Google and AI search details.",
    href: "/admin/website/blog",
    icon: Newspaper,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#FFF0F3] text-[#A94159]",
  },
  {
    title: "Ad Campaign Pack",
    description:
      "Use the prepared Google Search and Meta lead campaign structure, ad copy, keywords, sitelinks and launch checklist.",
    href: "/admin/website/campaigns",
    icon: Megaphone,
    status: "Prepared",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#FFF3D5] text-[#8A6100]",
  },
  {
    title: "SEO & Tracking",
    description:
      "Manage Google, Meta and search-engine verification IDs with consent-protected website tracking.",
    href: "/admin/website/seo",
    icon: SearchCheck,
    status: "Available",
    statusStyle: "bg-green-50 text-green-700 border-green-200",
    accentStyle: "bg-[#EEF2FF] text-[#4C5DA8]",
  },
] as const;

const websiteProgress = [
  {
    label: "Secure homepage media upload",
    completed: true,
  },
  {
    label: "Premium homepage content and layout",
    completed: true,
  },
  {
    label: "Enquiry form connected to CentreOS",
    completed: true,
  },
  {
    label: "Visit and conversion analytics",
    completed: true,
  },
  {
    label: "Gallery event albums and reels",
    completed: true,
  },
  {
    label: "About, programmes, daycare and contact managers",
    completed: true,
  },
  {
    label: "Editable teacher profiles and homepage team preview",
    completed: true,
  },
  {
    label: "Editable blog publishing",
    completed: true,
  },
  {
    label: "Tracking IDs, SEO and launch controls",
    completed: true,
  },
  {
    label: "Yearly admissions and page-text manager",
    completed: true,
  },
] as const;

export default async function AdminWebsitePage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const completedItems = websiteProgress.filter(
    (item) => item.completed,
  ).length;

  const progressPercentage = Math.round(
    (completedItems / websiteProgress.length) * 100,
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <Globe2 aria-hidden="true" size={23} />
                </span>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B] sm:text-sm">
                  Website Control Centre
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Manage your website from one place
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                Update the admission year, important wording, photographs,
                gallery, contact details, SEO and advertising connections
                without opening website folders or editing code.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/website/content"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD65F]"
              >
                Yearly Admissions Update
                <FilePenLine aria-hidden="true" size={17} />
              </Link>

              <Link
                href="/admin/website/analytics"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
              >
                Website Analytics
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
          <div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                Website sections
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
                Select the page you want to manage
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
                Each section will open only the photographs and media used on
                that page, keeping the panel simple on both phone and desktop.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {websiteSections.map((section) => {
                const Icon = section.icon;

                return (
                  <Link
                    key={section.title}
                    href={section.href}
                    className="group relative overflow-hidden rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] transition duration-200 hover:-translate-y-1 hover:border-[#D6C7DE] hover:shadow-[0_20px_52px_rgba(45,23,54,0.10)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/15 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${section.accentStyle}`}
                      >
                        <Icon aria-hidden="true" size={22} />
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${section.statusStyle}`}
                      >
                        {section.status}
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-black tracking-[-0.025em] text-[#2D1736]">
                      {section.title}
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-6 text-[#7A6F7E]">
                      {section.description}
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-sm font-black text-[#5B2A86]">
                      Open section
                      <ArrowRight
                        aria-hidden="true"
                        size={16}
                        className="transition group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
                  <Settings2 aria-hidden="true" size={21} />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                    Setup progress
                  </p>

                  <h2 className="text-lg font-black text-[#2D1736]">
                    Website CMS
                  </h2>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-black tracking-[-0.04em] text-[#2D1736]">
                      {progressPercentage}%
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#847987]">
                      Website foundation completed
                    </p>
                  </div>

                  <p className="text-sm font-black text-[#5B2A86]">
                    {completedItems}/{websiteProgress.length}
                  </p>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#EFE9F2]">
                  <div
                    className="h-full rounded-full bg-[#5B2A86]"
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {websiteProgress.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl bg-[#FAF8FC] px-4 py-3"
                  >
                    <span
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
                        item.completed
                          ? "bg-green-100 text-green-700"
                          : "bg-[#EEE8F1] text-[#928697]",
                      ].join(" ")}
                    >
                      {item.completed ? "✓" : "•"}
                    </span>

                    <p className="text-sm font-bold text-[#625768]">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[26px] border border-[#E4D4EA] bg-[#F7F0FA] p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                Current status
              </p>

              <h2 className="mt-2 text-lg font-black text-[#2D1736]">
                Enquiries, analytics, gallery and tracking are connected
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-[#746878]">
                Website visits and submitted enquiries flow into CentreOS.
                Team profiles, gallery albums, Parent Stories, Google and Meta
                IDs, consent controls and search verification can now be
                managed safely.
              </p>

              <Link
                href="/admin/website/seo"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white transition hover:bg-[#4B206F]"
              >
                Manage SEO & Tracking
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </section>
          </aside>
        </section>
      </div>
    </AdminLayout>
  );
}
