import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, BarChart3, BrainCircuit, FileStack, Link2, Search, Send, ShieldCheck, Target } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import MarketingPageFrame from "@/components/admin/marketing/MarketingPageFrame";
import GrowthRecommendationManager from "@/components/admin/growth/GrowthRecommendationManager";
import { getAdminSession } from "@/lib/admin/auth";
import { buildGrowthSnapshot } from "@/lib/growth/analysis";
import { buildMarketingControlData } from "@/lib/growth/marketingControl";

export const dynamic = "force-dynamic";

export default async function MarketingControlCentrePage() {
  if (!(await getAdminSession())) redirect("/admin/login");

  let data: any = null;
  let google: any = null;
  let meta: any = null;
  let organic: any = null;

  try {
    const results = await Promise.all([
      buildGrowthSnapshot(30).catch(() => null),
      buildMarketingControlData("GOOGLE").catch(() => null),
      buildMarketingControlData("META").catch(() => null),
      buildMarketingControlData("ORGANIC").catch(() => null),
    ]);
    data = results[0];
    google = results[1];
    meta = results[2];
    organic = results[3];
  } catch (err) {
    console.error("Marketing Control fetch error:", err);
  }

  const admissionRevenue =
    Number(google?.totals?.revenue ?? 0) +
    Number(meta?.totals?.revenue ?? 0) +
    Number(organic?.totals?.revenue ?? 0);

  const cards = [
    [
      "Google Ads",
      "/admin/marketing/google-ads",
      `${data?.ads?.google?.leads ?? 0} attributed leads`,
      Target,
    ],
    [
      "Meta Ads",
      "/admin/marketing/meta-ads",
      `${data?.ads?.meta?.leads ?? 0} attributed leads`,
      BarChart3,
    ],
    [
      "Organic SEO",
      "/admin/marketing/organic-seo",
      `${data?.content?.organicLeads ?? 0} organic leads`,
      Search,
    ],
    [
      "Landing Pages",
      "/admin/marketing/landing-pages",
      `${data?.breakdowns?.landingPerformance?.length ?? 0} measured pages`,
      FileStack,
    ],
    [
      "Conversion Centre",
      "/admin/marketing/conversions",
      `${data?.metrics?.admissions ?? 0} admissions in the funnel`,
      Send,
    ],
    ["Campaign URL Builder", "/admin/marketing/campaign-urls", "Purpose-safe ad and referral URLs", Link2],
    ["Website Analytics", "/admin/website/analytics", `${data?.metrics?.pageViews ?? 0} measured page views`, Activity],
    ["AI Recommendations", "/admin/growth", `${data?.findings?.length ?? 0} evidence-based findings`, BrainCircuit],
    ["Internal Traffic", "/admin/settings/integrations", "Owner-managed device exclusions", ShieldCheck],
  ] as const;
  return (
    <AdminLayout>
      <MarketingPageFrame
        current="/admin/marketing"
        eyebrow="Marketing & advertising"
        title="Marketing Control Centre"
        description="One evidence layer for organic discovery, Google Ads, Meta Ads, landing pages and admission conversion. CentreOS can recommend and preview; only the Owner can approve, apply or record a rollback."
      >
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-900">
          Admission marketing only: Careers, recruitment, internal devices, test traffic, bots and repeated submissions are excluded from these KPIs and AI recommendations.
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, href, value, Icon]) => (
            <Link
              key={href}
              href={href}
              className="rounded-[24px] border border-[#E7DFEA] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#BFA6CD]"
            >
              <Icon size={20} className="text-[#6A328F]" />
              <h2 className="mt-4 font-black text-[#2D1736]">{label}</h2>
              <p className="mt-2 text-xs font-semibold text-[#817684]">
                {value}
              </p>
            </Link>
          ))}
        </section>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Visitors", data?.metrics?.genuineVisitors ?? 0],
            ["Leads", data?.metrics?.leads ?? 0],
            ["Visits", data?.metrics?.visits ?? 0],
            ["Admissions", data?.metrics?.admissions ?? 0],
            ["Calls", data?.metrics?.callClicks ?? 0],
            ["WhatsApp clicks", data?.metrics?.whatsappClicks ?? 0],
            ["Lead to visit", `${data?.metrics?.leadToVisit ?? 0}%`],
            ["Admission revenue", `₹${Math.round(admissionRevenue).toLocaleString("en-IN")}`],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-[#E7DFEA] bg-white p-4"
            >
              <p className="text-2xl font-black text-[#2D1736]">{value}</p>
              <p className="text-xs font-bold text-[#817684]">
                {label} / last 30 days
              </p>
            </article>
          ))}
        </section>
        <GrowthRecommendationManager />
      </MarketingPageFrame>
    </AdminLayout>
  );
}
