import { createHash } from "node:crypto";

import type { $Enums, Prisma } from "@/generated/prisma/client";
import {
  assertInvoiceArithmetic,
  assertSourceCharges,
  assertUniqueChargeKeys,
} from "@/lib/admin/billing-integrity";
import {
  annualChargeReference,
  recurringDaycareAmount,
  type AcademicChargePolicy,
} from "@/lib/admin/academic-contract-rules";
import {
  calculateChargePricing,
  type ChargePriceType,
} from "@/lib/admin/charge-pricing";
import { prisma } from "@/lib/prisma";
import { getNextSequence } from "@/lib/numbering";

type GeneratedItem = {
  category: $Enums.FeeCategory;
  title: string;
  detail: string;
  amount: number;
  gstApplicable: boolean;
  gstRate: number;
  priceType: ChargePriceType;
  chargeKey: string;
  sourceType: string;
  sourceId: string;
  sourceVersionId?: string;
  contractServiceId?: string;
  daycareSessionId?: string;
  studentChargeId?: string;
};

type BillingCandidate = {
  studentId: string;
  enrollmentContractId?: string;
  billingKey: string;
  legacySchoolKey?: string;
  items: GeneratedItem[];
};

type BillingSettings = {
  dueDay: number;
  academicYearStartMonth: number;
  academicChargePolicy: AcademicChargePolicy;
  defaultInvoiceMode: "COMBINED" | "SPLIT_DAYCARE";
  additionalDaycareDisplayMode: "DETAILED" | "MERGED" | "HIDDEN_DETAIL";
  automaticMonthlyBilling: boolean;
};

const IST_OFFSET = "+05:30";

function money(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : 0;
}

function periodKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

function periodLabel(key: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "long",
    year: "numeric",
  }).format(new Date(`${key}-15T12:00:00.000${IST_OFFSET}`));
}

function monthBounds(key: string) {
  const [year, month] = key.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    start: new Date(`${key}-01T00:00:00.000${IST_OFFSET}`),
    end: new Date(
      new Date(
        `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00.000${IST_OFFSET}`,
      ).getTime() - 1,
    ),
  };
}

function dueDate(key: string, day: number) {
  const [year, month] = key.split("-").map(Number);
  const safeDay = Math.max(1, Math.min(day, new Date(year, month, 0).getDate()));
  return new Date(
    `${key}-${String(safeDay).padStart(2, "0")}T23:59:59.999${IST_OFFSET}`,
  );
}

function settingsValue(value: Prisma.JsonValue | undefined): BillingSettings {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Prisma.JsonObject)
      : {};
  return {
    dueDay: Math.min(31, Math.max(1, Number(record.dueDay) || 5)),
    academicYearStartMonth: Math.min(
      12,
      Math.max(1, Number(record.academicYearStartMonth) || 4),
    ),
    academicChargePolicy:
      record.academicChargePolicy === "ROLLING_12_MONTHS"
        ? "ROLLING_12_MONTHS"
        : record.academicChargePolicy === "MANUAL_ONLY"
          ? "MANUAL_ONLY"
          : "ACADEMIC_SESSION",
    defaultInvoiceMode:
      record.defaultInvoiceMode === "SPLIT_DAYCARE" ? "SPLIT_DAYCARE" : "COMBINED",
    additionalDaycareDisplayMode:
      record.additionalDaycareDisplayMode === "MERGED"
        ? "MERGED"
        : record.additionalDaycareDisplayMode === "HIDDEN_DETAIL"
          ? "HIDDEN_DETAIL"
          : "DETAILED",
    automaticMonthlyBilling: record.automaticMonthlyBilling !== false,
  };
}

function supplementKey(candidate: BillingCandidate, items: GeneratedItem[]) {
  const fingerprint = createHash("sha256")
    .update(items.map((item) => item.chargeKey).sort().join(":"))
    .digest("hex")
    .slice(0, 16);
  return `${candidate.billingKey}:supplement:${fingerprint}`;
}

function legacyProgrammeKey(studentId: string, key: string) {
  return `${studentId}:MONTHLY_PRESCHOOL_FEE:${key}`;
}

function isTransactionConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["P2002", "P2034"].includes(String((error as { code?: unknown }).code))
  );
}

function effectiveVersion<
  T extends { effectiveFrom: Date; effectiveTo: Date | null },
>(versions: T[], serviceDate: Date) {
  return versions.find(
    (version) =>
      version.effectiveFrom <= serviceDate &&
      (!version.effectiveTo || version.effectiveTo >= serviceDate),
  );
}

export async function generateRecurringInvoices(
  adminUserId: string,
  referenceDate = new Date(),
  options: { studentId?: string; ignoreAutomaticSetting?: boolean } = {},
) {
  const key = periodKey(referenceDate);
  const label = periodLabel(key);
  const { start, end } = monthBounds(key);
  const [students, legacyFees, legacyDaycareRate, lateFee, setting, sequence] =
    await Promise.all([
      prisma.student.findMany({
        where: {
          ...(options.studentId ? { id: options.studentId } : {}),
          status: "ACTIVE",
          joiningDate: { lte: end },
        },
        select: {
          id: true,
          programme: true,
          joiningDate: true,
          enrollmentContract: {
            include: {
              services: {
                where: {
                  status: "ACTIVE",
                  recurring: true,
                  frequency: "MONTHLY",
                  effectiveFrom: { lte: end },
                  OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
                },
                orderBy: [{ effectiveFrom: "asc" }, { createdAt: "asc" }],
              },
            },
          },
          programmeDefinition: {
            include: {
              feeVersions: {
                where: {
                  active: true,
                  effectiveFrom: { lte: end },
                  OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
                },
                orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
              },
            },
          },
          daycarePlans: {
            where: {
              active: true,
              recurring: true,
              billingStoppedAt: null,
              effectiveFrom: { lte: end },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
            },
            include: {
              planDefinition: {
                include: {
                  priceVersions: {
                    where: {
                      active: true,
                      effectiveFrom: { lte: end },
                      OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
                    },
                    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
                  },
                },
              },
              mealCombination: {
                include: {
                  priceVersions: {
                    where: {
                      active: true,
                      effectiveFrom: { lte: end },
                      OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
                    },
                    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
                  },
                },
              },
            },
            orderBy: [{ effectiveFrom: "asc" }, { createdAt: "asc" }],
          },
          daycareSessions: {
            where: {
              status: "COMPLETED",
              approved: true,
              invoiceStatus: { in: ["PENDING", "APPROVED"] },
              feeInvoiceId: null,
              sessionDate: { lt: start },
            },
            orderBy: [{ sessionDate: "asc" }, { createdAt: "asc" }],
            include: {
              meals: {
                include: { meal: true },
                orderBy: { createdAt: "asc" },
              },
            },
          },
          ledgerCharges: {
            where: {
              OR: [
                {
                  status: "PENDING",
                  approved: true,
                  feeInvoiceId: null,
                  chargeDate: { lt: start },
                },
                {
                  category: { in: ["ANNUAL_FEE", "KIT_FEE"] },
                  status: { in: ["BILLED", "PAID"] },
                },
              ],
            },
            orderBy: [{ chargeDate: "asc" }, { createdAt: "asc" }],
          },
        },
      }),
      prisma.programmeFeeSetting.findMany({
        where: {
          active: true,
          effectiveFrom: { lte: end },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
        },
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      }),
      prisma.daycareRateSetting.findFirst({
        where: {
          active: true,
          effectiveFrom: { lte: end },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
        },
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      }),
      prisma.lateFeeSetting.findFirst({
        where: {
          active: true,
          effectiveFrom: { lte: end },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
        },
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      }),
      prisma.centreSetting.findUnique({ where: { key: "BILLING_ENGINE" } }),
      prisma.numberSequence.findUnique({ where: { key: "INVOICE" } }),
    ]);
  const config = settingsValue(setting?.value);
  if (!config.automaticMonthlyBilling && !options.ignoreAutomaticSetting) {
    return { created: 0, updated: 0, skipped: true };
  }
  const legacyByKey = new Map<string, (typeof legacyFees)[number]>();
  for (const fee of legacyFees) {
    const mapKey = `${fee.programme}:${fee.category}`;
    if (!legacyByKey.has(mapKey)) legacyByKey.set(mapKey, fee);
  }
  const weeks = Math.max(1, Math.ceil((end.getTime() - start.getTime() + 1) / 604_800_000));
  const candidates: BillingCandidate[] = [];

  for (const student of students) {
    const groups = new Map<string, GeneratedItem[]>();
    const add = (group: string, item: GeneratedItem) => {
      groups.set(group, [...(groups.get(group) ?? []), item]);
    };
    const main = "combined";
    const contract = student.enrollmentContract;
    const contractIsEffective = Boolean(
      contract &&
        contract.status === "ACTIVE" &&
        contract.startDate <= end &&
        (!contract.endDate || contract.endDate >= start),
    );
    if (contractIsEffective && contract) {
      for (const service of contract.services) {
        const configuredAmount = Math.max(0, Number(service.amountSnapshot) - Number(service.discountSnapshot));
        if (configuredAmount <= 0) continue;
        add(main, {
          category: service.category,
          title: service.label,
          detail: service.detail ?? label,
          amount: money(configuredAmount),
          gstApplicable: service.gstApplicable,
          gstRate: service.gstApplicable ? money(service.gstRate) : 0,
          priceType: service.gstInclusive ? "GST_INCLUSIVE" : "GST_EXCLUSIVE",
          chargeKey: `contract-service:${service.id}:${key}`,
          sourceType: "ContractService",
          sourceId: service.id,
          sourceVersionId: service.sourceVersionId ?? undefined,
          contractServiceId: service.id,
        });
      }
    } else {
    const programme = student.programmeDefinition;
    const programmeServiceDate = student.joiningDate > start ? student.joiningDate : start;
    const feeVersion = programme
      ? effectiveVersion(programme.feeVersions, programmeServiceDate)
      : undefined;
    const isPreschool = programme ? programme.code !== "DAYCARE" : student.programme !== "DAYCARE";
    if (isPreschool && programme && feeVersion) {
      const common = {
        sourceType: "ProgrammeFeeVersion",
        sourceId: programme.id,
        sourceVersionId: feeVersion.id,
      };
      const programmePricing = (
        component: "admission" | "annual" | "kit" | "monthly",
      ) => {
        const applicable = feeVersion[`${component}GstApplicable`];
        return {
          gstApplicable: applicable,
          gstRate: applicable ? money(feeVersion[`${component}GstRate`]) : 0,
          priceType: feeVersion[`${component}PriceType`] as ChargePriceType,
        };
      };
      if (money(feeVersion.monthlyFee) > 0) {
        add(main, {
          ...common,
          ...programmePricing("monthly"),
          category: "MONTHLY_PRESCHOOL_FEE",
          title: `${programme.name} monthly fee`,
          detail: label,
          amount: money(feeVersion.monthlyFee),
          chargeKey: `programme-monthly:${student.id}:${key}`,
        });
      }
      if (student.joiningDate >= start && student.joiningDate <= end && money(feeVersion.admissionFee) > 0) {
        add(main, {
          ...common,
          ...programmePricing("admission"),
          category: "ADMISSION_FEE",
          title: `${programme.name} admission fee`,
          detail: "One-time admission charge",
          amount: money(feeVersion.admissionFee),
          chargeKey: `programme-admission:${student.id}:${programme.id}`,
        });
      }
      const annualContext = annualChargeReference({
        period: key,
        joiningPeriod: periodKey(student.joiningDate),
        startMonth: config.academicYearStartMonth,
        policy: config.academicChargePolicy,
      });
      const hasStudentAnnualCharge = student.ledgerCharges.some(
        (charge) =>
          charge.category === "ANNUAL_FEE" &&
          annualContext?.manualReference != null &&
          charge.academicYear === annualContext.manualReference &&
          !["WAIVED", "CANCELLED"].includes(charge.status),
      );
      const hasStudentKitCharge = student.ledgerCharges.some(
        (charge) =>
          charge.category === "KIT_FEE" &&
          annualContext?.manualReference != null &&
          charge.academicYear === annualContext.manualReference &&
          !["WAIVED", "CANCELLED"].includes(charge.status),
      );
      const annualAmount = hasStudentAnnualCharge ? 0 : money(feeVersion.annualFee);
      const kitAmount = hasStudentKitCharge ? 0 : money(feeVersion.kitFee);
      if (
        annualContext &&
        feeVersion.combineAnnualAndKit &&
        annualAmount > 0 &&
        kitAmount > 0 &&
        feeVersion.annualGstApplicable === feeVersion.kitGstApplicable &&
        money(feeVersion.annualGstRate) === money(feeVersion.kitGstRate) &&
        feeVersion.annualPriceType === feeVersion.kitPriceType
      ) {
        add(main, {
          ...common,
          ...programmePricing("annual"),
          category: "ANNUAL_FEE",
          title: `${programme.name} annual + kit package`,
          detail: annualContext.label,
          amount: money(annualAmount + kitAmount),
          chargeKey: `programme-annual-kit:${student.id}:${programme.id}:${annualContext.reference}`,
        });
      } else if (annualContext) {
        if (annualAmount > 0) {
          add(main, {
            ...common,
            ...programmePricing("annual"),
            category: "ANNUAL_FEE",
            title: `${programme.name} annual fee`,
            detail: annualContext.label,
            amount: annualAmount,
            chargeKey: `programme-annual:${student.id}:${programme.id}:${annualContext.reference}`,
          });
        }
        if (kitAmount > 0) {
          add(main, {
            ...common,
            ...programmePricing("kit"),
            category: "KIT_FEE",
            title: `${programme.name} kit fee`,
            detail: annualContext.label,
            amount: kitAmount,
            chargeKey: `programme-kit:${student.id}:${programme.id}:${annualContext.reference}`,
          });
        }
      }
    } else if (isPreschool) {
      const fee = legacyByKey.get(`${student.programme}:MONTHLY_PRESCHOOL_FEE`);
      if (fee && money(fee.amount) > 0) {
        add(main, {
          category: "MONTHLY_PRESCHOOL_FEE",
          title: fee.title || "Monthly preschool fee",
          detail: label,
          amount: money(fee.amount),
          gstApplicable: fee.gstApplicable,
          gstRate: fee.gstApplicable ? money(fee.gstRate) : 0,
          priceType: "GST_INCLUSIVE",
          chargeKey: `legacy-programme-monthly:${student.id}:${key}`,
          sourceType: "ProgrammeFeeSetting",
          sourceId: fee.id,
          sourceVersionId: fee.id,
        });
      }
    }

    for (const plan of student.daycarePlans) {
      if (plan.planType === "OCCASIONAL") continue;
      const definition = plan.planDefinition;
      const planServiceDate = plan.effectiveFrom > start ? plan.effectiveFrom : start;
      const version = definition
        ? effectiveVersion(definition.priceVersions, planServiceDate)
        : undefined;
      const legacyPrice =
        plan.planType === "MONTHLY_DAYCARE_ONLY"
          ? Number(plan.dailyHours ?? 0) <= 6.25
            ? legacyDaycareRate?.monthlySixHourRate ?? legacyDaycareRate?.monthlyDaycareOnlyRate
            : legacyDaycareRate?.monthlySixHalfHourRate ?? legacyDaycareRate?.monthlyDaycareOnlyRate
          : legacyDaycareRate?.monthlyPreschoolAddonRate;
      const unitPrice = money(plan.monthlyFeeOverride ?? version?.price ?? legacyPrice);
      const visits = plan.maximumVisitsOverride ?? definition?.maximumVisits ?? plan.includedDays ?? 1;
      const amount = recurringDaycareAmount({
        unitPrice,
        monthlyOverride: plan.monthlyFeeOverride == null ? null : Number(plan.monthlyFeeOverride),
        billingType: definition?.billingType ?? null,
        weeks,
        visits,
      });
      const group =
        plan.separateInvoice || config.defaultInvoiceMode === "SPLIT_DAYCARE"
          ? `daycare:${plan.id}`
          : main;
      const legacyFee =
        legacyByKey.get("DAYCARE:DAYCARE_FEE") ??
        legacyByKey.get(`${student.programme}:DAYCARE_FEE`);
      const gstApplicable = version?.gstApplicable ?? legacyDaycareRate?.gstApplicable ?? legacyFee?.gstApplicable ?? false;
      if (amount > 0) {
        add(group, {
          category: "DAYCARE_FEE",
          title: definition?.name ?? plan.title,
          detail: `${label}${definition?.hoursIncluded != null ? ` · ${Number(definition.hoursIncluded)} hours included` : ""}${definition?.mealRule === "INCLUDED" && plan.mealCombination ? ` · ${plan.mealCombination.name} included` : ""}`,
          amount,
          gstApplicable,
          gstRate: gstApplicable ? money(version?.gstRate ?? legacyDaycareRate?.gstRate ?? legacyFee?.gstRate) : 0,
          priceType: (version?.priceType ?? legacyDaycareRate?.priceType ?? "GST_INCLUSIVE") as ChargePriceType,
          chargeKey: `daycare-plan:${plan.id}:${key}`,
          sourceType: version ? "DaycarePlanPriceVersion" : "StudentDaycarePlan",
          sourceId: definition?.id ?? plan.id,
          sourceVersionId: version?.id ?? plan.priceVersionId ?? undefined,
        });
      }
      const comboVersion = plan.mealCombination
        ? effectiveVersion(plan.mealCombination.priceVersions, planServiceDate)
        : undefined;
      const legacyCategory: $Enums.FeeCategory = plan.foodOption === "LUNCH"
        ? "DAYCARE_LUNCH_FEE"
        : plan.foodOption === "EVENING_SNACK"
          ? "DAYCARE_EVENING_SNACK_FEE"
          : "DAYCARE_MEAL_COMBO_FEE";
      const legacyMeal =
        legacyByKey.get(`DAYCARE:${legacyCategory}`) ??
        legacyByKey.get(`${student.programme}:${legacyCategory}`);
      const mealAmount = money(plan.monthlyFoodFeeOverride ?? comboVersion?.price ?? legacyMeal?.amount);
      if (
        definition?.mealRule !== "INCLUDED" &&
        (plan.mealCombination || plan.foodOption !== "NONE") &&
        mealAmount > 0
      ) {
        const mealGst = comboVersion?.gstApplicable ?? legacyMeal?.gstApplicable ?? false;
        add(group, {
          category: plan.mealCombination ? "FOOD_FEE" : legacyCategory,
          title: plan.mealCombination?.name ?? legacyMeal?.title ?? "Daycare meal plan",
          detail: label,
          amount: mealAmount,
          gstApplicable: mealGst,
          gstRate: mealGst ? money(comboVersion?.gstRate ?? legacyMeal?.gstRate) : 0,
          priceType: (comboVersion?.priceType ?? "GST_INCLUSIVE") as ChargePriceType,
          chargeKey: `daycare-meal-plan:${plan.id}:${key}`,
          sourceType: comboVersion ? "MealCombinationPriceVersion" : "StudentDaycarePlan",
          sourceId: plan.mealCombination?.id ?? plan.id,
          sourceVersionId: comboVersion?.id,
        });
      }
    }
    }

    for (const session of student.daycareSessions) {
      const date = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(session.sessionDate);
      const parentDaycareTitle = config.additionalDaycareDisplayMode === "MERGED"
        ? "Daycare"
        : config.additionalDaycareDisplayMode === "HIDDEN_DETAIL"
          ? "Additional daycare"
          : session.emergencyCare
            ? "Emergency daycare"
            : session.billingMode === "HOURLY"
              ? "Hourly daycare"
              : "Full-day daycare";
      if (money(session.baseAmount) > 0) {
        add(main, {
          category: "DAYCARE_FEE",
          title: parentDaycareTitle,
          detail: config.additionalDaycareDisplayMode === "DETAILED"
            ? session.billingMode === "HOURLY"
              ? `${Number(session.billableHours ?? 0)} hours on ${date}${session.reason ? ` · ${session.reason}` : ""}`
              : `Full-day care on ${date}${session.reason ? ` · ${session.reason}` : ""}`
            : label,
          amount: money(session.baseAmount),
          gstApplicable: session.gstApplicable,
          gstRate: session.gstApplicable ? money(session.gstRate) : 0,
          priceType: session.priceType as ChargePriceType,
          chargeKey: `daycare-session:${session.id}:care`,
          sourceType: "DaycareSession",
          sourceId: session.id,
          daycareSessionId: session.id,
        });
      }
      if (session.meals.length > 0) {
        for (const sessionMeal of session.meals) {
          add(main, {
            category: "FOOD_FEE",
            title: sessionMeal.meal.name,
            detail: config.additionalDaycareDisplayMode === "DETAILED" ? `Meal taken on ${date}` : label,
            amount: money(sessionMeal.totalAmount),
            gstApplicable: sessionMeal.gstApplicable,
            gstRate: sessionMeal.gstApplicable ? money(sessionMeal.gstRate) : 0,
            priceType: sessionMeal.priceType as ChargePriceType,
            chargeKey: `daycare-session:${session.id}:meal:${sessionMeal.mealId}`,
            sourceType: "MealDefinition",
            sourceId: sessionMeal.mealId,
            daycareSessionId: session.id,
          });
        }
      } else if (money(session.foodCharge) > 0) {
        add(main, {
          category: "FOOD_FEE",
          title: "Daycare meals",
          detail: config.additionalDaycareDisplayMode === "DETAILED" ? `Meals taken on ${date}` : label,
          amount: money(session.foodCharge),
          gstApplicable: session.foodGstApplicable,
          gstRate: session.foodGstApplicable ? money(session.foodGstRate) : 0,
          priceType: session.foodPriceType as ChargePriceType,
          chargeKey: `daycare-session:${session.id}:meals`,
          sourceType: "DaycareSession",
          sourceId: session.id,
          daycareSessionId: session.id,
        });
      }
    }

    for (const charge of student.ledgerCharges.filter(
      (item) =>
        item.status === "PENDING" &&
        item.approved &&
        !item.feeInvoiceId &&
        item.chargeDate < start,
    )) {
      const date = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(charge.chargeDate);
      add(main, {
        category: charge.category,
        title: charge.title,
        detail: charge.detail ?? `${charge.academicYear ? `Academic year ${charge.academicYear} · ` : ""}Charged on ${date}`,
        amount: money(charge.amount),
        gstApplicable: charge.gstApplicable,
        gstRate: charge.gstApplicable ? money(charge.gstRate) : 0,
        priceType: charge.priceType as ChargePriceType,
        chargeKey: charge.chargeKey,
        sourceType: "StudentCharge",
        sourceId: charge.id,
        studentChargeId: charge.id,
      });
    }

    for (const [group, items] of groups) {
      if (items.length === 0) continue;
      assertSourceCharges(items);
      const legacyKey = legacyProgrammeKey(student.id, key);
      candidates.push({
        studentId: student.id,
        enrollmentContractId: contractIsEffective ? contract?.id : undefined,
        billingKey:
          group === main
            ? items.length === 1 && items[0].category === "MONTHLY_PRESCHOOL_FEE"
              ? legacyKey
              : `monthly-bundle:${student.id}:${key}`
            : `monthly-daycare:${student.id}:${key}:${group.slice(8)}`,
        legacySchoolKey: group === main ? legacyKey : undefined,
        items,
      });
    }
  }

  const allChargeKeys = candidates.flatMap((candidate) => candidate.items.map((item) => item.chargeKey));
  assertUniqueChargeKeys(candidates.flatMap((candidate) => candidate.items));
  const existingItems = allChargeKeys.length
    ? await prisma.feeInvoiceItem.findMany({
        where: { chargeKey: { in: allChargeKeys } },
        select: { chargeKey: true },
      })
    : [];
  const charged = new Set(existingItems.map((item) => item.chargeKey).filter(Boolean));
  let created = 0;
  let updated = 0;

  for (const candidate of candidates) {
    const missingItems = candidate.items.filter((item) => !charged.has(item.chargeKey));
    if (missingItems.length === 0) continue;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const exact = await tx.feeInvoice.findUnique({
            where: { billingKey: candidate.billingKey },
            include: { items: true },
          });
          const legacy = !exact && candidate.legacySchoolKey
            ? await tx.feeInvoice.findUnique({
                where: { billingKey: candidate.legacySchoolKey },
                include: { items: true },
              })
            : null;
          const base = exact ?? legacy;
          const canAppend =
            base != null &&
            Number(base.paidAmount) === 0 &&
            Number(base.discountAmount) === 0 &&
            Number(base.lateFeeAmount) === 0;
          if (base && canAppend) {
            assertInvoiceArithmetic({
              itemTotals: base.items.map((item) => Number(item.totalAmount)),
              totalAmount: Number(base.totalAmount),
              paidAmount: Number(base.paidAmount),
              pendingAmount: Number(base.pendingAmount),
            });
          }
          const targetKey = base && !canAppend ? supplementKey(candidate, missingItems) : candidate.billingKey;
          if (base && !canAppend) {
            const existingSupplement = await tx.feeInvoice.findUnique({ where: { billingKey: targetKey } });
            if (existingSupplement) return "skipped" as const;
          }
          const calculated = missingItems.map((item, index) => ({
            ...item,
            ...calculateChargePricing({
              configuredAmount: item.amount,
              gstApplicable: item.gstApplicable,
              gstRate: item.gstRate,
              priceType: item.priceType,
            }),
            sortOrder: ((base?.items.length ?? 0) + index + 1) * 10,
          }));
          const createData = calculated.map((item) => ({
            category: item.category,
            title: item.title,
            detail: item.detail,
            quantity: 1,
            unitAmount: item.totalAmount,
            amount: item.totalAmount,
            gstApplicable: item.gstApplicable,
            gstRate: item.gstApplicable ? item.gstRate : null,
            priceType: item.priceType,
            taxableAmount: item.taxableAmount,
            cgstAmount: item.cgstAmount,
            sgstAmount: item.sgstAmount,
            totalAmount: item.totalAmount,
            sortOrder: item.sortOrder,
            chargeKey: item.chargeKey,
            sourceType: item.sourceType,
            sourceId: item.sourceId,
            sourceVersionId: item.sourceVersionId,
            contractServiceId: item.contractServiceId,
          }));
          const newTotal = money(calculated.reduce((sum, item) => sum + item.totalAmount, 0));
          const newCgst = money(calculated.reduce((sum, item) => sum + item.cgstAmount, 0));
          const newSgst = money(calculated.reduce((sum, item) => sum + item.sgstAmount, 0));
          let invoiceId: string;
          if (base && canAppend) {
            const total = money(Number(base.totalAmount) + newTotal);
            const cgst = money(Number(base.cgstAmount) + newCgst);
            const sgst = money(Number(base.sgstAmount) + newSgst);
            assertInvoiceArithmetic({
              itemTotals: [...base.items.map((item) => Number(item.totalAmount)), ...calculated.map((item) => item.totalAmount)],
              totalAmount: total,
              paidAmount: 0,
              pendingAmount: total,
            });
            await tx.feeInvoice.update({
              where: { id: base.id },
              data: {
                billingKey: candidate.billingKey,
                enrollmentContractId: candidate.enrollmentContractId,
                category: [...base.items, ...calculated].some((item) => item.category === "MONTHLY_PRESCHOOL_FEE") ? "MONTHLY_PRESCHOOL_FEE" : "DAYCARE_FEE",
                amountBeforeTax: total,
                cgstAmount: cgst,
                sgstAmount: sgst,
                totalAmount: total,
                pendingAmount: total,
                items: { create: createData },
              },
            });
            invoiceId = base.id;
          } else {
            assertInvoiceArithmetic({
              itemTotals: calculated.map((item) => item.totalAmount),
              totalAmount: newTotal,
              paidAmount: 0,
              pendingAmount: newTotal,
            });
            const invoiceSequence = await getNextSequence(tx, {
              key: "INVOICE",
              prefix: sequence?.prefix ?? "KZ-INV",
              minimumWidth: sequence?.minimumWidth ?? 2,
            });
            const saved = await tx.feeInvoice.create({
              data: {
                invoiceNumber: invoiceSequence.formattedNumber,
                billingKey: targetKey,
                studentId: candidate.studentId,
                enrollmentContractId: candidate.enrollmentContractId,
                category: calculated.some((item) => item.category === "MONTHLY_PRESCHOOL_FEE") ? "MONTHLY_PRESCHOOL_FEE" : "DAYCARE_FEE",
                feePeriodKey: key,
                feePeriodLabel: label,
                issueDate: referenceDate,
                dueDate: dueDate(key, lateFee?.dueDay ?? config.dueDay),
                amountBeforeTax: newTotal,
                discountAmount: 0,
                lateFeeAmount: 0,
                gstApplicable: newCgst + newSgst > 0,
                gstRate: null,
                cgstAmount: newCgst,
                sgstAmount: newSgst,
                totalAmount: newTotal,
                paidAmount: 0,
                pendingAmount: newTotal,
                status: referenceDate > dueDate(key, lateFee?.dueDay ?? config.dueDay) ? "OVERDUE" : "DUE",
                createdById: adminUserId,
                notes: base && !canAppend
                  ? "Automatically generated supplement because the original monthly invoice was already paid or adjusted."
                  : "Automatically generated recurring combined invoice.",
                items: { create: createData },
              },
            });
            invoiceId = saved.id;
          }
          const sessionIds = [...new Set(missingItems.map((item) => item.daycareSessionId).filter((value): value is string => Boolean(value)))];
          if (sessionIds.length > 0) {
            const linked = await tx.daycareSession.updateMany({
              where: { id: { in: sessionIds }, feeInvoiceId: null, approved: true },
              data: { feeInvoiceId: invoiceId, status: "BILLED", invoiceStatus: "INVOICED" },
            });
            if (linked.count !== sessionIds.length) throw new Error("DAYCARE_LEDGER_CHANGED");
          }
          const studentChargeIds = [...new Set(missingItems.map((item) => item.studentChargeId).filter((value): value is string => Boolean(value)))];
          if (studentChargeIds.length > 0) {
            const linked = await tx.studentCharge.updateMany({
              where: {
                id: { in: studentChargeIds },
                status: "PENDING",
                approved: true,
                feeInvoiceId: null,
              },
              data: { feeInvoiceId: invoiceId, status: "BILLED" },
            });
            if (linked.count !== studentChargeIds.length) throw new Error("STUDENT_LEDGER_CHANGED");
          }
          await tx.activityLog.create({
            data: {
              adminUserId,
              action: base && canAppend ? "UPDATED" : "CREATED",
              entityType: "FeeInvoice",
              entityId: invoiceId,
              description: `${base && canAppend ? "Updated" : "Generated"} recurring invoice for ${label} with ${missingItems.length} item(s).`,
            },
          });
          return base && canAppend ? "updated" as const : "created" as const;
        }, { isolationLevel: "Serializable" });
        if (result === "created") created += 1;
        if (result === "updated") updated += 1;
        break;
      } catch (error) {
        if (!isTransactionConflict(error) || attempt === 2) throw error;
      }
    }
  }
  return { created, updated, skipped: false };
}
