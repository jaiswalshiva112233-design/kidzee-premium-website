import type { $Enums, Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Eye,
  FileText,
  Globe2,
  MessageCircle,
  MousePointerClick,
  Phone,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type WebsiteAnalyticsPageProps = {
  searchParams: Promise<{
    range?: string | string[];
  }>;
};

type AnalyticsEventData = {
  eventType?: string;
  eventName?: string;
  visitorId?: string;
  sessionId?: string;
  pagePath?: string;
  pageTitle?: string;
  targetUrl?: string;
  targetText?: string;
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  hasGoogleClickId?: boolean;
  hasMetaClickId?: boolean;
  deviceType?: string;
  viewportWidth?: number;
  language?: string;
  timeZone?: string;
  anonymous?: boolean;
  trafficClass?: string;
  eventScope?: string;
  leadType?: string;
  isInternal?: boolean;
  isTest?: boolean;
  isBot?: boolean;
};

type PagePerformance = {
  pagePath: string;
  views: number;
  visitors: Set<string>;
  ctaClicks: number;
  callClicks: number;
  whatsappClicks: number;
};

const rangeOptions = [
  {
    value: "7d",
    label: "Last 7 days",
    days: 7,
  },
  {
    value: "30d",
    label: "Last 30 days",
    days: 30,
  },
  {
    value: "90d",
    label: "Last 90 days",
    days: 90,
  },
  {
    value: "all",
    label: "All time",
    days: null,
  },
] as const;

const websiteEnquirySources = [
  "WEBSITE",
  "FORMSPREE",
  "GOOGLE_ADS",
  "META_ADS",
] as const;

const eventLabels: Record<string, string> = {
  PAGE_VIEW: "Page view",
  CTA_CLICK: "Enquiry button",
  PHONE_CLICK: "Call click",
  WHATSAPP_CLICK: "WhatsApp click",
  MAP_CLICK: "Directions click",
  FORM_STARTED: "Form started",
  FORM_SUBMITTED: "Form submitted",
  GALLERY_OPEN: "Gallery opened",
  VIDEO_PLAY: "Video played",
};

const enquirySourceLabels: Record<string, string> = {
  WEBSITE: "Website",
  FORMSPREE: "Older website form",
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readEventData(value: Prisma.JsonValue | null) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {} as AnalyticsEventData;
  }

  return value as AnalyticsEventData;
}

function startOfLocalDay(date: Date) {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);

  return localDate;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPercentage(value: number) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(d);
  } catch {
    return "N/A";
  }
}

function getTrafficSource(data: AnalyticsEventData) {
  if (data.utmSource?.trim()) {
    return data.utmSource.trim();
  }

  if (data.hasGoogleClickId) {
    return "Google Ads";
  }

  if (data.hasMetaClickId) {
    return "Meta Ads";
  }

  if (data.referrer?.trim()) {
    try {
      return new URL(data.referrer).hostname.replace(/^www\./, "");
    } catch {
      return "Referral";
    }
  }

  return "Direct / unknown";
}

function friendlyPagePath(pagePath: string) {
  const path = pagePath.split("?")[0] || "/";

  if (path === "/") {
    return "Homepage";
  }

  return path
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    )
    .join(" / ");
}

function eventBadgeStyle(eventType: string) {
  if (eventType === "PHONE_CLICK") {
    return "border-[#C9E4D4] bg-[#EFF9F3] text-[#28704A]";
  }

  if (eventType === "WHATSAPP_CLICK") {
    return "border-[#BDEBCD] bg-[#ECFBF1] text-[#14753C]";
  }

  if (eventType === "FORM_STARTED") {
    return "border-[#DFD0E7] bg-[#F7F0FA] text-[#6A328F]";
  }

  return "border-[#F1D98B] bg-[#FFF8DF] text-[#7A5900]";
}

export default async function WebsiteAnalyticsPage({
  searchParams,
}: WebsiteAnalyticsPageProps) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const canViewWebsiteAnalytics =
    await hasAdminPermission("website.manage");

  if (!canViewWebsiteAnalytics) {
    redirect("/admin");
  }

  const resolvedSearchParams = (await searchParams) || {};
  const requestedRange = firstQueryValue(
    resolvedSearchParams?.range,
  );

  const selectedRange =
    rangeOptions.find((option) => option.value === requestedRange) ??
    rangeOptions[1];

  const fromDate =
    selectedRange.days === null
      ? undefined
      : startOfLocalDay(
          new Date(
            // This server report range is intentionally calculated at request time.
            // eslint-disable-next-line react-hooks/purity
            Date.now() -
              (selectedRange.days - 1) * 24 * 60 * 60 * 1_000,
          ),
        );

  let eventLogs: Array<{
    id: string;
    description: string;
    newData: Prisma.JsonValue | null;
    createdAt: Date;
  }> = [];

  let websiteEnquiries: Array<{
    id: string;
    enquiryNumber: string;
    parentName: string;
    programme: $Enums.Programme | null;
    source: $Enums.EnquirySource;
    status: $Enums.EnquiryStatus;
    createdAt: Date;
  }> = [];

  try {
    const results = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          entityType: "WEBSITE_ANALYTICS_EVENT",
          createdAt: fromDate
            ? {
                gte: fromDate,
              }
            : undefined,
        },
        select: {
          id: true,
          description: true,
          newData: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 25_000,
      }),

      prisma.enquiry.findMany({
        where: {
          source: {
            in: [...websiteEnquirySources],
          },
          OR: [
            { latestTrafficClass: null },
            { latestTrafficClass: "GENUINE" },
          ],
          createdAt: fromDate
            ? {
                gte: fromDate,
              }
            : undefined,
        },
        select: {
          id: true,
          enquiryNumber: true,
          parentName: true,
          programme: true,
          source: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);
    eventLogs = results[0] ?? [];
    websiteEnquiries = results[1] ?? [];
  } catch (queryError) {
    console.error("Website Analytics query error:", queryError);
  }

  const events = eventLogs
    .map((log) => ({
      ...log,
      data: readEventData(log.newData),
    }))
    .filter(
      (event) =>
        (!event.data.trafficClass || event.data.trafficClass === "GENUINE") &&
        event.data.eventScope !== "RECRUITMENT" &&
        event.data.leadType !== "recruitment" &&
        event.data.isInternal !== true &&
        event.data.isTest !== true &&
        event.data.isBot !== true,
    );

  const visitors = new Set(
    events
      .map((event) => event.data.visitorId)
      .filter((value): value is string => Boolean(value)),
  );

  const sessions = new Set(
    events
      .map((event) => event.data.sessionId)
      .filter((value): value is string => Boolean(value)),
  );

  const countEvent = (eventType: string) =>
    events.filter((event) => event.data.eventType === eventType).length;

  const pageViews = countEvent("PAGE_VIEW");
  const phoneClicks = countEvent("PHONE_CLICK");
  const whatsappClicks = countEvent("WHATSAPP_CLICK");
  const mapClicks = countEvent("MAP_CLICK");
  const videoPlays = countEvent("VIDEO_PLAY");
  const totalLeads = websiteEnquiries.length;

  const submittedFormVisitors = new Set(
    events
      .filter(
        (event) =>
          event.data.eventType === "FORM_SUBMITTED" &&
          (event.data.eventScope === "ADMISSION" ||
            event.data.leadType === "admission"),
      )
      .map((event) => event.data.visitorId)
      .filter((value): value is string => Boolean(value)),
  );

  const contactIntentVisitors = new Set(
    events
      .filter((event) =>
        [
          "CTA_CLICK",
          "PHONE_CLICK",
          "WHATSAPP_CLICK",
          "FORM_STARTED",
        ].includes(event.data.eventType ?? ""),
      )
      .map((event) => event.data.visitorId)
      .filter((value): value is string => Boolean(value)),
  );

  const conversionRate =
    visitors.size > 0
      ? (submittedFormVisitors.size / visitors.size) * 100
      : 0;

  const contactIntentRate =
    visitors.size > 0
      ? (contactIntentVisitors.size / visitors.size) * 100
      : 0;

  const pagePerformanceMap = new Map<string, PagePerformance>();

  for (const event of events) {
    const pagePath =
      (event.data.pagePath?.trim() || "/").split("?")[0] || "/";
    const current = pagePerformanceMap.get(pagePath) ?? {
      pagePath,
      views: 0,
      visitors: new Set<string>(),
      ctaClicks: 0,
      callClicks: 0,
      whatsappClicks: 0,
    };

    if (event.data.eventType === "PAGE_VIEW") {
      current.views += 1;
    }

    if (event.data.visitorId) {
      current.visitors.add(event.data.visitorId);
    }

    if (event.data.eventType === "CTA_CLICK") {
      current.ctaClicks += 1;
    }

    if (event.data.eventType === "PHONE_CLICK") {
      current.callClicks += 1;
    }

    if (event.data.eventType === "WHATSAPP_CLICK") {
      current.whatsappClicks += 1;
    }

    pagePerformanceMap.set(pagePath, current);
  }

  const pagePerformance = Array.from(pagePerformanceMap.values())
    .filter((page) => page.views > 0)
    .sort((left, right) => right.views - left.views)
    .slice(0, 12);

  const sourceSessions = new Map<string, Set<string>>();

  for (const event of events) {
    if (!event.data.sessionId) {
      continue;
    }

    const source = getTrafficSource(event.data);
    const sourceSet = sourceSessions.get(source) ?? new Set<string>();
    sourceSet.add(event.data.sessionId);
    sourceSessions.set(source, sourceSet);
  }

  const trafficSources = Array.from(sourceSessions.entries())
    .map(([label, sessionSet]) => ({
      label,
      value: sessionSet.size,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 8);

  const campaignSessions = new Map<string, Set<string>>();

  for (const event of events) {
    const campaign = event.data.utmCampaign?.trim();

    if (!campaign || !event.data.sessionId) {
      continue;
    }

    const campaignSet =
      campaignSessions.get(campaign) ?? new Set<string>();
    campaignSet.add(event.data.sessionId);
    campaignSessions.set(campaign, campaignSet);
  }

  const campaigns = Array.from(campaignSessions.entries())
    .map(([label, sessionSet]) => ({
      label,
      value: sessionSet.size,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 8);

  const enquirySourceCounts = new Map<string, number>();

  for (const enquiry of websiteEnquiries) {
    enquirySourceCounts.set(
      enquiry.source,
      (enquirySourceCounts.get(enquiry.source) ?? 0) + 1,
    );
  }

  const leadSources = Array.from(enquirySourceCounts.entries())
    .map(([label, value]) => ({
      label: enquirySourceLabels[label] ?? label,
      value,
    }))
    .sort((left, right) => right.value - left.value);

  const intentEvents = events
    .filter((event) =>
      [
        "CTA_CLICK",
        "PHONE_CLICK",
        "WHATSAPP_CLICK",
        "MAP_CLICK",
        "FORM_STARTED",
      ].includes(event.data.eventType ?? ""),
    )
    .slice(0, 14);

  const biggestPageValue = Math.max(
    ...pagePerformance.map((page) => page.views),
    1,
  );

  const biggestTrafficValue = Math.max(
    ...trafficSources.map((source) => source.value),
    1,
  );

  return (
    <AdminLayout>
      <div className="space-y-7">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <BarChart3 aria-hidden="true" size={23} />
                </span>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B] sm:text-sm">
                  Website Analytics
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                See what brings parents closer to an enquiry
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                Follow anonymous website visits, popular pages, advertising
                sources and contact-button interest. Submitted enquiries remain
                the trusted record of actual leads.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={`/api/admin/website-analytics/export?range=${selectedRange.value}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD65F]"
              >
                <ArrowDownToLine aria-hidden="true" size={17} />
                Download PDF
              </a>

              <Link
                href="/admin/enquiries"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
              >
                Open Enquiries
                <ArrowRight aria-hidden="true" size={17} />
              </Link>

              <Link
                href="/admin/website"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
              >
                Website Manager
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-[#E8E0EC] bg-white p-4 shadow-[0_14px_38px_rgba(45,23,54,0.055)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <CalendarDays aria-hidden="true" size={20} />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                  Reporting period
                </p>

                <p className="mt-1 text-sm font-bold text-[#625768]">
                  {selectedRange.label}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {rangeOptions.map((option) => (
                <Link
                  key={option.value}
                  href={`/admin/website/analytics?range=${option.value}`}
                  aria-current={
                    option.value === selectedRange.value ? "page" : undefined
                  }
                  className={[
                    "inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-xs font-black transition",
                    option.value === selectedRange.value
                      ? "bg-[#5B2A86] text-white shadow-[0_8px_22px_rgba(91,42,134,0.18)]"
                      : "border border-[#E4DAE8] bg-white text-[#675B6C] hover:bg-[#F6F1F8]",
                  ].join(" ")}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard
            label="Unique visitors"
            value={formatNumber(visitors.size)}
            helper={`${formatNumber(sessions.size)} browsing sessions`}
            icon={UsersRound}
            iconStyle="bg-[#F2E8F7] text-[#5B2A86]"
          />

          <MetricCard
            label="Page views"
            value={formatNumber(pageViews)}
            helper="Public pages opened"
            icon={Eye}
            iconStyle="bg-[#EAF3FF] text-[#2765A4]"
          />

          <MetricCard
            label="Website enquiries"
            value={formatNumber(totalLeads)}
            helper={`${formatPercentage(conversionRate)} visitor-to-lead rate`}
            icon={UserRoundCheck}
            iconStyle="bg-[#E9F8F2] text-[#28755D]"
          />

          <MetricCard
            label="WhatsApp clicks"
            value={formatNumber(whatsappClicks)}
            helper="Intent, not confirmed messages"
            icon={MessageCircle}
            iconStyle="bg-[#ECFBF1] text-[#14753C]"
          />

          <MetricCard
            label="Call clicks"
            value={formatNumber(phoneClicks)}
            helper="Intent, not confirmed calls"
            icon={Phone}
            iconStyle="bg-[#FFF0E8] text-[#A65325]"
          />

          <MetricCard
            label="Contact intent"
            value={formatPercentage(contactIntentRate)}
            helper={`${formatNumber(contactIntentVisitors.size)} interested visitors`}
            icon={MousePointerClick}
            iconStyle="bg-[#FFF6D8] text-[#876000]"
          />
        </section>

        {events.length === 25_000 ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-900">
            This period contains more than 25,000 website events. The page is
            showing the newest 25,000 events so CentreOS remains responsive.
          </section>
        ) : null}

        <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-[28px] border border-[#E8E0EC] bg-white shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
            <SectionHeading
              eyebrow="Page performance"
              title="Pages parents visit most"
              description="Compare attention and contact-button interest without counting admin-panel traffic."
              icon={Globe2}
            />

            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#EEE8F1] bg-[#FAF8FC] text-left">
                    <TableHeading>Page</TableHeading>
                    <TableHeading>Views</TableHeading>
                    <TableHeading>Visitors</TableHeading>
                    <TableHeading>Enquiry clicks</TableHeading>
                    <TableHeading>Call</TableHeading>
                    <TableHeading>WhatsApp</TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {pagePerformance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <EmptyState
                          title="No website visits recorded yet"
                          description="Open the public website once after completing this setup. New visits will then appear here."
                        />
                      </td>
                    </tr>
                  ) : (
                    pagePerformance.map((page) => (
                      <tr
                        key={page.pagePath}
                        className="border-b border-[#F0EBF2] last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <p className="font-black text-[#2D1736]">
                            {friendlyPagePath(page.pagePath)}
                          </p>

                          <p className="mt-1 max-w-[340px] truncate text-xs font-semibold text-[#8A7F8E]">
                            {page.pagePath}
                          </p>

                          <div className="mt-3 h-1.5 max-w-[280px] overflow-hidden rounded-full bg-[#EEE8F1]">
                            <div
                              className="h-full rounded-full bg-[#5B2A86]"
                              style={{
                                width: `${Math.max(
                                  (page.views / biggestPageValue) * 100,
                                  4,
                                )}%`,
                              }}
                            />
                          </div>
                        </td>

                        <TableValue value={page.views} />
                        <TableValue value={page.visitors.size} />
                        <TableValue value={page.ctaClicks} />
                        <TableValue value={page.callClicks} />
                        <TableValue value={page.whatsappClicks} />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <BreakdownCard
              title="Traffic sources"
              description="Where browsing sessions began"
              items={trafficSources}
              maximumValue={biggestTrafficValue}
              emptyMessage="Traffic sources will appear after new website visits."
            />

            <BreakdownCard
              title="Actual lead sources"
              description="Sources saved on submitted enquiries"
              items={leadSources}
              maximumValue={Math.max(
                ...leadSources.map((source) => source.value),
                1,
              )}
              emptyMessage="No website enquiries were created in this period."
              colour="#28755D"
            />

            <BreakdownCard
              title="Advertising campaigns"
              description="Sessions grouped by UTM campaign name"
              items={campaigns}
              maximumValue={Math.max(
                ...campaigns.map((campaign) => campaign.value),
                1,
              )}
              emptyMessage="Campaign names will appear when advertising links include a UTM campaign."
              colour="#2765A4"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-[28px] border border-[#E8E0EC] bg-white shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
            <SectionHeading
              eyebrow="Recent interest"
              title="Latest contact actions"
              description="These clicks show intent. A call or WhatsApp conversation is confirmed only outside the website."
              icon={TrendingUp}
            />

            <div className="divide-y divide-[#F0EBF2]">
              {intentEvents.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No contact actions yet"
                    description="Call, WhatsApp and enquiry-button activity will appear here."
                  />
                </div>
              ) : (
                intentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 px-5 py-4 sm:px-6"
                  >
                    <span
                      className={`mt-0.5 inline-flex shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${eventBadgeStyle(
                        event.data.eventType ?? "",
                      )}`}
                    >
                      {eventLabels[event.data.eventType ?? ""] ??
                        "Website action"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#2D1736]">
                        {event.data.targetText ||
                          friendlyPagePath(event.data.pagePath || "/")}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[#817684]">
                        <span>{event.data.pagePath || "/"}</span>
                        <span>{formatDateTime(event.createdAt)}</span>
                        {event.data.deviceType ? (
                          <span className="inline-flex items-center gap-1">
                            <Smartphone aria-hidden="true" size={12} />
                            {event.data.deviceType}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[#E8E0EC] bg-white shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
            <SectionHeading
              eyebrow="Confirmed leads"
              title="Latest website enquiries"
              description="These parents submitted their details and have a real enquiry record in CentreOS."
              icon={UserRoundCheck}
            />

            <div className="divide-y divide-[#F0EBF2]">
              {websiteEnquiries.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No confirmed website enquiries yet"
                    description="A parent will appear here only after the website form is successfully submitted."
                  />
                </div>
              ) : (
                websiteEnquiries.slice(0, 12).map((enquiry) => (
                  <Link
                    key={enquiry.id}
                    href="/admin/enquiries"
                    className="group flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-[#FAF8FC] sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#2D1736]">
                        {enquiry.parentName}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#817684]">
                        {enquiry.enquiryNumber} - {formatDateTime(enquiry.createdAt)}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#F3EAF8] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#6A328F]">
                          {enquirySourceLabels[enquiry.source] ?? enquiry.source}
                        </span>

                        <span className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#2F6095]">
                          {enquiry.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    <ArrowRight
                      aria-hidden="true"
                      size={17}
                      className="mt-1 shrink-0 text-[#B0A5B4] transition group-hover:translate-x-1 group-hover:text-[#5B2A86]"
                    />
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <InfoCard
            icon={MousePointerClick}
            title="What a click means"
            description="A Call or WhatsApp click shows that a parent intended to contact the centre. Browsers cannot reveal their number unless they actually submit it."
          />

          <InfoCard
            icon={FileText}
            title="What counts as a lead"
            description="Only a successfully submitted website form creates or updates an enquiry. The same mobile number stays in one enquiry record for clean follow-up."
          />

          <InfoCard
            icon={ArrowDownToLine}
            title="Download a complete PDF"
            description="Use the Download PDF button to export the selected period with totals, pages, sources, campaigns, confirmed leads and recent contact interest."
          />
        </section>

        <section className="rounded-[24px] border border-[#E4D7EA] bg-[#F8F2FB] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B2A86] shadow-sm">
              <Sparkles aria-hidden="true" size={20} />
            </span>

            <div>
              <h2 className="font-black text-[#2D1736]">
                Privacy-conscious by design
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#746878]">
                Website activity is stored with anonymous visitor and session
                identifiers. The tracker does not save typed form text, an
                unprovided mobile number or a raw IP address.
                {mapClicks > 0
                  ? ` ${formatNumber(mapClicks)} directions clicks were also recorded in this period.`
                  : ""}
                {videoPlays > 0
                  ? ` ${formatNumber(videoPlays)} video plays were recorded.`
                  : ""}
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: typeof Eye;
  iconStyle: string;
};

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  iconStyle,
}: MetricCardProps) {
  return (
    <article className="rounded-[24px] border border-[#E8E0EC] bg-white p-5 shadow-[0_12px_34px_rgba(45,23,54,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#2D1736]">
            {value}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconStyle}`}
        >
          <Icon aria-hidden="true" size={20} />
        </span>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-[#817684]">
        {helper}
      </p>
    </article>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Globe2;
};

function SectionHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
}: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-4 border-b border-[#EEE8F1] bg-[#FAF8FC] px-5 py-5 sm:px-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
        <Icon aria-hidden="true" size={20} />
      </span>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7A459C]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-xl font-black tracking-[-0.025em] text-[#2D1736]">
          {title}
        </h2>

        <p className="mt-1 text-xs font-semibold leading-5 text-[#817684]">
          {description}
        </p>
      </div>
    </div>
  );
}

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
      {children}
    </th>
  );
}

function TableValue({ value }: { value: number }) {
  return (
    <td className="px-5 py-4 text-sm font-black text-[#403047]">
      {formatNumber(value)}
    </td>
  );
}

type BreakdownCardProps = {
  title: string;
  description: string;
  items: Array<{
    label: string;
    value: number;
  }>;
  maximumValue: number;
  emptyMessage: string;
  colour?: string;
};

function BreakdownCard({
  title,
  description,
  items,
  maximumValue,
  emptyMessage,
  colour = "#5B2A86",
}: BreakdownCardProps) {
  return (
    <article className="rounded-[28px] border border-[#E8E0EC] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
      <h2 className="text-xl font-black tracking-[-0.025em] text-[#2D1736]">
        {title}
      </h2>

      <p className="mt-1 text-xs font-semibold text-[#817684]">
        {description}
      </p>

      {items.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-[#FAF8FC] px-4 py-5 text-sm font-semibold leading-6 text-[#817684]">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-4">
                <p className="min-w-0 truncate text-sm font-black capitalize text-[#4A3A50]">
                  {item.label}
                </p>

                <p className="shrink-0 text-sm font-black text-[#2D1736]">
                  {formatNumber(item.value)}
                </p>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEE8F1]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(
                      (item.value / maximumValue) * 100,
                      4,
                    )}%`,
                    backgroundColor: colour,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
};

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-md">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
        <Globe2 aria-hidden="true" size={21} />
      </span>

      <h3 className="mt-4 font-black text-[#2D1736]">{title}</h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
        {description}
      </p>
    </div>
  );
}

type InfoCardProps = {
  icon: typeof MousePointerClick;
  title: string;
  description: string;
};

function InfoCard({
  icon: Icon,
  title,
  description,
}: InfoCardProps) {
  return (
    <article className="rounded-[24px] border border-[#E8E0EC] bg-white p-5 shadow-[0_12px_34px_rgba(45,23,54,0.05)] sm:p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
        <Icon aria-hidden="true" size={20} />
      </span>

      <h2 className="mt-4 text-lg font-black text-[#2D1736]">{title}</h2>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#746878]">
        {description}
      </p>
    </article>
  );
}
