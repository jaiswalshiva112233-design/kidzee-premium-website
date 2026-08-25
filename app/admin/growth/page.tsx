import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Gauge,
  UserCheck,
  Users,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import AskGrowthAi from "@/components/admin/growth/AskGrowthAi";
import GrowthRecommendationManager from "@/components/admin/growth/GrowthRecommendationManager";
import GrowthControlCentre from "@/components/admin/growth/GrowthControlCentre";
import LandingPageManager from "@/components/admin/growth/LandingPageManager";
import GrowthAnalysisActions from "@/components/admin/growth/GrowthAnalysisActions";
import { getAdminSession } from "@/lib/admin/auth";
import { buildGrowthSnapshot } from "@/lib/growth/analysis";

export const dynamic = "force-dynamic";

export default async function GrowthPage() {
  if (!(await getAdminSession())) redirect("/admin/login");

  const snapshot = await buildGrowthSnapshot(30);
  const metrics = snapshot.metrics;
  const cards = [
    ["Genuine visitors", metrics.genuineVisitors, Users],
    ["Leads", metrics.leads, UserCheck],
    ["Qualified", metrics.qualified, UserCheck],
    ["Visits", metrics.visits, ArrowRight],
    ["Admissions", metrics.admissions, BarChart3],
    ["Website → Lead", `${metrics.websiteToLead}%`, BarChart3],
    ["Lead → Visit", `${metrics.leadToVisit}%`, BarChart3],
    ["Visit → Admission", `${metrics.visitToAdmission}%`, BarChart3],
  ] as const;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-[30px] bg-[#2D1736] px-6 py-8 text-white">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
              <BrainCircuit size={27} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B]">
                Morning Growth Brief
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                AI Growth Analyst
              </h1>
              <p className="mt-2 text-sm font-semibold text-white/70">
                A 30-day view of genuine visitors → enquiries → visits → admissions.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, Icon]) => (
            <article
              key={label}
              className="rounded-[22px] border border-[#E7DFEA] bg-white p-4 shadow-sm"
            >
              <Icon size={18} className="text-[#6A328F]" />
              <p className="mt-4 text-2xl font-black text-[#2D1736]">{value}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-[#827686]">
                {label}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-[26px] border border-[#E7DFEA] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#6A328F]">
            Highest priority
          </p>
          <div className="mt-4 space-y-4">
            {snapshot.findings.map((finding) => (
              <article key={finding.finding} className="rounded-2xl bg-[#FAF8FB] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EDE2F2] px-3 py-1 text-[10px] font-black text-[#5B2A86]">
                    {finding.type}
                  </span>
                  <span className="text-[10px] font-black text-[#776B7A]">
                    Confidence: {finding.confidence} · Data: {finding.dataSufficiency} · Risk: {finding.risk}
                  </span>
                </div>
                <h2 className="mt-3 text-base font-black text-[#2D1736]">
                  {finding.finding}
                </h2>
                <div className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-[#665A69] lg:grid-cols-2">
                  <p><strong>Evidence:</strong> {finding.evidence}</p>
                  <p><strong>Why it matters:</strong> {finding.whyItMatters}</p>
                  <p><strong>Exact action:</strong> {finding.action}</p>
                  <p><strong>Expected goal:</strong> {finding.expectedGoal}</p>
                </div>
                <p className="mt-3 text-xs font-black text-[#5B2A86]">
                  Can AI apply it? {finding.canAiApply}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[24px] border border-[#E7DFEA] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Gauge size={20} className="text-[#6A328F]" />
              <h2 className="font-black text-[#2D1736]">Real-user performance</h2>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {snapshot.performance.map((metric) => (
                <div key={metric.name} className="rounded-2xl bg-[#FAF8FB] p-3 text-center">
                  <p className="text-xs font-black text-[#6A328F]">{metric.name}</p>
                  <p className="mt-2 text-lg font-black text-[#2D1736]">
                    {metric.p75 == null ? "—" : metric.p75}
                  </p>
                  <p className="mt-1 text-[10px] font-bold text-[#817584]">{metric.status}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[24px] border border-[#E7DFEA] bg-white p-5 shadow-sm">
            <h2 className="font-black text-[#2D1736]">Pages and lead sources</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#827686]">Top pages</p>
                <div className="mt-2 space-y-2">
                  {snapshot.breakdowns.pages.length > 0 ? snapshot.breakdowns.pages.slice(0, 4).map((item) => (
                    <p key={item.label} className="flex justify-between gap-3 text-sm font-bold text-[#574B5B]">
                      <span className="truncate">{item.label}</span><span>{item.count}</span>
                    </p>
                  )) : <p className="text-sm font-semibold text-[#817584]">No genuine page data yet.</p>}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#827686]">Lead sources</p>
                <div className="mt-2 space-y-2">
                  {snapshot.breakdowns.sources.length > 0 ? snapshot.breakdowns.sources.slice(0, 4).map((item) => (
                    <p key={item.label} className="flex justify-between gap-3 text-sm font-bold capitalize text-[#574B5B]">
                      <span className="truncate">{item.label}</span><span>{item.count}</span>
                    </p>
                  )) : <p className="text-sm font-semibold text-[#817584]">No genuine lead source data yet.</p>}
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <p className="rounded-2xl bg-white p-4 text-sm font-bold text-[#665A69]">
            Google Ads: {snapshot.ads.google.leads} attributed leads · {snapshot.ads.google.delivery.reduce((sum, item) => sum + item._count, 0)} conversion delivery records
          </p>
          <p className="rounded-2xl bg-white p-4 text-sm font-bold text-[#665A69]">
            Meta Ads: {snapshot.ads.meta.leads} attributed leads · {snapshot.ads.meta.delivery.reduce((sum, item) => sum + item._count, 0)} conversion delivery records
          </p>
        </section>

        <GrowthControlCentre />
        <GrowthAnalysisActions />
        <LandingPageManager />
        <AskGrowthAi />
        <GrowthRecommendationManager />
      </div>
    </AdminLayout>
  );
}
