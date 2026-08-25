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
  const [data, google, meta, organic] = await Promise.all([
    buildGrowthSnapshot(30),
    buildMarketingControlData("GOOGLE"),
    buildMarketingControlData("META"),
    buildMarketingControlData("ORGANIC"),
  ]);
  const admissionRevenue = google.totals.revenue + meta.totals.revenue + organic.totals.revenue;
  const cards = [
    [
      "Google Ads",
      "/admin/marketing/google-ads",
      `${data.ads.google.leads} attributed leads`,
      Target,
    ],
    [
      "Meta Ads",
      "/admin/marketing/meta-ads",
      `${data.ads.meta.leads} attributed leads`,
      BarChart3,
    ],
    [
      "Organic SEO",
      "/admin/marketing/organic-seo",
      `${data.content.organicLeads} organic leads`,
      Search,
    ],
    [
      "Landing Pages",
      "/admin/marketing/landing-pages",
      `${data.breakdowns.landingPerformance.length} measured pages`,
      FileStack,
    ],
    [
      "Conversion Centre",
      "/admin/marketing/conversions",
      `${data.metrics.admissions} admissions in the funnel`,
      Send,
    ],
    ["Campaign URL Builder", "/admin/marketing/campaign-urls", "Purpose-safe ad and referral URLs", Link2],
    ["Website Analytics", "/admin/website/analytics", `${data.metrics.pageViews} measured page views`, Activity],
    ["AI Recommendations", "/admin/growth", `${data.findings.length} evidence-based findings`, BrainCircuit],
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
            ["Visitors", data.metrics.genuineVisitors],
            ["Leads", data.metrics.leads],
            ["Visits", data.metrics.visits],
            ["Admissions", data.metrics.admissions],
            ["Calls", data.metrics.callClicks],
            ["WhatsApp clicks", data.metrics.whatsappClicks],
            ["Lead to visit", `${data.metrics.leadToVisit}%`],
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
