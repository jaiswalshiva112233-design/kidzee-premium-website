import "server-only";

import type { GrowthDataSource, Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

const DAY = 86_400_000;

type JsonRecord = Record<string, unknown>;

function record(value: Prisma.JsonValue | null | undefined): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function finite(value: unknown) {
  const parsed =
    typeof value === "string"
      ? Number(value.replace(/[,%â‚¹\s]/g, ""))
      : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstNumber(source: JsonRecord, names: string[]) {
  for (const name of names) {
    if (source[name] !== undefined && source[name] !== null)
      return finite(source[name]);
  }
  return 0;
}

function rowList(source: JsonRecord, names: string[]) {
  for (const name of names) {
    const value = source[name];
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is JsonRecord =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      );
    }
  }
  return [];
}

function percent(numerator: number, denominator: number) {
  return denominator > 0
    ? Number(((numerator / denominator) * 100).toFixed(1))
    : 0;
}

function sourceForChannel(channel: "GOOGLE" | "META" | "ORGANIC") {
  if (channel === "GOOGLE") return "GOOGLE_ADS" as GrowthDataSource;
  if (channel === "META") return "META_ADS" as GrowthDataSource;
  return "SEARCH_CONSOLE" as GrowthDataSource;
}

function submissionMatches(
  channel: "GOOGLE" | "META" | "ORGANIC",
  row: { source: string; trafficChannel: string | null },
) {
  if (channel === "GOOGLE")
    return row.source === "GOOGLE_ADS" || row.trafficChannel === "GOOGLE_ADS";
  if (channel === "META")
    return row.source === "META_ADS" || row.trafficChannel === "META_ADS";
  return row.trafficChannel === "ORGANIC_SEARCH";
}

export async function buildMarketingControlData(
  channel: "GOOGLE" | "META" | "ORGANIC",
) {
  const from = new Date(Date.now() - 30 * DAY);
  const source = sourceForChannel(channel);
  const provider: "GOOGLE_ADS" | "META" =
    channel === "GOOGLE" ? "GOOGLE_ADS" : "META";
  const [submissions, snapshots, jobs, landingPages] = await Promise.all([
    prisma.websiteLeadSubmission.findMany({
      where: {
        receivedAt: { gte: from },
        leadType: "admission",
        trafficClass: "GENUINE",
        isInternal: false,
        isTest: false,
        isBot: false,
      },
      select: {
        enquiryId: true,
        source: true,
        trafficChannel: true,
        utmCampaign: true,
        utmTerm: true,
        landingPage: true,
        landingPageId: true,
        enquiry: {
          select: {
            status: true,
            appointments: {
              where: { kind: "VISIT" },
              select: { status: true },
            },
            admission: { select: { status: true } },
          },
        },
      },
      orderBy: { receivedAt: "desc" },
      take: 5_000,
    }),
    prisma.growthDataSnapshot.findMany({
      where: {
        source:
          channel === "ORGANIC"
            ? { in: ["SEARCH_CONSOLE", "GOOGLE_ANALYTICS", "GBP"] }
            : source,
      },
      orderBy: { collectedAt: "desc" },
      take: 40,
    }),
    channel === "ORGANIC"
      ? Promise.resolve([])
      : prisma.marketingConversionJob.groupBy({
          by: ["status", "eventType"],
          where: { provider, createdAt: { gte: from } },
          _count: true,
        }),
    prisma.landingPage.findMany({
      select: { id: true, name: true, slug: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const attributed = [
    ...new Map(
      submissions
        .filter((row) => submissionMatches(channel, row))
        .map((row) => [row.enquiryId, row]),
    ).values(),
  ];
  const qualified = attributed.filter((row) =>
    [
      "INTERESTED",
      "QUALIFIED",
      "VISIT_SCHEDULED",
      "VISIT_BOOKED",
      "VISIT_COMPLETED",
      "ADMITTED",
    ].includes(row.enquiry.status),
  ).length;
  const admissions = attributed.filter(
    (row) => row.enquiry.admission?.status === "CONFIRMED",
  ).length;
  const visitsBooked = attributed.filter((row) =>
    row.enquiry.appointments.some((visit) =>
      ["SCHEDULED", "COMPLETED"].includes(visit.status),
    ),
  ).length;
  const visitsCompleted = attributed.filter((row) =>
    row.enquiry.appointments.some((visit) => visit.status === "COMPLETED"),
  ).length;
  const enquiryIds = attributed.map((row) => row.enquiryId);
  const payments = enquiryIds.length
    ? await prisma.feePayment.findMany({
        where: {
          paymentDate: { gte: from },
          status: { in: ["PAID", "PARTIALLY_PAID"] },
          student: { admission: { enquiryId: { in: enquiryIds } } },
        },
        select: {
          amountReceived: true,
          student: {
            select: { admission: { select: { enquiryId: true } } },
          },
        },
      })
    : [];
  const revenueByEnquiry = new Map<string, number>();
  for (const payment of payments) {
    const enquiryId = payment.student.admission?.enquiryId;
    if (!enquiryId) continue;
    revenueByEnquiry.set(
      enquiryId,
      (revenueByEnquiry.get(enquiryId) ?? 0) + Number(payment.amountReceived),
    );
  }
  const revenue = [...revenueByEnquiry.values()].reduce(
    (sum, value) => sum + value,
    0,
  );
  const latest = snapshots[0];
  const metrics = record(latest?.metrics);
  const budget = firstNumber(metrics, ["budget", "dailyBudget", "totalBudget"]);
  const spend = firstNumber(metrics, [
    "spend",
    "cost",
    "amountSpent",
    "totalSpend",
  ]);
  const impressions = firstNumber(metrics, ["impressions", "totalImpressions"]);
  const clicks = firstNumber(metrics, ["clicks", "linkClicks", "totalClicks"]);
  const providerConversions = firstNumber(metrics, [
    "conversions",
    "results",
    "leads",
  ]);
  const campaigns = rowList(metrics, [
    "campaigns",
    "campaignPerformance",
    "campaignRows",
    "data",
  ]);
  const keywords = rowList(metrics, [
    "keywords",
    "keywordPerformance",
    "keywordRows",
  ]);
  const searchTerms = rowList(metrics, [
    "searchTerms",
    "queries",
    "searchTermRows",
  ]);
  const negativeKeywords = rowList(metrics, ["negativeKeywords", "negatives"]);
  const adSets = rowList(metrics, ["adSets", "adsets", "adSetPerformance"]);
  const ads = rowList(metrics, ["ads", "adPerformance", "creatives"]);
  const audiences = rowList(metrics, ["audiences", "audiencePerformance"]);
  const placements = rowList(metrics, ["placements", "placementPerformance"]);

  const campaignLeadCounts = new Map<
    string,
    {
      leads: number;
      qualified: number;
      visits: number;
      admissions: number;
      revenue: number;
    }
  >();
  const keywordLeadCounts = new Map<string, number>();
  const landingCounts = new Map<
    string,
    {
      leads: number;
      qualified: number;
      visits: number;
      admissions: number;
      revenue: number;
    }
  >();
  for (const row of attributed) {
    const campaign = row.utmCampaign || "Unlabelled";
    const keyword = row.utmTerm || "Unlabelled";
    const campaignResult = campaignLeadCounts.get(campaign) ?? {
      leads: 0,
      qualified: 0,
      visits: 0,
      admissions: 0,
      revenue: 0,
    };
    campaignResult.leads += 1;
    keywordLeadCounts.set(keyword, (keywordLeadCounts.get(keyword) ?? 0) + 1);
    const landing = row.landingPageId || row.landingPage || "/";
    const current = landingCounts.get(landing) ?? {
      leads: 0,
      qualified: 0,
      visits: 0,
      admissions: 0,
      revenue: 0,
    };
    current.leads += 1;
    if (
      [
        "INTERESTED",
        "QUALIFIED",
        "VISIT_SCHEDULED",
        "VISIT_BOOKED",
        "VISIT_COMPLETED",
        "ADMITTED",
      ].includes(row.enquiry.status)
    ) {
      current.qualified += 1;
      campaignResult.qualified += 1;
    }
    if (row.enquiry.admission?.status === "CONFIRMED") {
      current.admissions += 1;
      campaignResult.admissions += 1;
    }
    if (
      row.enquiry.appointments.some((visit) => visit.status === "COMPLETED")
    ) {
      current.visits += 1;
      campaignResult.visits += 1;
    }
    const attributedRevenue = revenueByEnquiry.get(row.enquiryId) ?? 0;
    current.revenue += attributedRevenue;
    campaignResult.revenue += attributedRevenue;
    campaignLeadCounts.set(campaign, campaignResult);
    landingCounts.set(landing, current);
  }

  const measuredCampaigns = [...campaignLeadCounts.entries()]
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.leads - a.leads);
  const measuredKeywords = [...keywordLeadCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, leads]) => ({ name, leads }));
  const landingPerformance = [...landingCounts.entries()]
    .map(([key, value]) => {
      const page = landingPages.find((item) => item.id === key);
      return {
        key,
        name: page?.name || key,
        slug: page?.slug || null,
        status: page?.status || "PUBLIC",
        ...value,
        conversion: percent(value.admissions, value.leads),
      };
    })
    .sort((a, b) => b.leads - a.leads);

  const delivery = jobs.reduce(
    (result, row) => {
      result[row.status] = (result[row.status] ?? 0) + row._count;
      return result;
    },
    {} as Record<string, number>,
  );

  return {
    channel,
    generatedAt: new Date().toISOString(),
    sourceStatus: latest ? ("CONNECTED" as const) : ("AWAITING_DATA" as const),
    latestSnapshotAt: latest?.collectedAt.toISOString() ?? null,
    datasets: snapshots.map((item) => ({
      source: item.source,
      dataset: item.dataset,
      collectedAt: item.collectedAt.toISOString(),
    })),
    totals: {
      budget,
      spend,
      impressions,
      clicks,
      ctr:
        firstNumber(metrics, ["ctr", "clickThroughRate"]) ||
        percent(clicks, impressions),
      cpc:
        firstNumber(metrics, ["cpc", "costPerClick"]) ||
        (clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0),
      frequency: firstNumber(metrics, ["frequency"]),
      providerConversions,
      leads: attributed.length,
      qualified,
      visitsBooked,
      visitsCompleted,
      admissions,
      revenue,
      leadToVisit: percent(visitsCompleted, attributed.length),
      visitToAdmission: percent(admissions, visitsCompleted),
      costPerLead:
        spend > 0 ? Math.round(spend / Math.max(1, attributed.length)) : 0,
      costPerAdmission:
        spend > 0 ? Math.round(spend / Math.max(1, admissions)) : 0,
      costPerVisit:
        spend > 0 ? Math.round(spend / Math.max(1, visitsCompleted)) : 0,
    },
    providerRows: {
      campaigns: campaigns.slice(0, 50),
      keywords: keywords.slice(0, 50),
      searchTerms: searchTerms.slice(0, 50),
      negativeKeywords: negativeKeywords.slice(0, 50),
      adSets: adSets.slice(0, 50),
      ads: ads.slice(0, 50),
      audiences: audiences.slice(0, 50),
      placements: placements.slice(0, 50),
    },
    measuredCampaigns,
    measuredKeywords,
    landingPerformance,
    conversionDelivery: delivery,
  };
}
