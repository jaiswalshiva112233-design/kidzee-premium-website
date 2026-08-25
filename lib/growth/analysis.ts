import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

type EventData = {
  eventType?: string;
  eventName?: string;
  eventScope?: string;
  leadType?: string;
  visitorId?: string;
  pagePath?: string;
  deviceType?: string;
  trafficClass?: string;
  isInternal?: boolean;
  isTest?: boolean;
  isBot?: boolean;
  metricValue?: number;
  metricRating?: string;
};

export type GrowthFinding = {
  type: "Evidence-backed" | "Probable" | "Experiment" | "Insufficient Data";
  finding: string;
  evidence: string;
  whyItMatters: string;
  action: string;
  expectedGoal: string;
  confidence: "High" | "Medium" | "Low";
  dataSufficiency: "Enough" | "Limited" | "Insufficient";
  risk: "Low" | "Medium";
  canAiApply: "No content change needed" | "Preview required" | "Developer review required";
};

function eventJson(value: Prisma.JsonValue): EventData {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as EventData)
    : {};
}

function percent(numerator: number, denominator: number) {
  return denominator > 0
    ? Number(((numerator / denominator) * 100).toFixed(1))
    : 0;
}

function percentageChange(current: number, previous: number) {
  if (previous <= 0) return null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function genuineEvent(event: EventData) {
  return (
    (!event.trafficClass || event.trafficClass === "GENUINE") &&
    event.eventScope !== "RECRUITMENT" &&
    event.leadType !== "recruitment" &&
    event.isInternal !== true &&
    event.isTest !== true &&
    event.isBot !== true
  );
}

function pathFromUrl(value: string | null | undefined) {
  if (!value) return "/";
  try {
    return new URL(value, "https://kidzeedwarka.com").pathname || "/";
  } catch {
    return value.startsWith("/") ? value.split("?")[0] : "/";
  }
}

function countBy(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function percentile(values: number[], percentileValue: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(percentileValue * sorted.length) - 1);
  return Number(sorted[Math.max(index, 0)].toFixed(2));
}

function vitalThreshold(name: string) {
  if (name === "LCP") return 2_500;
  if (name === "INP") return 200;
  if (name === "CLS") return 0.1;
  return null;
}

function buildVitals(events: EventData[]) {
  return ["LCP", "INP", "CLS"]
    .map((name) => {
      const values = events
        .filter((event) => event.eventType === "WEB_VITAL" && event.eventName === name)
        .map((event) => Number(event.metricValue))
        .filter((value) => Number.isFinite(value) && value >= 0);
      const p75 = percentile(values, 0.75);
      const threshold = vitalThreshold(name);
      return {
        name,
        samples: values.length,
        p75,
        status:
          values.length < 5 || p75 == null || threshold == null
            ? "Insufficient data"
            : p75 <= threshold
              ? "Good"
              : "Needs attention",
      };
    });
}

export type GrowthSnapshot = Awaited<ReturnType<typeof buildGrowthSnapshot>>;

export async function buildGrowthSnapshot(days = 30) {
  const now = new Date();
  const from = new Date(now.getTime() - days * 86_400_000);
  const previousFrom = new Date(from.getTime() - days * 86_400_000);

  const [
    currentEventsRaw,
    previousEventsRaw,
    currentSubmissionRows,
    previousSubmissionRows,
    enquiries,
    previousEnquiries,
    admissions,
    previousAdmissions,
    conversionJobs,
    sourceSnapshots,
  ] = await Promise.all([
    prisma.activityLog.findMany({
      where: { entityType: "WEBSITE_ANALYTICS_EVENT", createdAt: { gte: from } },
      select: { newData: true },
      orderBy: { createdAt: "desc" },
      take: 10_000,
    }),
    prisma.activityLog.findMany({
      where: {
        entityType: "WEBSITE_ANALYTICS_EVENT",
        createdAt: { gte: previousFrom, lt: from },
      },
      select: { newData: true },
      orderBy: { createdAt: "desc" },
      take: 10_000,
    }),
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
        utmSource: true,
        landingPage: true,
        landingPageId: true,
        landingVariantId: true,
        growthExperimentId: true,
        enquiry: { select: { status: true, admission: { select: { status: true } } } },
      },
      orderBy: { receivedAt: "desc" },
      take: 5_000,
    }),
    prisma.websiteLeadSubmission.findMany({
      where: {
        receivedAt: { gte: previousFrom, lt: from },
        leadType: "admission",
        trafficClass: "GENUINE",
        isInternal: false,
        isTest: false,
        isBot: false,
      },
      select: { enquiryId: true },
      take: 5_000,
    }),
    prisma.enquiry.findMany({
      where: {
        createdAt: { gte: from },
        OR: [{ latestTrafficClass: null }, { latestTrafficClass: "GENUINE" }],
      },
      select: { status: true },
    }),
    prisma.enquiry.findMany({
      where: {
        createdAt: { gte: previousFrom, lt: from },
        OR: [{ latestTrafficClass: null }, { latestTrafficClass: "GENUINE" }],
      },
      select: { status: true },
    }),
    prisma.admission.count({
      where: { createdAt: { gte: from }, status: "CONFIRMED" },
    }),
    prisma.admission.count({
      where: { createdAt: { gte: previousFrom, lt: from }, status: "CONFIRMED" },
    }),
    prisma.marketingConversionJob.groupBy({
      by: ["provider", "status"],
      where: { createdAt: { gte: from } },
      _count: true,
    }),
    prisma.growthDataSnapshot.findMany({ orderBy: { collectedAt: "desc" }, distinct: ["source", "dataset"], take: 25 }),
  ]);

  // A parent can submit more than once while continuing one enquiry. Marketing
  // decisions must count the enquiry once, while raw submissions remain stored.
  const currentSubmissions = [
    ...new Map(currentSubmissionRows.map((item) => [item.enquiryId, item])).values(),
  ];
  const previousSubmissionCount = new Set(
    previousSubmissionRows.map((item) => item.enquiryId),
  ).size;

  const currentEvents = currentEventsRaw.map((event) => eventJson(event.newData)).filter(genuineEvent);
  const previousEvents = previousEventsRaw.map((event) => eventJson(event.newData)).filter(genuineEvent);
  const currentVisitors = new Set(
    currentEvents
      .filter((event) => event.eventType === "PAGE_VIEW")
      .map((event) => event.visitorId)
      .filter(Boolean),
  );
  const previousVisitors = new Set(
    previousEvents
      .filter((event) => event.eventType === "PAGE_VIEW")
      .map((event) => event.visitorId)
      .filter(Boolean),
  );
  const pageViews = currentEvents.filter((event) => event.eventType === "PAGE_VIEW");
  const formStarts = currentEvents.filter((event) => event.eventType === "FORM_STARTED").length;
  const formSubmissions = currentEvents.filter((event) => event.eventType === "FORM_SUBMITTED").length;
  const callClicks = currentEvents.filter((event) => event.eventType === "PHONE_CLICK").length;
  const whatsappClicks = currentEvents.filter((event) => event.eventType === "WHATSAPP_CLICK").length;
  const qualified = enquiries.filter((item) =>
    ["INTERESTED", "VISIT_SCHEDULED", "VISIT_BOOKED", "VISIT_COMPLETED", "TRIAL_SCHEDULED", "TRIAL_COMPLETED", "QUALIFIED", "ADMITTED"].includes(item.status),
  ).length;
  const visits = enquiries.filter((item) =>
    ["VISIT_SCHEDULED", "VISIT_BOOKED", "VISIT_COMPLETED", "TRIAL_SCHEDULED", "TRIAL_COMPLETED", "QUALIFIED", "ADMITTED"].includes(item.status),
  ).length;
  const previousVisits = previousEnquiries.filter((item) =>
    ["VISIT_SCHEDULED", "VISIT_BOOKED", "VISIT_COMPLETED", "TRIAL_SCHEDULED", "TRIAL_COMPLETED", "QUALIFIED", "ADMITTED"].includes(item.status),
  ).length;
  const leads = currentSubmissions.length;
  const organicLeads = currentSubmissions.filter((item) => item.trafficChannel === "ORGANIC_SEARCH").length;
  const googleLeads = currentSubmissions.filter((item) => item.trafficChannel === "GOOGLE_ADS" || item.source === "GOOGLE_ADS").length;
  const metaLeads = currentSubmissions.filter((item) => item.trafficChannel === "META_ADS" || item.source === "META_ADS").length;
  const blogViews = pageViews.filter((event) => pathFromUrl(event.pagePath).startsWith("/blog")).length;
  const galleryEngagements = currentEvents.filter((event) => event.eventType === "GALLERY_OPEN").length;
  const parentStoryPlays = currentEvents.filter((event) => event.eventType === "VIDEO_PLAY").length;

  const metrics = {
    days,
    genuineVisitors: currentVisitors.size,
    pageViews: pageViews.length,
    leads,
    qualified,
    visits,
    admissions,
    formStarts,
    formSubmissions,
    callClicks,
    whatsappClicks,
    websiteToLead: percent(leads, currentVisitors.size),
    leadToVisit: percent(visits, leads),
    visitToAdmission: percent(admissions, visits),
    formCompletion: percent(formSubmissions, formStarts),
  };

  const comparison = {
    visitors: percentageChange(currentVisitors.size, previousVisitors.size),
    leads: percentageChange(leads, previousSubmissionCount),
    visits: percentageChange(visits, previousVisits),
    admissions: percentageChange(admissions, previousAdmissions),
  };

  const pages = countBy(pageViews.map((event) => pathFromUrl(event.pagePath))).slice(0, 6);
  const devices = countBy(pageViews.map((event) => event.deviceType || "unknown")).slice(0, 4);
  const sources = countBy(
    currentSubmissions.map(
      (submission) =>
        submission.utmSource || submission.trafficChannel || submission.source.toLowerCase(),
    ),
  ).slice(0, 6);
  const landingPages = countBy(
    currentSubmissions.map((submission) => pathFromUrl(submission.landingPage)),
  ).slice(0, 6);
  const landingPerformance = [...new Set(currentSubmissions.map((item) => item.landingPageId).filter((item): item is string => Boolean(item)))].map((landingPageId) => {
    const rows = currentSubmissions.filter((item) => item.landingPageId === landingPageId);
    return { landingPageId, leads: rows.length, qualified: rows.filter((item) => ["QUALIFIED", "VISIT_SCHEDULED", "VISITED", "ADMITTED"].includes(item.enquiry.status)).length, admissions: rows.filter((item) => item.enquiry.admission?.status === "CONFIRMED").length, variants: countBy(rows.map((item) => item.landingVariantId || "unassigned")) };
  });
  const performance = buildVitals(currentEvents);

  const findings: GrowthFinding[] = [];
  if (currentVisitors.size < 50) {
    findings.push({
      type: "Insufficient Data",
      finding: "There is not enough genuine visitor data for a major website decision.",
      evidence: `${currentVisitors.size} genuine visitors were recorded in ${days} days; at least 50 are needed for the first directional conversion review.`,
      whyItMatters: "Changing headlines or page structure on a tiny sample can make the website worse without proving anything.",
      action: "Keep the public pages stable, finish production tracking and collect more genuine local-parent traffic.",
      expectedGoal: "Reach a reliable first conversion sample without introducing unnecessary changes.",
      confidence: "High",
      dataSufficiency: "Insufficient",
      risk: "Low",
      canAiApply: "No content change needed",
    });
  } else if (metrics.websiteToLead < 2) {
    findings.push({
      type: "Evidence-backed",
      finding: "Genuine visitors are reaching the website but too few become leads.",
      evidence: `${currentVisitors.size} visitors produced ${leads} leads (${metrics.websiteToLead}%).`,
      whyItMatters: "More traffic alone will not solve a weak visitor-to-enquiry step.",
      action: `Review ${pages[0]?.label ?? "the highest-traffic landing page"} on mobile and preview one clearer school-visit CTA before publishing any content change.`,
      expectedGoal: "Increase qualified enquiries without adding page length or repeated claims.",
      confidence: "High",
      dataSufficiency: "Enough",
      risk: "Low",
      canAiApply: "Preview required",
    });
  } else {
    findings.push({
      type: "Evidence-backed",
      finding: "Website lead conversion does not currently show a clear warning.",
      evidence: `${leads} leads came from ${currentVisitors.size} genuine visitors (${metrics.websiteToLead}%).`,
      whyItMatters: "Unnecessary homepage changes could interrupt a funnel that is already producing enquiries.",
      action: "Keep the core message stable and continue measuring lead quality, visits and admissions.",
      expectedGoal: "Protect current performance while enough downstream data accumulates.",
      confidence: currentVisitors.size >= 100 ? "High" : "Medium",
      dataSufficiency: currentVisitors.size >= 100 ? "Enough" : "Limited",
      risk: "Low",
      canAiApply: "No content change needed",
    });
  }

  if (formStarts >= 20 && metrics.formCompletion < 35) {
    findings.push({
      type: "Evidence-backed",
      finding: "Many parents start a form but do not finish it.",
      evidence: `${formStarts} form starts produced ${formSubmissions} recorded submissions (${metrics.formCompletion}%).`,
      whyItMatters: "These parents showed intent, so reducing friction can recover leads without buying more traffic.",
      action: "Review the first incomplete field and mobile form length; test only one simplification at a time.",
      expectedGoal: "Improve form completion while keeping the information the centre needs for follow-up.",
      confidence: "High",
      dataSufficiency: "Enough",
      risk: "Low",
      canAiApply: "Preview required",
    });
  }

  if (leads >= 10 && metrics.leadToVisit < 20) {
    findings.push({
      type: "Evidence-backed",
      finding: "The largest funnel gap is after enquiry and before a school visit.",
      evidence: `${leads} leads resulted in ${visits} recorded visits (${metrics.leadToVisit}%).`,
      whyItMatters: "A website rewrite will not fix slow or unclear follow-up after a parent has already enquired.",
      action: "Prioritise same-day follow-up and offer two specific visit slots in the first useful conversation.",
      expectedGoal: "Move more qualified parents from enquiry to an actual centre visit.",
      confidence: "High",
      dataSufficiency: "Enough",
      risk: "Low",
      canAiApply: "No content change needed",
    });
  }

  if (visits >= 8 && metrics.visitToAdmission < 25) {
    findings.push({
      type: "Probable",
      finding: "School visits are not becoming admissions at a healthy rate.",
      evidence: `${visits} visits resulted in ${admissions} confirmed admissions (${metrics.visitToAdmission}%).`,
      whyItMatters: "The problem may be programme fit, objections, visit experience or follow-up—not advertising.",
      action: "Review visit notes and lost reasons before changing the website or increasing ad spend.",
      expectedGoal: "Identify the actual admission objection and improve visit-to-admission conversion.",
      confidence: "Medium",
      dataSufficiency: "Limited",
      risk: "Low",
      canAiApply: "No content change needed",
    });
  }

  if (
    previousVisitors.size >= 50 &&
    comparison.visitors != null &&
    comparison.visitors <= -25
  ) {
    findings.push({
      type: "Evidence-backed",
      finding: "Genuine website traffic fell materially from the previous comparable period.",
      evidence: `${currentVisitors.size} visitors now versus ${previousVisitors.size} previously (${comparison.visitors}%).`,
      whyItMatters: "A traffic shortage cannot be solved only by changing conversion copy.",
      action: "Check Search Console visibility, local profile activity and active campaign delivery before editing pages.",
      expectedGoal: "Restore qualified local reach while preserving pages that still convert.",
      confidence: "High",
      dataSufficiency: "Enough",
      risk: "Low",
      canAiApply: "Developer review required",
    });
  }

  const poorVital = performance.find(
    (metric) => metric.samples >= 5 && metric.status === "Needs attention",
  );
  if (poorVital) {
    findings.push({
      type: "Evidence-backed",
      finding: `${poorVital.name} needs attention on real visitor devices.`,
      evidence: `${poorVital.samples} genuine samples produced a p75 value of ${poorVital.p75}.`,
      whyItMatters: "Slow or unstable interaction can reduce both parent trust and conversion.",
      action: "Inspect the affected page and media before changing copy; developer review is required for performance code.",
      expectedGoal: "Bring the real-user p75 metric into the good range without reducing visual quality.",
      confidence: "High",
      dataSufficiency: "Enough",
      risk: "Medium",
      canAiApply: "Developer review required",
    });
  }

  if (googleLeads < 10) {
    findings.push({
      type: "Insufficient Data",
      finding: "Google Ads does not yet have enough attributed leads for an optimisation decision.",
      evidence: `${googleLeads} genuine Google Ads leads and ${conversionJobs.filter((job) => job.provider === "GOOGLE_ADS").reduce((sum, job) => sum + job._count, 0)} Google conversion-delivery records were measured in ${days} days.`,
      whyItMatters: "Changing bidding, keywords or landing pages on a tiny sample can train the campaign on noise.",
      action: "Keep conversion delivery healthy and review search terms, qualified leads and admissions after a reliable sample accumulates.",
      expectedGoal: "Optimise Google Ads from qualified admissions rather than raw form volume.",
      confidence: "High",
      dataSufficiency: "Insufficient",
      risk: "Low",
      canAiApply: "No content change needed",
    });
  }

  if (metaLeads < 10) {
    findings.push({
      type: "Insufficient Data",
      finding: "Meta Ads does not yet have enough attributed leads for a creative or audience decision.",
      evidence: `${metaLeads} genuine Meta leads and ${conversionJobs.filter((job) => job.provider === "META").reduce((sum, job) => sum + job._count, 0)} Meta conversion-delivery records were measured in ${days} days.`,
      whyItMatters: "Meta needs enough deduplicated Lead, QualifiedLead and Admission feedback before quality trends are dependable.",
      action: "Continue measuring qualified leads and admissions; preview creative changes only after comparing lead quality by campaign.",
      expectedGoal: "Improve admission quality without repeatedly resetting campaign learning.",
      confidence: "High",
      dataSufficiency: "Insufficient",
      risk: "Low",
      canAiApply: "No content change needed",
    });
  }

  if (organicLeads === 0 || blogViews < 10) {
    findings.push({
      type: "Insufficient Data",
      finding: "SEO and blog decisions need more organic-search evidence.",
      evidence: `${organicLeads} organic leads and ${blogViews} blog page views were attributed in ${days} days.`,
      whyItMatters: "Publishing generic articles without search demand or local admission value can add length without producing visits.",
      action: "Use verified Search Console queries and local parent questions before approving the next SEO or blog topic.",
      expectedGoal: "Create useful local content that supports discovery and centre visits.",
      confidence: "High",
      dataSufficiency: "Insufficient",
      risk: "Low",
      canAiApply: "Preview required",
    });
  }

  if (galleryEngagements + parentStoryPlays < 10) {
    findings.push({
      type: "Insufficient Data",
      finding: "Gallery and parent-review engagement is not yet large enough to justify changing the media presentation.",
      evidence: `${galleryEngagements} gallery opens and ${parentStoryPlays} parent-story video plays were recorded in ${days} days.`,
      whyItMatters: "Real centre photos and parent stories build trust, but low usage data cannot identify which presentation converts best.",
      action: "Keep authentic media concise, collect viewing data and review whether viewers later enquire or book a visit.",
      expectedGoal: "Use authentic proof where it assists admission decisions without making pages longer.",
      confidence: "High",
      dataSufficiency: "Insufficient",
      risk: "Low",
      canAiApply: "No content change needed",
    });
  }

  return {
    generatedAt: now.toISOString(),
    metrics,
    comparison,
    breakdowns: { pages, devices, sources, landingPages, landingPerformance },
    performance,
    findings: findings.slice(0, 10),
    ads: {
      google: { leads: googleLeads, delivery: conversionJobs.filter((job) => job.provider === "GOOGLE_ADS") },
      meta: { leads: metaLeads, delivery: conversionJobs.filter((job) => job.provider === "META") },
    },
    content: { organicLeads, blogViews, galleryEngagements, parentStoryPlays },
    connectedSources: sourceSnapshots.map((item) => ({ source: item.source, dataset: item.dataset, collectedAt: item.collectedAt.toISOString(), periodStart: item.periodStart?.toISOString() ?? null, periodEnd: item.periodEnd?.toISOString() ?? null, metrics: item.metrics })),
  };
}
