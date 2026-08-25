import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  CircleDashed,
  ExternalLink,
  ListChecks,
  MapPin,
  Megaphone,
  Search,
  Share2,
  Tag,
  Target,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { hasAdminPermission, isAdminAuthenticated } from "@/lib/admin/auth";
import { getWebsiteTrackingSettings } from "@/lib/sanity/websiteSettings";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const googleAdGroups = [
  {
    name: "Preschool Dwarka",
    keywords: [
      "preschool in dwarka",
      "best preschool in dwarka",
      "preschool near me",
      "play school in dwarka",
      "pre nursery school dwarka",
    ],
  },
  {
    name: "Kidzee Brand",
    keywords: [
      "kidzee dwarka",
      "kidzee sector 12 dwarka",
      "kidzee preschool near me",
      "kidzee admission dwarka",
    ],
  },
  {
    name: "Nursery Admissions",
    keywords: [
      "nursery admission dwarka",
      "playgroup admission dwarka",
      "preschool admission 2026 27",
      "junior kg admission dwarka",
    ],
  },
  {
    name: "Daycare Dwarka",
    keywords: [
      "daycare in dwarka",
      "day care near me",
      "daycare sector 12 dwarka",
      "preschool with daycare dwarka",
    ],
  },
] as const;

const negativeKeywords = [
  "job",
  "jobs",
  "teacher vacancy",
  "salary",
  "franchise",
  "franchise cost",
  "training",
  "course",
  "online",
  "worksheet",
  "download",
  "free",
  "logo",
  "head office",
] as const;

const googleHeadlines = [
  "Kidzee Sector 12 Dwarka",
  "Preschool Admissions Open",
  "Book a School Visit",
  "Playgroup to Senior KG",
  "Daycare in Sector 12",
  "Three-Day Preschool Trial",
  "Small Classes, More Care",
  "Fresh Vegetarian Meals",
  "Learning Through Play",
  "Trusted Kidzee Preschool",
  "Near Dwarka Sector 12 Metro",
  "Speak With Our Centre Team",
] as const;

const googleDescriptions = [
  "Meet our teachers, explore the centre and find the right programme for your child.",
  "Playgroup, Nursery, Junior KG, Senior KG and weekday daycare in Sector 12, Dwarka.",
  "A warm first-school experience with purposeful play, caring teachers and parent support.",
  "Submit an enquiry or book a school visit. Our centre team will contact you personally.",
] as const;

const sitelinks = [
  ["Book a School Visit", "/admissions#admission-enquiry"],
  ["Preschool Programmes", "/programmes"],
  ["Daycare", "/daycare"],
  ["Gallery", "/gallery"],
  ["Meet the Team", "/about#team"],
  ["Contact & Directions", "/contact"],
] as const;

const metaAdSets = [
  {
    title: "Website enquiry",
    destination: "/admissions#admission-enquiry",
    goal: "Lead event",
    creative: "Real centre walkthrough or classroom reel",
  },
  {
    title: "Instant form",
    destination: "Meta higher-intent form",
    goal: "Completed lead",
    creative: "Teacher welcome video or parent review",
  },
  {
    title: "Retargeting",
    destination: "/admissions",
    goal: "Lead event",
    creative: "School-visit invitation using real centre photos",
  },
] as const;

export default async function CampaignLaunchPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login?next=%2Fadmin%2Fwebsite%2Fcampaigns");
  }

  if (!(await hasAdminPermission("website.manage"))) {
    redirect("/admin");
  }

  const tracking = await getWebsiteTrackingSettings();
  const gaReady = Boolean(
    tracking.analyticsEnabled &&
      (tracking.googleAnalyticsId || tracking.googleTagManagerId),
  );
  const googleAdsReady = Boolean(
    tracking.advertisingEnabled &&
      tracking.googleAdsId &&
      tracking.googleAdsConversionLabel,
  );
  const searchConsoleReady = Boolean(
    tracking.googleSearchConsoleVerification,
  );
  const metaPixelReady = Boolean(
    tracking.metaPixelEnabled && tracking.metaPixelId,
  );
  const metaServerReady = Boolean(
    process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim(),
  );

  return (
    <AdminLayout>
      <div className="space-y-7">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_24px_70px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                <Megaphone aria-hidden="true" size={27} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B]">
                  Admission growth plan
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  Google & Meta Campaign Pack
                </h1>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/70">
                  Campaign structure, search terms, ad copy, sitelinks and tracking gates prepared for Kidzee Sector 12, Dwarka. Add real photos and videos only at the final creative step.
                </p>
              </div>
            </div>

            <Link href="/admin/website/seo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] hover:bg-[#FFD65F]">
              Open SEO & Tracking
              <ExternalLink aria-hidden="true" size={17} />
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <LaunchStatus title="GA4" ready={gaReady} />
          <LaunchStatus title="Google Ads conversion" ready={googleAdsReady} />
          <LaunchStatus title="Search Console" ready={searchConsoleReady} />
          <LaunchStatus title="Meta Pixel" ready={metaPixelReady} />
          <LaunchStatus title="Meta server tracking" ready={metaServerReady} />
        </section>

        <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3D5] text-[#8A6100]">
              <Search aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#8A6100]">Google Search</p>
              <h2 className="mt-1 text-2xl font-black text-[#2D1736]">Campaign: Preschool Admissions | Dwarka | 2026-27</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#7D7181]">
                Goal: submitted enquiry forms and qualified phone calls. Location: parents physically present within the centre&apos;s practical travel radius, starting with approximately 5-7 km around Sector 12B, Dwarka.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {googleAdGroups.map((group) => (
              <article key={group.name} className="rounded-2xl border border-[#E9E2ED] bg-[#FAF8FC] p-4">
                <h3 className="font-black text-[#2D1736]">{group.name}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.keywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-[#DDCFE4] bg-white px-3 py-1.5 text-xs font-bold text-[#5B2A86]">&quot;{keyword}&quot;</span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-red-700">Starting negative-keyword list</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-red-800">{negativeKeywords.join(" · ")}</p>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <article className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-7">
            <div className="flex items-center gap-3">
              <Tag aria-hidden="true" size={22} className="text-[#6A328F]" />
              <h2 className="text-xl font-black text-[#2D1736]">Responsive search ad copy</h2>
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">Headlines</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {googleHeadlines.map((headline) => (
                <span key={headline} className="rounded-xl bg-[#F6F1F8] px-3 py-2 text-xs font-bold text-[#4C3E51]">{headline}</span>
              ))}
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">Descriptions</p>
            <div className="mt-3 space-y-2">
              {googleDescriptions.map((description) => (
                <p key={description} className="rounded-xl border border-[#ECE5EF] px-3 py-2.5 text-xs font-semibold leading-5 text-[#6F6373]">{description}</p>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-7">
            <div className="flex items-center gap-3">
              <MapPin aria-hidden="true" size={22} className="text-[#6A328F]" />
              <h2 className="text-xl font-black text-[#2D1736]">Sitelinks and final URLs</h2>
            </div>
            <div className="mt-4 space-y-2">
              {sitelinks.map(([label, path]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-[#ECE5EF] px-3 py-3">
                  <span className="text-sm font-black text-[#2D1736]">{label}</span>
                  <span className="truncate text-xs font-semibold text-[#7A459C]">{site.url}{path}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-[#F7F0FA] p-4">
              <p className="text-xs font-black uppercase tracking-[0.09em] text-[#6A328F]">Google final URL suffix</p>
              <code className="mt-2 block break-all text-xs font-bold leading-5 text-[#4F4254]">utm_source=google&amp;utm_medium=cpc&amp;utm_campaign=preschool_admissions_dwarka_2026_27&amp;utm_content={"{creative}"}&amp;utm_term={"{keyword}"}</code>
            </div>
          </article>
        </section>

        <section className="rounded-[28px] border border-[#DDE7F5] bg-[#F8FBFF] p-5 shadow-[0_14px_40px_rgba(45,23,54,0.04)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7F1FF] text-[#2765A4]">
              <Share2 aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#2765A4]">Meta Leads</p>
              <h2 className="mt-1 text-2xl font-black text-[#2D1736]">Campaign: Local Preschool Enquiries | Dwarka</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#66798D]">
                Use the Leads objective with both a website form and a higher-intent instant form. Begin with broad local delivery controls, Advantage+ placements and real centre creative; compare qualified visits and admissions, not only cheap leads.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {metaAdSets.map((adSet) => (
              <article key={adSet.title} className="rounded-2xl border border-[#DCE8F5] bg-white p-4">
                <h3 className="font-black text-[#2D1736]">{adSet.title}</h3>
                <p className="mt-3 text-xs font-semibold leading-5 text-[#6A7D90]"><strong className="text-[#345B80]">Destination:</strong> {adSet.destination}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#6A7D90]"><strong className="text-[#345B80]">Optimise for:</strong> {adSet.goal}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#6A7D90]"><strong className="text-[#345B80]">Creative:</strong> {adSet.creative}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-[#DCE8F5] bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.09em] text-[#2765A4]">Meta destination URL</p>
            <code className="mt-2 block break-all text-xs font-bold leading-5 text-[#4F6072]">{site.url}/admissions?utm_source=meta&amp;utm_medium=paid_social&amp;utm_campaign=local_preschool_enquiries_dwarka&amp;utm_content={"{{ad.name}}"}#admission-enquiry</code>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-7">
          <div className="flex items-center gap-3">
            <ListChecks aria-hidden="true" size={22} className="text-[#6A328F]" />
            <h2 className="text-xl font-black text-[#2D1736]">Publish only after all launch gates pass</h2>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Real domain opens securely on mobile and desktop",
              "GA4 Realtime receives a consented page view",
              "Google Ads test enquiry records one conversion",
              "Meta Test Events receives one deduplicated Lead",
              "Search Console ownership is verified and sitemap submitted",
              "Website form creates one CentreOS enquiry with correct source",
              "Call and WhatsApp clicks appear in website analytics",
              "Real photos, review video and reels replace remaining placeholders",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#FAF8FC] px-4 py-3">
                <Target aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-[#7A459C]" />
                <p className="text-sm font-bold leading-5 text-[#625768]">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function LaunchStatus({ title, ready }: { title: string; ready: boolean }) {
  return (
    <article className={["rounded-[20px] border p-4", ready ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"].join(" ")}>
      {ready ? <BadgeCheck aria-hidden="true" size={20} className="text-green-700" /> : <CircleDashed aria-hidden="true" size={20} className="text-amber-700" />}
      <p className={["mt-3 text-sm font-black", ready ? "text-green-900" : "text-amber-900"].join(" ")}>{title}</p>
      <p className={["mt-1 text-xs font-bold", ready ? "text-green-700" : "text-amber-700"].join(" ")}>{ready ? "Connected" : "Waiting for account ID"}</p>
    </article>
  );
}
