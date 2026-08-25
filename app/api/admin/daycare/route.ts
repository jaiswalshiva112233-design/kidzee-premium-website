import type { $Enums, Prisma } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import {
  dateIsWithinEffectiveRange,
  effectiveRangesOverlap,
  getIndiaMonthRange,
} from "@/lib/admin/daycare-rules";
import { prepaidPlanCoversWeekday } from "@/lib/admin/academic-contract-rules";
import {
  calculateChargePricing,
  type ChargePriceType,
} from "@/lib/admin/charge-pricing";
import { getNextSequence } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";

type DaycareRequestBody = {
  action?: unknown;
  hourlyRate?: unknown;
  foodCharge?: unknown;
  lunchCharge?: unknown;
  eveningSnackCharge?: unknown;
  mealComboCharge?: unknown;
  fullDayRate?: unknown;
  fullDayFoodIncluded?: unknown;
  monthlyDaycareOnlyRate?: unknown;
  monthlyPreschoolAddonRate?: unknown;
  monthlySixHourRate?: unknown;
  monthlySixHalfHourRate?: unknown;
  gstApplicable?: unknown;
  gstRate?: unknown;
  priceType?: unknown;
  foodGstApplicable?: unknown;
  foodGstRate?: unknown;
  foodPriceType?: unknown;
  effectiveFrom?: unknown;
  planId?: unknown;
  planDefinitionId?: unknown;
  mealCombinationId?: unknown;
  recurring?: unknown;
  maximumVisitsOverride?: unknown;
  separateInvoice?: unknown;
  studentId?: unknown;
  title?: unknown;
  planType?: unknown;
  billingMode?: unknown;
  scheduledWeekdays?: unknown;
  foodRequired?: unknown;
  foodOption?: unknown;
  dailyHours?: unknown;
  includedDays?: unknown;
  monthlyFeeOverride?: unknown;
  monthlyFoodFeeOverride?: unknown;
  hourlyRateOverride?: unknown;
  foodChargeOverride?: unknown;
  fullDayRateOverride?: unknown;
  planFullDayFoodIncluded?: unknown;
  planEffectiveFrom?: unknown;
  planEffectiveTo?: unknown;
  notes?: unknown;
  sessionId?: unknown;
  sessionDate?: unknown;
  checkInAt?: unknown;
  checkOutAt?: unknown;
  billableHours?: unknown;
  baseAmount?: unknown;
  foodProvided?: unknown;
  sessionStatus?: unknown;
  reason?: unknown;
  pickupPerson?: unknown;
  approved?: unknown;
  mealIds?: unknown;
  operation?: unknown;
  confirmation?: unknown;
};

class DaycareRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function canUseDaycare(session: Awaited<ReturnType<typeof getAdminSession>>) {
  return Boolean(
    session &&
    (session.role === "OWNER" ||
      session.permissions.includes("*") ||
      session.permissions.includes("fees.collect") ||
      session.permissions.includes("fees.settings")),
  );
}

function canManageRates(session: Awaited<ReturnType<typeof getAdminSession>>) {
  return session?.role === "OWNER";
}

function cleanText(value: unknown, maximumLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function cleanOptionalText(value: unknown, maximumLength = 2000) {
  return cleanText(value, maximumLength) || null;
}

function parseMoney(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.round((number + Number.EPSILON) * 100) / 100
    : Number.NaN;
}

function parseBoolean(value: unknown) {
  return value === true || cleanText(value, 10).toLowerCase() === "true";
}

function parsePriceType(value: unknown): ChargePriceType {
  return cleanText(value, 30) === "GST_EXCLUSIVE"
    ? "GST_EXCLUSIVE"
    : "GST_INCLUSIVE";
}

function booleanValueOrDefault(value: unknown, fallback: boolean) {
  if (value === null || value === undefined || value === "") return fallback;
  return parseBoolean(value);
}

function parseDate(value: unknown, endOfDay = false) {
  const text = cleanText(value, 40);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const date = new Date(
    `${text}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function formatDateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function parseTimeOnDate(date: Date, value: unknown) {
  const text = cleanText(value, 10);

  if (!/^\d{2}:\d{2}$/.test(text)) {
    return null;
  }

  const [hours, minutes] = text.split(":").map(Number);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  const result = new Date(
    `${formatDateKey(date)}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00.000+05:30`,
  );
  return Number.isNaN(result.getTime()) ? null : result;
}

function parseBillingMode(value: unknown): $Enums.DaycareBillingMode | null {
  const text = cleanText(value, 30);
  return text === "HOURLY" || text === "FULL_DAY" ? text : null;
}

function parsePlanType(value: unknown): $Enums.DaycarePlanType | null {
  const text = cleanText(value, 50);

  return text === "OCCASIONAL" ||
    text === "FLEXIBLE_DAYS" ||
    text === "MONTHLY_DAYCARE_ONLY" ||
    text === "MONTHLY_PRESCHOOL_DAYCARE"
    ? text
    : null;
}

function parseFoodOption(value: unknown): $Enums.DaycareFoodOption | null {
  const text = cleanText(value, 40);

  return text === "NONE" ||
    text === "LUNCH" ||
    text === "EVENING_SNACK" ||
    text === "BOTH"
    ? text
    : null;
}

function foodOptionLabel(value: $Enums.DaycareFoodOption) {
  if (value === "LUNCH") return "lunch";
  if (value === "EVENING_SNACK") return "evening snack";
  if (value === "BOTH") return "lunch + evening snack";
  return "no meal";
}

function parseWeekdays(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(Number)
        .filter((day) => Number.isInteger(day) && day >= 1 && day <= 6),
    ),
  ].sort((left, right) => left - right);
}

function indiaWeekday(value: Date) {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  }).format(value);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(label);
}

function isCoveredByPrepaidPlan(
  plan: {
    planType: $Enums.DaycarePlanType;
    scheduledWeekdays: number[];
  } | null,
  sessionDate: Date,
) {
  return prepaidPlanCoversWeekday(
    plan?.planType ?? null,
    plan?.scheduledWeekdays ?? [],
    indiaWeekday(sessionDate),
  );
}

function optionalMoney(value: unknown) {
  if (value === null || value === undefined || cleanText(value, 40) === "") {
    return null;
  }

  const amount = parseMoney(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : Number.NaN;
}

function isSerializationConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2034"
  );
}

function isUniqueConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function studentName(student: {
  firstName: string;
  middleName: string | null;
  lastName: string | null;
}) {
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
}

async function getNextDaycareSessionNumber(
  transaction: Prisma.TransactionClient,
) {
  const sequence = await transaction.numberSequence.upsert({
    where: { key: "DAYCARE_SESSION" },
    create: {
      key: "DAYCARE_SESSION",
      prefix: "KZ-DC",
      currentValue: 1,
      minimumWidth: 4,
      resetPolicy: "NEVER",
    },
    update: {
      currentValue: { increment: 1 },
      prefix: "KZ-DC",
      minimumWidth: 4,
      resetPolicy: "NEVER",
    },
    select: {
      currentValue: true,
      prefix: true,
      minimumWidth: true,
    },
  });
  const serial = String(sequence.currentValue).padStart(
    sequence.minimumWidth,
    "0",
  );

  return {
    formattedNumber: sequence.prefix ? `${sequence.prefix}-${serial}` : serial,
  };
}

function serialiseRate(rate: {
  id: string;
  title: string;
  hourlyRate: unknown;
  foodCharge: unknown;
  lunchCharge: unknown;
  eveningSnackCharge: unknown;
  mealComboCharge: unknown;
  fullDayRate: unknown;
  fullDayFoodIncluded: boolean;
  monthlyDaycareOnlyRate: unknown;
  monthlyPreschoolAddonRate: unknown;
  monthlySixHourRate: unknown;
  monthlySixHalfHourRate: unknown;
  gstApplicable: boolean;
  gstRate: unknown;
  priceType: $Enums.PriceType;
  foodGstApplicable: boolean;
  foodGstRate: unknown;
  foodPriceType: $Enums.PriceType;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  active: boolean;
}) {
  return {
    ...rate,
    hourlyRate: Number(rate.hourlyRate),
    foodCharge: Number(rate.foodCharge),
    lunchCharge:
      rate.lunchCharge == null
        ? Number(rate.foodCharge)
        : Number(rate.lunchCharge),
    eveningSnackCharge:
      rate.eveningSnackCharge == null
        ? Number(rate.foodCharge)
        : Number(rate.eveningSnackCharge),
    mealComboCharge:
      rate.mealComboCharge == null
        ? Number(rate.foodCharge) * 2
        : Number(rate.mealComboCharge),
    fullDayRate: Number(rate.fullDayRate),
    monthlyDaycareOnlyRate:
      rate.monthlyDaycareOnlyRate == null
        ? null
        : Number(rate.monthlyDaycareOnlyRate),
    monthlyPreschoolAddonRate:
      rate.monthlyPreschoolAddonRate == null
        ? null
        : Number(rate.monthlyPreschoolAddonRate),
    monthlySixHourRate:
      rate.monthlySixHourRate == null ? null : Number(rate.monthlySixHourRate),
    monthlySixHalfHourRate:
      rate.monthlySixHalfHourRate == null
        ? null
        : Number(rate.monthlySixHalfHourRate),
    gstRate: rate.gstRate == null ? null : Number(rate.gstRate),
    foodGstRate: rate.foodGstRate == null ? null : Number(rate.foodGstRate),
    effectiveFrom: rate.effectiveFrom.toISOString(),
    effectiveTo: rate.effectiveTo?.toISOString() ?? null,
  };
}

function serialisePlan(plan: {
  id: string;
  studentId: string;
  planDefinitionId: string | null;
  priceVersionId: string | null;
  mealCombinationId: string | null;
  title: string;
  planType: $Enums.DaycarePlanType;
  billingMode: $Enums.DaycareBillingMode;
  scheduledWeekdays: number[];
  foodRequired: boolean;
  foodOption: $Enums.DaycareFoodOption;
  dailyHours: unknown;
  includedDays: number | null;
  monthlyFeeOverride: unknown;
  monthlyFoodFeeOverride: unknown;
  hourlyRateOverride: unknown;
  foodChargeOverride: unknown;
  fullDayRateOverride: unknown;
  fullDayFoodIncluded: boolean | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  active: boolean;
  lifecycleStatus: $Enums.CatalogueStatus;
  recurring: boolean;
  maximumVisitsOverride: number | null;
  billingStoppedAt: Date | null;
  separateInvoice: boolean;
  notes: string | null;
  student: {
    studentNumber: string;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    programme: $Enums.Programme;
  };
  planDefinition?: {
    id: string;
    name: string;
    billingType: string;
    hoursIncluded: unknown;
    maximumVisits: number | null;
    allowConcurrent: boolean;
  } | null;
  priceVersion?: {
    id: string;
    price: unknown;
    gstApplicable: boolean;
    gstRate: unknown;
    priceType: $Enums.PriceType;
  } | null;
  mealCombination?: { id: string; name: string } | null;
}) {
  return {
    ...plan,
    studentName: studentName(plan.student),
    studentNumber: plan.student.studentNumber,
    programme: plan.student.programme,
    dailyHours: plan.dailyHours == null ? null : Number(plan.dailyHours),
    includedDays: plan.includedDays,
    monthlyFeeOverride:
      plan.monthlyFeeOverride == null ? null : Number(plan.monthlyFeeOverride),
    monthlyFoodFeeOverride:
      plan.monthlyFoodFeeOverride == null
        ? null
        : Number(plan.monthlyFoodFeeOverride),
    hourlyRateOverride:
      plan.hourlyRateOverride == null ? null : Number(plan.hourlyRateOverride),
    foodChargeOverride:
      plan.foodChargeOverride == null ? null : Number(plan.foodChargeOverride),
    fullDayRateOverride:
      plan.fullDayRateOverride == null
        ? null
        : Number(plan.fullDayRateOverride),
    effectiveFrom: plan.effectiveFrom.toISOString(),
    effectiveTo: plan.effectiveTo?.toISOString() ?? null,
    billingStoppedAt: plan.billingStoppedAt?.toISOString() ?? null,
    planDefinition: plan.planDefinition
      ? {
          ...plan.planDefinition,
          hoursIncluded:
            plan.planDefinition.hoursIncluded == null
              ? null
              : Number(plan.planDefinition.hoursIncluded),
        }
      : null,
    priceVersion: plan.priceVersion
      ? {
          ...plan.priceVersion,
          price: Number(plan.priceVersion.price),
          gstRate:
            plan.priceVersion.gstRate == null
              ? null
              : Number(plan.priceVersion.gstRate),
        }
      : null,
    student: undefined,
  };
}

function serialiseSession(session: {
  id: string;
  sessionNumber: string;
  studentId: string;
  planId: string | null;
  sessionDate: Date;
  billingMode: $Enums.DaycareBillingMode;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  billableHours: unknown;
  foodProvided: boolean;
  foodOption: $Enums.DaycareFoodOption;
  hourlyRate: unknown;
  foodCharge: unknown;
  fullDayRate: unknown;
  baseAmount: unknown;
  totalAmount: unknown;
  gstApplicable: boolean;
  gstRate: unknown;
  priceType: $Enums.PriceType;
  foodGstApplicable: boolean;
  foodGstRate: unknown;
  foodPriceType: $Enums.PriceType;
  status: $Enums.DaycareSessionStatus;
  reason: string | null;
  pickupPerson: string | null;
  approved: boolean;
  approvedAt: Date | null;
  invoiceStatus: string;
  emergencyCare: boolean;
  notes: string | null;
  student: {
    studentNumber: string;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    programme: $Enums.Programme;
    guardians: Array<{
      name: string;
      relationship: $Enums.GuardianRelationship;
      phone: string;
      authorisedPickup: boolean;
      isPrimary: boolean;
    }>;
  };
  feeInvoice: {
    id: string;
    invoiceNumber: string;
    status: $Enums.FeeInvoiceStatus;
    pendingAmount: unknown;
  } | null;
  meals?: Array<{
    id: string;
    mealId: string;
    quantity: unknown;
    unitPrice: unknown;
    totalAmount: unknown;
    meal: { name: string };
  }>;
}) {
  return {
    ...session,
    studentName: studentName(session.student),
    studentNumber: session.student.studentNumber,
    programme: session.student.programme,
    emergencyContacts: session.student.guardians.map((guardian) => ({
      name: guardian.name,
      relationship: guardian.relationship,
      phone: guardian.phone,
      authorisedPickup: guardian.authorisedPickup,
      isPrimary: guardian.isPrimary,
    })),
    sessionDate: session.sessionDate.toISOString(),
    checkInAt: session.checkInAt?.toISOString() ?? null,
    checkOutAt: session.checkOutAt?.toISOString() ?? null,
    billableHours:
      session.billableHours == null ? null : Number(session.billableHours),
    hourlyRate: session.hourlyRate == null ? null : Number(session.hourlyRate),
    foodCharge: Number(session.foodCharge),
    fullDayRate:
      session.fullDayRate == null ? null : Number(session.fullDayRate),
    baseAmount: Number(session.baseAmount),
    totalAmount: Number(session.totalAmount),
    gstRate: session.gstRate == null ? null : Number(session.gstRate),
    foodGstRate:
      session.foodGstRate == null ? null : Number(session.foodGstRate),
    approvedAt: session.approvedAt?.toISOString() ?? null,
    meals:
      session.meals?.map((entry) => ({
        ...entry,
        quantity: Number(entry.quantity),
        unitPrice: Number(entry.unitPrice),
        totalAmount: Number(entry.totalAmount),
      })) ?? [],
    feeInvoice: session.feeInvoice
      ? {
          ...session.feeInvoice,
          pendingAmount: Number(session.feeInvoice.pendingAmount),
        }
      : null,
    student: undefined,
  };
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();

  if (!canUseDaycare(session)) {
    return NextResponse.json(
      { success: false, message: "You do not have access to daycare billing." },
      { status: session ? 403 : 401 },
    );
  }

  const month =
    request.nextUrl.searchParams.get("month") ??
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    }).format(new Date());
  const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
  const indiaMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  const fallbackMatch = indiaMonth.match(/^(\d{4})-(\d{2})$/);
  const year = monthMatch
    ? Number(monthMatch[1])
    : Number(fallbackMatch?.[1] ?? new Date().getUTCFullYear());
  const monthNumber = monthMatch
    ? Number(monthMatch[2])
    : Number(fallbackMatch?.[2] ?? new Date().getUTCMonth() + 1);
  const monthStart = new Date(
    `${year}-${String(monthNumber).padStart(2, "0")}-01T00:00:00.000+05:30`,
  );
  const nextMonthYear = monthNumber === 12 ? year + 1 : year;
  const nextMonthNumber = monthNumber === 12 ? 1 : monthNumber + 1;
  const monthEnd = new Date(
    new Date(
      `${nextMonthYear}-${String(nextMonthNumber).padStart(2, "0")}-01T00:00:00.000+05:30`,
    ).getTime() - 1,
  );
  const now = new Date();

  const [
    rates,
    students,
    plans,
    sessions,
    planDefinitions,
    meals,
    mealCombinations,
    foodExpenses,
    billingSetting,
    daycareInvoices,
  ] = await Promise.all([
    prisma.daycareRateSetting.findMany({
      orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
    prisma.student.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        studentNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        programme: true,
      },
    }),
    prisma.studentDaycarePlan.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      include: {
        planDefinition: true,
        priceVersion: true,
        mealCombination: true,
        student: {
          select: {
            studentNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            programme: true,
          },
        },
      },
    }),
    prisma.daycareSession.findMany({
      where: { sessionDate: { gte: monthStart, lte: monthEnd } },
      orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }],
      include: {
        meals: { include: { meal: true } },
        student: {
          select: {
            studentNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            programme: true,
            guardians: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
              select: {
                name: true,
                relationship: true,
                phone: true,
                authorisedPickup: true,
                isPrimary: true,
              },
            },
          },
        },
        feeInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            pendingAmount: true,
          },
        },
      },
    }),
    prisma.daycarePlanDefinition.findMany({
      where: { active: true },
      include: {
        priceVersions: {
          where: { active: true },
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.mealDefinition.findMany({
      where: { status: "ACTIVE" },
      include: {
        priceVersions: {
          where: { active: true },
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.mealCombination.findMany({
      where: { status: "ACTIVE" },
      include: {
        items: { include: { meal: true } },
        priceVersions: {
          where: { active: true },
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.expense.aggregate({
      where: {
        category: "FOOD",
        expenseDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalAmount: true },
    }),
    prisma.centreSetting.findUnique({
      where: { key: "BILLING_ENGINE" },
      select: { value: true },
    }),
    prisma.feeInvoice.findMany({
      where: {
        issueDate: { gte: monthStart, lte: monthEnd },
        items: {
          some: {
            category: {
              in: [
                "DAYCARE_FEE",
                "DAYCARE_LUNCH_FEE",
                "DAYCARE_EVENING_SNACK_FEE",
                "DAYCARE_MEAL_COMBO_FEE",
                "FOOD_FEE",
              ],
            },
          },
        },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
        pendingAmount: true,
        items: {
          select: { category: true, totalAmount: true },
        },
      },
    }),
  ]);

  const activeRate =
    rates.find(
      (rate) =>
        rate.active &&
        rate.effectiveFrom <= now &&
        (!rate.effectiveTo || rate.effectiveTo >= now),
    ) ?? null;
  const todayKey = formatDateKey(now);
  const todaySessions = sessions.filter(
    (entry) =>
      formatDateKey(entry.sessionDate) === todayKey &&
      entry.status !== "CANCELLED",
  );
  const activePlans = plans.filter(
    (plan) =>
      plan.active &&
      plan.effectiveFrom <= now &&
      (!plan.effectiveTo || plan.effectiveTo >= now) &&
      !plan.billingStoppedAt,
  );
  const preschoolDaycareStudents = new Set(
    activePlans
      .filter((plan) => plan.student.programme !== "DAYCARE")
      .map((plan) => plan.studentId),
  ).size;
  const daycareOnlyStudents = new Set(
    activePlans
      .filter((plan) => plan.student.programme === "DAYCARE")
      .map((plan) => plan.studentId),
  ).size;
  const pendingAdditionalAmount = parseMoney(
    sessions
      .filter(
        (session) =>
          session.status === "COMPLETED" &&
          session.approved &&
          !session.feeInvoiceId,
      )
      .reduce((sum, session) => sum + Number(session.totalAmount), 0),
  );
  const uniqueTodayChildren = new Set(
    todaySessions.map((entry) => entry.studentId),
  ).size;
  const expectedPickups = todaySessions.filter(
    (entry) => entry.checkOutAt == null && entry.status !== "BILLED",
  ).length;
  const latePickups = todaySessions.filter((entry) => {
    if (entry.checkOutAt || entry.status === "BILLED") return false;
    const plan = plans.find((candidate) => candidate.id === entry.planId);
    const end = plan?.planDefinition?.timeWindowEnd;
    if (!end || !/^\d{2}:\d{2}$/.test(end)) return false;
    const expected = parseTimeOnDate(entry.sessionDate, end);
    return Boolean(expected && expected < now);
  }).length;
  const emergencyToday = todaySessions.filter(
    (entry) => entry.emergencyCare,
  ).length;
  const mealDemand = new Map<string, number>();
  for (const entry of sessions) {
    if (entry.status === "CANCELLED") continue;
    for (const meal of entry.meals) {
      mealDemand.set(
        meal.meal.name,
        (mealDemand.get(meal.meal.name) ?? 0) + Number(meal.quantity),
      );
    }
  }
  const planDemand = new Map<string, number>();
  for (const plan of activePlans) {
    const name = plan.planDefinition?.name ?? plan.title;
    planDemand.set(name, (planDemand.get(name) ?? 0) + 1);
  }
  const completedSessions = sessions.filter(
    (entry) => entry.status === "COMPLETED" || entry.status === "BILLED",
  );
  const daycareCategories = new Set([
    "DAYCARE_FEE",
    "DAYCARE_LUNCH_FEE",
    "DAYCARE_EVENING_SNACK_FEE",
    "DAYCARE_MEAL_COMBO_FEE",
    "FOOD_FEE",
  ]);
  const invoiceAllocation = daycareInvoices.map((invoice) => {
    const invoiceTotal = Number(invoice.totalAmount);
    const daycareTotal = invoice.items.reduce(
      (sum, item) =>
        sum +
        (daycareCategories.has(item.category) ? Number(item.totalAmount) : 0),
      0,
    );
    return {
      paid:
        invoiceTotal > 0
          ? daycareTotal * (Number(invoice.paidAmount) / invoiceTotal)
          : 0,
      pending:
        invoiceTotal > 0
          ? daycareTotal * (Number(invoice.pendingAmount) / invoiceTotal)
          : 0,
    };
  });
  const billedRevenue = parseMoney(
    invoiceAllocation.reduce((sum, invoice) => sum + invoice.paid, 0),
  );
  const outstanding = parseMoney(
    invoiceAllocation.reduce((sum, invoice) => sum + invoice.pending, 0),
  );
  const capacityRecord =
    billingSetting?.value &&
    typeof billingSetting.value === "object" &&
    !Array.isArray(billingSetting.value)
      ? (billingSetting.value as Record<string, unknown>)
      : {};
  const capacity = Math.max(0, Number(capacityRecord.daycareCapacity) || 0);
  const occupancy =
    capacity > 0
      ? Math.min(100, Math.round((uniqueTodayChildren / capacity) * 100))
      : null;
  const peakHourCounts = new Map<number, number>();
  for (const entry of completedSessions) {
    if (!entry.checkInAt) continue;
    const hour = Number(
      new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(entry.checkInAt),
    );
    peakHourCounts.set(hour, (peakHourCounts.get(hour) ?? 0) + 1);
  }
  const peakHour =
    [...peakHourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const popularPlan =
    [...planDemand.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topMeal =
    [...mealDemand.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const foodCost = parseMoney(foodExpenses._sum.totalAmount);
  const weeksInMonth = Math.max(
    1,
    Math.ceil((monthEnd.getTime() - monthStart.getTime() + 1) / 604_800_000),
  );
  const forecast = parseMoney(
    activePlans.reduce((sum, plan) => {
      const definition = planDefinitions.find(
        (entry) => entry.id === plan.planDefinitionId,
      );
      const version = definition?.priceVersions.find(
        (entry) =>
          entry.effectiveFrom <= monthEnd &&
          (!entry.effectiveTo || entry.effectiveTo >= monthStart),
      );
      const visits =
        plan.maximumVisitsOverride ??
        definition?.maximumVisits ??
        plan.includedDays ??
        1;
      const multiplier =
        definition?.billingType === "WEEKLY"
          ? weeksInMonth
          : definition?.billingType === "DAILY"
            ? Math.max(1, visits)
            : 1;
      const base =
        Number(
          plan.monthlyFeeOverride ??
            version?.price ??
            plan.priceVersion?.price ??
            0,
        ) * multiplier;
      const combination = mealCombinations.find(
        (entry) => entry.id === plan.mealCombinationId,
      );
      const combinationVersion = combination?.priceVersions.find(
        (entry) =>
          entry.effectiveFrom <= monthEnd &&
          (!entry.effectiveTo || entry.effectiveTo >= monthStart),
      );
      const mealsIncluded = definition?.mealRule === "INCLUDED";
      const food = mealsIncluded
        ? 0
        : Number(plan.monthlyFoodFeeOverride ?? combinationVersion?.price ?? 0);
      return sum + base + food;
    }, 0),
  );
  const suggestions = [
    occupancy != null && occupancy >= 85
      ? "Daycare is close to configured capacity. Review staffing and wait-list rules before adding seats."
      : null,
    occupancy != null && occupancy < 45
      ? "Daycare capacity is under-used today. Review weekly or flexible plans for nearby preschool families."
      : null,
    popularPlan
      ? `${popularPlan} is the most-used active plan; keep its future pricing and capacity under review.`
      : "Create and assign daycare plans to unlock plan-demand analysis.",
    topMeal
      ? `${topMeal} has the highest recorded meal demand this month.`
      : "Record exact meals to unlock meal-demand forecasting.",
  ].filter((value): value is string => Boolean(value));

  return NextResponse.json({
    success: true,
    canManageRates: canManageRates(session),
    canManageContracts: session?.role === "OWNER",
    canManageLifecycle: session?.role === "OWNER",
    canApproveLedger:
      session?.role === "OWNER" || session?.permissions.includes("*") || false,
    activeRate: activeRate ? serialiseRate(activeRate) : null,
    rateHistory: rates.map(serialiseRate),
    students: students.map((student) => ({
      ...student,
      name: studentName(student),
    })),
    plans: plans.map(serialisePlan),
    sessions: sessions.map(serialiseSession),
    planDefinitions: serialiseCatalogue(planDefinitions),
    mealDefinitions: serialiseCatalogue(meals),
    mealCombinations: serialiseCatalogue(mealCombinations),
    dashboard: {
      todayChildren: uniqueTodayChildren,
      expectedPickups,
      latePickups,
      emergencyToday,
      mealsToday: todaySessions.reduce(
        (sum, entry) => sum + entry.meals.length,
        0,
      ),
      billedRevenue,
      outstanding,
      monthlyForecast: forecast,
      occupancy,
      unusedCapacity:
        capacity > 0 ? Math.max(capacity - uniqueTodayChildren, 0) : null,
      peakHour:
        peakHour == null ? null : `${String(peakHour).padStart(2, "0")}:00`,
      popularPlan,
      topMeal,
      estimatedProfitAfterFood: parseMoney(billedRevenue - foodCost),
      activePlans: activePlans.length,
      preschoolDaycareStudents,
      daycareOnlyStudents,
      pendingAdditionalAmount,
      suggestions,
    },
  });
}

function serialiseCatalogue<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => {
      if (
        typeof item === "object" &&
        item &&
        "toNumber" in item &&
        typeof item.toNumber === "function"
      )
        return item.toNumber();
      return item;
    }),
  ) as T;
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();

  if (!session || !canUseDaycare(session)) {
    return NextResponse.json(
      { success: false, message: "You do not have access to daycare billing." },
      { status: session ? 403 : 401 },
    );
  }

  const adminUserId = session.userId;

  try {
    const body = (await request.json()) as DaycareRequestBody;
    const action = cleanText(body.action, 40);

    if (action === "plan-lifecycle") {
      if (session.role !== "OWNER")
        throw new DaycareRequestError(
          "Only the Owner can archive or permanently delete child plans.",
          403,
        );
      const planId = cleanText(body.planId, 100);
      const operation = cleanText(body.operation, 30).toUpperCase();
      const reason = cleanText(body.reason, 500);
      const existing = await prisma.studentDaycarePlan.findUnique({
        where: { id: planId },
        select: {
          id: true,
          title: true,
          active: true,
          lifecycleStatus: true,
          effectiveFrom: true,
          contractServiceId: true,
          enrollmentContractId: true,
        },
      });
      if (!existing)
        throw new DaycareRequestError("Daycare plan was not found.", 404);
      const [sessions, invoiceItems] = await Promise.all([
        prisma.daycareSession.count({ where: { planId } }),
        prisma.feeInvoiceItem.count({
          where: {
            OR: [
              { sourceId: planId },
              ...(existing.contractServiceId
                ? [{ contractServiceId: existing.contractServiceId }]
                : []),
              { chargeKey: { startsWith: `daycare-plan:${planId}:` } },
              { chargeKey: { startsWith: `daycare-meal-plan:${planId}:` } },
            ],
          },
        }),
      ]);
      if (operation === "PERMANENT_DELETE") {
        if (cleanText(body.confirmation, 40) !== "PERMANENT DELETE")
          throw new DaycareRequestError("Type PERMANENT DELETE to confirm.");
        if (reason.length < 8)
          throw new DaycareRequestError(
            "Enter a clear reason for permanent deletion.",
          );
        if (sessions + invoiceItems > 0)
          throw new DaycareRequestError(
            `This plan has ${sessions + invoiceItems} attendance or historical billing records. Archive it instead.`,
            409,
          );
        await prisma.$transaction(async (transaction) => {
          await transaction.activityLog.create({
            data: {
              adminUserId,
              action: "DELETED",
              entityType: "StudentDaycarePlan",
              entityId: planId,
              description: `${existing.title} was permanently deleted by the Owner.`,
              previousData: { title: existing.title },
              newData: {
                permanent: true,
                reason,
                affectedRecords: { sessions, invoiceItems },
              },
            },
          });
          await transaction.studentDaycarePlan.delete({
            where: { id: planId },
          });
          if (existing.contractServiceId) {
            await transaction.contractService.delete({
              where: { id: existing.contractServiceId },
            });
          }
          if (existing.enrollmentContractId) {
            const remainingPlans = await transaction.studentDaycarePlan.count({
              where: {
                enrollmentContractId: existing.enrollmentContractId,
                active: true,
              },
            });
            if (remainingPlans === 0) {
              await transaction.contractService.updateMany({
                where: {
                  contractId: existing.enrollmentContractId,
                  serviceType: "MEAL",
                  status: { in: ["ACTIVE", "DRAFT"] },
                },
                data: { status: "ENDED", effectiveTo: new Date() },
              });
              await transaction.studentEnrollmentContract.update({
                where: { id: existing.enrollmentContractId },
                data: { daycareEnabled: false, mealsEnabled: false },
              });
            }
          }
        });
      } else {
        const target =
          operation === "ACTIVATE"
            ? "ACTIVE"
            : operation === "DEACTIVATE"
              ? "INACTIVE"
              : operation === "ARCHIVE"
                ? "ARCHIVED"
                : operation === "DELETE"
                  ? "DELETED"
                  : null;
        if (!target)
          throw new DaycareRequestError("Choose a valid child-plan action.");
        if (["ARCHIVE", "DELETE"].includes(operation) && reason.length < 4)
          throw new DaycareRequestError(
            "Enter a reason for this audited change.",
          );
        const now = new Date();
        await prisma.$transaction(async (transaction) => {
          await transaction.studentDaycarePlan.update({
            where: { id: planId },
            data: {
              lifecycleStatus: target,
              active: target === "ACTIVE",
              billingStoppedAt: target === "ACTIVE" ? null : now,
            },
          });
          if (existing.contractServiceId) {
            await transaction.contractService.update({
              where: { id: existing.contractServiceId },
              data: {
                status: target === "ACTIVE" ? "ACTIVE" : "ENDED",
                effectiveTo:
                  target === "ACTIVE"
                    ? null
                    : now < existing.effectiveFrom
                      ? existing.effectiveFrom
                      : now,
              },
            });
          }
          if (existing.enrollmentContractId) {
            const remainingPlans = await transaction.studentDaycarePlan.count({
              where: {
                enrollmentContractId: existing.enrollmentContractId,
                active: true,
              },
            });
            if (target === "ACTIVE") {
              await transaction.studentEnrollmentContract.update({
                where: { id: existing.enrollmentContractId },
                data: { daycareEnabled: true, updatedById: adminUserId },
              });
            } else if (remainingPlans === 0) {
              await transaction.contractService.updateMany({
                where: {
                  contractId: existing.enrollmentContractId,
                  serviceType: "MEAL",
                  status: { in: ["ACTIVE", "DRAFT"] },
                },
                data: {
                  status: "ENDED",
                  effectiveTo:
                    now < existing.effectiveFrom ? existing.effectiveFrom : now,
                },
              });
              await transaction.studentEnrollmentContract.update({
                where: { id: existing.enrollmentContractId },
                data: {
                  daycareEnabled: false,
                  mealsEnabled: false,
                  updatedById: adminUserId,
                },
              });
            }
          }
          await transaction.activityLog.create({
            data: {
              adminUserId,
              action: "UPDATED",
              entityType: "StudentDaycarePlan",
              entityId: planId,
              description: `${existing.title} was marked ${target.toLowerCase()}.`,
              previousData: {
                status: existing.lifecycleStatus,
                active: existing.active,
              },
              newData: {
                status: target,
                reason: reason || null,
                affectedRecords: { sessions, invoiceItems },
              },
            },
          });
        });
      }
      return NextResponse.json({
        success: true,
        message: "Child daycare plan lifecycle updated.",
      });
    }

    if (action === "save-rates") {
      if (!canManageRates(session)) {
        throw new DaycareRequestError(
          "You do not have permission to change daycare rates.",
          403,
        );
      }

      const hourlyRate = parseMoney(body.hourlyRate);
      const foodCharge = parseMoney(body.foodCharge);
      const lunchCharge = parseMoney(body.lunchCharge);
      const eveningSnackCharge = parseMoney(body.eveningSnackCharge);
      const mealComboCharge = parseMoney(body.mealComboCharge);
      const fullDayRate = parseMoney(body.fullDayRate);
      const monthlyDaycareOnlyRate = optionalMoney(body.monthlyDaycareOnlyRate);
      const monthlyPreschoolAddonRate = optionalMoney(
        body.monthlyPreschoolAddonRate,
      );
      const monthlySixHourRate = optionalMoney(body.monthlySixHourRate);
      const monthlySixHalfHourRate = optionalMoney(body.monthlySixHalfHourRate);
      const gstApplicable = parseBoolean(body.gstApplicable);
      const gstRate = gstApplicable ? parseMoney(body.gstRate) : 0;
      const priceType = parsePriceType(body.priceType);
      const foodGstApplicable = parseBoolean(body.foodGstApplicable);
      const foodGstRate = foodGstApplicable ? parseMoney(body.foodGstRate) : 0;
      const foodPriceType = parsePriceType(body.foodPriceType);
      const effectiveFrom = parseDate(body.effectiveFrom);

      if (
        !Number.isFinite(hourlyRate) ||
        hourlyRate <= 0 ||
        !Number.isFinite(foodCharge) ||
        foodCharge < 0 ||
        !Number.isFinite(lunchCharge) ||
        lunchCharge < 0 ||
        !Number.isFinite(eveningSnackCharge) ||
        eveningSnackCharge < 0 ||
        !Number.isFinite(mealComboCharge) ||
        mealComboCharge < 0 ||
        !Number.isFinite(fullDayRate) ||
        fullDayRate <= 0 ||
        (typeof monthlyDaycareOnlyRate === "number" &&
          Number.isNaN(monthlyDaycareOnlyRate)) ||
        (typeof monthlyPreschoolAddonRate === "number" &&
          Number.isNaN(monthlyPreschoolAddonRate)) ||
        (typeof monthlySixHourRate === "number" &&
          Number.isNaN(monthlySixHourRate)) ||
        (typeof monthlySixHalfHourRate === "number" &&
          Number.isNaN(monthlySixHalfHourRate))
      ) {
        throw new DaycareRequestError(
          "Enter valid hourly, meal, full-day and monthly rates.",
        );
      }

      if (!effectiveFrom) {
        throw new DaycareRequestError(
          "Choose the date from which the rates apply.",
        );
      }

      if (
        gstApplicable &&
        (!Number.isFinite(gstRate) || gstRate <= 0 || gstRate > 100)
      ) {
        throw new DaycareRequestError("Enter a valid GST percentage.");
      }

      if (
        foodGstApplicable &&
        (!Number.isFinite(foodGstRate) || foodGstRate <= 0 || foodGstRate > 100)
      ) {
        throw new DaycareRequestError("Enter a valid food GST percentage.");
      }

      const previousEnd = new Date(effectiveFrom.getTime() - 1);
      const rate = await prisma.$transaction(async (transaction) => {
        const existingRates = await transaction.daycareRateSetting.findMany({
          where: { active: true },
          select: { id: true, effectiveFrom: true, effectiveTo: true },
          orderBy: { effectiveFrom: "asc" },
        });

        for (const existingRate of existingRates) {
          if (existingRate.effectiveFrom >= effectiveFrom) {
            await transaction.daycareRateSetting.update({
              where: { id: existingRate.id },
              data: { active: false },
            });
            continue;
          }

          if (
            existingRate.effectiveTo == null ||
            existingRate.effectiveTo >= effectiveFrom
          ) {
            await transaction.daycareRateSetting.update({
              where: { id: existingRate.id },
              data: { effectiveTo: previousEnd },
            });
          }
        }

        const created = await transaction.daycareRateSetting.create({
          data: {
            title: "Occasional Daycare Rates",
            hourlyRate,
            foodCharge,
            lunchCharge,
            eveningSnackCharge,
            mealComboCharge,
            fullDayRate,
            fullDayFoodIncluded: parseBoolean(body.fullDayFoodIncluded),
            monthlyDaycareOnlyRate,
            monthlyPreschoolAddonRate,
            monthlySixHourRate,
            monthlySixHalfHourRate,
            gstApplicable,
            gstRate: gstApplicable ? gstRate : null,
            priceType,
            foodGstApplicable,
            foodGstRate: foodGstApplicable ? foodGstRate : null,
            foodPriceType,
            effectiveFrom,
            active: true,
          },
        });

        await transaction.activityLog.create({
          data: {
            adminUserId,
            action: "UPDATED",
            entityType: "DaycareRateSetting",
            entityId: created.id,
            description: "Occasional daycare rates were updated.",
            newData: {
              hourlyRate,
              foodCharge,
              lunchCharge,
              eveningSnackCharge,
              mealComboCharge,
              fullDayRate,
              fullDayFoodIncluded: created.fullDayFoodIncluded,
              monthlyDaycareOnlyRate,
              monthlyPreschoolAddonRate,
              monthlySixHourRate,
              monthlySixHalfHourRate,
              gstApplicable,
              gstRate: gstApplicable ? gstRate : null,
              priceType,
              foodGstApplicable,
              foodGstRate: foodGstApplicable ? foodGstRate : null,
              foodPriceType,
              effectiveFrom: effectiveFrom.toISOString(),
            },
          },
        });

        return created;
      });

      return NextResponse.json({
        success: true,
        message: "Daycare rates saved. Old sessions keep their original rates.",
        rate: serialiseRate(rate),
      });
    }

    if (action === "save-plan") {
      if (session.role !== "OWNER") {
        throw new DaycareRequestError(
          "Only the Owner can change a child's contracted daycare plan. Centre Head access remains available for daily check-in, checkout, meals and notes.",
          403,
        );
      }
      const studentId = cleanText(body.studentId, 100);
      const planDefinitionId = cleanText(body.planDefinitionId, 100) || null;
      const mealCombinationId = cleanText(body.mealCombinationId, 100) || null;
      const foodOption = parseFoodOption(body.foodOption) ?? "NONE";
      const weekdays = parseWeekdays(body.scheduledWeekdays);
      const effectiveFrom = parseDate(body.planEffectiveFrom);
      const effectiveTo = cleanText(body.planEffectiveTo, 40)
        ? parseDate(body.planEffectiveTo, true)
        : null;
      const hourlyRateOverride = optionalMoney(body.hourlyRateOverride);
      const foodChargeOverride = optionalMoney(body.foodChargeOverride);
      const fullDayRateOverride = optionalMoney(body.fullDayRateOverride);
      const requestedDailyHours = optionalMoney(body.dailyHours);
      const includedDaysText = cleanText(body.includedDays, 10);
      const requestedIncludedDays = includedDaysText
        ? Number(includedDaysText)
        : null;
      const requestedMonthlyFee = optionalMoney(body.monthlyFeeOverride);
      const maximumVisitsOverrideText = cleanText(
        body.maximumVisitsOverride,
        10,
      );
      const maximumVisitsOverride = maximumVisitsOverrideText
        ? Number(maximumVisitsOverrideText)
        : null;
      const monthlyFoodFeeOverride = optionalMoney(body.monthlyFoodFeeOverride);

      if (!studentId || !effectiveFrom) {
        throw new DaycareRequestError(
          "Choose the student, daycare plan and start date.",
        );
      }

      const [student, planDefinition, mealCombination] = await Promise.all([
        prisma.student.findUnique({
          where: { id: studentId },
          select: {
            id: true,
            status: true,
            programme: true,
            enrollmentContract: {
              select: { id: true, status: true },
            },
          },
        }),
        planDefinitionId
          ? prisma.daycarePlanDefinition.findUnique({
              where: { id: planDefinitionId },
              include: {
                priceVersions: {
                  where: {
                    active: true,
                    effectiveFrom: { lte: effectiveFrom },
                    OR: [
                      { effectiveTo: null },
                      { effectiveTo: { gte: effectiveFrom } },
                    ],
                  },
                  orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
                  take: 1,
                },
              },
            })
          : Promise.resolve(null),
        mealCombinationId
          ? prisma.mealCombination.findUnique({
              where: { id: mealCombinationId },
              include: {
                priceVersions: {
                  where: {
                    active: true,
                    effectiveFrom: { lte: effectiveFrom },
                    OR: [
                      { effectiveTo: null },
                      { effectiveTo: { gte: effectiveFrom } },
                    ],
                  },
                  orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
                  take: 1,
                },
              },
            })
          : Promise.resolve(null),
      ]);
      if (!student || student.status !== "ACTIVE")
        throw new DaycareRequestError("Choose an active student.", 404);
      if (planDefinitionId && (!planDefinition || !planDefinition.active))
        throw new DaycareRequestError(
          "The selected catalogue plan is not active.",
          409,
        );
      if (
        mealCombinationId &&
        (!mealCombination || mealCombination.status !== "ACTIVE")
      )
        throw new DaycareRequestError(
          "The selected meal combination is not active.",
          409,
        );
      if (
        planDefinition?.mealRule === "NOT_AVAILABLE" &&
        (mealCombinationId || foodOption !== "NONE")
      ) {
        throw new DaycareRequestError(
          "Meals are not available with the selected daycare plan.",
        );
      }
      if (
        planDefinition?.mealRule === "REQUIRED" &&
        !mealCombinationId &&
        foodOption === "NONE"
      ) {
        throw new DaycareRequestError(
          "Choose a meal combination for this daycare plan.",
        );
      }

      const catalogPrice = planDefinition?.priceVersions[0] ?? null;
      if (planDefinition && !catalogPrice)
        throw new DaycareRequestError(
          "This plan has no price version for its start date.",
          409,
        );
      const derivedPlanType: $Enums.DaycarePlanType | null = planDefinition
        ? planDefinition.billingType === "HOURLY" ||
          planDefinition.billingType === "DAILY"
          ? "OCCASIONAL"
          : planDefinition.billingType === "MONTHLY"
            ? student.programme === "DAYCARE"
              ? "MONTHLY_DAYCARE_ONLY"
              : "MONTHLY_PRESCHOOL_DAYCARE"
            : "FLEXIBLE_DAYS"
        : parsePlanType(body.planType);
      const derivedBillingMode: $Enums.DaycareBillingMode | null =
        planDefinition
          ? planDefinition.billingType === "HOURLY"
            ? "HOURLY"
            : "FULL_DAY"
          : parseBillingMode(body.billingMode);
      const title = planDefinition?.name ?? cleanText(body.title, 160);
      const dailyHours =
        requestedDailyHours ??
        (planDefinition?.hoursIncluded == null
          ? null
          : Number(planDefinition.hoursIncluded));
      const includedDays =
        requestedIncludedDays ?? planDefinition?.maximumVisits ?? null;
      const catalogRecurring =
        planDefinition?.recurring ?? derivedPlanType !== "OCCASIONAL";
      const monthlyFeeOverride =
        requestedMonthlyFee ??
        (catalogPrice && catalogRecurring ? Number(catalogPrice.price) : null);
      const planType = derivedPlanType;
      const billingMode = derivedBillingMode;
      if (!planType || !billingMode || !title)
        throw new DaycareRequestError("Choose a valid daycare catalogue plan.");

      if (effectiveTo && effectiveTo < effectiveFrom) {
        throw new DaycareRequestError(
          "The plan end date cannot be before its start date.",
        );
      }

      if (
        [
          hourlyRateOverride,
          foodChargeOverride,
          fullDayRateOverride,
          requestedDailyHours,
          requestedMonthlyFee,
          monthlyFoodFeeOverride,
        ].some((value) => typeof value === "number" && Number.isNaN(value))
      ) {
        throw new DaycareRequestError(
          "Plan override rates cannot be negative.",
        );
      }
      if (
        maximumVisitsOverride != null &&
        (!Number.isInteger(maximumVisitsOverride) ||
          maximumVisitsOverride < 1 ||
          maximumVisitsOverride > 366)
      ) {
        throw new DaycareRequestError(
          "Maximum visits must be a whole number from 1 to 366.",
        );
      }

      if (
        planType === "FLEXIBLE_DAYS" &&
        (!Number.isInteger(includedDays) ||
          (includedDays ?? 0) < 1 ||
          (includedDays ?? 0) > 31)
      ) {
        throw new DaycareRequestError(
          "Enter the number of flexible daycare days (1 to 31).",
        );
      }

      if (planDefinition?.billingType === "WEEKLY" && weekdays.length === 0) {
        throw new DaycareRequestError(
          "Choose at least one contracted weekday for a weekly daycare plan.",
        );
      }

      if (
        planType !== "OCCASIONAL" &&
        planType !== "FLEXIBLE_DAYS" &&
        (!dailyHours || dailyHours <= 0 || dailyHours > 24)
      ) {
        throw new DaycareRequestError(
          "Enter the daily daycare hours for this monthly plan.",
        );
      }

      if (
        planType !== "OCCASIONAL" &&
        monthlyFeeOverride != null &&
        monthlyFeeOverride <= 0
      ) {
        throw new DaycareRequestError(
          "The monthly daycare fee must be greater than zero.",
        );
      }

      if (
        planType === "MONTHLY_DAYCARE_ONLY" &&
        student.programme !== "DAYCARE"
      ) {
        throw new DaycareRequestError(
          "Monthly daycare-only is for a child enrolled only in daycare. Choose Preschool + Monthly Daycare for a preschool student.",
        );
      }

      if (
        planType === "MONTHLY_PRESCHOOL_DAYCARE" &&
        student.programme === "DAYCARE"
      ) {
        throw new DaycareRequestError(
          "Choose Monthly Daycare Only for a child who is not enrolled in preschool.",
        );
      }

      if (planType !== "OCCASIONAL" && !catalogPrice) {
        const foodCategory: $Enums.FeeCategory | null =
          foodOption === "LUNCH"
            ? "DAYCARE_LUNCH_FEE"
            : foodOption === "EVENING_SNACK"
              ? "DAYCARE_EVENING_SNACK_FEE"
              : foodOption === "BOTH"
                ? "DAYCARE_MEAL_COMBO_FEE"
                : null;

        const [activeMonthlyRate, activeFoodSetting] = await Promise.all([
          prisma.daycareRateSetting.findFirst({
            where: {
              active: true,
              effectiveFrom: {
                lte: effectiveFrom,
              },
              OR: [
                { effectiveTo: null },
                {
                  effectiveTo: {
                    gte: effectiveFrom,
                  },
                },
              ],
            },
            orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
          }),
          foodCategory && monthlyFoodFeeOverride == null
            ? prisma.programmeFeeSetting.findFirst({
                where: {
                  active: true,
                  programme: "DAYCARE",
                  category: foodCategory,
                  effectiveFrom: {
                    lte: effectiveFrom,
                  },
                  OR: [
                    { effectiveTo: null },
                    {
                      effectiveTo: {
                        gte: effectiveFrom,
                      },
                    },
                  ],
                },
                orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
              })
            : Promise.resolve(null),
        ]);

        const defaultMonthlyRate =
          planType === "FLEXIBLE_DAYS"
            ? activeMonthlyRate?.fullDayRate == null
              ? null
              : Number(activeMonthlyRate.fullDayRate) * (includedDays ?? 0)
            : planType === "MONTHLY_DAYCARE_ONLY"
              ? dailyHours != null && dailyHours <= 6.25
                ? (activeMonthlyRate?.monthlySixHourRate ??
                  activeMonthlyRate?.monthlyDaycareOnlyRate)
                : (activeMonthlyRate?.monthlySixHalfHourRate ??
                  activeMonthlyRate?.monthlyDaycareOnlyRate)
              : activeMonthlyRate?.monthlyPreschoolAddonRate;

        if (monthlyFeeOverride == null && defaultMonthlyRate == null) {
          throw new DaycareRequestError(
            "Enter this child's monthly daycare fee or save a monthly default in Daycare Rates.",
          );
        }

        if (
          foodCategory &&
          monthlyFoodFeeOverride == null &&
          !activeFoodSetting
        ) {
          throw new DaycareRequestError(
            "Enter this child's monthly food fee or save the selected meal plan in Fee & GST Settings.",
          );
        }
      }

      const planId = cleanText(body.planId, 100);
      if (planId) {
        const linkedPlan = await prisma.studentDaycarePlan.findUnique({
          where: { id: planId },
          select: { contractServiceId: true },
        });
        if (linkedPlan?.contractServiceId) {
          throw new DaycareRequestError(
            "This plan belongs to the child's enrollment contract. Use Replace Plan so historical prices and invoices remain unchanged.",
            409,
          );
        }
      }

      const fallbackRateSnapshot = !catalogPrice
        ? await prisma.daycareRateSetting.findFirst({
            where: {
              active: true,
              effectiveFrom: { lte: effectiveFrom },
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: effectiveFrom } },
              ],
            },
            orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
          })
        : null;
      const activeRateForFlexible =
        planType === "FLEXIBLE_DAYS"
          ? await prisma.daycareRateSetting.findFirst({
              where: {
                active: true,
                effectiveFrom: { lte: effectiveFrom },
                OR: [
                  { effectiveTo: null },
                  { effectiveTo: { gte: effectiveFrom } },
                ],
              },
              orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
            })
          : null;
      const savedMonthlyFee =
        planType === "FLEXIBLE_DAYS"
          ? (monthlyFeeOverride ??
            (activeRateForFlexible?.fullDayRate == null
              ? null
              : Number(activeRateForFlexible.fullDayRate) *
                (includedDays ?? 0)))
          : monthlyFeeOverride;
      const planData = {
        studentId,
        planDefinitionId,
        priceVersionId: catalogPrice?.id ?? null,
        mealCombinationId,
        title,
        planType,
        billingMode,
        scheduledWeekdays: weekdays,
        foodRequired: foodOption !== "NONE",
        foodOption,
        dailyHours:
          planType === "OCCASIONAL" || planType === "FLEXIBLE_DAYS"
            ? null
            : dailyHours,
        includedDays: planType === "FLEXIBLE_DAYS" ? includedDays : null,
        monthlyFeeOverride: planType === "OCCASIONAL" ? null : savedMonthlyFee,
        monthlyFoodFeeOverride:
          planType === "OCCASIONAL" ? null : monthlyFoodFeeOverride,
        hourlyRateOverride,
        foodChargeOverride,
        fullDayRateOverride,
        fullDayFoodIncluded:
          body.planFullDayFoodIncluded === null ||
          body.planFullDayFoodIncluded === undefined ||
          body.planFullDayFoodIncluded === ""
            ? null
            : parseBoolean(body.planFullDayFoodIncluded),
        effectiveFrom,
        effectiveTo,
        active: true,
        lifecycleStatus: "ACTIVE" as const,
        recurring: planDefinition
          ? booleanValueOrDefault(body.recurring, planDefinition.recurring)
          : planType !== "OCCASIONAL",
        maximumVisitsOverride,
        separateInvoice: parseBoolean(body.separateInvoice),
        billingStoppedAt: null,
        notes: cleanOptionalText(body.notes),
      };

      const plan = await prisma.$transaction(
        async (transaction) => {
          const otherPlans = await transaction.studentDaycarePlan.findMany({
            where: {
              studentId,
              active: true,
              ...(planId ? { id: { not: planId } } : {}),
            },
            include: { planDefinition: { select: { allowConcurrent: true } } },
          });
          const overlappingPlan = otherPlans.find((otherPlan) =>
            effectiveRangesOverlap({ effectiveFrom, effectiveTo }, otherPlan),
          );

          if (
            overlappingPlan &&
            !(
              planDefinition?.allowConcurrent &&
              overlappingPlan.planDefinition?.allowConcurrent
            )
          ) {
            throw new DaycareRequestError(
              `This child already has an overlapping active plan: ${overlappingPlan.title}. End or edit that plan first.`,
              409,
            );
          }

          const contract = student.enrollmentContract;
          const planPricing = calculateChargePricing({
            configuredAmount:
              savedMonthlyFee ??
              hourlyRateOverride ??
              fullDayRateOverride ??
              Number(catalogPrice?.price ?? 0),
            gstApplicable:
              catalogPrice?.gstApplicable ??
              fallbackRateSnapshot?.gstApplicable ??
              false,
            gstRate: Number(
              catalogPrice?.gstRate ?? fallbackRateSnapshot?.gstRate ?? 0,
            ),
            priceType:
              catalogPrice?.priceType === "GST_EXCLUSIVE" ||
              fallbackRateSnapshot?.priceType === "GST_EXCLUSIVE"
                ? "GST_EXCLUSIVE"
                : "GST_INCLUSIVE",
          });

          const contractService =
            contract && !planId
              ? await transaction.contractService.create({
                  data: {
                    contractId: contract.id,
                    serviceType: "DAYCARE",
                    category: "DAYCARE_FEE",
                    catalogueItemType: planDefinitionId
                      ? "DAYCARE_PLAN"
                      : "LEGACY_DAYCARE_PLAN",
                    catalogueItemId: planDefinitionId,
                    label: title,
                    detail: planDefinition?.description ?? null,
                    amountSnapshot: planPricing.configuredAmount,
                    gstApplicable:
                      catalogPrice?.gstApplicable ??
                      fallbackRateSnapshot?.gstApplicable ??
                      false,
                    gstRate:
                      catalogPrice?.gstRate ??
                      fallbackRateSnapshot?.gstRate ??
                      null,
                    gstInclusive:
                      catalogPrice?.priceType !== "GST_EXCLUSIVE" &&
                      fallbackRateSnapshot?.priceType !== "GST_EXCLUSIVE",
                    taxableValue: planPricing.taxableAmount,
                    cgst: planPricing.cgstAmount,
                    sgst: planPricing.sgstAmount,
                    total: planPricing.totalAmount,
                    recurring: planData.recurring,
                    frequency: planData.recurring ? "MONTHLY" : "CUSTOM",
                    effectiveFrom,
                    effectiveTo,
                    status: contract.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
                    sourceVersionId: catalogPrice?.id ?? null,
                    metadata: {
                      scheduledWeekdays: weekdays,
                      dailyHours,
                      includedDays,
                      maximumVisitsOverride,
                    },
                  },
                })
              : null;

          const savedPlan = planId
            ? await transaction.studentDaycarePlan.update({
                where: { id: planId },
                data: planData,
                include: {
                  planDefinition: true,
                  priceVersion: true,
                  mealCombination: true,
                  student: {
                    select: {
                      studentNumber: true,
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      programme: true,
                    },
                  },
                },
              })
            : await transaction.studentDaycarePlan.create({
                data: {
                  ...planData,
                  enrollmentContractId: contract?.id ?? null,
                  contractServiceId: contractService?.id ?? null,
                  active: contract ? contract.status === "ACTIVE" : true,
                  lifecycleStatus:
                    contract && contract.status !== "ACTIVE"
                      ? "INACTIVE"
                      : "ACTIVE",
                },
                include: {
                  planDefinition: true,
                  priceVersion: true,
                  mealCombination: true,
                  student: {
                    select: {
                      studentNumber: true,
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      programme: true,
                    },
                  },
                },
              });

          if (contract) {
            if (mealCombination && mealCombination.priceVersions[0]) {
              const mealVersion = mealCombination.priceVersions[0];
              const existingMealService =
                await transaction.contractService.findFirst({
                  where: {
                    contractId: contract.id,
                    serviceType: "MEAL",
                    catalogueItemId: mealCombination.id,
                    status: { in: ["ACTIVE", "DRAFT"] },
                    effectiveFrom: { lte: effectiveTo ?? effectiveFrom },
                    OR: [
                      { effectiveTo: null },
                      { effectiveTo: { gte: effectiveFrom } },
                    ],
                  },
                  select: { id: true },
                });
              if (!existingMealService) {
                const mealAmount =
                  monthlyFoodFeeOverride ?? Number(mealVersion.price);
                const mealPricing = calculateChargePricing({
                  configuredAmount: mealAmount,
                  gstApplicable: mealVersion.gstApplicable,
                  gstRate: Number(mealVersion.gstRate ?? 0),
                  priceType:
                    mealVersion.priceType === "GST_EXCLUSIVE"
                      ? "GST_EXCLUSIVE"
                      : "GST_INCLUSIVE",
                });
                await transaction.contractService.create({
                  data: {
                    contractId: contract.id,
                    serviceType: "MEAL",
                    category: "DAYCARE_MEAL_COMBO_FEE",
                    catalogueItemType: "MEAL_COMBINATION",
                    catalogueItemId: mealCombination.id,
                    label: mealCombination.name,
                    amountSnapshot: mealPricing.configuredAmount,
                    gstApplicable: mealVersion.gstApplicable,
                    gstRate: mealVersion.gstRate,
                    gstInclusive: mealVersion.priceType !== "GST_EXCLUSIVE",
                    taxableValue: mealPricing.taxableAmount,
                    cgst: mealPricing.cgstAmount,
                    sgst: mealPricing.sgstAmount,
                    total: mealPricing.totalAmount,
                    recurring: planData.recurring,
                    frequency: planData.recurring ? "MONTHLY" : "CUSTOM",
                    effectiveFrom,
                    effectiveTo,
                    status:
                      contract.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
                    sourceVersionId: mealVersion.id,
                    metadata: { studentDaycarePlanId: savedPlan.id },
                  },
                });
              }
            }
            await transaction.studentEnrollmentContract.update({
              where: { id: contract.id },
              data: {
                daycareEnabled: true,
                mealsEnabled:
                  Boolean(mealCombinationId) || foodOption !== "NONE",
                updatedById: adminUserId,
              },
            });
          }

          await transaction.activityLog.create({
            data: {
              adminUserId,
              action: planId ? "UPDATED" : "CREATED",
              entityType: "StudentDaycarePlan",
              entityId: savedPlan.id,
              description: `${savedPlan.title} ${planId ? "updated" : "created"}.`,
              newData: {
                studentId,
                planType,
                billingMode,
                scheduledWeekdays: weekdays,
                foodOption,
                dailyHours,
                includedDays,
                monthlyFeeOverride: savedMonthlyFee,
                monthlyFoodFeeOverride,
                planDefinitionId,
                priceVersionId: catalogPrice?.id ?? null,
                mealCombinationId,
                recurring: planData.recurring,
                maximumVisitsOverride: planData.maximumVisitsOverride,
                separateInvoice: planData.separateInvoice,
                effectiveFrom: effectiveFrom.toISOString(),
                effectiveTo: effectiveTo?.toISOString() ?? null,
              },
            },
          });

          return savedPlan;
        },
        { isolationLevel: "Serializable" },
      );

      return NextResponse.json({
        success: true,
        message: planId ? "Daycare plan updated." : "Daycare plan created.",
        plan: serialisePlan(plan),
      });
    }

    if (action === "record-session") {
      const studentId = cleanText(body.studentId, 100);
      const planId = cleanText(body.planId, 100) || null;
      const billingMode = parseBillingMode(body.billingMode);
      const sessionDate = parseDate(body.sessionDate);
      const sessionStatus = cleanText(body.sessionStatus, 30);
      const pickupPerson = cleanOptionalText(body.pickupPerson, 160);
      const completed = sessionStatus === "COMPLETED";
      const sessionApproved =
        session.role === "OWNER" || session.permissions.includes("*");
      const selectedMealIds = Array.isArray(body.mealIds)
        ? [
            ...new Set(
              body.mealIds
                .map((value) => cleanText(value, 100))
                .filter(Boolean),
            ),
          ]
        : [];

      if (!studentId || !billingMode || !sessionDate) {
        throw new DaycareRequestError(
          "Choose the student, daycare type and session date.",
        );
      }

      if (sessionStatus !== "BOOKED" && sessionStatus !== "COMPLETED") {
        throw new DaycareRequestError(
          "Choose Booked or Completed & Create Invoice.",
        );
      }

      const [student, plan, rate, existingDaycareSession, selectedMeals] =
        await Promise.all([
          prisma.student.findUnique({
            where: { id: studentId },
            select: {
              id: true,
              studentNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              programme: true,
              status: true,
            },
          }),
          planId
            ? prisma.studentDaycarePlan.findUnique({
                where: { id: planId },
                include: { planDefinition: true, priceVersion: true },
              })
            : null,
          prisma.daycareRateSetting.findFirst({
            where: {
              active: true,
              effectiveFrom: { lte: sessionDate },
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: sessionDate } },
              ],
            },
            orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
          }),
          prisma.daycareSession.findFirst({
            where: {
              studentId,
              sessionDate,
            },
            select: {
              id: true,
              status: true,
              feeInvoiceId: true,
            },
          }),
          selectedMealIds.length > 0
            ? prisma.mealDefinition.findMany({
                where: { id: { in: selectedMealIds }, status: "ACTIVE" },
                include: {
                  priceVersions: {
                    where: {
                      active: true,
                      effectiveFrom: { lte: sessionDate },
                      OR: [
                        { effectiveTo: null },
                        { effectiveTo: { gte: sessionDate } },
                      ],
                    },
                    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
                    take: 1,
                  },
                },
              })
            : Promise.resolve([]),
        ]);

      if (!student || student.status !== "ACTIVE") {
        throw new DaycareRequestError("Choose an active student.", 404);
      }

      if (plan && (plan.studentId !== studentId || !plan.active)) {
        throw new DaycareRequestError(
          "The selected daycare plan is not active for this student.",
        );
      }
      if (
        selectedMeals.length !== selectedMealIds.length ||
        selectedMeals.some((meal) => meal.priceVersions.length === 0)
      ) {
        throw new DaycareRequestError(
          "One selected meal is inactive or has no price for this visit date.",
          409,
        );
      }
      if (
        plan?.planDefinition?.mealRule === "NOT_AVAILABLE" &&
        selectedMeals.length > 0
      ) {
        throw new DaycareRequestError(
          "Meals are not available with this daycare plan.",
        );
      }
      if (
        plan?.planDefinition?.mealRule === "REQUIRED" &&
        selectedMeals.length === 0
      ) {
        throw new DaycareRequestError(
          "Choose the meals provided for this daycare visit.",
        );
      }

      if (
        plan &&
        !dateIsWithinEffectiveRange(sessionDate, {
          effectiveFrom: plan.effectiveFrom,
          effectiveTo: plan.effectiveTo,
        })
      ) {
        throw new DaycareRequestError(
          "The selected daycare plan is not effective on the session date.",
          409,
        );
      }

      if (
        existingDaycareSession &&
        existingDaycareSession.status !== "CANCELLED"
      ) {
        throw new DaycareRequestError(
          "This student already has a daycare session on the selected date. Open the existing entry instead.",
          409,
        );
      }

      const dynamicMealCharge = parseMoney(
        selectedMeals.reduce(
          (sum, meal) => sum + Number(meal.priceVersions[0].price),
          0,
        ),
      );
      const foodOption =
        selectedMealIds.length > 0
          ? selectedMeals.length === 1 && selectedMeals[0].code === "LUNCH"
            ? "LUNCH"
            : selectedMeals.length === 1 &&
                selectedMeals[0].code === "EVENING_SNACK"
              ? "EVENING_SNACK"
              : "BOTH"
          : (parseFoodOption(body.foodOption) ??
            (parseBoolean(body.foodProvided) ? "LUNCH" : "NONE"));
      const foodProvided = foodOption !== "NONE";
      const planHasCatalogRate = plan?.priceVersion != null;
      const planHasBaseOverride =
        planHasCatalogRate || billingMode === "HOURLY"
          ? plan?.hourlyRateOverride != null
          : plan?.fullDayRateOverride != null;
      const planHasFoodOverride =
        !foodProvided ||
        selectedMeals.length > 0 ||
        plan?.foodChargeOverride != null ||
        (billingMode === "FULL_DAY" &&
          (plan?.fullDayFoodIncluded === true ||
            plan?.planDefinition?.mealRule === "INCLUDED"));

      if (!rate && (!planHasBaseOverride || !planHasFoodOverride)) {
        throw new DaycareRequestError(
          "No rate version covers this date. Save a daycare rate for the date, or enter every required rate override on the child's plan.",
          409,
        );
      }

      const hourlyRate =
        plan?.priceVersion && plan.planDefinition?.billingType === "HOURLY"
          ? Number(plan.priceVersion.price)
          : plan?.hourlyRateOverride == null
            ? Number(rate?.hourlyRate ?? Number.NaN)
            : Number(plan.hourlyRateOverride);
      const legacyFoodRate =
        plan?.foodChargeOverride == null
          ? Number(rate?.foodCharge ?? Number.NaN)
          : Number(plan.foodChargeOverride);
      const lunchRate =
        plan?.foodChargeOverride == null
          ? rate?.lunchCharge == null
            ? legacyFoodRate
            : Number(rate.lunchCharge)
          : legacyFoodRate;
      const eveningSnackRate =
        plan?.foodChargeOverride == null
          ? rate?.eveningSnackCharge == null
            ? legacyFoodRate
            : Number(rate.eveningSnackCharge)
          : legacyFoodRate;
      const mealComboRate =
        plan?.foodChargeOverride == null
          ? rate?.mealComboCharge == null
            ? lunchRate + eveningSnackRate
            : Number(rate.mealComboCharge)
          : legacyFoodRate * 2;
      const fullDayRate =
        plan?.priceVersion && plan.planDefinition?.billingType === "DAILY"
          ? Number(plan.priceVersion.price)
          : plan?.fullDayRateOverride == null
            ? Number(rate?.fullDayRate ?? Number.NaN)
            : Number(plan.fullDayRateOverride);
      const fullDayFoodIncluded =
        plan?.planDefinition?.mealRule === "INCLUDED" ||
        (plan?.fullDayFoodIncluded ?? rate?.fullDayFoodIncluded ?? false);
      const enteredHours = parseMoney(body.billableHours);
      const checkInAt = parseTimeOnDate(sessionDate, body.checkInAt);
      const checkOutAt = parseTimeOnDate(sessionDate, body.checkOutAt);
      let billableHours: number | null = null;

      if (billingMode === "HOURLY") {
        if (Number.isFinite(enteredHours) && enteredHours > 0) {
          billableHours = enteredHours;
        } else if (checkInAt && checkOutAt && checkOutAt > checkInAt) {
          billableHours =
            Math.ceil(
              ((checkOutAt.getTime() - checkInAt.getTime()) / 3_600_000) * 4,
            ) / 4;
        }

        if (!billableHours || billableHours <= 0 || billableHours > 24) {
          throw new DaycareRequestError(
            "Enter billable hours or valid check-in and check-out times.",
          );
        }
      }

      const monthlyPlan = plan != null && plan.planType !== "OCCASIONAL";
      const coveredByPrepaidPlan = isCoveredByPrepaidPlan(plan, sessionDate);
      const additionalPlanVisit = monthlyPlan && !coveredByPrepaidPlan;
      const calculatedBaseAmount = parseMoney(
        billingMode === "HOURLY"
          ? (billableHours ?? 0) * hourlyRate
          : fullDayRate,
      );
      const baseAmount = coveredByPrepaidPlan ? 0 : calculatedBaseAmount;
      const calculatedFoodCharge =
        foodProvided && !(billingMode === "FULL_DAY" && fullDayFoodIncluded)
          ? selectedMeals.length > 0
            ? dynamicMealCharge
            : foodOption === "LUNCH"
              ? lunchRate
              : foodOption === "EVENING_SNACK"
                ? eveningSnackRate
                : mealComboRate
          : 0;
      const appliedFoodCharge = coveredByPrepaidPlan ? 0 : calculatedFoodCharge;
      const totalAmount = parseMoney(baseAmount + appliedFoodCharge);
      const gstApplicable =
        plan?.priceVersion?.gstApplicable ?? rate?.gstApplicable ?? false;
      const gstRate = gstApplicable
        ? Number(plan?.priceVersion?.gstRate ?? rate?.gstRate ?? 0)
        : 0;
      const priceType = (plan?.priceVersion?.priceType ??
        rate?.priceType ??
        "GST_INCLUSIVE") as ChargePriceType;
      const foodGstApplicable =
        appliedFoodCharge > 0 &&
        (selectedMeals.length > 0
          ? selectedMeals.some((meal) => meal.priceVersions[0].gstApplicable)
          : (rate?.foodGstApplicable ?? false));
      const foodGstRate = foodGstApplicable
        ? selectedMeals.length > 0
          ? Number(selectedMeals[0].priceVersions[0].gstRate ?? 0)
          : Number(rate?.foodGstRate ?? 0)
        : 0;
      const foodPriceType = (selectedMeals[0]?.priceVersions[0]?.priceType ??
        rate?.foodPriceType ??
        "GST_INCLUSIVE") as ChargePriceType;
      const notes = cleanOptionalText(body.notes);
      const reason = cleanOptionalText(body.reason, 500);
      const deferToNextMonthlyInvoice =
        completed &&
        ((!monthlyPlan && student.programme !== "DAYCARE") ||
          additionalPlanVisit);
      const createVisitInvoice =
        completed &&
        sessionApproved &&
        !monthlyPlan &&
        !deferToNextMonthlyInvoice;
      const daycareSessionStatus: $Enums.DaycareSessionStatus = completed
        ? createVisitInvoice
          ? "BILLED"
          : "COMPLETED"
        : "BOOKED";

      const result = await prisma.$transaction(
        async (transaction) => {
          if (plan?.planType === "FLEXIBLE_DAYS" && plan.includedDays != null) {
            const monthRange = getIndiaMonthRange(sessionDate);
            const usedDays = await transaction.daycareSession.count({
              where: {
                planId: plan.id,
                sessionDate: { gte: monthRange.start, lte: monthRange.end },
                status: { not: "CANCELLED" },
                ...(existingDaycareSession
                  ? { id: { not: existingDaycareSession.id } }
                  : {}),
              },
            });

            if (usedDays >= plan.includedDays) {
              throw new DaycareRequestError(
                `This flexible package already used all ${plan.includedDays} included day${plan.includedDays === 1 ? "" : "s"} for this month.`,
                409,
              );
            }
          }

          const sessionSequence =
            await getNextDaycareSessionNumber(transaction);
          let invoiceId: string | null = null;
          let invoiceNumber: string | null = null;

          if (createVisitInvoice) {
            const invoiceSettings = await transaction.numberSequence.findUnique(
              {
                where: { key: "INVOICE" },
                select: { prefix: true, minimumWidth: true },
              },
            );
            const invoiceSequence = await getNextSequence(transaction, {
              key: "INVOICE",
              prefix: invoiceSettings?.prefix ?? "KZ-INV",
              minimumWidth: invoiceSettings?.minimumWidth ?? 2,
            });
            const baseGst = calculateChargePricing({
              configuredAmount: baseAmount,
              gstApplicable,
              gstRate,
              priceType,
            });
            const selectedMealItems = selectedMeals.map((meal, index) => {
              const version = meal.priceVersions[0];
              const amount = parseMoney(version.price);
              const tax = calculateChargePricing({
                configuredAmount: amount,
                gstApplicable: version.gstApplicable,
                gstRate: Number(version.gstRate ?? 0),
                priceType: version.priceType,
              });
              return {
                category: "FOOD_FEE" as const,
                title: meal.name,
                detail: `Meal provided on ${formatDateLabel(sessionDate)}`,
                quantity: 1,
                unitAmount: tax.totalAmount,
                amount: tax.totalAmount,
                gstApplicable: version.gstApplicable,
                gstRate: version.gstApplicable
                  ? Number(version.gstRate ?? 0)
                  : null,
                priceType: version.priceType,
                taxableAmount: tax.taxableAmount,
                cgstAmount: tax.cgstAmount,
                sgstAmount: tax.sgstAmount,
                totalAmount: tax.totalAmount,
                sortOrder: 20 + index,
                chargeKey: `daycare:${studentId}:${formatDateKey(sessionDate)}:meal:${meal.id}`,
                sourceType: "MealPriceVersion",
                sourceId: meal.id,
                sourceVersionId: version.id,
              };
            });
            const foodGst =
              selectedMealItems.length > 0
                ? selectedMealItems.reduce(
                    (total, item) => ({
                      taxableAmount: parseMoney(
                        total.taxableAmount + item.taxableAmount,
                      ),
                      cgstAmount: parseMoney(
                        total.cgstAmount + item.cgstAmount,
                      ),
                      sgstAmount: parseMoney(
                        total.sgstAmount + item.sgstAmount,
                      ),
                      totalAmount: parseMoney(
                        total.totalAmount + item.totalAmount,
                      ),
                    }),
                    {
                      taxableAmount: 0,
                      cgstAmount: 0,
                      sgstAmount: 0,
                      totalAmount: 0,
                    },
                  )
                : calculateChargePricing({
                    configuredAmount: appliedFoodCharge,
                    gstApplicable: foodGstApplicable,
                    gstRate: foodGstRate,
                    priceType: foodPriceType,
                  });
            const invoiceGstApplicable = gstApplicable || foodGstApplicable;
            const invoiceGstRate =
              gstApplicable && foodGstApplicable && gstRate !== foodGstRate
                ? null
                : gstApplicable
                  ? gstRate
                  : foodGstApplicable
                    ? foodGstRate
                    : null;
            const mealLabel = foodOptionLabel(foodOption);
            const detail =
              billingMode === "HOURLY"
                ? `${billableHours} hour${billableHours === 1 ? "" : "s"}${foodProvided ? ` + ${mealLabel}` : ""}`
                : `full day${foodProvided ? (fullDayFoodIncluded ? ` with ${mealLabel} included` : ` + ${mealLabel}`) : ""}`;
            const invoice = await transaction.feeInvoice.create({
              data: {
                invoiceNumber: invoiceSequence.formattedNumber,
                billingKey: `daycare:${studentId}:${formatDateKey(sessionDate)}`,
                studentId,
                category: "DAYCARE_FEE",
                feePeriodKey: null,
                feePeriodLabel: `Occasional daycare · ${formatDateLabel(sessionDate)} · ${detail}`,
                issueDate: new Date(),
                dueDate: sessionDate,
                amountBeforeTax: parseMoney(
                  baseGst.totalAmount +
                    (selectedMealItems.length > 0
                      ? selectedMealItems.reduce(
                          (sum, item) => sum + item.totalAmount,
                          0,
                        )
                      : foodGst.totalAmount),
                ),
                discountAmount: 0,
                lateFeeAmount: 0,
                gstApplicable: invoiceGstApplicable,
                gstRate: invoiceGstRate,
                cgstAmount: parseMoney(baseGst.cgstAmount + foodGst.cgstAmount),
                sgstAmount: parseMoney(baseGst.sgstAmount + foodGst.sgstAmount),
                totalAmount: parseMoney(
                  baseGst.totalAmount +
                    (selectedMealItems.length > 0
                      ? selectedMealItems.reduce(
                          (sum, item) => sum + item.totalAmount,
                          0,
                        )
                      : foodGst.totalAmount),
                ),
                paidAmount: 0,
                pendingAmount: parseMoney(
                  baseGst.totalAmount +
                    (selectedMealItems.length > 0
                      ? selectedMealItems.reduce(
                          (sum, item) => sum + item.totalAmount,
                          0,
                        )
                      : foodGst.totalAmount),
                ),
                status: "DUE",
                createdById: adminUserId,
                notes: [
                  `${sessionSequence.formattedNumber}: ${detail}.`,
                  `Base ₹${baseAmount.toLocaleString("en-IN")}; food ₹${appliedFoodCharge.toLocaleString("en-IN")}.`,
                  notes,
                ]
                  .filter(Boolean)
                  .join(" "),
                items: {
                  create: [
                    {
                      category: "DAYCARE_FEE",
                      title:
                        billingMode === "HOURLY"
                          ? "Emergency daycare"
                          : "Full-day daycare",
                      detail:
                        billingMode === "HOURLY"
                          ? `${billableHours} billable hour${billableHours === 1 ? "" : "s"}`
                          : foodProvided && fullDayFoodIncluded
                            ? `${mealLabel} included`
                            : "Full-day care",
                      quantity:
                        billingMode === "HOURLY" ? (billableHours ?? 1) : 1,
                      unitAmount: baseGst.totalAmount,
                      amount: baseGst.totalAmount,
                      gstApplicable,
                      gstRate: gstApplicable ? gstRate : null,
                      priceType,
                      taxableAmount: baseGst.taxableAmount,
                      cgstAmount: baseGst.cgstAmount,
                      sgstAmount: baseGst.sgstAmount,
                      totalAmount: baseGst.totalAmount,
                      sortOrder: 10,
                    },
                    ...(selectedMealItems.length > 0
                      ? selectedMealItems
                      : appliedFoodCharge > 0
                        ? [
                            {
                              category:
                                foodOption === "LUNCH"
                                  ? ("DAYCARE_LUNCH_FEE" as const)
                                  : foodOption === "EVENING_SNACK"
                                    ? ("DAYCARE_EVENING_SNACK_FEE" as const)
                                    : ("DAYCARE_MEAL_COMBO_FEE" as const),
                              title:
                                foodOption === "LUNCH"
                                  ? "Daycare lunch"
                                  : foodOption === "EVENING_SNACK"
                                    ? "Daycare evening snack"
                                    : "Daycare lunch + evening snack",
                              detail: `Meal provided on ${formatDateLabel(sessionDate)}`,
                              quantity: 1,
                              unitAmount: foodGst.totalAmount,
                              amount: foodGst.totalAmount,
                              gstApplicable: foodGstApplicable,
                              gstRate: foodGstApplicable ? foodGstRate : null,
                              priceType: foodPriceType,
                              taxableAmount: foodGst.taxableAmount,
                              cgstAmount: foodGst.cgstAmount,
                              sgstAmount: foodGst.sgstAmount,
                              totalAmount: foodGst.totalAmount,
                              sortOrder: 20,
                            },
                          ]
                        : []),
                  ],
                },
              },
            });
            invoiceId = invoice.id;
            invoiceNumber = invoice.invoiceNumber;
          }

          const daycareSessionData = {
            sessionNumber: sessionSequence.formattedNumber,
            studentId,
            planId,
            rateSettingId: rate?.id ?? null,
            feeInvoiceId: invoiceId,
            sessionDate,
            billingMode,
            checkInAt,
            checkOutAt,
            billableHours,
            foodProvided,
            foodOption,
            hourlyRate: billingMode === "HOURLY" ? hourlyRate : null,
            foodCharge: appliedFoodCharge,
            fullDayRate: billingMode === "FULL_DAY" ? fullDayRate : null,
            baseAmount,
            totalAmount,
            gstApplicable,
            gstRate: gstApplicable ? gstRate : null,
            priceType,
            foodGstApplicable,
            foodGstRate: foodGstApplicable ? foodGstRate : null,
            foodPriceType,
            status: daycareSessionStatus,
            reason,
            pickupPerson,
            approved: completed && (sessionApproved || coveredByPrepaidPlan),
            approvedAt:
              completed && (sessionApproved || coveredByPrepaidPlan)
                ? new Date()
                : null,
            approvedById:
              completed && (sessionApproved || coveredByPrepaidPlan)
                ? adminUserId
                : null,
            emergencyCare:
              !plan || plan.planType === "OCCASIONAL" || additionalPlanVisit,
            invoiceStatus: invoiceId
              ? "INVOICED"
              : completed && coveredByPrepaidPlan
                ? "CONTRACT_COVERED"
                : completed && sessionApproved
                  ? "APPROVED"
                  : "PENDING_APPROVAL",
            notes,
            createdById: adminUserId,
          };
          const created = existingDaycareSession
            ? await transaction.daycareSession.update({
                where: { id: existingDaycareSession.id },
                data: daycareSessionData,
              })
            : await transaction.daycareSession.create({
                data: daycareSessionData,
              });

          if (selectedMeals.length > 0) {
            await transaction.daycareSessionMeal.deleteMany({
              where: { sessionId: created.id },
            });
            await transaction.daycareSessionMeal.createMany({
              data: selectedMeals.map((meal) => {
                const version = meal.priceVersions[0];
                return {
                  sessionId: created.id,
                  mealId: meal.id,
                  quantity: 1,
                  unitPrice: Number(version.price),
                  totalAmount: Number(version.price),
                  gstApplicable: version.gstApplicable,
                  gstRate: version.gstApplicable
                    ? Number(version.gstRate ?? 0)
                    : null,
                  priceType: version.priceType,
                };
              }),
            });
          }

          await transaction.activityLog.create({
            data: {
              adminUserId,
              action: existingDaycareSession ? "UPDATED" : "CREATED",
              entityType: "DaycareSession",
              entityId: created.id,
              description: `${sessionSequence.formattedNumber} recorded for ${studentName(student)}.`,
              newData: {
                sessionDate: sessionDate.toISOString(),
                billingMode,
                billableHours,
                foodProvided,
                foodOption,
                pickupPerson,
                planType: plan?.planType ?? "OCCASIONAL",
                totalAmount,
                invoiceNumber,
                approved:
                  completed && (sessionApproved || coveredByPrepaidPlan),
                coveredByPrepaidPlan,
                additionalPlanVisit,
                reason,
                meals: selectedMeals.map((meal) => meal.name),
              },
            },
          });

          return { created, invoiceNumber };
        },
        { isolationLevel: "Serializable" },
      );

      return NextResponse.json({
        success: true,
        message: completed
          ? !sessionApproved
            ? `${result.created.sessionNumber} saved for Owner approval. It cannot be invoiced until approved.`
            : createVisitInvoice
              ? `${result.created.sessionNumber} saved and invoice ${result.invoiceNumber} created.`
              : deferToNextMonthlyInvoice
                ? `${result.created.sessionNumber} saved. This additional daycare charge will be added to the child's next combined monthly invoice.`
                : `${result.created.sessionNumber} saved under the prepaid monthly plan. Attendance did not change the contracted fee.`
          : `${result.created.sessionNumber} booked. Complete it later to create the invoice.`,
      });
    }

    if (action === "update-ledger") {
      if (session.role !== "OWNER" && !session.permissions.includes("*")) {
        throw new DaycareRequestError(
          "Only the Owner can edit an emergency daycare ledger entry.",
          403,
        );
      }
      const sessionId = cleanText(body.sessionId, 100);
      const existing = await prisma.daycareSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          sessionNumber: true,
          status: true,
          feeInvoiceId: true,
          invoiceStatus: true,
        },
      });
      if (!existing)
        throw new DaycareRequestError(
          "Daycare ledger entry was not found.",
          404,
        );
      if (
        existing.feeInvoiceId ||
        existing.status === "BILLED" ||
        existing.status === "CANCELLED"
      ) {
        throw new DaycareRequestError(
          "An invoiced or cancelled ledger entry cannot be edited.",
          409,
        );
      }
      if (existing.invoiceStatus === "CONTRACT_COVERED") {
        throw new DaycareRequestError(
          "A prepaid attendance record has no additional ledger charge to edit.",
          409,
        );
      }
      const billableHours =
        body.billableHours == null ? null : parseMoney(body.billableHours);
      const baseAmount = parseMoney(body.baseAmount);
      const foodCharge = parseMoney(body.foodCharge);
      if (
        baseAmount < 0 ||
        foodCharge < 0 ||
        (billableHours != null && (billableHours <= 0 || billableHours > 24))
      ) {
        throw new DaycareRequestError(
          "Enter valid hours and non-negative charges.",
        );
      }
      const reason = cleanOptionalText(body.reason, 500);
      const notes = cleanOptionalText(body.notes);
      const updated = await prisma.$transaction(async (transaction) => {
        const saved = await transaction.daycareSession.update({
          where: { id: existing.id },
          data: {
            billableHours,
            baseAmount,
            foodCharge,
            totalAmount: parseMoney(baseAmount + foodCharge),
            reason,
            notes,
            approved: false,
            approvedAt: null,
            approvedById: null,
            invoiceStatus: "PENDING_APPROVAL",
          },
        });
        await transaction.activityLog.create({
          data: {
            adminUserId,
            action: "UPDATED",
            entityType: "DaycareSession",
            entityId: existing.id,
            description: `${existing.sessionNumber} ledger charges were edited before invoicing and returned for approval.`,
            newData: { billableHours, baseAmount, foodCharge, reason },
          },
        });
        return saved;
      });
      return NextResponse.json({
        success: true,
        message: `${updated.sessionNumber} updated and returned for Owner approval.`,
      });
    }

    if (action === "approve-session") {
      if (session.role !== "OWNER" && !session.permissions.includes("*")) {
        throw new DaycareRequestError(
          "Only the Owner can approve an emergency daycare ledger entry.",
          403,
        );
      }
      const sessionId = cleanText(body.sessionId, 100);
      const existing = await prisma.daycareSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          sessionNumber: true,
          status: true,
          feeInvoiceId: true,
          approved: true,
        },
      });
      if (!existing)
        throw new DaycareRequestError(
          "Daycare ledger entry was not found.",
          404,
        );
      if (existing.status !== "COMPLETED" || existing.feeInvoiceId)
        throw new DaycareRequestError(
          "Only a completed, unbilled ledger entry can be approved.",
          409,
        );
      if (!existing.approved) {
        await prisma.$transaction(async (transaction) => {
          const claimed = await transaction.daycareSession.updateMany({
            where: {
              id: existing.id,
              approved: false,
              feeInvoiceId: null,
              status: "COMPLETED",
            },
            data: {
              approved: true,
              approvedAt: new Date(),
              approvedById: adminUserId,
              invoiceStatus: "APPROVED",
            },
          });
          if (claimed.count !== 1)
            throw new DaycareRequestError(
              "This ledger entry changed while it was being approved.",
              409,
            );
          await transaction.activityLog.create({
            data: {
              adminUserId,
              action: "UPDATED",
              entityType: "DaycareSession",
              entityId: existing.id,
              description: `${existing.sessionNumber} approved for billing.`,
            },
          });
        });
      }
      return NextResponse.json({
        success: true,
        message: `${existing.sessionNumber} approved and ready for the next invoice.`,
      });
    }

    if (action === "complete-session") {
      const sessionId = cleanText(body.sessionId, 100);
      const existing = await prisma.daycareSession.findUnique({
        where: { id: sessionId },
        include: {
          meals: { include: { meal: true }, orderBy: { createdAt: "asc" } },
          plan: {
            select: {
              planType: true,
              scheduledWeekdays: true,
            },
          },
          student: {
            select: {
              firstName: true,
              middleName: true,
              lastName: true,
              programme: true,
            },
          },
        },
      });

      if (!existing) {
        throw new DaycareRequestError("Daycare session was not found.", 404);
      }

      if (existing.status !== "BOOKED" || existing.feeInvoiceId) {
        throw new DaycareRequestError(
          "Only an unbilled booking can be completed.",
        );
      }

      const coveredBooking = isCoveredByPrepaidPlan(
        existing.plan,
        existing.sessionDate,
      );
      if (coveredBooking) {
        const updated = await prisma.$transaction(async (transaction) => {
          const claimed = await transaction.daycareSession.updateMany({
            where: { id: existing.id, status: "BOOKED", feeInvoiceId: null },
            data: {
              status: "COMPLETED",
              approved: true,
              approvedAt: new Date(),
              approvedById: adminUserId,
              invoiceStatus: "CONTRACT_COVERED",
            },
          });
          if (claimed.count !== 1) {
            throw new DaycareRequestError(
              "This daycare booking was already completed or changed.",
              409,
            );
          }
          await transaction.activityLog.create({
            data: {
              adminUserId,
              action: "UPDATED",
              entityType: "DaycareSession",
              entityId: existing.id,
              description: `${existing.sessionNumber} completed under its prepaid contract. Attendance did not change the monthly fee.`,
            },
          });
          return transaction.daycareSession.findUniqueOrThrow({
            where: { id: existing.id },
          });
        });
        return NextResponse.json({
          success: true,
          message: `${updated.sessionNumber} completed under the prepaid contract. No additional charge was created.`,
        });
      }

      const canApproveCompletion =
        session.role === "OWNER" || session.permissions.includes("*");
      if (!canApproveCompletion) {
        await prisma.$transaction(async (transaction) => {
          const claimed = await transaction.daycareSession.updateMany({
            where: { id: existing.id, status: "BOOKED", feeInvoiceId: null },
            data: {
              status: "COMPLETED",
              approved: false,
              approvedAt: null,
              approvedById: null,
              invoiceStatus: "PENDING_APPROVAL",
            },
          });
          if (claimed.count !== 1)
            throw new DaycareRequestError(
              "This booking changed while it was being completed.",
              409,
            );
          await transaction.activityLog.create({
            data: {
              adminUserId,
              action: "UPDATED",
              entityType: "DaycareSession",
              entityId: existing.id,
              description: `${existing.sessionNumber} completed and sent to the Owner for billing approval.`,
            },
          });
        });
        return NextResponse.json({
          success: true,
          message: `${existing.sessionNumber} completed. Owner approval is required before billing.`,
        });
      }

      if (
        (existing.plan && existing.plan.planType !== "OCCASIONAL") ||
        existing.student.programme !== "DAYCARE"
      ) {
        const queuedForMonthlyInvoice =
          (!existing.plan || existing.plan.planType === "OCCASIONAL") &&
          existing.student.programme !== "DAYCARE";
        const updated = await prisma.$transaction(async (transaction) => {
          const claimed = await transaction.daycareSession.updateMany({
            where: { id: existing.id, status: "BOOKED", feeInvoiceId: null },
            data: {
              status: "COMPLETED",
              approved: true,
              approvedAt: new Date(),
              approvedById: adminUserId,
              invoiceStatus: "APPROVED",
            },
          });

          if (claimed.count !== 1) {
            throw new DaycareRequestError(
              "This daycare booking was already completed or changed.",
              409,
            );
          }
          const completedSession =
            await transaction.daycareSession.findUniqueOrThrow({
              where: { id: existing.id },
            });

          await transaction.activityLog.create({
            data: {
              adminUserId,
              action: "UPDATED",
              entityType: "DaycareSession",
              entityId: completedSession.id,
              description: queuedForMonthlyInvoice
                ? `${completedSession.sessionNumber} completed and queued for the child's next monthly preschool invoice.`
                : `${completedSession.sessionNumber} completed under a monthly daycare plan. No daily invoice was created.`,
            },
          });

          return completedSession;
        });

        return NextResponse.json({
          success: true,
          message: queuedForMonthlyInvoice
            ? `${updated.sessionNumber} completed. The charge will be added to the child's next monthly preschool invoice.`
            : `${updated.sessionNumber} completed under the monthly plan. No duplicate daily invoice was created.`,
        });
      }

      const result = await prisma.$transaction(async (transaction) => {
        const claimed = await transaction.daycareSession.updateMany({
          where: { id: existing.id, status: "BOOKED", feeInvoiceId: null },
          data: {
            status: "COMPLETED",
            approved: true,
            approvedAt: new Date(),
            approvedById: adminUserId,
            invoiceStatus: "APPROVED",
          },
        });

        if (claimed.count !== 1) {
          throw new DaycareRequestError(
            "This daycare booking was already completed or changed.",
            409,
          );
        }

        const invoiceSettings = await transaction.numberSequence.findUnique({
          where: { key: "INVOICE" },
          select: { prefix: true, minimumWidth: true },
        });
        const sequence = await getNextSequence(transaction, {
          key: "INVOICE",
          prefix: invoiceSettings?.prefix ?? "KZ-INV",
          minimumWidth: invoiceSettings?.minimumWidth ?? 2,
        });
        const gstRate = existing.gstRate == null ? 0 : Number(existing.gstRate);
        const foodGstRate =
          existing.foodGstRate == null ? 0 : Number(existing.foodGstRate);
        const baseAmount = Number(existing.baseAmount);
        const foodAmount = Number(existing.foodCharge);
        const baseGst = calculateChargePricing({
          configuredAmount: baseAmount,
          gstApplicable: existing.gstApplicable,
          gstRate,
          priceType: existing.priceType,
        });
        const completedMealItems = existing.meals.map((sessionMeal, index) => {
          const amount = Number(sessionMeal.totalAmount);
          const tax = calculateChargePricing({
            configuredAmount: amount,
            gstApplicable: sessionMeal.gstApplicable,
            gstRate: Number(sessionMeal.gstRate ?? 0),
            priceType: sessionMeal.priceType,
          });
          return {
            category: "FOOD_FEE" as const,
            title: sessionMeal.meal.name,
            detail: `Meal provided on ${formatDateLabel(existing.sessionDate)}`,
            quantity: Number(sessionMeal.quantity),
            unitAmount: tax.totalAmount,
            amount: tax.totalAmount,
            gstApplicable: sessionMeal.gstApplicable,
            gstRate: sessionMeal.gstApplicable
              ? Number(sessionMeal.gstRate ?? 0)
              : null,
            priceType: sessionMeal.priceType,
            taxableAmount: tax.taxableAmount,
            cgstAmount: tax.cgstAmount,
            sgstAmount: tax.sgstAmount,
            totalAmount: tax.totalAmount,
            sortOrder: 20 + index,
            chargeKey: `daycare-session:${existing.id}:meal:${sessionMeal.mealId}`,
            sourceType: "MealDefinition",
            sourceId: sessionMeal.mealId,
          };
        });
        const foodGst =
          completedMealItems.length > 0
            ? completedMealItems.reduce(
                (total, item) => ({
                  taxableAmount: parseMoney(
                    total.taxableAmount + item.taxableAmount,
                  ),
                  cgstAmount: parseMoney(total.cgstAmount + item.cgstAmount),
                  sgstAmount: parseMoney(total.sgstAmount + item.sgstAmount),
                  totalAmount: parseMoney(total.totalAmount + item.totalAmount),
                }),
                {
                  taxableAmount: 0,
                  cgstAmount: 0,
                  sgstAmount: 0,
                  totalAmount: 0,
                },
              )
            : calculateChargePricing({
                configuredAmount: foodAmount,
                gstApplicable: existing.foodGstApplicable,
                gstRate: foodGstRate,
                priceType: existing.foodPriceType,
              });
        const totalAmount = parseMoney(
          baseGst.totalAmount +
            (completedMealItems.length > 0
              ? completedMealItems.reduce(
                  (sum, item) => sum + item.totalAmount,
                  0,
                )
              : foodGst.totalAmount),
        );
        const invoiceGstApplicable =
          existing.gstApplicable ||
          (foodAmount > 0 && existing.foodGstApplicable);
        const invoiceGstRate =
          existing.gstApplicable &&
          foodAmount > 0 &&
          existing.foodGstApplicable &&
          gstRate !== foodGstRate
            ? null
            : existing.gstApplicable
              ? gstRate
              : foodAmount > 0 && existing.foodGstApplicable
                ? foodGstRate
                : null;
        const completedFoodOption =
          existing.foodOption !== "NONE"
            ? existing.foodOption
            : existing.foodProvided
              ? ("LUNCH" as const)
              : ("NONE" as const);
        const mealLabel = foodOptionLabel(completedFoodOption);
        const detail =
          existing.billingMode === "HOURLY"
            ? `${Number(existing.billableHours)} hours${existing.foodProvided ? ` + ${mealLabel}` : ""}`
            : `full day${existing.foodProvided ? ` with ${mealLabel}` : ""}`;
        const invoice = await transaction.feeInvoice.create({
          data: {
            invoiceNumber: sequence.formattedNumber,
            billingKey: `daycare:${existing.studentId}:${formatDateKey(existing.sessionDate)}`,
            studentId: existing.studentId,
            category: "DAYCARE_FEE",
            feePeriodLabel: `Occasional daycare · ${formatDateLabel(existing.sessionDate)} · ${detail}`,
            issueDate: new Date(),
            dueDate: existing.sessionDate,
            amountBeforeTax: totalAmount,
            discountAmount: 0,
            lateFeeAmount: 0,
            gstApplicable: invoiceGstApplicable,
            gstRate: invoiceGstRate,
            cgstAmount: parseMoney(baseGst.cgstAmount + foodGst.cgstAmount),
            sgstAmount: parseMoney(baseGst.sgstAmount + foodGst.sgstAmount),
            totalAmount,
            paidAmount: 0,
            pendingAmount: totalAmount,
            status: "DUE",
            createdById: adminUserId,
            notes:
              `${existing.sessionNumber}: ${detail}. ${existing.notes ?? ""}`.trim(),
            items: {
              create: [
                {
                  category: "DAYCARE_FEE",
                  title:
                    existing.billingMode === "HOURLY"
                      ? "Emergency daycare"
                      : "Full-day daycare",
                  detail:
                    existing.billingMode === "HOURLY"
                      ? `${Number(existing.billableHours)} billable hours`
                      : existing.foodProvided && foodAmount === 0
                        ? `${mealLabel} included`
                        : "Full-day care",
                  quantity:
                    existing.billingMode === "HOURLY"
                      ? Number(existing.billableHours)
                      : 1,
                  unitAmount: baseGst.totalAmount,
                  amount: baseGst.totalAmount,
                  gstApplicable: existing.gstApplicable,
                  gstRate: existing.gstApplicable ? gstRate : null,
                  priceType: existing.priceType,
                  taxableAmount: baseGst.taxableAmount,
                  cgstAmount: baseGst.cgstAmount,
                  sgstAmount: baseGst.sgstAmount,
                  totalAmount: baseGst.totalAmount,
                  sortOrder: 10,
                },
                ...(completedMealItems.length > 0
                  ? completedMealItems
                  : foodAmount > 0
                    ? [
                        {
                          category:
                            completedFoodOption === "LUNCH"
                              ? ("DAYCARE_LUNCH_FEE" as const)
                              : completedFoodOption === "EVENING_SNACK"
                                ? ("DAYCARE_EVENING_SNACK_FEE" as const)
                                : ("DAYCARE_MEAL_COMBO_FEE" as const),
                          title:
                            completedFoodOption === "LUNCH"
                              ? "Daycare lunch"
                              : completedFoodOption === "EVENING_SNACK"
                                ? "Daycare evening snack"
                                : "Daycare lunch + evening snack",
                          detail: `Meal provided on ${formatDateLabel(existing.sessionDate)}`,
                          quantity: 1,
                          unitAmount: foodGst.totalAmount,
                          amount: foodGst.totalAmount,
                          gstApplicable: existing.foodGstApplicable,
                          gstRate: existing.foodGstApplicable
                            ? foodGstRate
                            : null,
                          priceType: existing.foodPriceType,
                          taxableAmount: foodGst.taxableAmount,
                          cgstAmount: foodGst.cgstAmount,
                          sgstAmount: foodGst.sgstAmount,
                          totalAmount: foodGst.totalAmount,
                          sortOrder: 20,
                        },
                      ]
                    : []),
              ],
            },
          },
        });
        const updated = await transaction.daycareSession.update({
          where: { id: existing.id },
          data: {
            status: "BILLED",
            feeInvoiceId: invoice.id,
            approved: true,
            approvedAt: new Date(),
            approvedById: adminUserId,
            invoiceStatus: "INVOICED",
          },
        });

        await transaction.activityLog.create({
          data: {
            adminUserId,
            action: "UPDATED",
            entityType: "DaycareSession",
            entityId: updated.id,
            description: `${updated.sessionNumber} completed and invoice ${invoice.invoiceNumber} created.`,
          },
        });

        return invoice;
      });

      return NextResponse.json({
        success: true,
        message: `Session completed and invoice ${result.invoiceNumber} created.`,
      });
    }

    throw new DaycareRequestError("Please choose a valid daycare action.");
  } catch (error) {
    console.error("Daycare update failed", error);
    const status =
      error instanceof DaycareRequestError
        ? error.status
        : isSerializationConflict(error) || isUniqueConflict(error)
          ? 409
          : 500;

    return NextResponse.json(
      {
        success: false,
        message: isSerializationConflict(error)
          ? "Another daycare update was saved at the same time. Please refresh and try once more."
          : isUniqueConflict(error)
            ? "A daycare entry for this child and date already exists. Refresh and open the existing entry."
            : error instanceof Error
              ? error.message
              : "The daycare record could not be saved.",
      },
      { status },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();

  if (!session || !canUseDaycare(session)) {
    return NextResponse.json(
      { success: false, message: "You do not have access to daycare billing." },
      { status: session ? 403 : 401 },
    );
  }

  const adminUserId = session.userId;

  const planId = request.nextUrl.searchParams.get("planId")?.trim();
  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();

  try {
    if (planId) {
      await prisma.$transaction(async (transaction) => {
        const existingPlan = await transaction.studentDaycarePlan.findUnique({
          where: { id: planId },
          select: { id: true, title: true, active: true, effectiveFrom: true },
        });

        if (!existingPlan) {
          throw new DaycareRequestError("Daycare plan was not found.", 404);
        }
        if (!existingPlan.active) {
          throw new DaycareRequestError(
            "This daycare plan is already inactive.",
            409,
          );
        }

        const now = new Date();
        const planEnd =
          now < existingPlan.effectiveFrom ? existingPlan.effectiveFrom : now;
        const claimed = await transaction.studentDaycarePlan.updateMany({
          where: { id: planId, active: true },
          data: {
            active: false,
            lifecycleStatus: "INACTIVE",
            effectiveTo: planEnd,
            billingStoppedAt: now,
          },
        });

        if (claimed.count !== 1) {
          throw new DaycareRequestError(
            "This daycare plan was already updated.",
            409,
          );
        }

        await transaction.activityLog.create({
          data: {
            adminUserId,
            action: "CANCELLED",
            entityType: "StudentDaycarePlan",
            entityId: existingPlan.id,
            description: `${existingPlan.title} deactivated.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Daycare plan deactivated.",
      });
    }

    if (sessionId) {
      const existing = await prisma.daycareSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          sessionNumber: true,
          status: true,
          feeInvoiceId: true,
        },
      });

      if (!existing) {
        throw new DaycareRequestError("Daycare session was not found.", 404);
      }

      if (existing.feeInvoiceId || existing.status === "BILLED") {
        throw new DaycareRequestError(
          "This session already has an invoice. Cancel the receipt or invoice through the finance workflow.",
          409,
        );
      }

      await prisma.$transaction(async (transaction) => {
        const claimed = await transaction.daycareSession.updateMany({
          where: {
            id: sessionId,
            feeInvoiceId: null,
            status: { notIn: ["BILLED", "CANCELLED"] },
          },
          data: { status: "CANCELLED" },
        });

        if (claimed.count !== 1) {
          throw new DaycareRequestError(
            "This daycare booking was already changed. Refresh before trying again.",
            409,
          );
        }

        await transaction.activityLog.create({
          data: {
            adminUserId,
            action: "CANCELLED",
            entityType: "DaycareSession",
            entityId: existing.id,
            description: `${existing.sessionNumber} cancelled before billing.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Daycare booking cancelled.",
      });
    }

    throw new DaycareRequestError("Select a plan or session to deactivate.");
  } catch (error) {
    const status = error instanceof DaycareRequestError ? error.status : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The daycare record could not be updated.",
      },
      { status },
    );
  }
}
