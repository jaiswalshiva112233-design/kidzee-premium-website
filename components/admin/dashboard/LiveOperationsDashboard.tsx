"use client";

import { Activity, AlertTriangle, IndianRupee, RefreshCw, TrendingUp, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type DashboardData = {
  generatedAt: string;
  role: "OWNER" | "CENTRE_HEAD";
  operations: Record<string, number>;
  attendance: { students: Record<string, number>; staff: Record<string, number> };
  birthdays: Array<{ id: string; name: string; days: number }>;
  funnel: Array<{ status: string; count: number }>;
  campaigns: Array<{ name: string; channel: string; leads: number; admissions: number }>;
  organicGrowth: number;
  marketingJobs: Array<{ provider: string; status: string; _count: number }>;
  whatsappJobs: Array<{ status: string; _count: number }>;
  paidMarketing: null | Record<string, number>;
  finance: null | Record<string, number>;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function label(value: string) {
  return value.replaceAll(/([A-Z])/g, " $1").replaceAll("_", " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function LiveOperationsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(true);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const result = (await response.json()) as DashboardData & { message?: string };
      if (!response.ok) throw new Error(result.message || "Unable to refresh dashboard.");
      setData(result);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Fetch the first live snapshot after the client dashboard mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  if (!data) {
    return <section className="mb-7 rounded-[28px] border border-[#E6DCEC] bg-white p-6 text-sm font-bold text-[#625768]">{error || "Loading live centre dashboard…"}</section>;
  }

  const operationalCards = [
    ["Enquiries today", data.operations.enquiriesToday],
    ["Follow-ups due", data.operations.pendingFollowUps],
    ["Visits booked", data.operations.visitsBooked],
    ["Visits completed", data.operations.visitsCompleted],
    ["Trials", data.operations.trials],
    ["Admissions today", data.operations.admissionsToday],
    ["Pending fees", data.operations.pendingFees],
    ["Pending documents", data.operations.pendingDocuments],
    ["Daycare today", data.operations.daycareToday],
    ["Staff leave requests", data.operations.pendingLeaveRequests],
    ["AI recommendations", data.operations.growthRecommendations],
  ] as const;
  const paidMarketing = data.paidMarketing;

  return (
    <section className="mb-8 rounded-[30px] border border-[#E1D5E8] bg-white p-5 shadow-[0_20px_55px_rgba(53,25,70,0.08)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6A328F]">Live operations</p>
          <h2 className="mt-1 text-2xl font-black text-[#2D1736]">{data.role === "OWNER" ? "Owner command centre" : "Centre Head daily workspace"}</h2>
          <p className="mt-1 text-xs font-semibold text-[#817684]">Updates automatically every minute · {new Date(data.generatedAt).toLocaleTimeString("en-IN")}</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCCFE4] px-3 text-xs font-black text-[#5B2A86] disabled:opacity-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
      </div>
      {error ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">{error}</div> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {operationalCards.map(([name, value]) => (
          <article key={name} className="rounded-2xl border border-[#E9E2ED] bg-[#FBF9FC] p-4"><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8B808F]">{name}</p><p className="mt-1 text-2xl font-black text-[#2D1736]">{value ?? 0}</p></article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl bg-[#31153B] p-5 text-white">
          <h3 className="flex items-center gap-2 text-sm font-black"><UsersRound size={17} /> Lead sources today</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            {["organic", "google", "meta", "walkIn", "calls", "whatsapp"].map((key) => <div key={key}><p className="font-semibold text-white/65">{label(key)}</p><p className="text-lg font-black">{data.operations[key] ?? 0}</p></div>)}
          </div>
        </article>

        <article className="rounded-2xl border border-[#E9E2ED] p-5">
          <h3 className="flex items-center gap-2 text-sm font-black text-[#2D1736]"><Activity size={17} /> Today&apos;s attendance</h3>
          <div className="mt-4 grid grid-cols-2 gap-4"><div><p className="text-xs font-bold text-[#817684]">Students present</p><p className="text-2xl font-black text-[#2D1736]">{data.attendance.students.PRESENT ?? 0}</p></div><div><p className="text-xs font-bold text-[#817684]">Teachers present</p><p className="text-2xl font-black text-[#2D1736]">{data.attendance.staff.PRESENT ?? 0}</p></div></div>
          {data.birthdays.length ? <div className="mt-4 rounded-xl bg-[#FFF7D9] p-3 text-xs font-bold text-[#715600]">Birthdays in 7 days: {data.birthdays.map((birthday) => `${birthday.name} (${birthday.days === 0 ? "today" : `${birthday.days}d`})`).join(", ")}</div> : null}
        </article>

        <article className="rounded-2xl border border-[#E9E2ED] p-5">
          <h3 className="flex items-center gap-2 text-sm font-black text-[#2D1736]"><TrendingUp size={17} /> Funnel & campaigns</h3>
          <p className="mt-3 text-xs font-bold text-[#817684]">Organic growth: <span className={data.organicGrowth >= 0 ? "text-green-700" : "text-red-700"}>{data.organicGrowth}%</span></p>
          <div className="mt-3 space-y-2">{data.campaigns.length ? data.campaigns.map((campaign) => <div key={campaign.name} className="flex justify-between gap-2 text-xs"><span className="truncate font-bold text-[#625768]">{campaign.name}</span><span className="font-black text-[#5B2A86]">{campaign.leads} leads · {campaign.admissions} admissions</span></div>) : <p className="text-xs font-semibold text-[#817684]">Campaign data will appear with attributed leads.</p>}</div>
        </article>
      </div>

      {data.finance ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[["Revenue today", money(data.finance.revenueToday)], ["Revenue this month", money(data.finance.revenueMonth)], ["Expenses today", money(data.finance.expensesToday)], ["Profit estimate", money(data.finance.profitEstimate)]].map(([name, value]) => <article key={name} className="rounded-2xl border border-green-100 bg-green-50 p-4"><p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-green-800"><IndianRupee size={12} /> {name}</p><p className="mt-1 text-xl font-black text-green-950">{value}</p></article>)}
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#F7F3F9] p-4 text-xs font-bold text-[#625768]"><AlertTriangle size={16} /> Finance and ROI remain owner-only. Centre Head receives operational alerts only.</div>
      )}

      {paidMarketing ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {(["google", "meta"] as const).map((provider) => (
            <article key={provider} className="rounded-2xl border border-[#E9E2ED] bg-[#FBF9FC] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[#5B2A86]">{provider === "google" ? "Google Ads" : "Meta Ads"} this month</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div><p className="font-bold text-[#817684]">Spend</p><p className="mt-1 font-black text-[#2D1736]">{money(paidMarketing[`${provider}Spend`])}</p></div>
                <div><p className="font-bold text-[#817684]">Revenue</p><p className="mt-1 font-black text-[#2D1736]">{money(paidMarketing[`${provider}Revenue`])}</p></div>
                <div><p className="font-bold text-[#817684]">Admissions</p><p className="mt-1 font-black text-[#2D1736]">{paidMarketing[`${provider}Admissions`] ?? 0}</p></div>
                <div><p className="font-bold text-[#817684]">Estimated ROI</p><p className="mt-1 font-black text-[#2D1736]">{paidMarketing[`${provider}Roi`] ?? 0}%</p></div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#E9E2ED] p-4"><h3 className="text-sm font-black text-[#2D1736]">Google & Meta conversion delivery</h3><div className="mt-3 flex flex-wrap gap-2">{data.marketingJobs.length ? data.marketingJobs.map((job) => <span key={`${job.provider}-${job.status}`} className="rounded-full bg-[#F4ECF8] px-3 py-1 text-xs font-bold text-[#5B2A86]">{label(job.provider)} · {label(job.status)}: {job._count}</span>) : <span className="text-xs font-semibold text-[#817684]">No conversion events are queued.</span>}</div></article>
        <article className="rounded-2xl border border-[#E9E2ED] p-4"><h3 className="text-sm font-black text-[#2D1736]">WhatsApp automation delivery</h3><div className="mt-3 flex flex-wrap gap-2">{data.whatsappJobs.length ? data.whatsappJobs.map((job) => <span key={job.status} className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">{label(job.status)}: {job._count}</span>) : <span className="text-xs font-semibold text-[#817684]">No automated messages are queued.</span>}</div></article>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E9E2ED] p-4">
        <h3 className="text-sm font-black text-[#2D1736]">Conversion funnel</h3>
        <div className="mt-3 flex min-w-max gap-2">{data.funnel.map((item) => <div key={item.status} className="rounded-xl bg-[#F4ECF8] px-3 py-2 text-xs"><span className="font-bold text-[#625768]">{label(item.status)}</span><span className="ml-2 font-black text-[#5B2A86]">{item.count}</span></div>)}</div>
      </div>
    </section>
  );
}
