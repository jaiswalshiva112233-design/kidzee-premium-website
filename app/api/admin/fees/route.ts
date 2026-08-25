import type {
  $Enums,
  Prisma,
} from "@/generated/prisma/client";
import { createHash } from "node:crypto";
import { after, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { allocatePaymentSnapshot } from "@/lib/admin/fee-allocation";
import { generateRecurringInvoices } from "@/lib/admin/recurring-billing";
import { BillingIntegrityError } from "@/lib/admin/billing-integrity";
import { safeFirestoreMirror } from "@/lib/firebase/firestoreRest";
import { getNextSequence } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { queueReceiptWhatsApp } from "@/lib/whatsapp/automation";

const FEE_CATEGORIES = [
  "ADMISSION_FEE",
  "ANNUAL_FEE",
  "MONTHLY_PRESCHOOL_FEE",
  "DAYCARE_FEE",
  "DAYCARE_LUNCH_FEE",
  "DAYCARE_EVENING_SNACK_FEE",
  "DAYCARE_MEAL_COMBO_FEE",
  "FOOD_FEE",
  "LATE_FEE",
  "ACTIVITY_FEE",
  "KIT_FEE",
  "OTHER",
] as const;

const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
] as const;

const RECURRING_MONTHLY_CATEGORIES =
  new Set<string>([
    "MONTHLY_PRESCHOOL_FEE",
    "DAYCARE_LUNCH_FEE",
    "DAYCARE_EVENING_SNACK_FEE",
    "DAYCARE_MEAL_COMBO_FEE",
  ]);

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

type FeeCategoryValue =
  (typeof FEE_CATEGORIES)[number];

type PaymentMethodValue =
  (typeof PAYMENT_METHODS)[number];

type CreateFeePaymentBody = {
  action?: unknown;
  idempotencyKey?: unknown;
  studentId?: unknown;
  invoiceId?: unknown;
  category?: unknown;
  feePeriodLabel?: unknown;
  amountBeforeTax?: unknown;
  discountAmount?: unknown;
  lateFeeAmount?: unknown;
  gstApplicable?: unknown;
  gstRate?: unknown;
  amountReceived?: unknown;
  paymentMethod?: unknown;
  transactionReference?: unknown;
  paymentDate?: unknown;
  notes?: unknown;
};

class FeeRequestError extends Error {
  status: number;

  constructor(
    message: string,
    status = 400,
  ) {
    super(message);
    this.name = "FeeRequestError";
    this.status = status;
  }
}

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanOptionalText(
  value: unknown,
) {
  const cleaned = cleanText(value);

  return cleaned.length > 0
    ? cleaned
    : null;
}

function parseMoney(value: unknown) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const cleaned = cleanText(
    value,
  ).replace(/,/g, "");

  if (!cleaned) {
    return 0;
  }

  const parsed = Number(cleaned);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function roundMoney(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

function parsePaymentDate(
  value: unknown,
) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return new Date();
  }

  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(
    cleaned,
  )
    ? new Date(
        `${cleaned}T00:00:00+05:30`,
      )
    : new Date(cleaned);

  return Number.isNaN(
    parsedDate.getTime(),
  )
    ? null
    : parsedDate;
}

function isFeeCategory(
  value: string,
): value is FeeCategoryValue {
  return FEE_CATEGORIES.includes(
    value as FeeCategoryValue,
  );
}

function isPaymentMethod(
  value: string,
): value is PaymentMethodValue {
  return PAYMENT_METHODS.includes(
    value as PaymentMethodValue,
  );
}

function hasFeePermission(
  session: Awaited<
    ReturnType<typeof getAdminSession>
  >,
) {
  return Boolean(
    session &&
      (session.role === "OWNER" ||
        session.permissions.includes(
          "*",
        ) ||
        session.permissions.includes(
          "fees.collect",
        )),
  );
}

function startOfMonth(
  date = new Date(),
) {
  const periodKey = getPeriodKey(date);
  return new Date(`${periodKey}-01T00:00:00.000+05:30`);
}

function canAdjustInvoice(
  session: NonNullable<
    Awaited<ReturnType<typeof getAdminSession>>
  >,
) {
  return (
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("fees.settings")
  );
}

function endOfMonth(
  date = new Date(),
) {
  const [year, month] = getPeriodKey(date).split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return new Date(
    new Date(
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00.000+05:30`,
    ).getTime() - 1,
  );
}

function endOfToday() {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${dateKey}T23:59:59.999+05:30`);
}

function getPeriodKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

function parsePeriodKey(
  value: string,
) {
  const numericMatch =
    /^(\d{4})-(0[1-9]|1[0-2])$/.exec(
      value,
    );

  if (numericMatch) {
    return `${numericMatch[1]}-${numericMatch[2]}`;
  }

  const namedMatch =
    /^([A-Za-z]+)\s+(\d{4})$/.exec(
      value.trim(),
    );

  if (!namedMatch) {
    return null;
  }

  const monthIndex =
    MONTH_NAMES.indexOf(
      namedMatch[1].toLowerCase() as (
        typeof MONTH_NAMES
      )[number],
    );

  if (monthIndex < 0) {
    return null;
  }

  return `${namedMatch[2]}-${String(
    monthIndex + 1,
  ).padStart(2, "0")}`;
}

function formatPeriodLabel(
  periodKey: string,
) {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      periodKey,
    );

  if (!match) {
    return periodKey;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        1,
      ),
    ),
  );
}

function createDueDate(
  periodKey: string,
  dueDay: number,
) {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      periodKey,
    );

  if (!match) {
    return new Date();
  }

  const year = Number(match[1]);
  const monthIndex =
    Number(match[2]) - 1;

  const finalDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const safeDueDay = Math.min(
    Math.max(
      Math.trunc(dueDay),
      1,
    ),
    finalDay,
  );

  return new Date(
    `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(safeDueDay).padStart(2, "0")}T23:59:59.999+05:30`,
  );
}

function createManualBillingKey(
  studentId: string,
  category: string,
) {
  return [
    studentId,
    category,
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2, 9),
  ].join(":");
}

function createRecurringBillingKey(
  studentId: string,
  category: string,
  periodKey: string,
) {
  return `${studentId}:${category}:${periodKey}`;
}

function calculateIncludedGst(
  totalAmount: number,
  gstApplicable: boolean,
  gstRate: number,
) {
  const taxableAmount =
    gstApplicable && gstRate > 0
      ? roundMoney(
          totalAmount /
            (1 + gstRate / 100),
        )
      : totalAmount;

  const totalGstAmount =
    gstApplicable && gstRate > 0
      ? roundMoney(
          totalAmount -
            taxableAmount,
        )
      : 0;

  const cgstAmount = gstApplicable
    ? roundMoney(
        totalGstAmount / 2,
      )
    : 0;

  const sgstAmount = gstApplicable
    ? roundMoney(
        totalGstAmount -
          cgstAmount,
      )
    : 0;

  return {
    taxableAmount,
    cgstAmount,
    sgstAmount,
  };
}

function calculateInvoiceAmounts(
  amountBeforeTax: number,
  discountAmount: number,
  lateFeeAmount: number,
  gstApplicable: boolean,
  gstRate: number,
) {
  const totalAmount = roundMoney(
    Math.max(
      amountBeforeTax -
        discountAmount +
        lateFeeAmount,
      0,
    ),
  );

  const includedGst =
    calculateIncludedGst(
      totalAmount,
      gstApplicable,
      gstRate,
    );

  return {
    amountBeforeTax,
    discountAmount,
    lateFeeAmount,
    gstApplicable,
    gstRate,
    totalAmount,
    ...includedGst,
  };
}

function getInvoiceStatus(
  paidAmount: number,
  pendingAmount: number,
  dueDate: Date,
  referenceDate = new Date(),
): $Enums.FeeInvoiceStatus {
  if (pendingAmount <= 0) {
    return "PAID";
  }

  if (
    referenceDate.getTime() >
    dueDate.getTime()
  ) {
    return "OVERDUE";
  }

  if (paidAmount > 0) {
    return "PARTIALLY_PAID";
  }

  return "DUE";
}

function isUniqueConflict(
  error: unknown,
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (
      error as {
        code?: unknown;
      }
    ).code === "P2002"
  );
}

type MonthlyInvoiceItemInput = {
  category: $Enums.FeeCategory;
  title: string;
  detail: string;
  amount: number;
  gstApplicable: boolean;
  gstRate: number;
  daycareSessionId?: string;
  chargeKey?: string;
  sourceType?: string;
  sourceId?: string;
  sourceVersionId?: string;
  invoiceGroup?: string;
};

function carryoverBillingKey(
  studentId: string,
  periodKey: string,
  sessionIds: string[],
) {
  const fingerprint = createHash("sha256")
    .update([...sessionIds].sort().join(":"))
    .digest("hex")
    .slice(0, 16);
  return `daycare-carryover:${studentId}:${periodKey}:${fingerprint}`;
}

async function _ensureCurrentSchoolFeeInvoices(adminUserId: string) {
  const now = new Date();
  const periodKey = getPeriodKey(now);
  const periodLabel = formatPeriodLabel(periodKey);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [students, settings, daycareRate, lateFeeSetting, invoiceNumbering] =
    await Promise.all([
      prisma.student.findMany({
        where: {
          status: "ACTIVE",
          joiningDate: { lte: monthEnd },
        },
        select: {
          id: true,
          programme: true,
          joiningDate: true,
          programmeDefinition: {
            include: {
              feeVersions: {
                where: { active: true, effectiveFrom: { lte: monthEnd }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthStart } }] },
                orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
                take: 1,
              },
            },
          },
          daycarePlans: {
            where: {
              active: true,
              billingStoppedAt: null,
              effectiveFrom: { lte: now },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthStart } }],
            },
            orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
            include: {
              planDefinition: true,
              priceVersion: true,
              mealCombination: {
                include: {
                  priceVersions: {
                    where: { active: true, effectiveFrom: { lte: monthEnd }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthStart } }] },
                    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
                    take: 1,
                  },
                },
              },
            },
          },
          daycareSessions: {
            where: {
              status: "COMPLETED",
              approved: true,
              feeInvoiceId: null,
              sessionDate: { lt: monthStart },
              OR: [
                { planId: null },
                { plan: { is: { planType: "OCCASIONAL" } } },
              ],
            },
            orderBy: [{ sessionDate: "asc" }, { createdAt: "asc" }],
          },
        },
      }),
      prisma.programmeFeeSetting.findMany({
        where: {
          active: true,
          category: {
            in: [
              "MONTHLY_PRESCHOOL_FEE",
              "DAYCARE_FEE",
              "DAYCARE_LUNCH_FEE",
              "DAYCARE_EVENING_SNACK_FEE",
              "DAYCARE_MEAL_COMBO_FEE",
            ],
          },
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      }),
      prisma.daycareRateSetting.findFirst({
        where: {
          active: true,
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      }),
      prisma.lateFeeSetting.findFirst({
        where: {
          active: true,
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      }),
      prisma.numberSequence.findUnique({
        where: { key: "INVOICE" },
        select: { prefix: true, minimumWidth: true },
      }),
    ]);

  const latestSetting = new Map<string, (typeof settings)[number]>();

  for (const setting of settings) {
    const key = `${setting.programme}:${setting.category}`;
    if (!latestSetting.has(key)) latestSetting.set(key, setting);
  }

  const candidates = students
    .map((student) => {
      const plan = student.daycarePlans[0] ?? null;
      const monthlyPlan =
        plan && plan.planType !== "OCCASIONAL" ? plan : null;
      const invoiceItems: MonthlyInvoiceItemInput[] = [];
      const schoolSetting = latestSetting.get(
        `${student.programme}:MONTHLY_PRESCHOOL_FEE`,
      );

      if (schoolSetting && student.programme !== "DAYCARE") {
        invoiceItems.push({
          category: "MONTHLY_PRESCHOOL_FEE",
          title: schoolSetting.title || "Monthly preschool fee",
          detail: periodLabel,
          amount: roundMoney(Number(schoolSetting.amount)),
          gstApplicable: schoolSetting.gstApplicable,
          gstRate:
            schoolSetting.gstApplicable && schoolSetting.gstRate != null
              ? roundMoney(Number(schoolSetting.gstRate))
              : 0,
        });
      }

      if (monthlyPlan) {
        const fallbackMonthlyRate =
          monthlyPlan.planType === "MONTHLY_DAYCARE_ONLY"
            ? Number(monthlyPlan.dailyHours ?? 0) <= 6.25
              ? daycareRate?.monthlySixHourRate ??
                daycareRate?.monthlyDaycareOnlyRate
              : daycareRate?.monthlySixHalfHourRate ??
                daycareRate?.monthlyDaycareOnlyRate
            : daycareRate?.monthlyPreschoolAddonRate;
        const monthlyDaycareAmount = roundMoney(
          Number(monthlyPlan.monthlyFeeOverride ?? fallbackMonthlyRate ?? 0),
        );
        const daycareFeeSetting =
          latestSetting.get("DAYCARE:DAYCARE_FEE") ??
          latestSetting.get(`${student.programme}:DAYCARE_FEE`);
        const daycareGstApplicable =
          daycareRate?.gstApplicable ?? daycareFeeSetting?.gstApplicable ?? false;
        const daycareGstRate = daycareGstApplicable
          ? roundMoney(
              Number(daycareRate?.gstRate ?? daycareFeeSetting?.gstRate ?? 0),
            )
          : 0;

        if (monthlyDaycareAmount > 0) {
          invoiceItems.push({
            category: "DAYCARE_FEE",
            title:
              monthlyPlan.planType === "MONTHLY_DAYCARE_ONLY"
                ? "Monthly daycare"
                : "Monthly daycare add-on",
            detail: `${Number(monthlyPlan.dailyHours ?? 0)} hours daily · ${periodLabel}`,
            amount: monthlyDaycareAmount,
            gstApplicable: daycareGstApplicable,
            gstRate: daycareGstRate,
          });
        }

        if (monthlyPlan.foodOption !== "NONE") {
          const foodCategory: $Enums.FeeCategory =
            monthlyPlan.foodOption === "LUNCH"
              ? "DAYCARE_LUNCH_FEE"
              : monthlyPlan.foodOption === "EVENING_SNACK"
                ? "DAYCARE_EVENING_SNACK_FEE"
                : "DAYCARE_MEAL_COMBO_FEE";
          const foodSetting =
            latestSetting.get(`DAYCARE:${foodCategory}`) ??
            latestSetting.get(`${student.programme}:${foodCategory}`);
          const monthlyFoodAmount = roundMoney(
            Number(
              monthlyPlan.monthlyFoodFeeOverride ?? foodSetting?.amount ?? 0,
            ),
          );

          if (monthlyFoodAmount > 0) {
            invoiceItems.push({
              category: foodCategory,
              title:
                monthlyPlan.foodOption === "LUNCH"
                  ? "Monthly daycare lunch"
                  : monthlyPlan.foodOption === "EVENING_SNACK"
                    ? "Monthly daycare evening snack"
                    : "Monthly daycare lunch + evening snack",
              detail: periodLabel,
              amount: monthlyFoodAmount,
              gstApplicable: foodSetting?.gstApplicable ?? false,
              gstRate:
                foodSetting?.gstApplicable && foodSetting.gstRate != null
                  ? roundMoney(Number(foodSetting.gstRate))
                  : 0,
            });
          }
        }
      }

      for (const session of student.daycareSessions) {
        const baseAmount = roundMoney(Number(session.baseAmount));
        const foodAmount = roundMoney(Number(session.foodCharge));
        const dateLabel = new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(session.sessionDate);

        if (baseAmount > 0) {
          invoiceItems.push({
            category: "DAYCARE_FEE",
            title:
              session.billingMode === "HOURLY"
                ? "Emergency daycare"
                : "Occasional full-day daycare",
            detail:
              session.billingMode === "HOURLY"
                ? `${Number(session.billableHours ?? 0)} hours on ${dateLabel}`
                : `Full-day care on ${dateLabel}`,
            amount: baseAmount,
            gstApplicable: session.gstApplicable,
            gstRate:
              session.gstApplicable && session.gstRate != null
                ? roundMoney(Number(session.gstRate))
                : 0,
            daycareSessionId: session.id,
          });
        }

        if (foodAmount > 0) {
          const foodCategory: $Enums.FeeCategory =
            session.foodOption === "LUNCH"
              ? "DAYCARE_LUNCH_FEE"
              : session.foodOption === "EVENING_SNACK"
                ? "DAYCARE_EVENING_SNACK_FEE"
                : "DAYCARE_MEAL_COMBO_FEE";
          invoiceItems.push({
            category: foodCategory,
            title:
              session.foodOption === "LUNCH"
                ? "Daycare lunch"
                : session.foodOption === "EVENING_SNACK"
                  ? "Daycare evening snack"
                  : "Daycare lunch + evening snack",
            detail: `Meal taken on ${dateLabel}`,
            amount: foodAmount,
            gstApplicable: session.foodGstApplicable,
            gstRate:
              session.foodGstApplicable && session.foodGstRate != null
                ? roundMoney(Number(session.foodGstRate))
                : 0,
            daycareSessionId: session.id,
          });
        }
      }

      if (invoiceItems.length === 0) return null;

      const combined = invoiceItems.length > 1;
      const billingKey = combined
        ? `monthly-bundle:${student.id}:${periodKey}`
        : invoiceItems[0].category === "MONTHLY_PRESCHOOL_FEE"
          ? createRecurringBillingKey(
              student.id,
              "MONTHLY_PRESCHOOL_FEE",
              periodKey,
            )
          : `monthly-daycare:${student.id}:${periodKey}`;

      return {
        student,
        invoiceItems,
        carryoverItems: invoiceItems.filter((item) => item.daycareSessionId),
        queuedSessionIds: [
          ...new Set(
            invoiceItems
              .map((item) => item.daycareSessionId)
              .filter((value): value is string => Boolean(value)),
          ),
        ],
        billingKey,
        legacySchoolKey: createRecurringBillingKey(
          student.id,
          "MONTHLY_PRESCHOOL_FEE",
          periodKey,
        ),
      };
    })
    .filter(
      (
        candidate,
      ): candidate is NonNullable<
        typeof candidate
      > => candidate !== null,
    );

  if (candidates.length === 0) return;

  const candidateKeys = candidates.flatMap((candidate) => [
    candidate.billingKey,
    candidate.legacySchoolKey,
  ]);
  const existingInvoices = await prisma.feeInvoice.findMany({
    where: { billingKey: { in: candidateKeys } },
    select: {
      id: true,
      billingKey: true,
      paidAmount: true,
      discountAmount: true,
      lateFeeAmount: true,
    },
  });
  const existingByKey = new Map(
    existingInvoices
      .filter(
        (invoice) =>
          invoice.billingKey != null,
      )
      .map((invoice) => [
        invoice.billingKey as string,
        invoice,
      ]),
  );
  const dueDate = createDueDate(periodKey, lateFeeSetting?.dueDay ?? 5);

  for (const candidate of candidates) {
    const exactInvoice =
      existingByKey.get(
        candidate.billingKey,
      );
    const legacyInvoice =
      candidate.billingKey !==
      candidate.legacySchoolKey
        ? existingByKey.get(
            candidate.legacySchoolKey,
          )
        : undefined;

    const baseInvoice = exactInvoice ?? legacyInvoice;
    const canUpgradeBaseInvoice =
      baseInvoice != null &&
      Number(baseInvoice.paidAmount) === 0 &&
      Number(baseInvoice.discountAmount) === 0 &&
      Number(baseInvoice.lateFeeAmount) === 0;
    const supplementingFinalisedInvoice =
      baseInvoice != null && !canUpgradeBaseInvoice;
    const supplementingFinalisedExactInvoice =
      exactInvoice != null && supplementingFinalisedInvoice;

    if (exactInvoice && candidate.queuedSessionIds.length === 0) {
      continue;
    }

    const invoiceItemsToCreate = supplementingFinalisedInvoice
      ? supplementingFinalisedExactInvoice
        ? candidate.carryoverItems
        : candidate.invoiceItems.filter(
            (item) => item.category !== "MONTHLY_PRESCHOOL_FEE",
          )
      : candidate.invoiceItems;

    if (invoiceItemsToCreate.length === 0) continue;

    const targetBillingKey = supplementingFinalisedExactInvoice
      ? carryoverBillingKey(
          candidate.student.id,
          periodKey,
          candidate.queuedSessionIds,
        )
      : candidate.billingKey;

    if (supplementingFinalisedExactInvoice) {
      const existingSupplement = await prisma.feeInvoice.findUnique({
        where: { billingKey: targetBillingKey },
        select: { id: true },
      });

      if (existingSupplement) {
        await prisma.daycareSession.updateMany({
          where: {
            id: { in: candidate.queuedSessionIds },
            status: "COMPLETED",
            feeInvoiceId: null,
          },
          data: {
            status: "BILLED",
            feeInvoiceId: existingSupplement.id,
          },
        });
        continue;
      }
    }

    const calculatedItems = invoiceItemsToCreate.map((item, index) => {
      const includedGst = calculateIncludedGst(
        item.amount,
        item.gstApplicable,
        item.gstRate,
      );
      return { ...item, ...includedGst, sortOrder: (index + 1) * 10 };
    });
    const totalAmount = roundMoney(
      calculatedItems.reduce((sum, item) => sum + item.amount, 0),
    );
    const cgstAmount = roundMoney(
      calculatedItems.reduce((sum, item) => sum + item.cgstAmount, 0),
    );
    const sgstAmount = roundMoney(
      calculatedItems.reduce((sum, item) => sum + item.sgstAmount, 0),
    );
    const gstRates = [
      ...new Set(
        calculatedItems
          .filter((item) => item.gstApplicable)
          .map((item) => item.gstRate),
      ),
    ];
    const primaryCategory = calculatedItems.some(
      (item) => item.category === "MONTHLY_PRESCHOOL_FEE",
    )
      ? ("MONTHLY_PRESCHOOL_FEE" as const)
      : ("DAYCARE_FEE" as const);

    try {
      await prisma.$transaction(async (transaction) => {
        const invoiceData = {
          billingKey: targetBillingKey,
          category: primaryCategory,
          feePeriodKey: periodKey,
          feePeriodLabel: periodLabel,
          dueDate,
          amountBeforeTax: totalAmount,
          discountAmount: 0,
          lateFeeAmount: 0,
          gstApplicable: gstRates.length > 0,
          gstRate:
            gstRates.length === 1
              ? gstRates[0]
              : null,
          cgstAmount,
          sgstAmount,
          totalAmount,
          paidAmount: 0,
          pendingAmount: totalAmount,
          status: getInvoiceStatus(
            0,
            totalAmount,
            dueDate,
            now,
          ),
          notes: supplementingFinalisedInvoice
            ? `Automatically generated daycare carry-over supplement because the monthly invoice had already been paid or adjusted: ${calculatedItems
                .map((item) => item.title)
                .join(", ")}.`
            : `Automatically generated monthly invoice: ${calculatedItems
                .map((item) => item.title)
                .join(", ")}.`,
        };
        const itemData =
          calculatedItems.map((item) => ({
            category: item.category,
            title: item.title,
            detail: item.detail,
            quantity: 1,
            unitAmount: item.amount,
            amount: item.amount,
            gstApplicable:
              item.gstApplicable,
            gstRate:
              item.gstApplicable
                ? item.gstRate
                : null,
            taxableAmount:
              item.taxableAmount,
            cgstAmount:
              item.cgstAmount,
            sgstAmount:
              item.sgstAmount,
            totalAmount: item.amount,
            sortOrder: item.sortOrder,
          }));

        let savedInvoiceId: string;

        if (baseInvoice && canUpgradeBaseInvoice) {
          await transaction.feeInvoiceItem.deleteMany(
            {
              where: {
                invoiceId:
                  baseInvoice.id,
              },
            },
          );
          await transaction.feeInvoice.update({
            where: {
              id: baseInvoice.id,
            },
            data: {
              ...invoiceData,
              items: {
                create: itemData,
              },
            },
          });

          await transaction.activityLog.create({
            data: {
              adminUserId,
              action: "UPDATED",
              entityType: "FeeInvoice",
              entityId: baseInvoice.id,
              description:
                "The unpaid monthly invoice was refreshed with preschool, daycare, food and carried-over occasional-care items.",
            },
          });
          savedInvoiceId = baseInvoice.id;
        } else {
          const invoiceSequence = await getNextSequence(transaction, {
            key: "INVOICE",
            prefix: invoiceNumbering?.prefix ?? "KZ-INV",
            minimumWidth: invoiceNumbering?.minimumWidth ?? 2,
          });

          const savedInvoice = await transaction.feeInvoice.create({
            data: {
              invoiceNumber: invoiceSequence.formattedNumber,
              studentId: candidate.student.id,
              issueDate: now,
              createdById: adminUserId,
              ...invoiceData,
              items: {
                create: itemData,
              },
            },
          });
          savedInvoiceId = savedInvoice.id;
        }

        if (candidate.queuedSessionIds.length > 0) {
          const linkedSessions = await transaction.daycareSession.updateMany({
            where: {
              id: { in: candidate.queuedSessionIds },
              status: "COMPLETED",
              feeInvoiceId: null,
            },
            data: {
              status: "BILLED",
              feeInvoiceId: savedInvoiceId,
            },
          });

          if (linkedSessions.count !== candidate.queuedSessionIds.length) {
            throw new FeeRequestError(
              "One of the carried-over daycare visits changed while the monthly invoice was being prepared. Refresh dues once more.",
              409,
            );
          }
        }
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
    }
  }
}

async function refreshOverdueInvoices() {
  const now = new Date();

  await prisma.feeInvoice.updateMany({
    where: {
      status: {
        in: [
          "DUE",
          "PARTIALLY_PAID",
        ],
      },

      dueDate: {
        lt: now,
      },

      pendingAmount: {
        gt: 0,
      },
    },

    data: {
      status: "OVERDUE",
    },
  });
}

export async function GET(
  request: Request,
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    if (
      !hasFeePermission(session)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to view fees.",
        },
        {
          status: 403,
        },
      );
    }

    const url = new URL(
      request.url,
    );

    const search = cleanText(
      url.searchParams.get(
        "search",
      ),
    );

    const studentId = cleanText(
      url.searchParams.get(
        "studentId",
      ),
    );

    const categoryValue =
      cleanText(
        url.searchParams.get(
          "category",
        ),
      );

    const category =
      isFeeCategory(
        categoryValue,
      )
        ? (categoryValue as $Enums.FeeCategory)
        : undefined;

    const monthStart =
      startOfMonth();

    const todayEnd =
      endOfToday();

    const [
      students,
      payments,
      invoices,
      monthlyCollection,
      pendingBalance,
      totalReceipts,
      programmeFeeSettings,
      activeLateFeeSetting,
    ] = await Promise.all([
      prisma.student.findMany({
        where: {
          status: "ACTIVE",
        },

        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          middleName: true,
          lastName: true,
          programme: true,

          guardians: {
            where: {
              isPrimary: true,
            },

            select: {
              id: true,
              name: true,
              phone: true,
            },

            take: 1,
          },

          feeAccounts: {
            where: {
              active: true,
            },

            orderBy: {
              createdAt: "asc",
            },
          },

          feeInvoices: {
            where: {
              status: {
                in: [
                  "DRAFT",
                  "DUE",
                  "PARTIALLY_PAID",
                  "OVERDUE",
                ],
              },
            },

            orderBy: [
              {
                dueDate: "asc",
              },
              {
                createdAt: "asc",
              },
            ],

            include: {
              items: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },

        orderBy: [
          {
            firstName: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      }),

      prisma.feePayment.findMany({
        where: {
          ...(studentId
            ? {
                studentId,
              }
            : {}),

          ...(category
            ? {
                category,
              }
            : {}),

          ...(search
            ? {
                OR: [
                  {
                    paymentNumber: {
                      contains:
                        search,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    feePeriodLabel: {
                      contains:
                        search,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    transactionReference:
                      {
                        contains:
                          search,
                        mode:
                          "insensitive",
                      },
                  },
                  {
                    student: {
                      OR: [
                        {
                          firstName:
                            {
                              contains:
                                search,
                              mode:
                                "insensitive",
                            },
                        },
                        {
                          middleName:
                            {
                              contains:
                                search,
                              mode:
                                "insensitive",
                            },
                        },
                        {
                          lastName:
                            {
                              contains:
                                search,
                              mode:
                                "insensitive",
                            },
                        },
                        {
                          studentNumber:
                            {
                              contains:
                                search,
                              mode:
                                "insensitive",
                            },
                        },
                      ],
                    },
                  },
                ],
              }
            : {}),
        },

        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              programme: true,
            },
          },

          receipt: true,
          invoice: {
            include: {
              items: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },

        orderBy: {
          paymentDate: "desc",
        },

        take: 250,
      }),

      prisma.feeInvoice.findMany({
        where: {
          ...(studentId
            ? {
                studentId,
              }
            : {}),

          ...(category
            ? {
                category,
              }
            : {}),

          ...(search
            ? {
                OR: [
                  {
                    invoiceNumber: {
                      contains:
                        search,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    feePeriodLabel: {
                      contains:
                        search,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    student: {
                      OR: [
                        {
                          firstName:
                            {
                              contains:
                                search,
                              mode:
                                "insensitive",
                            },
                        },
                        {
                          middleName:
                            {
                              contains:
                                search,
                              mode:
                                "insensitive",
                            },
                        },
                        {
                          lastName:
                            {
                              contains:
                                search,
                              mode:
                                "insensitive",
                            },
                        },
                        {
                          studentNumber:
                            {
                              contains:
                                search,
                              mode:
                                "insensitive",
                            },
                        },
                      ],
                    },
                  },
                ],
              }
            : {}),
        },

        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              programme: true,
            },
          },
          items: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },

        orderBy: [
          {
            dueDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        take: 250,
      }),

      prisma.feePayment.aggregate({
        where: {
          paymentDate: {
            gte: monthStart,
            lte: todayEnd,
          },

          status: {
            in: [
              "PAID",
              "PARTIALLY_PAID",
            ],
          },
        },

        _sum: {
          amountReceived: true,
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

      prisma.programmeFeeSetting.findMany({
        where: {
          active: true,

          effectiveFrom: {
            lte: todayEnd,
          },

          OR: [
            {
              effectiveTo: null,
            },
            {
              effectiveTo: {
                gte: todayEnd,
              },
            },
          ],
        },

        orderBy: [
          {
            effectiveFrom: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),

      prisma.lateFeeSetting.findFirst({
        where: {
          active: true,

          effectiveFrom: {
            lte: todayEnd,
          },

          OR: [
            {
              effectiveTo: null,
            },
            {
              effectiveTo: {
                gte: todayEnd,
              },
            },
          ],
        },

        orderBy: [
          {
            effectiveFrom: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),
    ]);

    const studentsWithFeeSettings =
      students.map((student) => {
        const matchingSettings =
          programmeFeeSettings
            .filter(
              (setting) =>
                setting.programme ===
                student.programme,
            )
            .filter(
              (
                setting,
                index,
                allSettings,
              ) =>
                allSettings.findIndex(
                  (item) =>
                    item.category ===
                    setting.category,
                ) === index,
            );

        const configuredCategories =
          new Set(
            matchingSettings.map(
              (setting) =>
                setting.category,
            ),
          );

        return {
          ...student,

          openInvoices:
            student.feeInvoices,

          feeAccounts: [
            ...student.feeAccounts.filter(
              (account) =>
                !configuredCategories.has(
                  account.category,
                ),
            ),

            ...matchingSettings.map(
              (setting) => ({
                id: `setting-${setting.id}`,
                category:
                  setting.category,
                title:
                  setting.title,
                standardAmount:
                  setting.amount,
                gstApplicable:
                  setting.gstApplicable,
                gstRate:
                  setting.gstRate,
              }),
            ),
          ],
        };
      });

    return NextResponse.json({
      success: true,
      students:
        studentsWithFeeSettings,
      payments,
      invoices,

      lateFeeSetting:
        activeLateFeeSetting
          ? {
              id:
                activeLateFeeSetting.id,

              dueDay:
                activeLateFeeSetting.dueDay,

              gracePeriodDays:
                activeLateFeeSetting.gracePeriodDays,

              calculationType:
                activeLateFeeSetting.calculationType,

              amount: Number(
                activeLateFeeSetting.amount,
              ),

              maximumAmount:
                activeLateFeeSetting.maximumAmount ===
                null
                  ? null
                  : Number(
                      activeLateFeeSetting.maximumAmount,
                    ),

              effectiveFrom:
                activeLateFeeSetting.effectiveFrom.toISOString(),
            }
          : null,

      summary: {
        monthlyCollection:
          monthlyCollection._sum
            .amountReceived ?? 0,

        pendingBalance:
          pendingBalance._sum
            .pendingAmount ?? 0,

        totalPayments:
          payments.length,

        totalInvoices:
          invoices.length,

        openInvoices:
          invoices.filter(
            (invoice) =>
              [
                "DUE",
                "PARTIALLY_PAID",
                "OVERDUE",
              ].includes(
                invoice.status,
              ),
          ).length,

        totalReceipts,
      },
    });
  } catch (error) {
    console.error(
      "Unable to load fee information:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load fee information. Check the server terminal.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  let requestIdempotencyKey = "";

  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    if (
      !hasFeePermission(session)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to collect fees.",
        },
        {
          status: 403,
        },
      );
    }

    let body: CreateFeePaymentBody;

    try {
      body =
        (await request.json()) as CreateFeePaymentBody;
    } catch {
      throw new FeeRequestError(
        "Invalid fee-payment request.",
      );
    }

    const action = cleanText(body.action);

    if (action === "refresh-ledger") {
      try {
        await generateRecurringInvoices(session.userId);
      } catch (error) {
        if (error instanceof BillingIntegrityError) {
          throw new FeeRequestError(error.message, 409);
        }
        throw error;
      }
      await refreshOverdueInvoices();

      return NextResponse.json({
        success: true,
        message: "Fee ledger refreshed.",
      });
    }

    requestIdempotencyKey = cleanText(
      request.headers.get("idempotency-key") ?? body.idempotencyKey,
    ).slice(0, 128);

    if (
      requestIdempotencyKey &&
      !/^[A-Za-z0-9:_-]{16,128}$/.test(requestIdempotencyKey)
    ) {
      throw new FeeRequestError(
        "The payment request identifier is invalid. Refresh the page and try again.",
      );
    }

    const studentId = cleanText(
      body.studentId,
    );

    const requestedInvoiceId =
      cleanText(body.invoiceId);

    if (!requestedInvoiceId) {
      throw new FeeRequestError(
        "Normal fees are generated from the child's financial contract. Refresh dues and select the prepared invoice; manual bill creation is not available on the collection screen.",
      );
    }

    const categoryValue =
      cleanText(body.category);

    const paymentMethodValue =
      cleanText(
        body.paymentMethod,
      );

    const paymentDate =
      parsePaymentDate(
        body.paymentDate,
      );

    const requestedAmount =
      roundMoney(
        parseMoney(
          body.amountBeforeTax,
        ),
      );

    const requestedDiscount =
      roundMoney(
        parseMoney(
          body.discountAmount,
        ),
      );

    const requestedLateFee =
      roundMoney(
        parseMoney(
          body.lateFeeAmount,
        ),
      );

    const amountReceived =
      roundMoney(
        parseMoney(
          body.amountReceived,
        ),
      );

    const feePeriodText =
      cleanOptionalText(
        body.feePeriodLabel,
      );

    let requestedGstApplicable =
      body.gstApplicable === true ||
      cleanText(
        body.gstApplicable,
      ).toLowerCase() === "true";

    let requestedGstRate =
      requestedGstApplicable
        ? roundMoney(
            parseMoney(
              body.gstRate,
            ),
          )
        : 0;

    if (!studentId) {
      throw new FeeRequestError(
        "Please select a student.",
      );
    }

    if (
      !isFeeCategory(
        categoryValue,
      )
    ) {
      throw new FeeRequestError(
        "Please select a valid fee category.",
      );
    }

    if (
      !isPaymentMethod(
        paymentMethodValue,
      )
    ) {
      throw new FeeRequestError(
        "Please select a valid payment method.",
      );
    }

    if (!paymentDate) {
      throw new FeeRequestError(
        "Please enter a valid payment date.",
      );
    }

    if (requestedAmount <= 0) {
      throw new FeeRequestError(
        "Fee amount must be greater than zero.",
      );
    }

    if (requestedDiscount < 0) {
      throw new FeeRequestError(
        "Discount amount cannot be negative.",
      );
    }

    if (requestedLateFee < 0) {
      throw new FeeRequestError(
        "Late fee amount cannot be negative.",
      );
    }

    if (amountReceived <= 0) {
      throw new FeeRequestError(
        "Enter the amount received. Unpaid monthly fees are already kept in the due ledger.",
      );
    }

    const student =
      await prisma.student.findUnique({
        where: {
          id: studentId,
        },

        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          middleName: true,
          lastName: true,
          programme: true,
          status: true,
        },
      });

    if (!student) {
      throw new FeeRequestError(
        "Student record not found.",
        404,
      );
    }

    if (
      student.status ===
      "WITHDRAWN"
    ) {
      throw new FeeRequestError(
        "This student is marked as withdrawn. Review the student record before collecting a fee.",
        409,
      );
    }

    const [
      savedFeeSetting,
      activeLateFeeSetting,
    ] = await Promise.all([
      prisma.programmeFeeSetting.findFirst({
        where: {
          active: true,

          programme:
            student.programme,

          category:
            categoryValue as $Enums.FeeCategory,

          effectiveFrom: {
            lte: paymentDate,
          },

          OR: [
            {
              effectiveTo: null,
            },
            {
              effectiveTo: {
                gte: paymentDate,
              },
            },
          ],
        },

        orderBy: [
          {
            effectiveFrom: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),

      prisma.lateFeeSetting.findFirst({
        where: {
          active: true,

          effectiveFrom: {
            lte: paymentDate,
          },

          OR: [
            {
              effectiveTo: null,
            },
            {
              effectiveTo: {
                gte: paymentDate,
              },
            },
          ],
        },

        orderBy: [
          {
            effectiveFrom: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),
    ]);

    if (savedFeeSetting) {
      requestedGstApplicable =
        savedFeeSetting.gstApplicable;

      requestedGstRate =
        savedFeeSetting.gstApplicable &&
        savedFeeSetting.gstRate != null
          ? roundMoney(
              Number(
                savedFeeSetting.gstRate,
              ),
            )
          : 0;
    }

    if (
      !requestedInvoiceId &&
      requestedGstApplicable &&
      (requestedGstRate <= 0 ||
        requestedGstRate > 100)
    ) {
      throw new FeeRequestError(
        "Please enter a valid GST percentage.",
      );
    }

    const recurring =
      RECURRING_MONTHLY_CATEGORIES.has(
        categoryValue,
      );

    const periodKey = recurring
      ? parsePeriodKey(
          feePeriodText ?? "",
        ) ??
        getPeriodKey(paymentDate)
      : null;

    const periodLabel = periodKey
      ? formatPeriodLabel(
          periodKey,
        )
      : feePeriodText ??
        categoryValue.replaceAll(
          "_",
          " ",
        );

    const billingKey = periodKey
      ? createRecurringBillingKey(
          studentId,
          categoryValue,
          periodKey,
        )
      : createManualBillingKey(
          studentId,
          categoryValue,
        );

    const notes =
      cleanOptionalText(
        body.notes,
      );

    const transactionReference =
      cleanOptionalText(
        body.transactionReference,
      );

    const result =
      await prisma.$transaction(
        async (transaction) => {
          if (requestIdempotencyKey) {
            const existingPayment = await transaction.feePayment.findUnique({
              where: {
                idempotencyKey: requestIdempotencyKey,
              },
              include: {
                invoice: true,
                receipt: true,
              },
            });

            if (existingPayment) {
              const replayMatchesOriginalRequest =
                existingPayment.studentId === studentId &&
                existingPayment.category === categoryValue &&
                roundMoney(Number(existingPayment.amountReceived)) ===
                  amountReceived &&
                existingPayment.paymentMethod === paymentMethodValue &&
                (!requestedInvoiceId ||
                  existingPayment.invoiceId === requestedInvoiceId);

              if (!replayMatchesOriginalRequest) {
                throw new FeeRequestError(
                  "This payment request identifier was already used for different payment details. Refresh the fee ledger and submit again.",
                  409,
                );
              }

              if (!existingPayment.invoice || !existingPayment.receipt) {
                throw new FeeRequestError(
                  "This payment request is already being processed. Refresh the fee ledger before trying again.",
                  409,
                );
              }

              return {
                invoice: existingPayment.invoice,
                payment: existingPayment,
                receipt: existingPayment.receipt,
                receiptSequence: {
                  serial: 0,
                  serialText: "",
                  formattedNumber: existingPayment.receipt.receiptNumber,
                },
                taxableAmount: roundMoney(
                  Number(existingPayment.totalAmount) -
                    Number(existingPayment.cgstAmount) -
                    Number(existingPayment.sgstAmount),
                ),
                idempotentReplay: true,
              };
            }
          }

          let invoice:
            | Prisma.FeeInvoiceGetPayload<{
                include: {
                  items: true;
                  payments: true;
                };
              }>
            | null =
            requestedInvoiceId
              ? await transaction.feeInvoice.findUnique(
                  {
                    where: {
                      id:
                        requestedInvoiceId,
                    },

                    include: {
                      items: true,
                      payments: {
                        where: { status: { in: ["PAID", "PARTIALLY_PAID"] } },
                      },
                    },
                  },
                )
              : periodKey
                ? await transaction.feeInvoice.findUnique(
                    {
                      where: {
                        billingKey,
                      },

                      include: {
                        items: true,
                        payments: {
                          where: { status: { in: ["PAID", "PARTIALLY_PAID"] } },
                        },
                      },
                    },
                  )
                : null;

          if (
            requestedInvoiceId &&
            !invoice
          ) {
            throw new FeeRequestError(
              "The selected invoice could not be found.",
              404,
            );
          }

          if (
            invoice &&
            (invoice.studentId !==
              studentId ||
              invoice.category !==
                categoryValue)
          ) {
            throw new FeeRequestError(
              "The selected invoice does not belong to this student or fee category.",
              409,
            );
          }

          if (
            invoice &&
            [
              "CANCELLED",
              "WAIVED",
            ].includes(
              invoice.status,
            )
          ) {
            throw new FeeRequestError(
              `Invoice ${invoice.invoiceNumber} is closed and cannot accept a payment.`,
              409,
            );
          }

          if (
            invoice &&
            Number(
              invoice.pendingAmount,
            ) <= 0
          ) {
            throw new FeeRequestError(
              `${periodLabel} is already fully paid. A duplicate payment was not created.`,
              409,
            );
          }

          if (
            invoice &&
            !canAdjustInvoice(session) &&
            (requestedDiscount !==
              roundMoney(Number(invoice.discountAmount)) ||
              requestedLateFee !==
                roundMoney(Number(invoice.lateFeeAmount)))
          ) {
            throw new FeeRequestError(
              "Only the Owner or an authorised fee-settings user can change discounts or bill adjustments.",
              403,
            );
          }

          if (!invoice) {
            if (
              requestedDiscount >
              requestedAmount
            ) {
              throw new FeeRequestError(
                "Discount cannot exceed the fee amount.",
              );
            }

            const amounts =
              calculateInvoiceAmounts(
                requestedAmount,
                requestedDiscount,
                requestedLateFee,
                requestedGstApplicable,
                requestedGstRate,
              );

            const itemTax =
              calculateIncludedGst(
                requestedAmount,
                requestedGstApplicable,
                requestedGstRate,
              );

            if (
              amounts.totalAmount <= 0
            ) {
              throw new FeeRequestError(
                "Total payable amount must be greater than zero.",
              );
            }

            const invoiceNumbering =
              await transaction.numberSequence.findUnique(
                {
                  where: {
                    key: "INVOICE",
                  },

                  select: {
                    prefix: true,
                    minimumWidth:
                      true,
                  },
                },
              );

            const invoiceSequence =
              await getNextSequence(
                transaction,
                {
                  key: "INVOICE",

                  prefix:
                    invoiceNumbering
                      ?.prefix ??
                    "KZ-INV",

                  minimumWidth:
                    invoiceNumbering
                      ?.minimumWidth ??
                    2,
                },
              );

            const dueDate =
              categoryValue ===
                "MONTHLY_PRESCHOOL_FEE" &&
              periodKey
                ? createDueDate(
                    periodKey,
                    activeLateFeeSetting
                      ?.dueDay ??
                      5,
                  )
                : paymentDate;

            invoice =
              await transaction.feeInvoice.create(
                {
                  data: {
                    invoiceNumber:
                      invoiceSequence
                        .formattedNumber,

                    billingKey,
                    studentId,

                    category:
                      categoryValue as $Enums.FeeCategory,

                    feePeriodKey:
                      periodKey,

                    feePeriodLabel:
                      periodLabel,

                    issueDate:
                      new Date(),

                    dueDate,

                    amountBeforeTax:
                      amounts.amountBeforeTax,

                    discountAmount:
                      amounts.discountAmount,

                    lateFeeAmount:
                      amounts.lateFeeAmount,

                    gstApplicable:
                      amounts.gstApplicable,

                    gstRate:
                      amounts.gstApplicable
                        ? amounts.gstRate
                        : null,

                    cgstAmount:
                      amounts.cgstAmount,

                    sgstAmount:
                      amounts.sgstAmount,

                    totalAmount:
                      amounts.totalAmount,

                    paidAmount: 0,

                    pendingAmount:
                      amounts.totalAmount,

                    status:
                      getInvoiceStatus(
                        0,
                        amounts.totalAmount,
                        dueDate,
                      ),

                    createdById:
                      session.userId,

                    notes,

                    items: {
                      create: {
                        category:
                          categoryValue as $Enums.FeeCategory,

                        title:
                          categoryValue
                            .replaceAll("_", " ")
                            .toLowerCase()
                            .replace(
                              /^./,
                              (letter) =>
                                letter.toUpperCase(),
                            ),

                        detail:
                          periodLabel,

                        quantity: 1,

                        unitAmount:
                          requestedAmount,

                        amount:
                          requestedAmount,

                        gstApplicable:
                          requestedGstApplicable,

                        gstRate:
                          requestedGstApplicable
                            ? requestedGstRate
                            : null,

                        taxableAmount:
                          itemTax.taxableAmount,

                        cgstAmount:
                          itemTax.cgstAmount,

                        sgstAmount:
                          itemTax.sgstAmount,

                        totalAmount:
                          requestedAmount,

                        sortOrder: 10,
                      },
                    },
                  },

                  include: {
                    items: true,
                    payments: true,
                  },
                },
              );
          } else if (
            Number(
              invoice.paidAmount,
            ) <= 0
          ) {
            const invoiceBaseAmount =
              roundMoney(
                Number(
                  invoice.amountBeforeTax,
                ),
              );

            if (
              requestedDiscount >
              invoiceBaseAmount
            ) {
              throw new FeeRequestError(
                "Discount cannot exceed the fee amount.",
              );
            }

            const invoiceGstApplicable =
              invoice.gstApplicable;

            const invoiceGstRate =
              invoiceGstApplicable &&
              invoice.gstRate != null
                ? roundMoney(
                    Number(
                      invoice.gstRate,
                    ),
                )
                : 0;

            const invoiceIsItemised =
              invoice.items.length > 0;

            const itemisedDiscountScale =
              invoiceIsItemised &&
              invoiceBaseAmount > 0
                ? Math.max(
                    invoiceBaseAmount -
                      requestedDiscount,
                    0,
                  ) /
                  invoiceBaseAmount
                : 1;

            const revisedAmounts =
              invoiceIsItemised
                ? {
                    amountBeforeTax:
                      invoiceBaseAmount,

                    discountAmount:
                      requestedDiscount,

                    lateFeeAmount:
                      requestedLateFee,

                    gstApplicable:
                      invoiceGstApplicable,

                    gstRate:
                      invoiceGstRate,

                    cgstAmount:
                      roundMoney(
                        Number(
                          invoice.cgstAmount,
                        ) *
                          itemisedDiscountScale,
                      ),

                    sgstAmount:
                      roundMoney(
                        Number(
                          invoice.sgstAmount,
                        ) *
                          itemisedDiscountScale,
                      ),

                    totalAmount:
                      roundMoney(
                        Math.max(
                          invoiceBaseAmount -
                            requestedDiscount +
                            requestedLateFee,
                          0,
                        ),
                      ),
                  }
                : calculateInvoiceAmounts(
                    invoiceBaseAmount,
                    requestedDiscount,
                    requestedLateFee,
                    invoiceGstApplicable,
                    invoiceGstRate,
                  );

            invoice =
              await transaction.feeInvoice.update(
                {
                  where: {
                    id: invoice.id,
                  },

                  data: {
                    discountAmount:
                      revisedAmounts.discountAmount,

                    lateFeeAmount:
                      revisedAmounts.lateFeeAmount,

                    cgstAmount:
                      revisedAmounts.cgstAmount,

                    sgstAmount:
                      revisedAmounts.sgstAmount,

                    totalAmount:
                      revisedAmounts.totalAmount,

                    pendingAmount:
                      revisedAmounts.totalAmount,

                    status:
                      getInvoiceStatus(
                        0,
                        revisedAmounts.totalAmount,
                        invoice.dueDate,
                      ),

                    ...(notes
                      ? {
                          notes,
                        }
                      : {}),
                  },

                  include: {
                    items: true,
                    payments: {
                      where: { status: { in: ["PAID", "PARTIALLY_PAID"] } },
                    },
                  },
                },
              );
          }

          const currentPending =
            roundMoney(
              Number(
                invoice.pendingAmount,
              ),
            );

          if (
            amountReceived >
            currentPending
          ) {
            throw new FeeRequestError(
              `Amount received cannot exceed the invoice balance of ₹${currentPending.toLocaleString("en-IN")}.`,
            );
          }

          const activePayments = invoice.payments.filter(
            (payment) =>
              payment.status === "PAID" || payment.status === "PARTIALLY_PAID",
          );
          const paymentSnapshot = allocatePaymentSnapshot({
            amountReceived,
            currentPendingAmount: currentPending,
            invoiceCgstAmount: Number(invoice.cgstAmount),
            invoiceSgstAmount: Number(invoice.sgstAmount),
            invoiceLateFeeAmount: Number(invoice.lateFeeAmount),
            allocatedCgstAmount: activePayments.reduce(
              (sum, payment) => sum + Number(payment.cgstAmount),
              0,
            ),
            allocatedSgstAmount: activePayments.reduce(
              (sum, payment) => sum + Number(payment.sgstAmount),
              0,
            ),
            allocatedLateFeeAmount: activePayments.reduce(
              (sum, payment) => sum + Number(payment.lateFeeAmount),
              0,
            ),
          });

          const claimedInvoice = await transaction.feeInvoice.updateMany({
            where: {
              id: invoice.id,
              paidAmount: invoice.paidAmount,
              pendingAmount: invoice.pendingAmount,
              status: { notIn: ["CANCELLED", "WAIVED", "PAID"] },
            },
            data: {
              paidAmount: { increment: amountReceived },
              pendingAmount: { decrement: amountReceived },
            },
          });

          if (claimedInvoice.count !== 1) {
            throw new FeeRequestError(
              "This invoice changed while the payment was being saved. Refresh the ledger and try again; no duplicate payment was created.",
              409,
            );
          }

          const updatedInvoiceState = await transaction.feeInvoice.findUniqueOrThrow({
            where: { id: invoice.id },
          });
          const newPaidAmount = roundMoney(Number(updatedInvoiceState.paidAmount));
          const newPendingAmount = roundMoney(Number(updatedInvoiceState.pendingAmount));

          const invoiceStatus =
            getInvoiceStatus(
              newPaidAmount,
              newPendingAmount,
              invoice.dueDate,
              paymentDate,
            );

          const paymentStatus:
            $Enums.PaymentStatus =
            newPendingAmount > 0
              ? "PARTIALLY_PAID"
              : "PAID";

          const updatedInvoice =
            await transaction.feeInvoice.update(
              {
                where: {
                  id: invoice.id,
                },

                data: {
                  status:
                    invoiceStatus,
                },
              },
            );

          await transaction.studentCharge.updateMany({
            where: { feeInvoiceId: invoice.id, status: { in: ["BILLED", "PAID"] } },
            data: { status: invoiceStatus === "PAID" ? "PAID" : "BILLED" },
          });

          const [
            paymentNumbering,
            receiptNumbering,
          ] = await Promise.all([
            transaction.numberSequence.findUnique(
              {
                where: {
                  key: "PAYMENT",
                },

                select: {
                  prefix: true,
                  minimumWidth:
                    true,
                },
              },
            ),

            transaction.numberSequence.findUnique(
              {
                where: {
                  key: "RECEIPT",
                },

                select: {
                  prefix: true,
                  minimumWidth:
                    true,
                },
              },
            ),
          ]);

          const paymentSequence =
            await getNextSequence(
              transaction,
              {
                key: "PAYMENT",

                prefix:
                  paymentNumbering
                    ?.prefix ??
                  "KZ-PAY",

                minimumWidth:
                  paymentNumbering
                    ?.minimumWidth ??
                  2,
              },
            );

          const receiptSequence =
            await getNextSequence(
              transaction,
              {
                key: "RECEIPT",

                prefix:
                  receiptNumbering
                    ?.prefix ??
                  "KZ-RCP",

                minimumWidth:
                  receiptNumbering
                    ?.minimumWidth ??
                  2,
              },
            );

          const payment =
            await transaction.feePayment.create(
              {
                data: {
                  paymentNumber:
                    paymentSequence
                      .formattedNumber,

                  idempotencyKey:
                    requestIdempotencyKey || null,

                  invoiceId:
                    updatedInvoice.id,

                  studentId,

                  category:
                    updatedInvoice.category,

                  feePeriodLabel:
                    updatedInvoice.feePeriodLabel,

                  amountBeforeTax:
                    paymentSnapshot.totalAmount,

                  discountAmount:
                    0,

                  lateFeeAmount:
                    paymentSnapshot.lateFeeAmount,

                  gstApplicable:
                    updatedInvoice.gstApplicable,

                  gstRate:
                    updatedInvoice.gstRate,

                  cgstAmount:
                    paymentSnapshot.cgstAmount,

                  sgstAmount:
                    paymentSnapshot.sgstAmount,

                  totalAmount:
                    paymentSnapshot.totalAmount,

                  amountReceived,

                  pendingAmount:
                    newPendingAmount,

                  paymentMethod:
                    paymentMethodValue as $Enums.PaymentMethod,

                  status:
                    paymentStatus,

                  transactionReference,

                  paymentDate,
                  notes,

                  createdById:
                    session.userId,
                },
              },
            );

          const receipt =
            await transaction.receipt.create(
              {
                data: {
                  receiptNumber:
                    receiptSequence
                      .formattedNumber,

                  paymentId:
                    payment.id,

                  studentId,

                  status: "ISSUED",

                  issuedAt:
                    new Date(),
                },
              },
            );

          await transaction.activityLog.create(
            {
              data: {
                adminUserId:
                  session.userId,

                action: "CREATED",

                entityType:
                  "FeePayment",

                entityId:
                  payment.id,

                description: `Payment ${payment.paymentNumber} recorded against invoice ${updatedInvoice.invoiceNumber}.`,

                newData: {
                  invoiceNumber:
                    updatedInvoice.invoiceNumber,

                  paymentNumber:
                    payment.paymentNumber,

                  receiptNumber:
                    receipt.receiptNumber,

                  studentId,

                  category:
                    updatedInvoice.category,

                  amountReceived:
                    amountReceived.toString(),

                  pendingAmount:
                    newPendingAmount.toString(),

                  paymentMethod:
                    payment.paymentMethod,
                },
              },
            },
          );

          return {
            invoice:
              updatedInvoice,

            payment,
            receipt,
            receiptSequence,

            taxableAmount:
              paymentSnapshot.taxableAmount,

            idempotentReplay: false,
          };
        },
      );

    after(async () => {
      await Promise.all([
        queueReceiptWhatsApp(result.receipt.id),
        safeFirestoreMirror(
          "operational_feeinvoice",
          result.invoice.id,
          {
            ...result.invoice,
            amountBeforeTax: Number(result.invoice.amountBeforeTax),
            discountAmount: Number(result.invoice.discountAmount),
            lateFeeAmount: Number(result.invoice.lateFeeAmount),
            gstRate: result.invoice.gstRate == null ? null : Number(result.invoice.gstRate),
            cgstAmount: Number(result.invoice.cgstAmount),
            sgstAmount: Number(result.invoice.sgstAmount),
            totalAmount: Number(result.invoice.totalAmount),
            paidAmount: Number(result.invoice.paidAmount),
            pendingAmount: Number(result.invoice.pendingAmount),
            mirroredAt: new Date(),
          },
        ),
        safeFirestoreMirror(
          "operational_feepayment",
          result.payment.id,
          {
            ...result.payment,
            amountBeforeTax: Number(result.payment.amountBeforeTax),
            discountAmount: Number(result.payment.discountAmount),
            lateFeeAmount: Number(result.payment.lateFeeAmount),
            gstRate: result.payment.gstRate == null ? null : Number(result.payment.gstRate),
            cgstAmount: Number(result.payment.cgstAmount),
            sgstAmount: Number(result.payment.sgstAmount),
            totalAmount: Number(result.payment.totalAmount),
            amountReceived: Number(result.payment.amountReceived),
            pendingAmount: Number(result.payment.pendingAmount),
            mirroredAt: new Date(),
          },
        ),
        safeFirestoreMirror(
          "operational_receipt",
          result.receipt.id,
          {
            ...result.receipt,
            mirroredAt: new Date(),
          },
        ),
      ]);
    });

    return NextResponse.json(
      {
        success: true,

        message:
          Number(
            result.invoice
              .pendingAmount,
          ) > 0
            ? `Partial payment saved. ₹${Number(
                result.invoice
                  .pendingAmount,
              ).toLocaleString(
                "en-IN",
              )} remains due.`
            : "Fee payment recorded and the invoice is fully paid.",

        invoice:
          result.invoice,

        payment:
          result.payment,

        receipt:
          result.receipt,

        receiptNumbering: {
          serial:
            result.receiptSequence.serial,

          serialText:
            result.receiptSequence.serialText,

          receiptNumber:
            result.receiptSequence.formattedNumber,
        },

        calculation: {
          amountBeforeTax:
            Number(
              result.invoice
                .amountBeforeTax,
            ),

          discountAmount:
            Number(
              result.invoice
                .discountAmount,
            ),

          lateFeeAmount:
            Number(
              result.invoice
                .lateFeeAmount,
            ),

          taxableAmount:
            result.taxableAmount,

          gstApplicable:
            result.invoice
              .gstApplicable,

          gstRate:
            result.invoice
              .gstRate == null
              ? 0
              : Number(
                  result.invoice
                    .gstRate,
                ),

          cgstAmount:
            Number(
              result.invoice
                .cgstAmount,
            ),

          sgstAmount:
            Number(
              result.invoice
                .sgstAmount,
            ),

          totalAmount:
            Number(
              result.invoice
                .totalAmount,
            ),

          amountReceived,

          pendingAmount:
            Number(
              result.invoice
                .pendingAmount,
            ),

          paymentStatus:
            result.payment.status,

          invoiceStatus:
            result.invoice.status,
        },

        idempotentReplay:
          result.idempotentReplay,
      },
      {
        status: result.idempotentReplay ? 200 : 201,
      },
    );
  } catch (error) {
    if (
      error instanceof
      FeeRequestError
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    if (
      requestIdempotencyKey &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002" &&
      "meta" in error &&
      typeof error.meta === "object" &&
      error.meta !== null &&
      "target" in error.meta &&
      (typeof error.meta.target === "string"
        ? error.meta.target.includes("idempotencyKey")
        : Array.isArray(error.meta.target) &&
          error.meta.target.some(
            (target) =>
              typeof target === "string" &&
              target.includes("idempotencyKey"),
          ))
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This payment was already submitted. Refresh the fee ledger to open the existing receipt; no duplicate was created.",
        },
        { status: 409 },
      );
    }

    console.error(
      "Unable to record fee payment:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The fee payment could not be recorded. Check the server terminal.",
      },
      {
        status: 500,
      },
    );
  }
}
