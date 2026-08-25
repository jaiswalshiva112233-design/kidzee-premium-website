"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  GraduationCap,
  MessageSquareText,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

type MonthlyTrend = {
  month: string;
  enquiries: number;
  admissions: number;
  revenue: number;
  expenses: number;
};

type DistributionItem = {
  label: string;
  value: number;
};

type DashboardAnalyticsProps = {
  monthlyTrend: MonthlyTrend[];
  programmeDistribution: DistributionItem[];
  enquirySources: DistributionItem[];
};

type ViewType = "programmes" | "sources" | "trend";

const colours = [
  "#5B2A86",
  "#F6C84B",
  "#28755D",
  "#1769AA",
  "#A65325",
  "#A94159",
];

function createGradient(items: DistributionItem[]) {
  const total = items.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  if (total === 0) {
    return "conic-gradient(#EEE8F1 0deg 360deg)";
  }

  let position = 0;

  const parts = items.map((item, index) => {
    const size = (item.value / total) * 360;
    const start = position;
    const end = position + size;

    position = end;

    return `${colours[index % colours.length]} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${parts.join(", ")})`;
}

export default function DashboardAnalytics({
  monthlyTrend,
  programmeDistribution,
  enquirySources,
}: DashboardAnalyticsProps) {
  const [view, setView] =
    useState<ViewType>("programmes");

  const items =
    view === "sources"
      ? enquirySources
      : programmeDistribution;

  const total = items.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const gradient = useMemo(
    () => createGradient(items),
    [items],
  );

  const latestMonth =
    monthlyTrend[monthlyTrend.length - 1] ?? null;

  const maxTrendValue = Math.max(
    ...monthlyTrend.map((item) =>
      Math.max(item.enquiries, item.admissions),
    ),
    1,
  );

  const href =
    view === "programmes"
      ? "/admin/students"
      : "/admin/enquiries";

  return (
    <section className="overflow-hidden rounded-[26px] border border-[#E9E2ED] bg-white shadow-[0_14px_38px_rgba(45,23,54,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#EEE8F1] bg-[#FAF8FC] p-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7A459C]">
            Quick insight
          </p>

          <h2 className="mt-1 text-lg font-black text-[#2D1736]">
            Centre overview
          </h2>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
          <BarChart3
            aria-hidden="true"
            size={19}
          />
        </span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          <ViewButton
            active={view === "programmes"}
            label="Students"
            icon={GraduationCap}
            onClick={() =>
              setView("programmes")
            }
          />

          <ViewButton
            active={view === "sources"}
            label="Sources"
            icon={MessageSquareText}
            onClick={() => setView("sources")}
          />

          <ViewButton
            active={view === "trend"}
            label="Trend"
            icon={TrendingUp}
            onClick={() => setView("trend")}
          />
        </div>

        {view !== "trend" ? (
          <div className="mt-5">
            <div className="flex items-center gap-5">
              <div
                className="relative h-32 w-32 shrink-0 rounded-full"
                style={{
                  background: gradient,
                }}
              >
                <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white">
                  <p className="text-2xl font-black text-[#2D1736]">
                    {total}
                  </p>

                  <p className="text-[8px] font-black uppercase tracking-[0.08em] text-[#8B808F]">
                    Total
                  </p>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-2.5">
                {items.length === 0 ? (
                  <p className="text-xs font-bold text-[#817684]">
                    No data yet.
                  </p>
                ) : (
                  items
                    .slice(0, 4)
                    .map((item, index) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              colours[
                                index %
                                  colours.length
                              ],
                          }}
                        />

                        <p className="min-w-0 flex-1 truncate text-[11px] font-bold text-[#625768]">
                          {item.label}
                        </p>

                        <p className="text-xs font-black text-[#2D1736]">
                          {item.value}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>

            <Link
              href={href}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#E2D8E6] bg-white text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
            >
              View Details
              <ArrowUpRight
                aria-hidden="true"
                size={14}
              />
            </Link>
          </div>
        ) : (
          <div className="mt-5">
            <div className="grid grid-cols-2 gap-2">
              <MiniValue
                label="Enquiries"
                value={
                  latestMonth?.enquiries.toString() ??
                  "0"
                }
              />

              <MiniValue
                label="Admissions"
                value={
                  latestMonth?.admissions.toString() ??
                  "0"
                }
              />
            </div>

            <div className="mt-4 flex h-32 items-end justify-between gap-2 rounded-2xl bg-[#FAF8FC] px-3 pb-3 pt-4">
              {monthlyTrend.map((item) => {
                const enquiryHeight = Math.max(
                  (item.enquiries /
                    maxTrendValue) *
                    80,
                  item.enquiries > 0 ? 6 : 2,
                );

                const admissionHeight = Math.max(
                  (item.admissions /
                    maxTrendValue) *
                    80,
                  item.admissions > 0 ? 6 : 2,
                );

                return (
                  <div
                    key={item.month}
                    className="flex h-full flex-1 flex-col justify-end"
                  >
                    <div className="flex flex-1 items-end justify-center gap-1">
                      <div
                        className="w-2 rounded-t bg-[#5B2A86]"
                        style={{
                          height: enquiryHeight,
                        }}
                        title={`${item.enquiries} enquiries`}
                      />

                      <div
                        className="w-2 rounded-t bg-[#28755D]"
                        style={{
                          height: admissionHeight,
                        }}
                        title={`${item.admissions} admissions`}
                      />
                    </div>

                    <p className="mt-1 text-center text-[8px] font-black text-[#817684]">
                      {item.month}
                    </p>
                  </div>
                );
              })}
            </div>

            <Link
              href="/admin/enquiries"
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#E2D8E6] bg-white text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
            >
              Open Enquiries
              <ArrowUpRight
                aria-hidden="true"
                size={14}
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

type ViewButtonProps = {
  active: boolean;
  label: string;
  icon: typeof GraduationCap;
  onClick: () => void;
};

function ViewButton({
  active,
  label,
  icon: Icon,
  onClick,
}: ViewButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[10px] font-black transition",
        active
          ? "bg-[#5B2A86] text-white"
          : "border border-[#E4DAE8] bg-white text-[#6F6373] hover:bg-[#F3EAF8]",
      ].join(" ")}
    >
      <Icon aria-hidden="true" size={13} />
      {label}
    </button>
  );
}

type MiniValueProps = {
  label: string;
  value: string;
};

function MiniValue({
  label,
  value,
}: MiniValueProps) {
  return (
    <article className="rounded-xl bg-[#FAF8FC] p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-[#8B808F]">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-[#2D1736]">
        {value}
      </p>
    </article>
  );
}