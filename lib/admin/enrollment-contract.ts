import { createHash } from "node:crypto";

import type { $Enums, Prisma } from "@/generated/prisma/client";
import { calculateChargePricing } from "@/lib/admin/charge-pricing";
import { getNextSequence } from "@/lib/numbering";

type TransactionClient = Prisma.TransactionClient;

export type EnrollmentDaycareSelection = {
  planDefinitionId: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  scheduledWeekdays: number[];
};

export type EnrollmentOtherCharge = {
  definitionId: string;
};

export type EnrollmentContractSelection = {
  academicSession: string;
  preschoolEnabled: boolean;
  preschoolProgrammeId: string | null;
  daycareSelections: EnrollmentDaycareSelection[];
  mealCombinationId: string | null;
  includeAdmissionFee: boolean;
  includeAnnualFee: boolean;
  includeKitFee: boolean;
  annualKitSkipReason: string | null;
  otherCharges: EnrollmentOtherCharge[];
  approvedDiscount: number;
  billingDay: number;
  dueDay: number;
};

type LineDraft = {
  serviceType: $Enums.ContractServiceType;
  category: $Enums.FeeCategory;
  catalogueItemType: string;
  catalogueItemId: string;
  label: string;
  detail: string | null;
  amount: number;
  discount: number;
  gstApplicable: boolean;
  gstRate: number;
  priceType: "GST_INCLUSIVE" | "GST_EXCLUSIVE";
  recurring: boolean;
  frequency: $Enums.ContractServiceFrequency;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  sourceVersionId: string | null;
  metadata?: Prisma.InputJsonValue;
  status?: $Enums.ContractServiceStatus;
  skipReason?: string | null;
};

function cleanIdentityText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function cleanIdentityPhone(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "").slice(-10);
}

export function createStudentIdentityFingerprint(input: {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  dateOfBirth: Date;
  guardianPhone: string;
}) {
  const name = cleanIdentityText(
    [input.firstName, input.middleName, input.lastName].filter(Boolean).join(" "),
  );
  const date = input.dateOfBirth.toISOString().slice(0, 10);
  const phone = cleanIdentityPhone(input.guardianPhone);
  return createHash("sha256").update(`${name}|${date}|${phone}`).digest("hex");
}

export async function findPossibleDuplicateStudent(
  input: {
    firstName: string;
    middleName?: string | null;
    lastName?: string | null;
    dateOfBirth: Date;
    guardianPhone: string;
    guardianEmail?: string | null;
  },
) {
  const fingerprint = createStudentIdentityFingerprint(input);
  const phoneDigits = cleanIdentityPhone(input.guardianPhone);
  const email = input.guardianEmail?.trim().toLowerCase() || null;
  const possible = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.student.findFirst({
      where: {
        OR: [
          { identityFingerprint: fingerprint },
          {
            firstName: { equals: input.firstName.trim(), mode: "insensitive" },
            dateOfBirth: input.dateOfBirth,
            guardians: {
              some: {
                OR: [
                  { phone: { endsWith: phoneDigits } },
                  ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []),
                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        studentNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        status: true,
        createdAt: true,
        programmeDefinition: { select: { name: true } },
        guardians: {
          where: { isPrimary: true },
          take: 1,
          select: { name: true, phone: true },
        },
      },
    }),
  );
  return { fingerprint, possible };
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(date);
}

function dueDateFor(joiningDate: Date, dueDay: number) {
  const lastDay = new Date(joiningDate.getFullYear(), joiningDate.getMonth() + 1, 0).getDate();
  return new Date(joiningDate.getFullYear(), joiningDate.getMonth(), Math.min(lastDay, dueDay), 12);
}

function daycarePlanType(
  preschoolEnabled: boolean,
  billingType: $Enums.ConfigurableDaycareBillingType,
): $Enums.DaycarePlanType {
  if (billingType === "HOURLY" || billingType === "DAILY") return "OCCASIONAL";
  if (billingType === "WEEKLY" || billingType === "CUSTOM") return "FLEXIBLE_DAYS";
  return preschoolEnabled ? "MONTHLY_PRESCHOOL_DAYCARE" : "MONTHLY_DAYCARE_ONLY";
}

function daycareBillingMode(
  billingType: $Enums.ConfigurableDaycareBillingType,
): $Enums.DaycareBillingMode {
  return billingType === "HOURLY" ? "HOURLY" : "FULL_DAY";
}

function pricedLine(draft: LineDraft) {
  const grossPricing = calculateChargePricing({
    configuredAmount: draft.amount,
    gstApplicable: draft.gstApplicable,
    gstRate: draft.gstRate,
    priceType: draft.priceType,
  });
  const targetTotal = Math.max(0, grossPricing.totalAmount - draft.discount);
  const netAmount =
    draft.gstApplicable &&
    draft.priceType === "GST_EXCLUSIVE" &&
    draft.gstRate > 0
      ? Math.round((targetTotal / (1 + draft.gstRate / 100)) * 100) / 100
      : targetTotal;
  const pricing = calculateChargePricing({
    configuredAmount: netAmount,
    gstApplicable: draft.gstApplicable,
    gstRate: draft.gstRate,
    priceType: draft.priceType,
  });
  return { draft, pricing };
}

export async function createEnrollmentContractAndDraftInvoice(
  transaction: TransactionClient,
  input: {
    studentId: string;
    studentNumber: string;
    admissionId: string;
    enquiryId: string | null;
    programmeClass: string | null;
    joiningDate: Date;
    documentsComplete: boolean;
    createdById: string;
    selection: EnrollmentContractSelection;
  },
) {
  const selection = input.selection;
  const referenceDate = input.joiningDate;
  const programme = selection.preschoolEnabled && selection.preschoolProgrammeId
    ? await transaction.programmeDefinition.findFirst({
        where: { id: selection.preschoolProgrammeId, status: "ACTIVE" },
        include: {
          feeVersions: {
            where: {
              active: true,
              effectiveFrom: { lte: referenceDate },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: referenceDate } }],
            },
            orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
            take: 1,
          },
        },
      })
    : null;
  if (selection.preschoolEnabled && (!programme || !programme.feeVersions[0])) {
    throw new Error("The selected preschool programme does not have an active fee version for the joining date.");
  }

  const requestedPlanIds = [...new Set(selection.daycareSelections.map((item) => item.planDefinitionId))];
  const daycareDefinitions = requestedPlanIds.length
    ? await transaction.daycarePlanDefinition.findMany({
        where: { id: { in: requestedPlanIds }, active: true, status: "ACTIVE" },
        include: {
          priceVersions: {
            where: {
              active: true,
              effectiveFrom: { lte: referenceDate },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: referenceDate } }],
            },
            orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
          },
        },
      })
    : [];
  if (daycareDefinitions.length !== requestedPlanIds.length || daycareDefinitions.some((plan) => !plan.priceVersions[0])) {
    throw new Error("One or more selected daycare plans do not have an active price for the joining date.");
  }

  const mealCombination = selection.mealCombinationId
    ? await transaction.mealCombination.findFirst({
        where: { id: selection.mealCombinationId, status: "ACTIVE" },
        include: {
          priceVersions: {
            where: {
              active: true,
              effectiveFrom: { lte: referenceDate },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: referenceDate } }],
            },
            orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
            take: 1,
          },
        },
      })
    : null;
  if (selection.mealCombinationId && (!mealCombination || !mealCombination.priceVersions[0])) {
    throw new Error("The selected meal plan does not have an active price for the joining date.");
  }

  const otherDefinitions = selection.otherCharges.length
    ? await transaction.chargeDefinition.findMany({
        where: {
          id: { in: [...new Set(selection.otherCharges.map((item) => item.definitionId))] },
          active: true,
          status: "ACTIVE",
        },
      })
    : [];
  if (otherDefinitions.length !== new Set(selection.otherCharges.map((item) => item.definitionId)).size) {
    throw new Error("One or more selected other charges are no longer active.");
  }

  const fee = programme?.feeVersions[0] ?? null;
  const lines: LineDraft[] = [];
  const addProgrammeLine = (
    serviceType: $Enums.ContractServiceType,
    category: $Enums.FeeCategory,
    label: string,
    amount: number,
    component: "monthly" | "admission" | "annual" | "kit",
    recurring: boolean,
  ) => {
    if (!fee || amount <= 0) return;
    const applicable = fee[`${component}GstApplicable`];
    lines.push({
      serviceType,
      category,
      catalogueItemType: "PROGRAMME",
      catalogueItemId: programme!.id,
      label,
      detail: selection.academicSession,
      amount,
      discount: 0,
      gstApplicable: applicable,
      gstRate: applicable ? Number(fee[`${component}GstRate`] ?? 0) : 0,
      priceType: fee[`${component}PriceType`],
      recurring,
      frequency: recurring ? "MONTHLY" : "ONE_TIME",
      effectiveFrom: referenceDate,
      effectiveTo: null,
      sourceVersionId: fee.id,
      metadata: { academicSession: selection.academicSession },
    });
  };
  if (programme && fee) {
    addProgrammeLine("PRESCHOOL", "MONTHLY_PRESCHOOL_FEE", `${programme.name} monthly fee`, Number(fee.monthlyFee), "monthly", true);
    if (selection.includeAdmissionFee) addProgrammeLine("ADMISSION", "ADMISSION_FEE", `${programme.name} admission fee`, Number(fee.admissionFee), "admission", false);
    if (selection.includeAnnualFee) addProgrammeLine("ANNUAL", "ANNUAL_FEE", `${programme.name} annual fee`, Number(fee.annualFee), "annual", false);
    if (selection.includeKitFee) addProgrammeLine("KIT", "KIT_FEE", `${programme.name} kit fee`, Number(fee.kitFee), "kit", false);
  }
  if (selection.annualKitSkipReason && !selection.includeAnnualFee && !selection.includeKitFee) {
    lines.push({
      serviceType: "ANNUAL",
      category: "ANNUAL_FEE",
      catalogueItemType: "PROGRAMME",
      catalogueItemId: programme?.id ?? "NONE",
      label: "Annual / kit charge skipped",
      detail: selection.academicSession,
      amount: 0,
      discount: 0,
      gstApplicable: false,
      gstRate: 0,
      priceType: "GST_INCLUSIVE",
      recurring: false,
      frequency: "ONE_TIME",
      effectiveFrom: referenceDate,
      effectiveTo: null,
      sourceVersionId: fee?.id ?? null,
      status: "WAIVED",
      skipReason: selection.annualKitSkipReason,
      metadata: { academicSession: selection.academicSession },
    });
  }

  for (const requested of selection.daycareSelections) {
    const definition = daycareDefinitions.find((item) => item.id === requested.planDefinitionId)!;
    const price = definition.priceVersions[0];
    lines.push({
      serviceType: "DAYCARE",
      category: "DAYCARE_FEE",
      catalogueItemType: "DAYCARE_PLAN",
      catalogueItemId: definition.id,
      label: definition.name,
      detail: definition.description,
      amount: Number(price.price),
      discount: 0,
      gstApplicable: price.gstApplicable,
      gstRate: Number(price.gstRate ?? 0),
      priceType: price.priceType,
      recurring: definition.recurring,
      frequency: definition.recurring ? "MONTHLY" : "CUSTOM",
      effectiveFrom: requested.effectiveFrom,
      effectiveTo: requested.effectiveTo,
      sourceVersionId: price.id,
      metadata: {
        billingType: definition.billingType,
        hoursIncluded: definition.hoursIncluded ? Number(definition.hoursIncluded) : null,
        maximumVisits: definition.maximumVisits,
        scheduledWeekdays: requested.scheduledWeekdays,
      },
    });
  }
  if (mealCombination) {
    const price = mealCombination.priceVersions[0];
    lines.push({
      serviceType: "MEAL",
      category: "FOOD_FEE",
      catalogueItemType: "MEAL_COMBINATION",
      catalogueItemId: mealCombination.id,
      label: mealCombination.name,
      detail: mealCombination.description,
      amount: Number(price.price),
      discount: 0,
      gstApplicable: price.gstApplicable,
      gstRate: Number(price.gstRate ?? 0),
      priceType: price.priceType,
      recurring: true,
      frequency: "MONTHLY",
      effectiveFrom: referenceDate,
      effectiveTo: null,
      sourceVersionId: price.id,
    });
  }
  for (const definition of otherDefinitions) {
    if (Number(definition.defaultAmount ?? 0) <= 0) continue;
    lines.push({
      serviceType: "OTHER",
      category: definition.category,
      catalogueItemType: "CHARGE_DEFINITION",
      catalogueItemId: definition.id,
      label: definition.name,
      detail: definition.description,
      amount: Number(definition.defaultAmount),
      discount: 0,
      gstApplicable: definition.gstApplicable,
      gstRate: Number(definition.gstRate ?? 0),
      priceType: definition.priceType,
      recurring: false,
      frequency: "ONE_TIME",
      effectiveFrom: referenceDate,
      effectiveTo: null,
      sourceVersionId: null,
    });
  }

  const discountableLines = lines.filter(
    (line) => line.status !== "WAIVED" && line.amount > 0,
  );
  const grossContractTotal = discountableLines.reduce(
    (sum, line) =>
      sum + pricedLine({ ...line, discount: 0 }).pricing.totalAmount,
    0,
  );
  const approvedDiscount = Math.min(
    Math.max(0, selection.approvedDiscount),
    grossContractTotal,
  );
  let remainingDiscount = approvedDiscount;
  discountableLines.forEach((line, index) => {
    const grossLineTotal = pricedLine({ ...line, discount: 0 }).pricing.totalAmount;
    const allocated =
      index === discountableLines.length - 1
        ? remainingDiscount
        : Math.min(
            remainingDiscount,
            Math.round(
              ((approvedDiscount * grossLineTotal) / grossContractTotal +
                Number.EPSILON) *
                100,
            ) / 100,
          );
    line.discount = allocated;
    remainingDiscount =
      Math.round((remainingDiscount - allocated + Number.EPSILON) * 100) / 100;
  });

  const contract = await transaction.studentEnrollmentContract.create({
    data: {
      contractNumber: `KZ-CON-${input.studentNumber}`,
      studentId: input.studentId,
      admissionId: input.admissionId,
      enquiryId: input.enquiryId,
      academicSession: selection.academicSession,
      status: input.documentsComplete ? "ACTIVE" : "DRAFT",
      startDate: referenceDate,
      preschoolEnabled: selection.preschoolEnabled,
      preschoolProgrammeId: selection.preschoolProgrammeId,
      preschoolClass: input.programmeClass,
      daycareEnabled: selection.daycareSelections.length > 0,
      mealsEnabled: Boolean(mealCombination),
      annualKitEnabled: selection.includeAnnualFee || selection.includeKitFee,
      annualKitSkipReason: selection.annualKitSkipReason,
      billingDay: selection.billingDay,
      dueDay: selection.dueDay,
      source: input.enquiryId ? "ENQUIRY" : "DIRECT",
      createdById: input.createdById,
      updatedById: input.createdById,
    },
  });

  const services = [];
  for (const line of lines) {
    const { pricing } = pricedLine(line);
    services.push(await transaction.contractService.create({
      data: {
        contractId: contract.id,
        serviceType: line.serviceType,
        category: line.category,
        catalogueItemType: line.catalogueItemType,
        catalogueItemId: line.catalogueItemId,
        label: line.label,
        detail: line.detail,
        amountSnapshot: line.amount,
        discountSnapshot: line.discount,
        gstApplicable: line.gstApplicable,
        gstRate: line.gstApplicable ? line.gstRate : null,
        gstInclusive: line.priceType === "GST_INCLUSIVE",
        taxableValue: pricing.taxableAmount,
        cgst: pricing.cgstAmount,
        sgst: pricing.sgstAmount,
        total: pricing.totalAmount,
        recurring: line.recurring,
        frequency: line.frequency,
        effectiveFrom: line.effectiveFrom,
        effectiveTo: line.effectiveTo,
        status: line.status ?? (input.documentsComplete ? "ACTIVE" : "DRAFT"),
        sourceVersionId: line.sourceVersionId,
        skipReason: line.skipReason,
        metadata: line.metadata,
      },
    }));
  }

  for (const requested of selection.daycareSelections) {
    const definition = daycareDefinitions.find((item) => item.id === requested.planDefinitionId)!;
    const price = definition.priceVersions[0];
    const service = services.find(
      (item) => item.serviceType === "DAYCARE" && item.catalogueItemId === definition.id,
    )!;
    await transaction.studentDaycarePlan.create({
      data: {
        studentId: input.studentId,
        enrollmentContractId: contract.id,
        contractServiceId: service.id,
        planDefinitionId: definition.id,
        priceVersionId: price.id,
        mealCombinationId: mealCombination?.id ?? null,
        title: definition.name,
        planType: daycarePlanType(selection.preschoolEnabled, definition.billingType),
        billingMode: daycareBillingMode(definition.billingType),
        scheduledWeekdays: requested.scheduledWeekdays,
        foodRequired: Boolean(mealCombination),
        foodOption: mealCombination ? "BOTH" : "NONE",
        dailyHours: definition.hoursIncluded,
        includedDays: definition.maximumVisits,
        effectiveFrom: requested.effectiveFrom,
        effectiveTo: requested.effectiveTo,
        active: input.documentsComplete,
        lifecycleStatus: input.documentsComplete ? "ACTIVE" : "INACTIVE",
        recurring: definition.recurring,
        maximumVisitsOverride: definition.maximumVisits,
        separateInvoice: false,
        notes: "Created with the enrollment contract.",
      },
    });
  }

  const billable = services.filter((service) => Number(service.total) > 0 && service.status !== "WAIVED");
  if (billable.length === 0) throw new Error("The contract has no billable service. Select at least one configured charge.");
  const totalAmount =
    Math.round(
      (billable.reduce((sum, service) => sum + Number(service.total), 0) +
        Number.EPSILON) *
        100,
    ) / 100;
  const sequence = await transaction.numberSequence.findUnique({ where: { key: "INVOICE" } });
  const invoiceSequence = await getNextSequence(transaction, {
    key: "INVOICE",
    prefix: sequence?.prefix ?? "KZ-INV",
    minimumWidth: sequence?.minimumWidth ?? 2,
  });
  const invoice = await transaction.feeInvoice.create({
    data: {
      invoiceNumber: invoiceSequence.formattedNumber,
      billingKey: `contract-first:${contract.id}`,
      studentId: input.studentId,
      enrollmentContractId: contract.id,
      category: billable.some((service) => service.serviceType === "PRESCHOOL")
        ? "MONTHLY_PRESCHOOL_FEE"
        : billable.some((service) => service.serviceType === "DAYCARE")
          ? "DAYCARE_FEE"
          : billable[0].category,
      feePeriodKey: monthKey(referenceDate),
      feePeriodLabel: `Admission contract · ${monthLabel(referenceDate)}`,
      issueDate: new Date(),
      dueDate: dueDateFor(referenceDate, selection.dueDay),
      amountBeforeTax: billable.reduce((sum, service) => sum + Number(service.taxableValue), 0),
      discountAmount: approvedDiscount,
      lateFeeAmount: 0,
      gstApplicable: billable.some((service) => service.gstApplicable),
      gstRate: null,
      cgstAmount: billable.reduce((sum, service) => sum + Number(service.cgst), 0),
      sgstAmount: billable.reduce((sum, service) => sum + Number(service.sgst), 0),
      totalAmount,
      paidAmount: 0,
      pendingAmount: totalAmount,
      status: "DRAFT",
      createdById: input.createdById,
      notes: "Combined first bill created atomically from the enrollment contract. Review before collecting payment.",
      items: {
        create: billable.map((service, index) => ({
          contractServiceId: service.id,
          category: service.category,
          title: service.label,
          detail: service.detail,
          quantity: service.quantity,
          unitAmount: service.amountSnapshot,
          amount: service.amountSnapshot,
          discountAmount: service.discountSnapshot,
          gstApplicable: service.gstApplicable,
          gstRate: service.gstRate,
          priceType: service.gstInclusive ? "GST_INCLUSIVE" : "GST_EXCLUSIVE",
          taxableAmount: service.taxableValue,
          cgstAmount: service.cgst,
          sgstAmount: service.sgst,
          totalAmount: service.total,
          sortOrder: index,
          chargeKey: service.recurring
            ? `contract-service:${service.id}:${monthKey(referenceDate)}`
            : `contract-onetime:${service.id}`,
          sourceType: "ContractService",
          sourceId: service.id,
          sourceVersionId: service.sourceVersionId,
        })),
      },
    },
  });

  await transaction.activityLog.create({
    data: {
      adminUserId: input.createdById,
      action: "CREATED",
      entityType: "StudentEnrollmentContract",
      entityId: contract.id,
      description: `Created enrollment contract ${contract.contractNumber} and draft bill ${invoice.invoiceNumber} in one transaction.`,
    },
  });
  return { contract, invoice, services };
}
