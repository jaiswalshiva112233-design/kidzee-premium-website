import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  BellRing,
  Cake,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  DatabaseBackup,
  FileText,
  GalleryHorizontalEnd,
  Globe2,
  IndianRupee,
  MessageSquareText,
  Megaphone,
  ReceiptText,
  Settings,
  SearchCheck,
  TrendingUp,
  UserRoundPlus,
  UserRoundCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import DashboardAnalytics from "@/components/admin/dashboard/DashboardAnalytics";
import { getAdminSession } from "@/lib/admin/auth";
import { canAccessAdminPath } from "@/lib/admin/permissions";
import { prisma } from "@/lib/prisma";
import { getWebsiteTrackingSettings } from "@/lib/sanity/websiteSettings";

const programmeLabels: Record<string, string> = {
  PLAYGROUP: "Playgroup",
  NURSERY: "Nursery",
  JUNIOR_KG: "Junior KG",
  SENIOR_KG: "Senior KG",
  DAYCARE: "Daycare",
};

const enquirySourceLabels: Record<string, string> = {
  WEBSITE: "Website",
  FORMSPREE: "Website Form",
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  WHATSAPP: "WhatsApp",
  PHONE_CALL: "Phone Call",
  WALK_IN: "Walk-in",
  REFERRAL: "Referral",
  OTHER: "Other",
};

const enquiryStatusStyles: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-purple-50 text-purple-700",
  NO_ANSWER: "bg-slate-100 text-slate-600",
  VISIT_SCHEDULED: "bg-indigo-50 text-indigo-700",
  TRIAL_SCHEDULED: "bg-amber-50 text-amber-700",
  INTERESTED: "bg-green-50 text-green-700",
  FOLLOW_UP: "bg-orange-50 text-orange-700",
  ADMITTED: "bg-emerald-50 text-emerald-700",
  NOT_INTERESTED: "bg-red-50 text-red-700",
  CLOSED: "bg-slate-100 text-slate-600",
};

const digitalSourceStyles: Record<string, string> = {
  WEBSITE: "border-green-200 bg-green-50 text-green-700",
  FORMSPREE: "border-green-200 bg-green-50 text-green-700",
  GOOGLE_ADS: "border-blue-200 bg-blue-50 text-blue-700",
  META_ADS: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

function startOfToday() {
  return new Date(`${createIndiaDateKey(new Date())}T00:00:00.000+05:30`);
}

function endOfToday() {
  return new Date(startOfToday().getTime() + 86_400_000 - 1);
}

function startOfMonth() {
  const [year, month] = createIndiaDateKey(new Date()).split("-");
  return new Date(
    `${year}-${month}-01T00:00:00.000+05:30`,
  );
}

function startOfSixMonthPeriod() {
  const [year, month] = createIndiaDateKey(new Date())
    .split("-")
    .map(Number);
  const anchor = new Date(
    Date.UTC(year, month - 1 - 5, 1),
  );
  const anchorYear = anchor.getUTCFullYear();
  const anchorMonth = String(anchor.getUTCMonth() + 1).padStart(2, "0");

  return new Date(`${anchorYear}-${anchorMonth}-01T00:00:00.000+05:30`);
}

function createMonthKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(value);
}

function createIndiaDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function createSixMonthBuckets() {
  const [year, month] = createIndiaDateKey(new Date())
    .split("-")
    .map(Number);

  return Array.from({ length: 6 }, (_, index) => {
    const utcAnchor = new Date(
      Date.UTC(year, month - 1 - 5 + index, 1),
    );
    const date = new Date(
      `${utcAnchor.getUTCFullYear()}-${String(utcAnchor.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00.000+05:30`,
    );

    return {
      key: createMonthKey(date),

      label: new Intl.DateTimeFormat("en-IN", {
        month: "short",
        timeZone: "Asia/Kolkata",
      }).format(date),

      enquiries: 0,
      admissions: 0,
      revenue: 0,
      expenses: 0,
    };
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000);
}

function getBirthdayInYear(dateOfBirth: Date, year: number) {
  const [, monthText, dayText] = createIndiaDateKey(dateOfBirth).split("-");
  const month = Number(monthText);
  const originalDay = Number(dayText);
  const finalDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = String(Math.min(originalDay, finalDay)).padStart(2, "0");

  return new Date(
    `${year}-${monthText}-${day}T00:00:00.000+05:30`,
  );
}

function getNextBirthday(dateOfBirth: Date, today: Date) {
  let birthday = getBirthdayInYear(
    dateOfBirth,
    Number(createIndiaDateKey(today).slice(0, 4)),
  );

  if (birthday < today) {
    birthday = getBirthdayInYear(
      dateOfBirth,
      Number(createIndiaDateKey(today).slice(0, 4)) + 1,
    );
  }

  return birthday;
}

function studentFullName(student: {
  firstName: string;
  middleName: string | null;
  lastName: string | null;
}) {
  return [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getStudentCapacity(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return 60;
  }

  const capacity = Number(
    (value as Record<string, unknown>)
      .studentCapacity,
  );

  return Number.isInteger(capacity) &&
    capacity >= 1 &&
    capacity <= 10000
    ? capacity
    : 60;
}

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const canViewPayroll =
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("payroll.manage");
  const canOpen = (href: string) =>
    canAccessAdminPath(href.split(/[?#]/, 1)[0], session);
  const canViewEnquiries = canOpen("/admin/enquiries");
  const canViewStudents = canOpen("/admin/students");
  const canViewWebsite = canOpen("/admin/website");
  const canViewFinance = [
    "/admin/fees",
    "/admin/revenue",
    "/admin/receipts",
    "/admin/expenses",
  ].some(canOpen);
  const canViewNetPosition =
    canOpen("/admin/revenue") && canOpen("/admin/expenses");

  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const tomorrowStart = addDays(todayStart, 1);
  const tomorrowEnd = addDays(todayEnd, 1);
  const birthdayWindowEnd = addDays(todayEnd, 7);
  const monthStart = startOfMonth();
  const sixMonthStart = startOfSixMonthPeriod();
  const sevenDayStart = addDays(todayStart, -6);

  const [
    totalStudents,
    preschoolStrength,
    daycareStrength,
    mealStrength,
    recurringContractValue,
    totalEnquiries,
    newEnquiries,
    enquiriesToday,
    pendingFollowUps,
    visitsScheduled,
    admittedEnquiries,
    revenueThisMonth,
    expensesThisMonth,
    pendingFees,
    issuedReceipts,
    activeStaffCount,
    studentAttendanceToday,
    staffAttendanceToday,
    pendingStaffLeave,
    approvedPayroll,
    recentEnquiries,
    upcomingFollowUps,
    sixMonthEnquiries,
    sixMonthPayments,
    sixMonthExpenses,
    programmeGroups,
    enquirySourceGroups,
    schoolProfileSetting,
    activeStudentsForBirthdays,
    tomorrowEvents,
    todayDaycareSessions,
    overdueInvoiceCount,
    digitalLeadsToday,
    newDigitalLeads,
    digitalLeadSourceGroups,
    recentDigitalLeads,
    newCareerApplicants,
    trackingSettings,
  ] = await Promise.all([
    prisma.studentEnrollmentContract.count({
      where: {
        status: "ACTIVE",
        student: { status: "ACTIVE" },
      },
    }),

    prisma.studentEnrollmentContract.count({
      where: {
        status: "ACTIVE",
        preschoolEnabled: true,
        student: { status: "ACTIVE" },
      },
    }),

    prisma.studentEnrollmentContract.count({
      where: {
        status: "ACTIVE",
        daycareEnabled: true,
        student: { status: "ACTIVE" },
      },
    }),

    prisma.studentEnrollmentContract.count({
      where: {
        status: "ACTIVE",
        mealsEnabled: true,
        student: { status: "ACTIVE" },
      },
    }),

    prisma.contractService.aggregate({
      where: {
        status: "ACTIVE",
        recurring: true,
        effectiveFrom: { lte: todayEnd },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: todayStart } }],
        contract: { status: "ACTIVE", student: { status: "ACTIVE" } },
      },
      _sum: { total: true },
    }),

    prisma.enquiry.count(),

    prisma.enquiry.count({
      where: {
        status: "NEW",
      },
    }),

    prisma.enquiry.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),

    prisma.followUp.count({
      where: {
        status: "PENDING",

        dueAt: {
          lte: todayEnd,
        },
      },
    }),

    prisma.enquiry.count({
      where: {
        status: "VISIT_SCHEDULED",
      },
    }),

    prisma.enquiry.count({
      where: {
        status: "ADMITTED",
      },
    }),

    prisma.feePayment.aggregate({
      where: {
        paymentDate: {
          gte: monthStart,
          lte: todayEnd,
        },

        status: {
          in: ["PAID", "PARTIALLY_PAID"],
        },
      },

      _sum: {
        amountReceived: true,
      },
    }),

    prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: monthStart,
          lte: todayEnd,
        },
      },

      _sum: {
        totalAmount: true,
      },
    }),

    prisma.feeInvoice.aggregate({
  where: {
    status: {
      in: [
        "DUE",
        "PARTIALLY_PAID",
        "OVERDUE",
      ],
    },
  },

  _sum: {
    pendingAmount: true,
  },
}),

    prisma.receipt.count({
      where: {
        status: "ISSUED",
      },
    }),

    prisma.staff.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.studentAttendance.count({
      where: {
        attendanceDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        student: {
          status: "ACTIVE",
        },
      },
    }),

    prisma.staffAttendance.count({
      where: {
        attendanceDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        staff: {
          status: "ACTIVE",
        },
      },
    }),

    prisma.staffLeaveRequest.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.staffPayroll.aggregate({
      where: {
        status: "APPROVED",
      },
      _count: {
        _all: true,
      },
      _sum: {
        netPayable: true,
      },
    }),

    prisma.enquiry.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    }),

    prisma.followUp.findMany({
      where: {
        status: "PENDING",
      },

      include: {
        enquiry: {
          select: {
            id: true,
            enquiryNumber: true,
            parentName: true,
            childName: true,
            phone: true,
          },
        },
      },

      orderBy: {
        dueAt: "asc",
      },

      take: 6,
    }),

    prisma.enquiry.findMany({
      where: {
        OR: [
          {
            createdAt: {
              gte: sixMonthStart,
            },
          },
          {
            admittedAt: {
              gte: sixMonthStart,
            },
          },
        ],
      },

      select: {
        createdAt: true,
        admittedAt: true,
        status: true,
      },
    }),

    prisma.feePayment.findMany({
      where: {
        paymentDate: {
          gte: sixMonthStart,
        },

        status: {
          in: ["PAID", "PARTIALLY_PAID"],
        },
      },

      select: {
        paymentDate: true,
        amountReceived: true,
      },
    }),

    prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: sixMonthStart,
        },
      },

      select: {
        expenseDate: true,
        totalAmount: true,
      },
    }),

    prisma.studentEnrollmentContract.findMany({
      where: {
        status: "ACTIVE",
        preschoolEnabled: true,
        student: { status: "ACTIVE" },
      },
      select: { preschoolClass: true },
    }),

    prisma.enquiry.groupBy({
      by: ["source"],

      _count: {
        _all: true,
      },

      orderBy: {
        source: "asc",
      },
    }),

    prisma.centreSetting.findUnique({
      where: {
        key: "SCHOOL_PROFILE",
      },
      select: {
        value: true,
      },
    }),

    prisma.student.findMany({
      where: {
        status: "ACTIVE",
        enrollmentContract: { is: { status: "ACTIVE" } },
      },
      select: {
        id: true,
        studentNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        dateOfBirth: true,
        programme: true,
      },
      orderBy: {
        firstName: "asc",
      },
    }),

    prisma.academicCalendarEvent.findMany({
      where: {
        active: true,
        OR: [
          {
            startDate: {
              gte: tomorrowStart,
              lte: tomorrowEnd,
            },
          },
          {
            startDate: {
              lte: tomorrowEnd,
            },
            endDate: {
              gte: tomorrowStart,
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        eventType: true,
        startDate: true,
        endDate: true,
        description: true,
      },
      orderBy: [
        { startDate: "asc" },
        { title: "asc" },
      ],
    }),

    prisma.daycareSession.findMany({
      where: {
        sessionDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        id: true,
        status: true,
      },
    }),

    prisma.feeInvoice.count({
      where: {
        pendingAmount: {
          gt: 0,
        },
        status: {
          in: [
            "DUE",
            "PARTIALLY_PAID",
            "OVERDUE",
          ],
        },
        dueDate: {
          lt: todayStart,
        },
      },
    }),

    prisma.websiteLeadSubmission.count({
      where: {
        trafficClass: "GENUINE",
        leadType: "admission",
        isInternal: false,
        isTest: false,
        isBot: false,
        receivedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),

    prisma.enquiry.count({
      where: {
        source: {
          in: ["WEBSITE", "FORMSPREE", "GOOGLE_ADS", "META_ADS"],
        },
        status: "NEW",
      },
    }),

    prisma.websiteLeadSubmission.groupBy({
      by: ["source"],
      where: {
        trafficClass: "GENUINE",
        leadType: "admission",
        isInternal: false,
        isTest: false,
        isBot: false,
        receivedAt: {
          gte: sevenDayStart,
          lte: todayEnd,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        source: "asc",
      },
    }),

    prisma.websiteLeadSubmission.findMany({
      where: {
        trafficClass: "GENUINE",
        leadType: "admission",
        isInternal: false,
        isTest: false,
        isBot: false,
      },
      select: {
        id: true,
        source: true,
        receivedAt: true,
        enquiry: {
          select: {
            enquiryNumber: true,
            parentName: true,
            childName: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: {
        receivedAt: "desc",
      },
      take: 8,
    }),

    prisma.careerApplication.count({
      where: {
        status: "NEW",
      },
    }),

    getWebsiteTrackingSettings(),
  ]);

  const upcomingBirthdays =
    activeStudentsForBirthdays
      .map((student) => ({
        ...student,
        name: studentFullName(student),
        nextBirthday: getNextBirthday(
          student.dateOfBirth,
          todayStart,
        ),
      }))
      .filter(
        (student) =>
          student.nextBirthday >= todayStart &&
          student.nextBirthday <= birthdayWindowEnd,
      )
      .sort(
        (first, second) =>
          first.nextBirthday.getTime() -
          second.nextBirthday.getTime(),
      );

  const bookedDaycareToday =
    todayDaycareSessions.filter(
      (daycareSession) =>
        daycareSession.status === "BOOKED",
    ).length;

  const monthlyRevenue = Number(
    revenueThisMonth._sum.amountReceived ?? 0,
  );

  const monthlyExpenses = Number(
    expensesThisMonth._sum.totalAmount ?? 0,
  );

  const outstandingFees = Number(
    pendingFees._sum.pendingAmount ?? 0,
  );

  const studentAttendanceRemaining =
    Math.max(
      preschoolStrength - studentAttendanceToday,
      0,
    );

  const staffAttendanceRemaining = Math.max(
    activeStaffCount - staffAttendanceToday,
    0,
  );

  const approvedPayrollCount =
    approvedPayroll._count._all;

  const approvedPayrollAmount = Number(
    approvedPayroll._sum.netPayable ?? 0,
  );

  const operatingResult =
    monthlyRevenue - monthlyExpenses;

  const studentCapacity = getStudentCapacity(
    schoolProfileSetting?.value,
  );

  const seatsAvailable = Math.max(
    studentCapacity - totalStudents,
    0,
  );

  const occupancyPercentage = Math.min(
    Math.round(
      (totalStudents / studentCapacity) * 100,
    ),
    100,
  );

  const monthBuckets = createSixMonthBuckets();

  const monthBucketMap = new Map(
    monthBuckets.map((bucket) => [
      bucket.key,
      bucket,
    ]),
  );

  sixMonthEnquiries.forEach((enquiry) => {
    const enquiryBucket = monthBucketMap.get(
      createMonthKey(enquiry.createdAt),
    );

    if (enquiryBucket) {
      enquiryBucket.enquiries += 1;
    }

    if (enquiry.admittedAt) {
      const admissionBucket = monthBucketMap.get(
        createMonthKey(enquiry.admittedAt),
      );

      if (admissionBucket) {
        admissionBucket.admissions += 1;
      }
    } else if (enquiry.status === "ADMITTED") {
      const fallbackBucket = monthBucketMap.get(
        createMonthKey(enquiry.createdAt),
      );

      if (fallbackBucket) {
        fallbackBucket.admissions += 1;
      }
    }
  });

  sixMonthPayments.forEach((payment) => {
    const bucket = monthBucketMap.get(
      createMonthKey(payment.paymentDate),
    );

    if (bucket) {
      bucket.revenue += Number(
        payment.amountReceived,
      );
    }
  });

  sixMonthExpenses.forEach((expense) => {
    const bucket = monthBucketMap.get(
      createMonthKey(expense.expenseDate),
    );

    if (bucket) {
      bucket.expenses += Number(
        expense.totalAmount,
      );
    }
  });

  const monthlyTrend = monthBuckets.map(
    (bucket) => ({
      month: bucket.label,
      enquiries: bucket.enquiries,
      admissions: bucket.admissions,
      revenue: bucket.revenue,
      expenses: bucket.expenses,
    }),
  );

  const programmeDistribution = Array.from(
    programmeGroups.reduce((counts, group) => {
      const label = group.preschoolClass || "Preschool";
      counts.set(label, (counts.get(label) ?? 0) + 1);
      return counts;
    }, new Map<string, number>()),
    ([label, value]) => ({ label, value }),
  );

  const enquirySources = enquirySourceGroups
    .map((group) => ({
      label:
        enquirySourceLabels[group.source] ??
        group.source,

      value: group._count._all,
    }))
    .sort((first, second) =>
      second.value - first.value,
    );

  const digitalLeadCounts = new Map(
    digitalLeadSourceGroups.map((group) => [
      group.source,
      group._count._all,
    ]),
  );

  const organicLeadsSevenDays =
    (digitalLeadCounts.get("WEBSITE") ?? 0) +
    (digitalLeadCounts.get("FORMSPREE") ?? 0);
  const googleLeadsSevenDays =
    digitalLeadCounts.get("GOOGLE_ADS") ?? 0;
  const metaLeadsSevenDays =
    digitalLeadCounts.get("META_ADS") ?? 0;
  const digitalLeadsSevenDays =
    organicLeadsSevenDays +
    googleLeadsSevenDays +
    metaLeadsSevenDays;

  const googleAnalyticsReady = Boolean(
    trackingSettings.analyticsEnabled &&
      (trackingSettings.googleTagManagerId ||
        trackingSettings.googleAnalyticsId),
  );
  const googleAdsReady = Boolean(
    trackingSettings.advertisingEnabled &&
      trackingSettings.googleAdsId &&
      trackingSettings.googleAdsConversionLabel,
  );
  const metaAdsReady = Boolean(
    trackingSettings.metaPixelEnabled && trackingSettings.metaPixelId,
  );

  const leadSourceCards = [
    {
      title: "Organic Website",
      value: organicLeadsSevenDays,
      detail: "Direct and search visitors",
      icon: Globe2,
      accent: "bg-green-50 text-green-700",
      connected: true,
    },
    {
      title: "Google Ads",
      value: googleLeadsSevenDays,
      detail: "Campaign leads with Google attribution",
      icon: SearchCheck,
      accent: "bg-blue-50 text-blue-700",
      connected: googleAdsReady,
    },
    {
      title: "Meta Ads",
      value: metaLeadsSevenDays,
      detail: "Facebook and Instagram leads",
      icon: Megaphone,
      accent: "bg-indigo-50 text-indigo-700",
      connected: metaAdsReady,
    },
  ] as const;

  const summaryCards = [
    {
      title: "Current Students",
      value: totalStudents.toString(),
      detail: `${seatsAvailable} seats available`,
      href: "/admin/students",
      icon: UsersRound,
      accent: "bg-[#F0E7F5] text-[#5B2A86]",
    },
    {
      title: "Preschool Strength",
      value: preschoolStrength.toString(),
      detail: "Active preschool contracts",
      href: "/admin/students",
      icon: UsersRound,
      accent: "bg-[#FFF7D8] text-[#7A5B00]",
    },
    {
      title: "Daycare Strength",
      value: daycareStrength.toString(),
      detail: `${mealStrength} active meal plans`,
      href: "/admin/daycare",
      icon: CalendarClock,
      accent: "bg-[#E9F8F1] text-[#16734A]",
    },
    ...(canOpen("/admin/fees")
      ? [
          {
            title: "Monthly Contract Value",
            value: formatCurrency(
              Number(recurringContractValue._sum.total ?? 0),
            ),
            detail: "Active recurring service snapshots",
            href: "/admin/fees",
            icon: IndianRupee,
            accent: "bg-[#F3EAF8] text-[#5B2A86]",
          },
        ]
      : []),
    {
      title: "Total Enquiries",
      value: totalEnquiries.toString(),
      detail: `${enquiriesToday} received today`,
      href: "/admin/enquiries",
      icon: MessageSquareText,
      accent: "bg-[#E8F4FF] text-[#1769AA]",
    },
    {
      title: "New Enquiries",
      value: newEnquiries.toString(),
      detail: "Awaiting first response",
      href: "/admin/enquiries?status=NEW",
      icon: UserRoundPlus,
      accent: "bg-[#FFF0E8] text-[#A65325]",
    },
    {
      title: "Follow-ups Due",
      value: pendingFollowUps.toString(),
      detail: "Due today or overdue",
      href: "/admin/enquiries?view=follow-ups",
      icon: CalendarClock,
      accent: "bg-[#FFF3D5] text-[#8A6100]",
    },
    {
      title: "Visits Scheduled",
      value: visitsScheduled.toString(),
      detail: "Parents expected to visit",
      href: "/admin/enquiries?status=VISIT_SCHEDULED",
      icon: Clock3,
      accent: "bg-[#EEF2FF] text-[#4C5DA8]",
    },
    {
      title: "Confirmed Admissions",
      value: admittedEnquiries.toString(),
      detail: "Converted from enquiries",
      href: "/admin/admissions",
      icon: UserRoundCheck,
      accent: "bg-[#E9F8F2] text-[#28755D]",
    },
  ] as const;

  const financeCards = [
    {
      title: "Revenue This Month",
      value: formatCurrency(monthlyRevenue),
      href: "/admin/fees",
      icon: IndianRupee,
      accent: "text-[#28755D]",
    },
    {
      title: "Expenses This Month",
      value: formatCurrency(monthlyExpenses),
      href: "/admin/expenses",
      icon: WalletCards,
      accent: "text-[#A65325]",
    },
    {
      title: "Pending Fees",
      value: formatCurrency(outstandingFees),
      href: "/admin/fees",
      icon: CircleDollarSign,
      accent: "text-[#B33A3A]",
    },
    {
      title: "Receipts Issued",
      value: issuedReceipts.toString(),
      href: "/admin/receipts",
      icon: ReceiptText,
      accent: "text-[#5B2A86]",
    },
  ] as const;

  const operationsCards = [
    {
      title: "Student Attendance",
      value: `${studentAttendanceToday}/${preschoolStrength}`,
      detail:
        studentAttendanceRemaining > 0
          ? `${studentAttendanceRemaining} student record${
              studentAttendanceRemaining === 1
                ? ""
                : "s"
            } still unmarked today`
          : "All active students are marked today",
      href: "/admin/attendance",
      icon: UserRoundCheck,
      accent: "bg-blue-50 text-blue-700",
    },
    {
      title: "Staff Attendance",
      value: `${staffAttendanceToday}/${activeStaffCount}`,
      detail:
        staffAttendanceRemaining > 0
          ? `${staffAttendanceRemaining} staff record${
              staffAttendanceRemaining === 1
                ? ""
                : "s"
            } still unmarked today`
          : "All active staff are marked today",
      href: "/admin/staff/attendance",
      icon: UsersRound,
      accent: "bg-purple-50 text-purple-700",
    },
    {
      title: "Pending Staff Leave",
      value: pendingStaffLeave.toString(),
      detail:
        pendingStaffLeave > 0
          ? "Leave requests need review"
          : "No leave requests waiting",
      href: "/admin/staff/leave",
      icon: CalendarClock,
      accent: "bg-amber-50 text-amber-700",
    },
    {
      title: "Birthdays in Next 7 Days",
      value: upcomingBirthdays.length.toString(),
      detail:
        upcomingBirthdays.length > 0
          ? `${upcomingBirthdays[0].name} is next`
          : "No student birthday in the next 7 days",
      href: "/admin/students",
      icon: Cake,
      accent: "bg-pink-50 text-pink-700",
    },
    {
      title: "Tomorrow's Calendar",
      value: tomorrowEvents.length.toString(),
      detail:
        tomorrowEvents[0]?.title ??
        "No event scheduled for tomorrow",
      href: "/admin/calendar",
      icon: CalendarDays,
      accent: "bg-indigo-50 text-indigo-700",
    },
    {
      title: "Daycare Today",
      value: todayDaycareSessions.length.toString(),
      detail:
        bookedDaycareToday > 0
          ? `${bookedDaycareToday} booking${
              bookedDaycareToday === 1 ? "" : "s"
            } still need completion`
          : "No unbilled daycare booking waiting",
      href: "/admin/daycare",
      icon: CalendarClock,
      accent: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "New Job Applicants",
      value: newCareerApplicants.toString(),
      detail:
        newCareerApplicants > 0
          ? "Applications are ready for review"
          : "No application waiting for review",
      href: "/admin/careers",
      icon: BriefcaseBusiness,
      accent: "bg-violet-50 text-violet-700",
    },
    {
      title: "Overdue Fee Accounts",
      value: overdueInvoiceCount.toString(),
      detail:
        overdueInvoiceCount > 0
          ? "Payment follow-up is required"
          : "No overdue fee account",
      href: "/admin/fees",
      icon: CircleDollarSign,
      accent: "bg-red-50 text-red-700",
    },
    ...(canViewPayroll
      ? [
          {
            title: "Approved Payroll",
            value: formatCurrency(
              approvedPayrollAmount,
            ),
            detail:
              approvedPayrollCount > 0
                ? `${approvedPayrollCount} approved salary record${
                    approvedPayrollCount === 1
                      ? ""
                      : "s"
                  } waiting for payment`
                : "No approved salary waiting",
            href: "/admin/staff/payroll",
            icon: WalletCards,
            accent:
              "bg-emerald-50 text-emerald-700",
          },
        ]
      : []),
  ];

  const dailyActions = [
    {
      title: "Admissions",
      description:
        "Continue an admission, review its contract and prepare the combined bill.",
      href: "/admin/admissions",
      icon: UserRoundCheck,
    },
    {
      title: "Student attendance",
      description:
        "Mark and review today's attendance.",
      href: "/admin/attendance",
      icon: UserRoundCheck,
    },
    {
      title: "Fees & receipts",
      description:
        "Collect a payment and issue its receipt.",
      href: "/admin/fees",
      icon: ReceiptText,
    },
    {
      title: "Daycare desk",
      description:
        "Check children in or out and record extra care or parent notes.",
      href: "/admin/daycare",
      icon: CalendarClock,
    },
  ];

  const centreTools = [
    {
      title: "Students",
      href: "/admin/students",
      icon: UserRoundPlus,
    },
    {
      title: "Calendar",
      href: "/admin/calendar",
      icon: CalendarDays,
    },
    {
      title: "Expenses",
      href: "/admin/expenses",
      icon: WalletCards,
    },
    ...(canViewPayroll
      ? [
          {
            title: "Payroll",
            href: "/admin/staff/payroll",
            icon: WalletCards,
          },
        ]
      : []),
    {
      title: "Website",
      href: "/admin/website",
      icon: GalleryHorizontalEnd,
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: FileText,
    },
    {
      title: "Careers",
      href: "/admin/careers",
      icon: BriefcaseBusiness,
    },
    {
      title: "Receipts",
      href: "/admin/receipts",
      icon: ReceiptText,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
    ...(session.role === "OWNER"
      ? [
          {
            title: "Data & History",
            href: "/admin/settings/data",
            icon: DatabaseBackup,
          },
        ]
      : []),
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[32px] bg-[#2D1736] px-5 py-8 text-white shadow-[0_24px_70px_rgba(45,23,54,0.2)] sm:px-7 lg:px-9 lg:py-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />

          <div className="pointer-events-none absolute -bottom-32 right-28 h-64 w-64 rounded-full bg-[#F6C84B]/10 blur-2xl" />

          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <TrendingUp
                    aria-hidden="true"
                    size={23}
                  />
                </span>

                <p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B] sm:text-sm">
                  Kidzee Sector 12, Dwarka
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                Centre Dashboard
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                A live overview of students, enquiries,
                admissions, collections, expenses and
                follow-up work across your preschool.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              {canViewEnquiries ? (
                <Link
                  href="/admin/enquiries"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD65F]"
                >
                  Add Enquiry
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
              ) : null}

              {canViewWebsite ? (
                <Link
                  href="/admin/website"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
                >
                  Website CMS
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {canViewEnquiries ? (
        <section className="overflow-hidden rounded-[30px] border border-[#DED0E5] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.08)]">
          <div className="border-b border-[#E9E2ED] bg-[linear-gradient(135deg,#F8F1FB_0%,#FFFFFF_62%,#FFF8DD_100%)] p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5B2A86] text-white shadow-[0_12px_28px_rgba(91,42,134,0.22)]">
                  <BellRing aria-hidden="true" size={22} />
                  {newDigitalLeads > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F6C84B] px-1 text-[10px] font-black text-[#2D1736] ring-2 ring-white">
                      {newDigitalLeads > 99 ? "99+" : newDigitalLeads}
                    </span>
                  ) : null}
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                    Website & advertising leads
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
                    {digitalLeadsToday > 0
                      ? `${digitalLeadsToday} new lead${digitalLeadsToday === 1 ? "" : "s"} arrived today`
                      : "Your digital lead inbox is up to date"}
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#756A79]">
                    Organic, Google Ads and Meta Ads enquiries are identified
                    automatically and saved in the same follow-up window.
                  </p>
                </div>
              </div>

              <Link
                href="/admin/enquiries"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#4B206F]"
              >
                Open Lead Inbox
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="p-5 sm:p-7 xl:border-r xl:border-[#E9E2ED]">
              <div className="grid gap-3 sm:grid-cols-3">
                {leadSourceCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <article
                      key={card.title}
                      className="rounded-[22px] border border-[#ECE5EF] bg-[#FAF8FC] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.accent}`}>
                          <Icon aria-hidden="true" size={19} />
                        </span>
                        <span className={["rounded-full px-2.5 py-1 text-[9px] font-black uppercase", card.connected ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"].join(" ")}>
                          {card.connected ? "Ready" : "Setup needed"}
                        </span>
                      </div>
                      <p className="mt-4 text-2xl font-black text-[#2D1736]">
                        {card.value}
                      </p>
                      <p className="mt-1 text-sm font-black text-[#4F4354]">
                        {card.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#8A7F8D]">
                        {card.detail} · last 7 days
                      </p>
                    </article>
                  );
                })}
              </div>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                    Latest digital enquiries
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#817684]">
                    {digitalLeadsSevenDays} received in the last seven days
                  </p>
                </div>
                <Link href="/admin/enquiries" className="text-xs font-black text-[#5B2A86] hover:underline">
                  View all
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {recentDigitalLeads.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAF8FC] p-5 text-center text-sm font-bold text-[#817684]">
                    No website or advertising enquiry has arrived yet.
                  </div>
                ) : (
                  recentDigitalLeads.slice(0, 5).map((submission) => (
                    <Link
                      key={submission.id}
                      href={`/admin/enquiries?search=${encodeURIComponent(submission.enquiry.enquiryNumber)}`}
                      className="group flex flex-col gap-3 rounded-2xl border border-[#EEE8F1] bg-white p-4 transition hover:border-[#D7C8DF] hover:bg-[#FAF8FC] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-[#2D1736]">
                          {submission.enquiry.parentName}
                        </span>
                        <span className="mt-1 block truncate text-xs font-semibold text-[#817684]">
                          {submission.enquiry.childName ?? "Child name not entered"} · {submission.enquiry.phone}
                        </span>
                        <span className="mt-1 block text-[10px] font-bold text-[#9A8F9E]">
                          {formatDateTime(submission.receivedAt)}
                        </span>
                      </span>

                      <span className="flex items-center gap-2">
                        <span className={["rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.06em]", digitalSourceStyles[submission.source] ?? "border-[#E5DCE9] bg-[#F8F5F9] text-[#807486]"].join(" ")}>
                          {enquirySourceLabels[submission.source] ?? submission.source}
                        </span>
                        <span className={["rounded-full px-3 py-1.5 text-[9px] font-black uppercase", enquiryStatusStyles[submission.enquiry.status] ?? "bg-[#F3EAF8] text-[#5B2A86]"].join(" ")}>
                          {submission.enquiry.status.replaceAll("_", " ")}
                        </span>
                        <ArrowRight aria-hidden="true" size={15} className="text-[#B1A6B5] transition group-hover:translate-x-1 group-hover:text-[#5B2A86]" />
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <aside className="bg-[#FAF8FC] p-5 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                Conversion readiness
              </p>
              <h3 className="mt-2 text-xl font-black text-[#2D1736]">
                Google and Meta connection
              </h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#817684]">
                When connected, successful enquiry forms are sent as conversion
                events automatically after visitor consent.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  ["Google Analytics", googleAnalyticsReady],
                  ["Google Ads enquiry", googleAdsReady],
                  ["Meta enquiry", metaAdsReady],
                ].map(([label, ready]) => (
                  <div key={String(label)} className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E0EB] bg-white px-4 py-3">
                    <span className="text-sm font-black text-[#4F4354]">{label}</span>
                    <span className={["inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase", ready ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"].join(" ")}>
                      {ready ? <BadgeCheck aria-hidden="true" size={12} /> : null}
                      {ready ? "Connected" : "Not ready"}
                    </span>
                  </div>
                ))}
              </div>

              {canViewWebsite ? (
                <Link
                  href="/admin/website/seo#tracking-connections"
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
                >
                  Connect or Check Tracking
                  <ArrowRight aria-hidden="true" size={15} />
                </Link>
              ) : null}
            </aside>
          </div>
        </section>
        ) : null}

        <section>
  <div className="mb-6">
    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
      Live centre overview
    </p>

    <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
      Important information at a glance
    </h2>

    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
      Select any card to open the related CentreOS
      module.
    </p>
  </div>

  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {summaryCards.filter((card) => canOpen(card.href)).map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.title}
            href={card.href}
            className="group rounded-[22px] border border-[#E9E2ED] bg-white p-4 shadow-[0_12px_32px_rgba(45,23,54,0.05)] transition hover:-translate-y-1 hover:border-[#D6C6DE] hover:shadow-[0_16px_40px_rgba(45,23,54,0.09)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.accent}`}
              >
                <Icon
                  aria-hidden="true"
                  size={19}
                />
              </span>

              <ArrowRight
                aria-hidden="true"
                size={15}
                className="mt-1 text-[#B1A6B5] transition group-hover:translate-x-1 group-hover:text-[#5B2A86]"
              />
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#746A78]">
                  {card.title}
                </p>

                <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#2D1736]">
                  {card.value}
                </p>
              </div>
            </div>

            <p className="mt-2 text-[11px] font-semibold leading-5 text-[#928896]">
              {card.detail}
            </p>
          </Link>
        );
      })}
    </div>

    <DashboardAnalytics
      monthlyTrend={monthlyTrend}
      programmeDistribution={
        programmeDistribution
      }
      enquirySources={enquirySources}
    />
  </div>
</section>

        <section className="grid gap-6 xl:grid-cols-2">
          {canViewStudents ? (
          <div className="rounded-[28px] border border-[#F0DDE9] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-700">
                  <Cake aria-hidden="true" size={22} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-pink-700">
                    Seven-day birthday reminder
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                    Student birthdays coming up
                  </h2>
                </div>
              </div>
              <Link
                href="/admin/students"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E6DCEB] px-3 text-xs font-black text-[#5B2A86]"
              >
                Students
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </div>

            {upcomingBirthdays.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-[#FAF8FC] p-6 text-center text-sm font-bold text-[#817684]">
                No student birthday falls in the next seven days.
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {upcomingBirthdays.map((student) => {
                  const daysAway = Math.round(
                    (student.nextBirthday.getTime() -
                      todayStart.getTime()) /
                      86_400_000,
                  );

                  return (
                    <Link
                      key={student.id}
                      href={`/admin/students/${student.id}`}
                      className="group flex items-center gap-3 rounded-2xl border border-pink-100 bg-pink-50/55 p-4 transition hover:border-pink-200 hover:bg-pink-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-pink-700 shadow-sm">
                        {student.firstName.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-[#2D1736]">
                          {student.name}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-[#817684]">
                          {programmeLabels[student.programme] ?? student.programme} · {formatShortDate(student.nextBirthday)}
                        </span>
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-pink-700">
                        {daysAway === 0
                          ? "Today"
                          : daysAway === 1
                            ? "Tomorrow"
                            : `${daysAway} days`}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          ) : null}

          <div className="rounded-[28px] border border-[#E2E2F3] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <CalendarDays aria-hidden="true" size={22} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-indigo-700">
                    Tomorrow at the centre
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                    Calendar events and holidays
                  </h2>
                </div>
              </div>
              <Link
                href="/admin/calendar"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E6DCEB] px-3 text-xs font-black text-[#5B2A86]"
              >
                Calendar
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </div>

            {tomorrowEvents.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-[#FAF8FC] p-6 text-center text-sm font-bold text-[#817684]">
                Nothing is scheduled for tomorrow. Add activities, meetings or deadlines in Centre Calendar.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {tomorrowEvents.map((event) => (
                  <Link
                    key={event.id}
                    href="/admin/calendar"
                    className="group flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/45 p-4 transition hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm">
                      <CalendarClock aria-hidden="true" size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-[#2D1736]">
                        {event.title}
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
                        {event.eventType.replaceAll("_", " ")}
                        {event.description ? ` · ${event.description}` : ""}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      size={15}
                      className="mt-2 shrink-0 text-[#AAA0AE] transition group-hover:translate-x-1 group-hover:text-indigo-700"
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {canViewFinance ? (
            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                    Finance overview
                  </p>

                  <h2 className="mt-2 text-xl font-black text-[#2D1736] sm:text-2xl">
                    Monthly centre position
                  </h2>
                </div>

                {canViewNetPosition ? <p
                  className={[
                    "text-lg font-black",
                    operatingResult >= 0
                      ? "text-[#28755D]"
                      : "text-red-700",
                  ].join(" ")}
                >
                  Net:{" "}
                  {formatCurrency(operatingResult)}
                </p> : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {financeCards.filter((card) => canOpen(card.href)).map((card) => {
                  const Icon = card.icon;

                  return (
                    <Link
                      key={card.title}
                      href={card.href}
                      className="group rounded-[22px] bg-[#FAF8FC] p-5 transition hover:bg-[#F3EAF8]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${card.accent}`}
                        >
                          <Icon
                            aria-hidden="true"
                            size={19}
                          />
                        </span>

                        <ArrowRight
                          aria-hidden="true"
                          size={15}
                          className="text-[#B1A6B5] transition group-hover:translate-x-1 group-hover:text-[#5B2A86]"
                        />
                      </div>

                      <p className="mt-4 text-sm font-bold text-[#746A78]">
                        {card.title}
                      </p>

                      <p className="mt-1 break-words text-2xl font-black text-[#2D1736]">
                        {card.value}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
            ) : null}

            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                    Today&apos;s operations
                  </p>

                  <h2 className="mt-2 text-xl font-black text-[#2D1736] sm:text-2xl">
                    Work requiring attention
                  </h2>
                </div>

                <p className="max-w-sm text-xs font-semibold leading-5 text-[#817684] sm:text-right">
                  Open a card to complete attendance, leave review or salary
                  payment.
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {operationsCards.filter((card) => canOpen(card.href)).map((card) => {
                  const Icon = card.icon;

                  return (
                    <Link
                      key={card.title}
                      href={card.href}
                      className="group rounded-[22px] border border-[#EEE8F1] bg-[#FAF8FC] p-5 transition hover:-translate-y-0.5 hover:border-[#D6C6DE] hover:bg-[#F5EEF8]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card.accent}`}
                        >
                          <Icon
                            aria-hidden="true"
                            size={20}
                          />
                        </span>

                        <ArrowRight
                          aria-hidden="true"
                          size={16}
                          className="mt-1 text-[#B1A6B5] transition group-hover:translate-x-1 group-hover:text-[#5B2A86]"
                        />
                      </div>

                      <p className="mt-4 text-xs font-bold text-[#746A78]">
                        {card.title}
                      </p>

                      <p className="mt-1 break-words text-2xl font-black text-[#2D1736]">
                        {card.value}
                      </p>

                      <p className="mt-2 text-xs font-semibold leading-5 text-[#928896]">
                        {card.detail}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>

            {canViewEnquiries ? (
            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                    All enquiry channels
                  </p>

                  <h2 className="mt-2 text-xl font-black text-[#2D1736]">
                    Recent phone, walk-in and online leads
                  </h2>
                </div>

                <Link
                  href="/admin/enquiries"
                  className="inline-flex items-center gap-2 text-sm font-black text-[#5B2A86]"
                >
                  View all

                  <ArrowRight
                    aria-hidden="true"
                    size={15}
                  />
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {recentEnquiries.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAF8FC] p-5 text-center">
                    <p className="text-sm font-bold text-[#817684]">
                      No enquiries saved yet.
                    </p>
                  </div>
                ) : (
                  recentEnquiries.map((enquiry) => (
                    <Link
                      key={enquiry.id}
                      href={`/admin/enquiries?search=${encodeURIComponent(
                        enquiry.enquiryNumber,
                      )}`}
                      className="group flex flex-col gap-3 rounded-2xl bg-[#FAF8FC] p-4 transition hover:bg-[#F3EAF8] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#2D1736]">
                          {enquiry.parentName}
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-[#817684]">
                          {enquiry.childName ??
                            "Child name not entered"}{" "}
                          · {enquiry.phone}
                        </p>

                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#9A8F9E]">
                          {enquiry.enquiryNumber}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "w-fit rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em]",
                            enquiryStatusStyles[
                              enquiry.status
                            ] ??
                              "bg-[#F3EAF8] text-[#5B2A86]",
                          ].join(" ")}
                        >
                          {enquiry.status.replaceAll(
                            "_",
                            " ",
                          )}
                        </span>

                        <ArrowRight
                          aria-hidden="true"
                          size={15}
                          className="text-[#B1A6B5] transition group-hover:translate-x-1 group-hover:text-[#5B2A86]"
                        />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
            ) : null}

            <section>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                Daily workspace
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
                What would you like to do?
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {dailyActions.filter((action) => canOpen(action.href)).map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="group flex items-start gap-4 rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_12px_35px_rgba(45,23,54,0.05)] transition hover:-translate-y-1 hover:border-[#D7C8DF]"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86] transition group-hover:bg-[#5B2A86] group-hover:text-white">
                        <Icon
                          aria-hidden="true"
                          size={21}
                        />
                      </span>

                      <span className="min-w-0">
                        <span className="block text-base font-black text-[#2D1736]">
                          {action.title}
                        </span>

                        <span className="mt-1 block text-sm font-semibold leading-6 text-[#7B707F]">
                          {action.description}
                        </span>
                      </span>

                      <ArrowRight
                        aria-hidden="true"
                        size={17}
                        className="ml-auto mt-1 shrink-0 text-[#B0A5B4] transition group-hover:translate-x-1 group-hover:text-[#5B2A86]"
                      />
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[24px] border border-[#E9E2ED] bg-[#FAF8FC] p-4 sm:p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-black text-[#2D1736]">
                    More centre tools
                  </p>
                  <p className="text-xs font-semibold text-[#817684]">
                    Students, accounts, website and settings
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {centreTools.filter((tool) => canOpen(tool.href)).map((tool) => {
                    const Icon = tool.icon;

                    return (
                      <Link
                        key={tool.title}
                        href={tool.href}
                        className="group flex min-h-12 items-center gap-2.5 rounded-2xl border border-[#E8E0EC] bg-white px-3 py-2.5 text-sm font-black text-[#4F4354] transition hover:border-[#D7C8DF] hover:bg-[#F3EAF8] hover:text-[#5B2A86]"
                      >
                        <Icon
                          aria-hidden="true"
                          size={17}
                          className="shrink-0 text-[#7A459C]"
                        />
                        <span className="truncate">
                          {tool.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            {canViewStudents ? <Link
              href="/admin/students"
              className="group block rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] transition hover:-translate-y-1 hover:border-[#D7C8DF] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                    Student capacity
                  </p>

                  <h2 className="mt-2 text-xl font-black text-[#2D1736]">
                    {totalStudents} of{" "}
                    {studentCapacity} seats
                  </h2>

                  <p className="mt-2 text-sm font-semibold text-[#817684]">
                    {seatsAvailable} seats currently
                    available
                  </p>
                </div>

                <ArrowRight
                  aria-hidden="true"
                  size={18}
                  className="text-[#B1A6B5] transition group-hover:translate-x-1 group-hover:text-[#5B2A86]"
                />
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#EFE9F2]">
                <div
                  className="h-full rounded-full bg-[#5B2A86] transition-all"
                  style={{
                    width: `${occupancyPercentage}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs font-black">
                <span className="text-[#817684]">
                  Occupancy
                </span>

                <span className="text-[#5B2A86]">
                  {occupancyPercentage}%
                </span>
              </div>
            </Link> : null}

            {canViewEnquiries ? (
            <section className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF3D5] text-[#8A6100]">
                  <CalendarClock
                    aria-hidden="true"
                    size={21}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                    Follow-ups
                  </p>

                  <h2 className="text-lg font-black text-[#2D1736]">
                    Upcoming work
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {upcomingFollowUps.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAF8FC] p-4">
                    <p className="text-sm font-bold text-[#817684]">
                      No pending follow-ups.
                    </p>
                  </div>
                ) : (
                  upcomingFollowUps.map(
                    (followUp) => (
                      <Link
                        key={followUp.id}
                        href={`/admin/enquiries?search=${encodeURIComponent(
                          followUp.enquiry
                            .enquiryNumber,
                        )}`}
                        className="group block rounded-2xl bg-[#FAF8FC] p-4 transition hover:bg-[#FFF7E5]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#2D1736]">
                              {
                                followUp.enquiry
                                  .parentName
                              }
                            </p>

                            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#817684]">
                              {followUp.title}
                            </p>
                          </div>

                          <ArrowRight
                            aria-hidden="true"
                            size={15}
                            className="mt-1 shrink-0 text-[#B1A6B5] transition group-hover:translate-x-1 group-hover:text-[#8A6100]"
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-black text-[#8A6100]">
                            {formatDateTime(
                              followUp.dueAt,
                            )}
                          </p>

                          {followUp.dueAt <
                          todayStart ? (
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-black uppercase text-red-700">
                              Overdue
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase text-amber-700">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </Link>
                    ),
                  )
                )}
              </div>

              <Link
                href="/admin/enquiries?view=follow-ups"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#E1D8E5] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
              >
                View All Follow-ups

                <ArrowRight
                  aria-hidden="true"
                  size={15}
                />
              </Link>
            </section>
            ) : null}

            <section className="rounded-[26px] bg-[#2D1736] p-5 text-white shadow-[0_18px_48px_rgba(45,23,54,0.16)] sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#F6C84B]">
                Today
              </p>

              <h2 className="mt-2 text-xl font-black">
                Centre activity
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <ActivityValue
                  label="New enquiries"
                  value={canViewEnquiries ? enquiriesToday.toString() : "—"}
                />

                <ActivityValue
                  label="Follow-ups due"
                  value={canViewEnquiries ? pendingFollowUps.toString() : "—"}
                />

                <ActivityValue
                  label="Visits"
                  value={canViewEnquiries ? visitsScheduled.toString() : "—"}
                />

                <ActivityValue
                  label="Month revenue"
                  value={canOpen("/admin/revenue") ? formatCurrency(monthlyRevenue) : "—"}
                />
              </div>

              <p className="mt-5 text-xs font-semibold leading-6 text-white/55">
                Updated from your CentreOS database on{" "}
                {formatShortDate(new Date())}.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </AdminLayout>
  );
}

type ActivityValueProps = {
  label: string;
  value: string;
};

function ActivityValue({
  label,
  value,
}: ActivityValueProps) {
  return (
    <article className="rounded-2xl bg-white/10 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.09em] text-white/50">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-black text-white">
        {value}
      </p>
    </article>
  );
}
