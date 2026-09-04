import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  IndianRupee,
  MousePointerClick,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import CampaignSnapshotSyncModal from "./CampaignSnapshotSyncModal";

import type { buildMarketingControlData } from "@/lib/growth/marketingControl";

type Data = Awaited<ReturnType<typeof buildMarketingControlData>>;
type ProviderRow = Record<string, unknown>;
type Column = { label: string; names: string[] };

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const number = (amount: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(amount);

function value(row: ProviderRow, names: string[]) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null) return String(row[name]);
  }
  return "-";
}

function ProviderTable({
  title,
  rows,
  primaryNames,
  columns,
}: {
  title: string;
  rows: ProviderRow[];
  primaryNames: string[];
  columns: Column[];
}) {
  return (
    <article className="rounded-[24px] border border-[#E7DFEA] bg-white p-5 shadow-sm">
      <h2 className="font-black text-[#2D1736]">{title}</h2>
      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#E9E2ED] text-[#817684]">
                <th className="pb-3">Name</th>
                {columns.map((column) => (
                  <th key={column.label} className="pb-3">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((row, index) => (
                <tr
                  key={`${value(row, primaryNames)}-${index}`}
                  className="border-b border-[#F0EBF2]"
                >
                  <td className="py-3 font-black text-[#392040]">
                    {value(row, primaryNames)}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.label}
                      className="py-3 font-semibold text-[#6D6170]"
                    >
                      {value(row, column.names)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#FAF8FB] p-4 text-sm font-semibold text-[#817684]">
          No provider-level {title.toLowerCase()} snapshot has been received
          yet. CentreOS will not invent this data.
        </p>
      )}
    </article>
  );
}

const campaignColumns: Column[] = [
  { label: "Status", names: ["status", "effectiveStatus", "state"] },
  { label: "Budget", names: ["budget", "dailyBudget", "lifetimeBudget"] },
  { label: "Clicks", names: ["clicks", "linkClicks"] },
  { label: "CTR", names: ["ctr", "clickThroughRate"] },
  { label: "CPC", names: ["cpc", "costPerClick"] },
  { label: "Conversions", names: ["conversions", "results", "leads"] },
  { label: "Spend", names: ["spend", "cost", "amountSpent"] },
];

const keywordColumns: Column[] = [
  { label: "Match", names: ["matchType", "match"] },
  { label: "Clicks", names: ["clicks"] },
  { label: "CTR", names: ["ctr", "clickThroughRate"] },
  { label: "CPC", names: ["cpc", "costPerClick"] },
  { label: "Conversions", names: ["conversions", "results"] },
];

export default function ChannelDashboard({ data }: { data: Data }) {
  const isOrganic = data.channel === "ORGANIC";
  const cards = isOrganic
    ? ([
        ["Organic leads", number(data.totals.leads), Users],
        ["Qualified leads", number(data.totals.qualified), Target],
        ["Visits completed", number(data.totals.visitsCompleted), Target],
        ["Admissions", number(data.totals.admissions), CheckCircle2],
        ["Admission revenue", money(data.totals.revenue), IndianRupee],
        [
          "Admission rate",
          `${data.totals.leads ? number((data.totals.admissions / data.totals.leads) * 100) : 0}%`,
          BarChart3,
        ],
      ] as const)
    : ([
        ["Budget", money(data.totals.budget), IndianRupee],
        ["Spend", money(data.totals.spend), IndianRupee],
        ["Clicks", number(data.totals.clicks), MousePointerClick],
        ["CTR", `${number(data.totals.ctr)}%`, BarChart3],
        ["CPC", money(data.totals.cpc), IndianRupee],
        ["Genuine leads", number(data.totals.leads), Users],
        ["Qualified leads", number(data.totals.qualified), Target],
        ["Visits completed", number(data.totals.visitsCompleted), Target],
        ["Admissions", number(data.totals.admissions), CheckCircle2],
        ["Admission revenue", money(data.totals.revenue), IndianRupee],
        ["Cost / visit", money(data.totals.costPerVisit), IndianRupee],
        ["Cost / admission", money(data.totals.costPerAdmission), IndianRupee],
        ...(data.channel === "META"
          ? ([["Frequency", number(data.totals.frequency), BarChart3]] as const)
          : []),
      ] as const);

  return (
    <div className="space-y-5">
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 ${
          data.sourceStatus === "CONNECTED"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-3">
          {data.sourceStatus === "CONNECTED" ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertCircle size={19} />
          )}
          <div>
            <p className="text-sm font-black">
              {data.sourceStatus === "CONNECTED"
                ? "Provider evidence connected"
                : "Provider evidence awaiting its first sync"}
            </p>
            <p className="text-xs font-semibold opacity-80">
              {data.latestSnapshotAt
                ? `Latest snapshot ${new Date(data.latestSnapshotAt).toLocaleString("en-IN")}`
                : "CentreOS still shows its own verified lead and admission attribution."}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <CampaignSnapshotSyncModal
            channel={data.channel}
            defaultSpend={data.totals.spend || 13.81}
            defaultClicks={data.totals.clicks || 2}
            defaultBudget={data.totals.budget || 500}
          />
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, amount, Icon]) => (
          <article
            key={label}
            className="rounded-[22px] border border-[#E7DFEA] bg-white p-4 shadow-sm"
          >
            <Icon size={18} className="text-[#6A328F]" />
            <p className="mt-3 text-2xl font-black text-[#2D1736]">{amount}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
              {label}
            </p>
          </article>
        ))}
      </section>

      {!isOrganic ? (
        <section className="grid gap-3 md:grid-cols-3">
          <Metric
            label="Offline sent"
            value={data.conversionDelivery.SUCCEEDED ?? 0}
          />
          <Metric
            label="Retry queue"
            value={(data.conversionDelivery.RETRY ?? 0) + (data.conversionDelivery.PENDING ?? 0)}
          />
          <Metric
            label="Permanent failures"
            value={data.conversionDelivery.DEAD ?? 0}
          />
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <ProviderTable
          title="Campaigns"
          rows={data.providerRows.campaigns}
          primaryNames={["campaignName", "name", "campaign"]}
          columns={campaignColumns}
        />
        {data.channel === "GOOGLE" ? (
          <>
            <ProviderTable
              title="Keywords"
              rows={data.providerRows.keywords}
              primaryNames={["keyword", "text", "name"]}
              columns={keywordColumns}
            />
            <ProviderTable
              title="Search terms"
              rows={data.providerRows.searchTerms}
              primaryNames={["searchTerm", "query", "text"]}
              columns={keywordColumns}
            />
            <ProviderTable
              title="Negative keywords"
              rows={data.providerRows.negativeKeywords}
              primaryNames={["keyword", "text", "name"]}
              columns={[
                { label: "Match", names: ["matchType", "match"] },
                { label: "Campaign", names: ["campaignName", "campaign"] },
                { label: "Status", names: ["status", "state"] },
              ]}
            />
          </>
        ) : null}
        {data.channel === "META" ? (
          <>
            <ProviderTable
              title="Ad sets"
              rows={data.providerRows.adSets}
              primaryNames={["adSetName", "name", "adset"]}
              columns={campaignColumns}
            />
            <ProviderTable
              title="Ads and creative library"
              rows={data.providerRows.ads}
              primaryNames={["adName", "creativeName", "name"]}
              columns={campaignColumns}
            />
            <ProviderTable
              title="Audiences"
              rows={data.providerRows.audiences}
              primaryNames={["audienceName", "name", "audience"]}
              columns={campaignColumns}
            />
            <ProviderTable
              title="Placements"
              rows={data.providerRows.placements}
              primaryNames={["placement", "publisherPlatform", "name"]}
              columns={campaignColumns}
            />
          </>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Ranked
          title="CentreOS campaign attribution"
          rows={data.measuredCampaigns}
        />
        <Ranked
          title={
            isOrganic ? "Organic search terms" : "CentreOS keyword attribution"
          }
          rows={data.measuredKeywords}
        />
      </section>

      <article className="rounded-[24px] border border-[#E7DFEA] bg-white p-5 shadow-sm">
        <h2 className="font-black text-[#2D1736]">Landing-page performance</h2>
        <div className="mt-4 space-y-2">
          {data.landingPerformance.length ? (
            data.landingPerformance.slice(0, 12).map((row) => (
              <div
                key={row.key}
                className="grid gap-2 rounded-2xl bg-[#FAF8FB] p-4 text-xs sm:grid-cols-[1fr_auto_auto_auto]"
              >
                <strong>{row.name}</strong>
                <span>{row.leads} leads</span>
                <span>{row.visits} visits</span>
                <span>{row.qualified} qualified</span>
                <span>
                  {row.admissions} admissions / {row.conversion}%
                </span>
                <span>{money(row.revenue)} revenue</span>
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-[#817684]">
              No attributed landing-page conversions yet.
            </p>
          )}
        </div>
      </article>

      <article className="flex flex-col gap-3 rounded-[24px] border border-[#D7C6E0] bg-[#FAF8FB] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-black text-[#2D1736]">
            Evidence-based AI review
          </h2>
          <p className="mt-1 text-xs font-semibold text-[#817684]">
            Review evidence, preview recommendations and use the Owner approval
            queue. No website or ad change is automatic.
          </p>
        </div>
        <Link
          href="/admin/marketing"
          className="rounded-xl bg-[#5B2A86] px-4 py-3 text-center text-xs font-black text-white"
        >
          Open recommendation queue
        </Link>
      </article>
    </div>
  );
}

function Metric({ label, value: amount }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#E7DFEA] bg-white p-4">
      <p className="text-xl font-black text-[#2D1736]">{amount}</p>
      <p className="text-xs font-bold text-[#817684]">{label}</p>
    </div>
  );
}

function Ranked({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    name: string;
    leads: number;
    qualified?: number;
    admissions?: number;
    visits?: number;
    revenue?: number;
  }>;
}) {
  return (
    <article className="rounded-[24px] border border-[#E7DFEA] bg-white p-5">
      <h2 className="font-black text-[#2D1736]">{title}</h2>
      <div className="mt-4 space-y-2">
        {rows.length ? (
          rows.slice(0, 10).map((row) => (
            <p
              key={row.name}
              className="flex flex-wrap justify-between gap-3 rounded-xl bg-[#FAF8FB] px-4 py-3 text-xs font-bold"
            >
              <span>{row.name}</span>
              <span>
                {row.leads} leads
                {row.qualified == null ? "" : ` / ${row.qualified} qualified`}
                {row.admissions == null
                  ? ""
                  : ` / ${row.admissions} admissions`}
                {row.revenue == null ? "" : ` / ${money(row.revenue)} revenue`}
              </span>
            </p>
          ))
        ) : (
          <p className="text-sm font-semibold text-[#817684]">
            No verified attribution data yet.
          </p>
        )}
      </div>
    </article>
  );
}
