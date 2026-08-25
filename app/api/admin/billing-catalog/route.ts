import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { calculateChargePricing } from "@/lib/admin/charge-pricing";
import { prisma } from "@/lib/prisma";

class CatalogueError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalText(value: unknown, max = 1000) {
  return text(value, max) || null;
}

function numberValue(value: unknown, minimum = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : Number.NaN;
}

function optionalNumber(value: unknown, minimum = 0) {
  if (value === null || value === undefined || text(value, 50) === "")
    return null;
  return numberValue(value, minimum);
}

function booleanValue(value: unknown) {
  return value === true || text(value, 10).toLowerCase() === "true";
}

function priceTypeValue(value: unknown): "GST_INCLUSIVE" | "GST_EXCLUSIVE" {
  return text(value, 30) === "GST_EXCLUSIVE"
    ? "GST_EXCLUSIVE"
    : "GST_INCLUSIVE";
}

function gstConfiguration(body: Record<string, unknown>, prefix = "") {
  const applicable = booleanValue(body[`${prefix}GstApplicable`]);
  const rate = applicable ? numberValue(body[`${prefix}GstRate`]) : 0;
  if (applicable && (Number.isNaN(rate) || rate <= 0 || rate > 100)) {
    throw new CatalogueError("Enter a valid GST rate between 0 and 100.");
  }
  return {
    applicable,
    rate,
    priceType: priceTypeValue(body[`${prefix}PriceType`]),
  };
}

function dateValue(value: unknown, endOfDay = false) {
  const cleaned = text(value, 30);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return null;
  const parsed = new Date(
    `${cleaned}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function codeValue(value: unknown) {
  const code = text(value, 60)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!code) throw new CatalogueError("Enter a short catalogue code.");
  return code;
}

function canManage(session: Awaited<ReturnType<typeof getAdminSession>>) {
  return Boolean(
    session && (session.role === "OWNER" || session.permissions.includes("*")),
  );
}

function serialise<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => {
      if (
        typeof item === "object" &&
        item &&
        "toNumber" in item &&
        typeof item.toNumber === "function"
      ) {
        return item.toNumber();
      }
      return item;
    }),
  ) as T;
}

async function getCatalogue() {
  const [
    programmes,
    daycarePlans,
    meals,
    mealCombinations,
    chargeDefinitions,
    setting,
  ] = await Promise.all([
    prisma.programmeDefinition.findMany({
      include: {
        feeVersions: {
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.daycarePlanDefinition.findMany({
      include: {
        priceVersions: {
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.mealDefinition.findMany({
      include: {
        priceVersions: {
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.mealCombination.findMany({
      include: {
        items: {
          include: { meal: true },
          orderBy: { meal: { displayOrder: "asc" } },
        },
        priceVersions: {
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.chargeDefinition.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.centreSetting.findUnique({ where: { key: "BILLING_ENGINE" } }),
  ]);

  return serialise({
    programmes,
    daycarePlans,
    meals,
    mealCombinations,
    chargeDefinitions,
    settings: {
      dueDay: 5,
      invoicePrefix: "KZ-INV",
      receiptPrefix: "KZ-RCP",
      paymentTerms: "Fees are inclusive of applicable GST.",
      academicYearStartMonth: 4,
      academicChargePolicy: "ACADEMIC_SESSION",
      defaultInvoiceMode: "COMBINED",
      additionalDaycareDisplayMode: "DETAILED",
      automaticMonthlyBilling: true,
      daycareCapacity: null,
      ...(setting?.value &&
      typeof setting.value === "object" &&
      !Array.isArray(setting.value)
        ? setting.value
        : {}),
    },
  });
}

type CatalogueEntity =
  "PROGRAMME" | "DAYCARE_PLAN" | "MEAL" | "MEAL_COMBINATION" | "CHARGE";

async function catalogueName(entityType: CatalogueEntity, id: string) {
  if (entityType === "PROGRAMME")
    return (
      await prisma.programmeDefinition.findUnique({
        where: { id },
        select: { name: true },
      })
    )?.name;
  if (entityType === "DAYCARE_PLAN")
    return (
      await prisma.daycarePlanDefinition.findUnique({
        where: { id },
        select: { name: true },
      })
    )?.name;
  if (entityType === "MEAL")
    return (
      await prisma.mealDefinition.findUnique({
        where: { id },
        select: { name: true },
      })
    )?.name;
  if (entityType === "MEAL_COMBINATION")
    return (
      await prisma.mealCombination.findUnique({
        where: { id },
        select: { name: true },
      })
    )?.name;
  return (
    await prisma.chargeDefinition.findUnique({
      where: { id },
      select: { name: true },
    })
  )?.name;
}

async function catalogueDependencies(entityType: CatalogueEntity, id: string) {
  const historicalInvoices = await prisma.feeInvoiceItem.count({
    where: { sourceId: id },
  });
  if (entityType === "PROGRAMME")
    return {
      students: await prisma.student.count({
        where: { programmeDefinitionId: id },
      }),
      historicalInvoices,
    };
  if (entityType === "DAYCARE_PLAN")
    return {
      childPlans: await prisma.studentDaycarePlan.count({
        where: { planDefinitionId: id },
      }),
      historicalInvoices,
    };
  if (entityType === "MEAL")
    return {
      mealCombinations: await prisma.mealCombinationItem.count({
        where: { mealId: id },
      }),
      daycareSessions: await prisma.daycareSessionMeal.count({
        where: { mealId: id },
      }),
      historicalInvoices,
    };
  if (entityType === "MEAL_COMBINATION")
    return {
      childPlans: await prisma.studentDaycarePlan.count({
        where: { mealCombinationId: id },
      }),
      historicalInvoices,
    };
  return {
    studentCharges: await prisma.studentCharge.count({
      where: { definitionId: id },
    }),
    historicalInvoices,
  };
}

function dependencyTotal(values: Record<string, number | undefined>) {
  let total = 0;
  for (const value of Object.values(values)) total += value ?? 0;
  return total;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json(
      { success: false, message: "You are not authorised." },
      { status: 401 },
    );

  return NextResponse.json({
    success: true,
    canManage: canManage(session),
    ...(await getCatalogue()),
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!canManage(session)) {
    return NextResponse.json(
      {
        success: false,
        message: session
          ? "Only the Owner can change the billing catalogue."
          : "You are not authorised.",
      },
      { status: session ? 403 : 401 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = text(body.action, 50);
    if (
      action === "replace-plan-preview" ||
      action === "replace-plan-apply"
    ) {
      if (session?.role !== "OWNER") {
        throw new CatalogueError(
          "Only the Owner can replace plans in active child contracts.",
          403,
        );
      }
      const oldPlanId = text(body.oldPlanId, 100);
      const newPlanId = text(body.newPlanId, 100);
      const effectiveFrom = dateValue(body.effectiveFrom);
      const selectedPlanIds = Array.isArray(body.studentPlanIds)
        ? body.studentPlanIds
            .map((value) => text(value, 100))
            .filter(Boolean)
        : [];
      if (!oldPlanId || !newPlanId || oldPlanId === newPlanId) {
        throw new CatalogueError(
          "Choose two different daycare plans for replacement.",
        );
      }
      if (!effectiveFrom) {
        throw new CatalogueError("Choose the replacement effective date.");
      }

      const [oldPlan, newPlan] = await Promise.all([
        prisma.daycarePlanDefinition.findUnique({
          where: { id: oldPlanId },
          select: { id: true, name: true },
        }),
        prisma.daycarePlanDefinition.findUnique({
          where: { id: newPlanId },
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
        }),
      ]);
      if (!oldPlan || !newPlan || !newPlan.active || newPlan.status !== "ACTIVE") {
        throw new CatalogueError(
          "Both plans must exist and the replacement plan must be active.",
          409,
        );
      }
      const newVersion = newPlan.priceVersions[0];
      if (!newVersion) {
        throw new CatalogueError(
          "The replacement plan has no active price for that date.",
          409,
        );
      }

      const affectedPlans = await prisma.studentDaycarePlan.findMany({
        where: {
          planDefinitionId: oldPlanId,
          active: true,
          lifecycleStatus: "ACTIVE",
          enrollmentContractId: { not: null },
          contractServiceId: { not: null },
          effectiveFrom: { lt: effectiveFrom },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }],
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
          enrollmentContract: {
            select: { id: true, contractNumber: true, status: true },
          },
          contractService: {
            select: { id: true, total: true, status: true },
          },
          _count: { select: { sessions: true } },
        },
        orderBy: [{ student: { firstName: "asc" } }, { createdAt: "asc" }],
      });

      if (action === "replace-plan-preview") {
        return NextResponse.json({
          success: true,
          oldPlan: { id: oldPlan.id, name: oldPlan.name },
          newPlan: {
            id: newPlan.id,
            name: newPlan.name,
            price: Number(newVersion.price),
            billingType: newPlan.billingType,
          },
          affectedPlans: serialise(
            affectedPlans.map((plan) => ({
              studentPlanId: plan.id,
              studentId: plan.student.id,
              studentNumber: plan.student.studentNumber,
              studentName: [
                plan.student.firstName,
                plan.student.middleName,
                plan.student.lastName,
              ]
                .filter(Boolean)
                .join(" "),
              contractNumber: plan.enrollmentContract?.contractNumber,
              currentAmount: Number(
                plan.contractService?.total ?? plan.monthlyFeeOverride ?? 0,
              ),
              historicalSessions: plan._count.sessions,
            })),
          ),
        });
      }

      const selected = affectedPlans.filter((plan) =>
        selectedPlanIds.includes(plan.id),
      );
      if (selected.length === 0 || selected.length !== selectedPlanIds.length) {
        throw new CatalogueError(
          "Select at least one eligible child plan from the current preview.",
          409,
        );
      }
      const pricing = calculateChargePricing({
        configuredAmount: Number(newVersion.price),
        gstApplicable: newVersion.gstApplicable,
        gstRate: Number(newVersion.gstRate ?? 0),
        priceType:
          newVersion.priceType === "GST_EXCLUSIVE"
            ? "GST_EXCLUSIVE"
            : "GST_INCLUSIVE",
      });
      const previousEnd = new Date(effectiveFrom.getTime() - 1);

      const replacements = await prisma.$transaction(
        async (transaction) => {
          const created: Array<{ oldPlanId: string; newPlanId: string }> = [];
          for (const current of selected) {
            if (!current.enrollmentContractId || !current.contractServiceId) {
              throw new CatalogueError(
                "A selected plan is no longer linked to an enrollment contract.",
                409,
              );
            }
            const claimed = await transaction.studentDaycarePlan.updateMany({
              where: {
                id: current.id,
                active: true,
                planDefinitionId: oldPlanId,
              },
              data: {
                active: false,
                lifecycleStatus: "INACTIVE",
                effectiveTo: previousEnd,
                billingStoppedAt: effectiveFrom,
              },
            });
            if (claimed.count !== 1) {
              throw new CatalogueError(
                "One child plan changed after preview. Refresh and try again.",
                409,
              );
            }
            await transaction.contractService.update({
              where: { id: current.contractServiceId },
              data: { status: "ENDED", effectiveTo: previousEnd },
            });
            const service = await transaction.contractService.create({
              data: {
                contractId: current.enrollmentContractId,
                serviceType: "DAYCARE",
                category: "DAYCARE_FEE",
                catalogueItemType: "DAYCARE_PLAN",
                catalogueItemId: newPlan.id,
                label: newPlan.name,
                detail: newPlan.description,
                amountSnapshot: pricing.configuredAmount,
                gstApplicable: newVersion.gstApplicable,
                gstRate: newVersion.gstRate,
                gstInclusive: newVersion.priceType !== "GST_EXCLUSIVE",
                taxableValue: pricing.taxableAmount,
                cgst: pricing.cgstAmount,
                sgst: pricing.sgstAmount,
                total: pricing.totalAmount,
                recurring: newPlan.recurring,
                frequency: newPlan.recurring ? "MONTHLY" : "CUSTOM",
                effectiveFrom,
                status: "ACTIVE",
                sourceVersionId: newVersion.id,
                metadata: {
                  replacedPlanId: current.id,
                  previousCataloguePlanId: oldPlanId,
                },
              },
            });
            const replacement = await transaction.studentDaycarePlan.create({
              data: {
                studentId: current.studentId,
                enrollmentContractId: current.enrollmentContractId,
                contractServiceId: service.id,
                planDefinitionId: newPlan.id,
                priceVersionId: newVersion.id,
                mealCombinationId: current.mealCombinationId,
                title: newPlan.name,
                planType:
                  newPlan.billingType === "HOURLY" ||
                  newPlan.billingType === "DAILY"
                    ? "OCCASIONAL"
                    : newPlan.billingType === "MONTHLY"
                      ? current.student.programme === "DAYCARE"
                        ? "MONTHLY_DAYCARE_ONLY"
                        : "MONTHLY_PRESCHOOL_DAYCARE"
                      : "FLEXIBLE_DAYS",
                billingMode:
                  newPlan.billingType === "HOURLY" ? "HOURLY" : "FULL_DAY",
                scheduledWeekdays: current.scheduledWeekdays,
                foodRequired: current.foodRequired,
                foodOption: current.foodOption,
                dailyHours: newPlan.hoursIncluded,
                includedDays:
                  newPlan.billingType === "WEEKLY" ||
                  newPlan.billingType === "CUSTOM"
                    ? newPlan.maximumVisits
                    : null,
                monthlyFeeOverride: newVersion.price,
                monthlyFoodFeeOverride: current.monthlyFoodFeeOverride,
                fullDayFoodIncluded: current.fullDayFoodIncluded,
                effectiveFrom,
                active: true,
                lifecycleStatus: "ACTIVE",
                recurring: newPlan.recurring,
                maximumVisitsOverride: newPlan.maximumVisits,
                separateInvoice: current.separateInvoice,
                notes: current.notes,
              },
            });
            created.push({ oldPlanId: current.id, newPlanId: replacement.id });
          }
          await transaction.activityLog.create({
            data: {
              adminUserId: session!.userId,
              action: "UPDATED",
              entityType: "StudentDaycarePlan",
              entityId: oldPlanId,
              description: `${selected.length} active child plan${selected.length === 1 ? "" : "s"} moved from ${oldPlan.name} to ${newPlan.name}.`,
              previousData: { oldPlanId, oldPlanName: oldPlan.name },
              newData: {
                newPlanId,
                newPlanName: newPlan.name,
                effectiveFrom: effectiveFrom.toISOString(),
                affectedStudentPlanIds: selectedPlanIds,
              },
            },
          });
          return created;
        },
        { isolationLevel: "Serializable" },
      );

      return NextResponse.json({
        success: true,
        message: `${replacements.length} child contract${replacements.length === 1 ? "" : "s"} updated. Historical plans and invoices were preserved.`,
        replacements,
      });
    }
    if (
      action === "catalogue-dependency-check" ||
      action === "catalogue-lifecycle"
    ) {
      if (session?.role !== "OWNER") {
        return NextResponse.json(
          {
            success: false,
            message: "Only the Owner can manage catalogue lifecycles.",
          },
          { status: 403 },
        );
      }
      const entityType = text(body.entityType, 40) as CatalogueEntity;
      const id = text(body.id, 100);
      const allowedEntities: CatalogueEntity[] = [
        "PROGRAMME",
        "DAYCARE_PLAN",
        "MEAL",
        "MEAL_COMBINATION",
        "CHARGE",
      ];
      if (!allowedEntities.includes(entityType) || !id)
        throw new CatalogueError("Choose a valid catalogue item.");
      const name = await catalogueName(entityType, id);
      if (!name) throw new CatalogueError("Catalogue item not found.", 404);
      const dependencies = await catalogueDependencies(entityType, id);
      if (action === "catalogue-dependency-check")
        return NextResponse.json({
          success: true,
          name,
          dependencies,
          totalDependencies: dependencyTotal(dependencies),
          recommendation: dependencyTotal(dependencies)
            ? "ARCHIVE"
            : "PERMANENT_DELETE_AVAILABLE",
        });
      const operation = text(body.operation, 30).toUpperCase();
      const reason = text(body.reason, 500);
      const statusByOperation = {
        ACTIVATE: "ACTIVE",
        DEACTIVATE: "INACTIVE",
        ARCHIVE: "ARCHIVED",
        DELETE: "DELETED",
      } as const;
      if (operation === "PERMANENT_DELETE") {
        if (text(body.confirmation, 40) !== "PERMANENT DELETE")
          throw new CatalogueError(
            "Type PERMANENT DELETE to confirm this irreversible action.",
          );
        if (reason.length < 8)
          throw new CatalogueError(
            "Enter a clear reason for permanent deletion.",
          );
        if (dependencyTotal(dependencies) > 0)
          throw new CatalogueError(
            `This item has ${dependencyTotal(dependencies)} dependent or historical records. Archive it to preserve billing history.`,
            409,
          );
        await prisma.$transaction(async (transaction) => {
          await transaction.activityLog.create({
            data: {
              adminUserId: session!.userId,
              action: "DELETED",
              entityType: `BillingCatalogue:${entityType}`,
              entityId: id,
              description: `${name} was permanently deleted by the Owner.`,
              previousData: { name },
              newData: {
                permanent: true,
                reason,
                affectedRecords: dependencies,
              },
            },
          });
          if (entityType === "PROGRAMME")
            await transaction.programmeDefinition.delete({ where: { id } });
          else if (entityType === "DAYCARE_PLAN")
            await transaction.daycarePlanDefinition.delete({ where: { id } });
          else if (entityType === "MEAL")
            await transaction.mealDefinition.delete({ where: { id } });
          else if (entityType === "MEAL_COMBINATION")
            await transaction.mealCombination.delete({ where: { id } });
          else await transaction.chargeDefinition.delete({ where: { id } });
        });
      } else {
        const status =
          statusByOperation[operation as keyof typeof statusByOperation];
        if (!status)
          throw new CatalogueError(
            "Choose Activate, Deactivate, Archive, Delete or Permanent Delete.",
          );
        if (["ARCHIVE", "DELETE"].includes(operation) && reason.length < 4)
          throw new CatalogueError(
            "Enter a reason so the audit history is clear.",
          );
        await prisma.$transaction(async (transaction) => {
          if (entityType === "PROGRAMME")
            await transaction.programmeDefinition.update({
              where: { id },
              data: { status },
            });
          else if (entityType === "DAYCARE_PLAN")
            await transaction.daycarePlanDefinition.update({
              where: { id },
              data: { status, active: status === "ACTIVE" },
            });
          else if (entityType === "MEAL")
            await transaction.mealDefinition.update({
              where: { id },
              data: { status },
            });
          else if (entityType === "MEAL_COMBINATION")
            await transaction.mealCombination.update({
              where: { id },
              data: { status },
            });
          else
            await transaction.chargeDefinition.update({
              where: { id },
              data: { status, active: status === "ACTIVE" },
            });
          await transaction.activityLog.create({
            data: {
              adminUserId: session!.userId,
              action: "UPDATED",
              entityType: `BillingCatalogue:${entityType}`,
              entityId: id,
              description: `${name} was marked ${status.toLowerCase()}.`,
              newData: {
                status,
                reason: reason || null,
                affectedRecords: dependencies,
              },
            },
          });
        });
      }
    } else if (action === "save-programme") {
      const id = text(body.id, 100) || null;
      const name = text(body.name, 120);
      const code = codeValue(body.code || name);
      const effectiveFrom = dateValue(body.effectiveFrom);
      const admissionFee = numberValue(body.admissionFee);
      const annualFee = numberValue(body.annualFee);
      const kitFee = numberValue(body.kitFee);
      const combineAnnualAndKit = booleanValue(body.combineAnnualAndKit);
      const monthlyFee = numberValue(body.monthlyFee);
      const ageMinimumMonths = optionalNumber(body.ageMinimumMonths);
      const ageMaximumMonths = optionalNumber(body.ageMaximumMonths);
      const capacity = optionalNumber(body.capacity, 1);
      const admissionTax = gstConfiguration(body, "admission");
      const annualTax = gstConfiguration(body, "annual");
      const kitTax = gstConfiguration(body, "kit");
      const monthlyTax = gstConfiguration(body, "monthly");

      if (
        !name ||
        !effectiveFrom ||
        [admissionFee, annualFee, kitFee, monthlyFee].some(
          (value) => Number.isNaN(value) || value < 0,
        )
      ) {
        throw new CatalogueError(
          "Enter the programme name, effective date and valid fees.",
        );
      }
      if (
        ageMinimumMonths != null &&
        ageMaximumMonths != null &&
        ageMaximumMonths < ageMinimumMonths
      ) {
        throw new CatalogueError(
          "Maximum age cannot be lower than minimum age.",
        );
      }
      const feeData = {
        admissionFee,
        annualFee,
        kitFee,
        combineAnnualAndKit,
        monthlyFee,
        gstApplicable: monthlyTax.applicable,
        gstRate: monthlyTax.applicable ? monthlyTax.rate : null,
        admissionGstApplicable: admissionTax.applicable,
        admissionGstRate: admissionTax.applicable ? admissionTax.rate : null,
        admissionPriceType: admissionTax.priceType,
        annualGstApplicable: annualTax.applicable,
        annualGstRate: annualTax.applicable ? annualTax.rate : null,
        annualPriceType: annualTax.priceType,
        kitGstApplicable: kitTax.applicable,
        kitGstRate: kitTax.applicable ? kitTax.rate : null,
        kitPriceType: kitTax.priceType,
        monthlyGstApplicable: monthlyTax.applicable,
        monthlyGstRate: monthlyTax.applicable ? monthlyTax.rate : null,
        monthlyPriceType: monthlyTax.priceType,
        active: true,
      } satisfies Prisma.ProgrammeFeeVersionUncheckedUpdateInput;

      await prisma.$transaction(
        async (tx) => {
          const programme = id
            ? await tx.programmeDefinition.update({
                where: { id },
                data: {
                  code,
                  name,
                  description: optionalText(body.description, 2000),
                  ageMinimumMonths:
                    ageMinimumMonths == null
                      ? null
                      : Math.trunc(ageMinimumMonths),
                  ageMaximumMonths:
                    ageMaximumMonths == null
                      ? null
                      : Math.trunc(ageMaximumMonths),
                  colour: text(body.colour, 20) || "#5B2A86",
                  capacity: capacity == null ? null : Math.trunc(capacity),
                  status: booleanValue(body.active) ? "ACTIVE" : "INACTIVE",
                  displayOrder: Math.trunc(numberValue(body.displayOrder) || 0),
                },
              })
            : await tx.programmeDefinition.create({
                data: {
                  code,
                  name,
                  description: optionalText(body.description, 2000),
                  ageMinimumMonths:
                    ageMinimumMonths == null
                      ? null
                      : Math.trunc(ageMinimumMonths),
                  ageMaximumMonths:
                    ageMaximumMonths == null
                      ? null
                      : Math.trunc(ageMaximumMonths),
                  colour: text(body.colour, 20) || "#5B2A86",
                  capacity: capacity == null ? null : Math.trunc(capacity),
                  status: booleanValue(body.active) ? "ACTIVE" : "INACTIVE",
                  displayOrder: Math.trunc(numberValue(body.displayOrder) || 0),
                },
              });

          const sameDate = await tx.programmeFeeVersion.findFirst({
            where: { programmeId: programme.id, effectiveFrom },
          });
          if (sameDate) {
            await tx.programmeFeeVersion.update({
              where: { id: sameDate.id },
              data: feeData,
            });
          } else {
            const nextVersion = await tx.programmeFeeVersion.findFirst({
              where: {
                programmeId: programme.id,
                effectiveFrom: { gt: effectiveFrom },
              },
              orderBy: { effectiveFrom: "asc" },
              select: { effectiveFrom: true },
            });
            await tx.programmeFeeVersion.updateMany({
              where: {
                programmeId: programme.id,
                active: true,
                effectiveFrom: { lt: effectiveFrom },
                OR: [
                  { effectiveTo: null },
                  { effectiveTo: { gte: effectiveFrom } },
                ],
              },
              data: { effectiveTo: new Date(effectiveFrom.getTime() - 1) },
            });
            await tx.programmeFeeVersion.create({
              data: {
                programmeId: programme.id,
                ...feeData,
                effectiveFrom,
                effectiveTo: nextVersion
                  ? new Date(nextVersion.effectiveFrom.getTime() - 1)
                  : null,
              },
            });
          }
          await tx.activityLog.create({
            data: {
              adminUserId: session!.userId,
              action: id ? "UPDATED" : "CREATED",
              entityType: "ProgrammeDefinition",
              entityId: programme.id,
              description: `${name} and its effective fee version were saved.`,
            },
          });
        },
        { isolationLevel: "Serializable" },
      );
    } else if (action === "save-daycare-plan") {
      const id = text(body.id, 100) || null;
      const name = text(body.name, 120);
      const code = codeValue(body.code || name);
      const billingType = text(body.billingType, 30);
      const effectiveFrom = dateValue(body.effectiveFrom);
      const price = numberValue(body.price);
      const hoursIncluded = optionalNumber(body.hoursIncluded);
      const maximumVisits = optionalNumber(body.maximumVisits, 1);
      const gstApplicable = booleanValue(body.gstApplicable);
      const gstRate = gstApplicable ? numberValue(body.gstRate) : 0;
      const priceType = priceTypeValue(body.priceType);
      const mealRule = text(body.mealRule, 30) || "OPTIONAL";
      if (
        !name ||
        !effectiveFrom ||
        Number.isNaN(price) ||
        !["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(
          billingType,
        )
      ) {
        throw new CatalogueError(
          "Enter the daycare plan name, billing type, price and effective date.",
        );
      }
      if (
        !["NOT_AVAILABLE", "OPTIONAL", "REQUIRED", "INCLUDED"].includes(
          mealRule,
        )
      )
        throw new CatalogueError("Choose a valid meal rule.");
      if (gstApplicable && (Number.isNaN(gstRate) || gstRate > 100))
        throw new CatalogueError("Enter a valid GST rate.");

      await prisma.$transaction(
        async (tx) => {
          const planData = {
            code,
            name,
            description: optionalText(body.description, 2000),
            billingType: billingType as
              "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM",
            hoursIncluded,
            timeWindowStart: optionalText(body.timeWindowStart, 10),
            timeWindowEnd: optionalText(body.timeWindowEnd, 10),
            mealRule: mealRule as
              "NOT_AVAILABLE" | "OPTIONAL" | "REQUIRED" | "INCLUDED",
            recurring: booleanValue(body.recurring),
            maximumVisits:
              maximumVisits == null ? null : Math.trunc(maximumVisits),
            allowConcurrent: booleanValue(body.allowConcurrent),
            active: booleanValue(body.active),
            status: booleanValue(body.active)
              ? ("ACTIVE" as const)
              : ("INACTIVE" as const),
            displayOrder: Math.trunc(numberValue(body.displayOrder) || 0),
          } satisfies Prisma.DaycarePlanDefinitionUncheckedCreateInput;
          const plan = id
            ? await tx.daycarePlanDefinition.update({
                where: { id },
                data: planData,
              })
            : await tx.daycarePlanDefinition.create({ data: planData });
          const sameDate = await tx.daycarePlanPriceVersion.findFirst({
            where: { planId: plan.id, effectiveFrom },
          });
          if (sameDate) {
            await tx.daycarePlanPriceVersion.update({
              where: { id: sameDate.id },
              data: {
                price,
                gstApplicable,
                gstRate: gstApplicable ? gstRate : null,
                priceType,
                active: true,
              },
            });
          } else {
            const nextVersion = await tx.daycarePlanPriceVersion.findFirst({
              where: { planId: plan.id, effectiveFrom: { gt: effectiveFrom } },
              orderBy: { effectiveFrom: "asc" },
              select: { effectiveFrom: true },
            });
            await tx.daycarePlanPriceVersion.updateMany({
              where: {
                planId: plan.id,
                active: true,
                effectiveFrom: { lt: effectiveFrom },
                OR: [
                  { effectiveTo: null },
                  { effectiveTo: { gte: effectiveFrom } },
                ],
              },
              data: { effectiveTo: new Date(effectiveFrom.getTime() - 1) },
            });
            await tx.daycarePlanPriceVersion.create({
              data: {
                planId: plan.id,
                price,
                gstApplicable,
                gstRate: gstApplicable ? gstRate : null,
                priceType,
                effectiveFrom,
                effectiveTo: nextVersion
                  ? new Date(nextVersion.effectiveFrom.getTime() - 1)
                  : null,
              },
            });
          }
          await tx.activityLog.create({
            data: {
              adminUserId: session!.userId,
              action: id ? "UPDATED" : "CREATED",
              entityType: "DaycarePlanDefinition",
              entityId: plan.id,
              description: `${name} and its effective price version were saved.`,
            },
          });
        },
        { isolationLevel: "Serializable" },
      );
    } else if (action === "save-meal") {
      const id = text(body.id, 100) || null;
      const name = text(body.name, 120);
      const code = codeValue(body.code || name);
      const effectiveFrom = dateValue(body.effectiveFrom);
      const price = numberValue(body.price);
      const gstApplicable = booleanValue(body.gstApplicable);
      const gstRate = gstApplicable ? numberValue(body.gstRate) : 0;
      const priceType = priceTypeValue(body.priceType);
      if (!name || !effectiveFrom || Number.isNaN(price))
        throw new CatalogueError(
          "Enter the meal name, price and effective date.",
        );
      if (gstApplicable && (Number.isNaN(gstRate) || gstRate > 100))
        throw new CatalogueError("Enter a valid GST rate.");

      await prisma.$transaction(
        async (tx) => {
          const mealData = {
            code,
            name,
            description: optionalText(body.description, 2000),
            status: booleanValue(body.active)
              ? ("ACTIVE" as const)
              : ("INACTIVE" as const),
            displayOrder: Math.trunc(numberValue(body.displayOrder) || 0),
          };
          const meal = id
            ? await tx.mealDefinition.update({ where: { id }, data: mealData })
            : await tx.mealDefinition.create({ data: mealData });
          const sameDate = await tx.mealPriceVersion.findFirst({
            where: { mealId: meal.id, effectiveFrom },
          });
          if (sameDate)
            await tx.mealPriceVersion.update({
              where: { id: sameDate.id },
              data: {
                price,
                gstApplicable,
                gstRate: gstApplicable ? gstRate : null,
                priceType,
                active: true,
              },
            });
          else {
            const nextVersion = await tx.mealPriceVersion.findFirst({
              where: { mealId: meal.id, effectiveFrom: { gt: effectiveFrom } },
              orderBy: { effectiveFrom: "asc" },
              select: { effectiveFrom: true },
            });
            await tx.mealPriceVersion.updateMany({
              where: {
                mealId: meal.id,
                active: true,
                effectiveFrom: { lt: effectiveFrom },
                OR: [
                  { effectiveTo: null },
                  { effectiveTo: { gte: effectiveFrom } },
                ],
              },
              data: { effectiveTo: new Date(effectiveFrom.getTime() - 1) },
            });
            await tx.mealPriceVersion.create({
              data: {
                mealId: meal.id,
                price,
                gstApplicable,
                gstRate: gstApplicable ? gstRate : null,
                priceType,
                effectiveFrom,
                effectiveTo: nextVersion
                  ? new Date(nextVersion.effectiveFrom.getTime() - 1)
                  : null,
              },
            });
          }
          await tx.activityLog.create({
            data: {
              adminUserId: session!.userId,
              action: id ? "UPDATED" : "CREATED",
              entityType: "MealDefinition",
              entityId: meal.id,
              description: `${name} and its effective price version were saved.`,
            },
          });
        },
        { isolationLevel: "Serializable" },
      );
    } else if (action === "save-meal-combination") {
      const id = text(body.id, 100) || null;
      const name = text(body.name, 120);
      const code = codeValue(body.code || name);
      const effectiveFrom = dateValue(body.effectiveFrom);
      const price = numberValue(body.price);
      const mealIds = Array.isArray(body.mealIds)
        ? [
            ...new Set(
              body.mealIds.map((value) => text(value, 100)).filter(Boolean),
            ),
          ]
        : [];
      const gstApplicable = booleanValue(body.gstApplicable);
      const gstRate = gstApplicable ? numberValue(body.gstRate) : 0;
      const priceType = priceTypeValue(body.priceType);
      if (
        !name ||
        !effectiveFrom ||
        Number.isNaN(price) ||
        mealIds.length === 0
      )
        throw new CatalogueError(
          "Enter the combination name, price, effective date and at least one meal.",
        );
      if (gstApplicable && (Number.isNaN(gstRate) || gstRate > 100))
        throw new CatalogueError("Enter a valid GST rate.");

      await prisma.$transaction(
        async (tx) => {
          const comboData = {
            code,
            name,
            description: optionalText(body.description, 2000),
            status: booleanValue(body.active)
              ? ("ACTIVE" as const)
              : ("INACTIVE" as const),
            displayOrder: Math.trunc(numberValue(body.displayOrder) || 0),
          };
          const combination = id
            ? await tx.mealCombination.update({
                where: { id },
                data: comboData,
              })
            : await tx.mealCombination.create({ data: comboData });
          const validMealCount = await tx.mealDefinition.count({
            where: { id: { in: mealIds } },
          });
          if (validMealCount !== mealIds.length)
            throw new CatalogueError(
              "One selected meal no longer exists.",
              409,
            );
          await tx.mealCombinationItem.deleteMany({
            where: { combinationId: combination.id },
          });
          await tx.mealCombinationItem.createMany({
            data: mealIds.map((mealId, index) => ({
              id: `${combination.id}-${index}-${mealId}`,
              combinationId: combination.id,
              mealId,
              quantity: 1,
            })),
          });
          const sameDate = await tx.mealCombinationPriceVersion.findFirst({
            where: { combinationId: combination.id, effectiveFrom },
          });
          if (sameDate)
            await tx.mealCombinationPriceVersion.update({
              where: { id: sameDate.id },
              data: {
                price,
                gstApplicable,
                gstRate: gstApplicable ? gstRate : null,
                priceType,
                active: true,
              },
            });
          else {
            const nextVersion = await tx.mealCombinationPriceVersion.findFirst({
              where: {
                combinationId: combination.id,
                effectiveFrom: { gt: effectiveFrom },
              },
              orderBy: { effectiveFrom: "asc" },
              select: { effectiveFrom: true },
            });
            await tx.mealCombinationPriceVersion.updateMany({
              where: {
                combinationId: combination.id,
                active: true,
                effectiveFrom: { lt: effectiveFrom },
                OR: [
                  { effectiveTo: null },
                  { effectiveTo: { gte: effectiveFrom } },
                ],
              },
              data: { effectiveTo: new Date(effectiveFrom.getTime() - 1) },
            });
            await tx.mealCombinationPriceVersion.create({
              data: {
                combinationId: combination.id,
                price,
                gstApplicable,
                gstRate: gstApplicable ? gstRate : null,
                priceType,
                effectiveFrom,
                effectiveTo: nextVersion
                  ? new Date(nextVersion.effectiveFrom.getTime() - 1)
                  : null,
              },
            });
          }
          await tx.activityLog.create({
            data: {
              adminUserId: session!.userId,
              action: id ? "UPDATED" : "CREATED",
              entityType: "MealCombination",
              entityId: combination.id,
              description: `${name} and its effective price version were saved.`,
            },
          });
        },
        { isolationLevel: "Serializable" },
      );
    } else if (action === "save-charge-definition") {
      const id = text(body.id, 100) || null;
      const name = text(body.name, 120);
      const code = codeValue(body.code || name);
      const category = text(body.category, 50);
      const defaultAmount = optionalNumber(body.defaultAmount);
      const gstApplicable = booleanValue(body.gstApplicable);
      const gstRate = gstApplicable ? numberValue(body.gstRate) : 0;
      const priceType = priceTypeValue(body.priceType);
      const allowedCategories = [
        "ANNUAL_FEE",
        "ACTIVITY_FEE",
        "KIT_FEE",
        "FOOD_FEE",
        "DAYCARE_FEE",
        "OTHER",
      ] as const;
      if (
        !name ||
        !allowedCategories.includes(
          category as (typeof allowedCategories)[number],
        )
      ) {
        throw new CatalogueError(
          "Enter the charge name and choose a valid charge category.",
        );
      }
      if (defaultAmount != null && Number.isNaN(defaultAmount)) {
        throw new CatalogueError("Enter a valid default charge amount.");
      }
      if (gstApplicable && (Number.isNaN(gstRate) || gstRate > 100)) {
        throw new CatalogueError("Enter a valid GST rate.");
      }
      await prisma.$transaction(async (tx) => {
        const data = {
          code,
          name,
          description: optionalText(body.description, 2000),
          category: category as (typeof allowedCategories)[number],
          defaultAmount,
          gstApplicable,
          gstRate: gstApplicable ? gstRate : null,
          priceType,
          active: booleanValue(body.active),
          status: booleanValue(body.active)
            ? ("ACTIVE" as const)
            : ("INACTIVE" as const),
          displayOrder: Math.trunc(numberValue(body.displayOrder) || 0),
        };
        const definition = id
          ? await tx.chargeDefinition.update({ where: { id }, data })
          : await tx.chargeDefinition.create({ data });
        await tx.activityLog.create({
          data: {
            adminUserId: session!.userId,
            action: id ? "UPDATED" : "CREATED",
            entityType: "ChargeDefinition",
            entityId: definition.id,
            description: `${name} charge type was ${id ? "updated" : "created"}.`,
            newData: {
              category,
              defaultAmount,
              gstApplicable,
              gstRate: gstApplicable ? gstRate : null,
              active: definition.active,
            },
          },
        });
      });
    } else if (action === "save-settings") {
      const dueDay = Math.trunc(numberValue(body.dueDay, 1));
      const academicYearStartMonth = Math.trunc(
        numberValue(body.academicYearStartMonth, 1),
      );
      const academicChargePolicy =
        text(body.academicChargePolicy, 30) || "ACADEMIC_SESSION";
      const defaultInvoiceMode = text(body.defaultInvoiceMode, 30);
      const additionalDaycareDisplayMode =
        text(body.additionalDaycareDisplayMode, 30) || "DETAILED";
      const daycareCapacity = optionalNumber(body.daycareCapacity, 1);
      if (
        dueDay > 31 ||
        academicYearStartMonth > 12 ||
        !["ACADEMIC_SESSION", "ROLLING_12_MONTHS", "MANUAL_ONLY"].includes(
          academicChargePolicy,
        ) ||
        !["COMBINED", "SPLIT_DAYCARE"].includes(defaultInvoiceMode) ||
        !["DETAILED", "MERGED", "HIDDEN_DETAIL"].includes(
          additionalDaycareDisplayMode,
        )
      ) {
        throw new CatalogueError("Enter valid billing settings.");
      }
      const settings = {
        dueDay,
        invoicePrefix: text(body.invoicePrefix, 30) || "KZ-INV",
        receiptPrefix: text(body.receiptPrefix, 30) || "KZ-RCP",
        paymentTerms: text(body.paymentTerms, 1000),
        academicYearStartMonth,
        academicChargePolicy,
        defaultInvoiceMode,
        additionalDaycareDisplayMode,
        automaticMonthlyBilling: booleanValue(body.automaticMonthlyBilling),
        daycareCapacity:
          daycareCapacity == null ? null : Math.trunc(daycareCapacity),
      };
      await prisma.$transaction(async (tx) => {
        await tx.centreSetting.upsert({
          where: { key: "BILLING_ENGINE" },
          create: {
            key: "BILLING_ENGINE",
            value: settings,
            description:
              "Owner-managed billing, invoice and recurring billing settings.",
          },
          update: { value: settings },
        });
        await tx.numberSequence.upsert({
          where: { key: "INVOICE" },
          create: {
            key: "INVOICE",
            prefix: settings.invoicePrefix,
            minimumWidth: 2,
          },
          update: { prefix: settings.invoicePrefix },
        });
        await tx.numberSequence.upsert({
          where: { key: "RECEIPT" },
          create: {
            key: "RECEIPT",
            prefix: settings.receiptPrefix,
            minimumWidth: 2,
          },
          update: { prefix: settings.receiptPrefix },
        });
        await tx.activityLog.create({
          data: {
            adminUserId: session!.userId,
            action: "UPDATED",
            entityType: "CentreSetting",
            entityId: "BILLING_ENGINE",
            description:
              "Billing, recurring invoice and receipt settings were updated.",
          },
        });
      });
    } else {
      throw new CatalogueError("Choose a valid billing catalogue action.");
    }

    return NextResponse.json({
      success: true,
      message: "Billing catalogue saved.",
      ...(await getCatalogue()),
    });
  } catch (error) {
    if (error instanceof CatalogueError)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, message: "That catalogue code is already in use." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message:
          "The billing catalogue could not be saved. Check the server terminal.",
      },
      { status: 500 },
    );
  }
}
