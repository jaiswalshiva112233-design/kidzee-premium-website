import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";
import { getWebsiteOperationalSettings } from "@/lib/website/operationalSettings";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function number(value: unknown) {
  return Number(value ?? 0);
}

export async function GET() {
  try {
    const session = await requireAdmin();
    const owner = session.role === "OWNER";
    const today = startOfDay();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const month = startOfMonth();
    const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    const now = new Date();

    const [
      todayEnquiries,
      appointments,
      admissionsToday,
      pendingFollowUps,
      pendingAdmissions,
      pendingInvoices,
      studentAttendance,
      staffAttendance,
      activeStudents,
      pendingDocuments,
      marketingJobs,
      campaignSubmissions,
      currentOrganic,
      previousOrganic,
      daycareToday,
      pendingLeaveRequests,
      growthRecommendations,
      whatsappJobs,
      admissionsMonth,
      websiteOperations,
      todayWebsiteEvents,
    ] = await Promise.all([
      prisma.enquiry.findMany({
        where: { createdAt: { gte: today, lt: tomorrow } },
        select: { source: true, latestTrafficChannel: true },
      }),
      prisma.leadAppointment.findMany({
        where: { scheduledAt: { gte: today, lt: tomorrow } },
        select: { kind: true, status: true },
      }),
      prisma.admission.count({
        where: { status: "CONFIRMED", admissionDate: { gte: today, lt: tomorrow } },
      }),
      prisma.followUp.count({ where: { status: "PENDING", dueAt: { lte: tomorrow } } }),
      prisma.admission.count({ where: { status: { in: ["DRAFT", "DOCUMENTS_PENDING"] } } }),
      prisma.feeInvoice.aggregate({
        where: { status: { in: ["DUE", "PARTIALLY_PAID", "OVERDUE"] } },
        _count: true,
        _sum: { pendingAmount: true },
      }),
      prisma.studentAttendance.groupBy({
        by: ["status"],
        where: { attendanceDate: { gte: today, lt: tomorrow } },
        _count: true,
      }),
      prisma.staffAttendance.groupBy({
        by: ["status"],
        where: { attendanceDate: { gte: today, lt: tomorrow } },
        _count: true,
      }),
      prisma.student.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, dateOfBirth: true },
      }),
      prisma.studentDocument.count({ where: { status: { in: ["UPLOADED", "REJECTED"] } } }),
      prisma.marketingConversionJob.groupBy({
        by: ["provider", "status"],
        _count: true,
      }),
      prisma.websiteLeadSubmission.findMany({
        where: { receivedAt: { gte: month }, leadType: "admission", isInternal: false, isTest: false, isBot: false },
        select: { trafficChannel: true, utmCampaign: true },
      }),
      prisma.websiteLeadSubmission.count({
        where: { receivedAt: { gte: month }, leadType: "admission", trafficChannel: "ORGANIC_SEARCH", isInternal: false, isTest: false, isBot: false },
      }),
      prisma.websiteLeadSubmission.count({
        where: { receivedAt: { gte: previousMonth, lt: month }, leadType: "admission", trafficChannel: "ORGANIC_SEARCH", isInternal: false, isTest: false, isBot: false },
      }),
      prisma.daycareSession.count({
        where: { sessionDate: { gte: today, lt: tomorrow }, status: { not: "CANCELLED" } },
      }),
      prisma.staffLeaveRequest.count({ where: { status: "PENDING" } }),
      prisma.growthRecommendation.count({ where: { status: "RECOMMENDED" } }),
      prisma.whatsAppAutomationMessage.groupBy({ by: ["status"], _count: true }),
      prisma.admission.findMany({
        where: { status: "CONFIRMED", admissionDate: { gte: month } },
        select: {
          enquiry: { select: { source: true, latestTrafficChannel: true, latestUtmCampaign: true } },
        },
      }),
      getWebsiteOperationalSettings(),
      prisma.activityLog.findMany({
        where: { entityType: "WEBSITE_ANALYTICS_EVENT", createdAt: { gte: today, lt: tomorrow } },
        select: { newData: true },
        take: 5_000,
      }),
    ]);

    const sourceCounts = { organic: 0, google: 0, meta: 0, walkIn: 0, calls: 0, whatsapp: 0 };
    for (const enquiry of todayEnquiries) {
      const channel = enquiry.latestTrafficChannel;
      if (channel === "ORGANIC_SEARCH") sourceCounts.organic += 1;
      if (channel === "GOOGLE_ADS" || enquiry.source === "GOOGLE_ADS") sourceCounts.google += 1;
      if (channel === "META_ADS" || enquiry.source === "META_ADS") sourceCounts.meta += 1;
      if (enquiry.source === "WALK_IN") sourceCounts.walkIn += 1;
    }
    for (const event of todayWebsiteEvents) {
      const data = event.newData && typeof event.newData === "object" && !Array.isArray(event.newData)
        ? event.newData as Record<string, unknown>
        : {};
      if (data.trafficClass && data.trafficClass !== "GENUINE") continue;
      if (data.eventType === "PHONE_CLICK") sourceCounts.calls += 1;
      if (data.eventType === "WHATSAPP_CLICK") sourceCounts.whatsapp += 1;
    }

    const funnel = await prisma.enquiry.groupBy({ by: ["status"], _count: true });
    const campaignMap = new Map<string, { leads: number; admissions: number; channel: string }>();
    for (const submission of campaignSubmissions) {
      const name = submission.utmCampaign?.trim() || "Organic / direct";
      const existing = campaignMap.get(name) ?? { leads: 0, admissions: 0, channel: submission.trafficChannel ?? "DIRECT" };
      existing.leads += 1;
      campaignMap.set(name, existing);
    }
    for (const admission of admissionsMonth) {
      const name = admission.enquiry?.latestUtmCampaign?.trim() || "Organic / direct";
      const existing = campaignMap.get(name) ?? {
        leads: 0,
        admissions: 0,
        channel: admission.enquiry?.latestTrafficChannel ?? admission.enquiry?.source ?? "DIRECT",
      };
      existing.admissions += 1;
      campaignMap.set(name, existing);
    }
    const birthdays = activeStudents
      .map((student) => {
        const birthday = new Date(now.getFullYear(), student.dateOfBirth.getMonth(), student.dateOfBirth.getDate());
        if (birthday < today) birthday.setFullYear(now.getFullYear() + 1);
        const days = Math.floor((birthday.getTime() - today.getTime()) / 86_400_000);
        return { id: student.id, name: `${student.firstName} ${student.lastName ?? ""}`.trim(), days };
      })
      .filter((birthday) => birthday.days <= 7)
      .sort((a, b) => a.days - b.days);

    let finance: Record<string, number> | null = null;
    let paidMarketing: Record<string, number> | null = null;
    if (owner) {
      const [todayPayments, monthPayments, todayExpenses, monthExpenses, attributedPayments] = await Promise.all([
        prisma.feePayment.aggregate({
          where: { paymentDate: { gte: today, lt: tomorrow }, status: { in: ["PAID", "PARTIALLY_PAID"] } },
          _sum: { amountReceived: true },
        }),
        prisma.feePayment.aggregate({
          where: { paymentDate: { gte: month }, status: { in: ["PAID", "PARTIALLY_PAID"] } },
          _sum: { amountReceived: true },
        }),
        prisma.expense.aggregate({ where: { expenseDate: { gte: today, lt: tomorrow } }, _sum: { totalAmount: true } }),
        prisma.expense.aggregate({ where: { expenseDate: { gte: month } }, _sum: { totalAmount: true } }),
        prisma.feePayment.findMany({
          where: {
            paymentDate: { gte: month },
            status: { in: ["PAID", "PARTIALLY_PAID"] },
          },
          select: {
            amountReceived: true,
            student: {
              select: {
                admission: {
                  select: {
                    enquiry: { select: { source: true, latestTrafficChannel: true } },
                  },
                },
              },
            },
          },
        }),
      ]);
      const revenueMonth = number(monthPayments._sum.amountReceived);
      const expensesMonth = number(monthExpenses._sum.totalAmount);
      finance = {
        revenueToday: number(todayPayments._sum.amountReceived),
        collectionToday: number(todayPayments._sum.amountReceived),
        revenueMonth,
        expensesToday: number(todayExpenses._sum.totalAmount),
        expensesMonth,
        profitEstimate: revenueMonth - expensesMonth,
      };
      let googleRevenue = 0;
      let metaRevenue = 0;
      for (const payment of attributedPayments) {
        const channel = payment.student.admission?.enquiry?.latestTrafficChannel;
        const source = payment.student.admission?.enquiry?.source;
        if (channel === "GOOGLE_ADS" || source === "GOOGLE_ADS") googleRevenue += Number(payment.amountReceived);
        if (channel === "META_ADS" || source === "META_ADS") metaRevenue += Number(payment.amountReceived);
      }
      const googleSpend = websiteOperations.monthlyGoogleAdsSpend;
      const metaSpend = websiteOperations.monthlyMetaAdsSpend;
      const googleAdmissions = admissionsMonth.filter((item) => item.enquiry?.latestTrafficChannel === "GOOGLE_ADS" || item.enquiry?.source === "GOOGLE_ADS").length;
      const metaAdmissions = admissionsMonth.filter((item) => item.enquiry?.latestTrafficChannel === "META_ADS" || item.enquiry?.source === "META_ADS").length;
      paidMarketing = {
        googleSpend,
        googleRevenue,
        googleAdmissions,
        googleRoi: googleSpend > 0 ? Math.round(((googleRevenue - googleSpend) / googleSpend) * 100) : 0,
        metaSpend,
        metaRevenue,
        metaAdmissions,
        metaRoi: metaSpend > 0 ? Math.round(((metaRevenue - metaSpend) / metaSpend) * 100) : 0,
      };
    }

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      role: session.role,
      operations: {
        enquiriesToday: todayEnquiries.length,
        ...sourceCounts,
        visitsBooked: appointments.filter((item) => item.kind === "VISIT" && item.status === "SCHEDULED").length,
        visitsCompleted: appointments.filter((item) => item.kind === "VISIT" && item.status === "COMPLETED").length,
        trials: appointments.filter((item) => item.kind === "TRIAL").length,
        admissionsToday,
        pendingFollowUps,
        pendingAdmissions,
        pendingFees: pendingInvoices._count,
        outstandingFees: number(pendingInvoices._sum?.pendingAmount),
        pendingDocuments,
        daycareToday,
        pendingLeaveRequests,
        growthRecommendations,
      },
      attendance: {
        students: Object.fromEntries(studentAttendance.map((item) => [item.status, item._count])),
        staff: Object.fromEntries(staffAttendance.map((item) => [item.status, item._count])),
      },
      birthdays,
      funnel: funnel.map((item) => ({ status: item.status, count: item._count })),
      campaigns: Array.from(campaignMap.entries())
        .map(([name, value]) => ({ name, ...value }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 5),
      organicGrowth: previousOrganic ? Math.round(((currentOrganic - previousOrganic) / previousOrganic) * 100) : currentOrganic ? 100 : 0,
      marketingJobs,
      whatsappJobs,
      paidMarketing,
      finance,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: "You are not authorised." }, { status: 401 });
    }
    logServerError("Unable to load the live dashboard.", error);
    return NextResponse.json({ success: false, message: "Unable to refresh dashboard data." }, { status: 500 });
  }
}
