import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

export const DATA_CONTROL_CONFIRMATION = "DELETE SELECTED DATA";

export type DataControlSection =
  | "enquiries"
  | "students"
  | "fees"
  | "expenses"
  | "websiteLeadHistory"
  | "activityHistory"
  | "preschoolCatalogue"
  | "daycareCatalogue"
  | "mealCatalogue"
  | "otherChargeCatalogue"
  | "legacyFeeSettings";

export type DataControlAction =
  | "deleteEnquiry"
  | "deleteStudent"
  | "deleteInvoice"
  | "deletePayment"
  | "deleteExpense"
  | "deleteSelected";

const BULK_CLEANUP_TRANSACTION_OPTIONS = {
  maxWait: 15_000,
  timeout: 120_000,
} as const;

export class DataControlBlockedError extends Error {
  constructor(
    public readonly safeMessage: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super("CLEANUP_BLOCKED");
    this.name = "DataControlBlockedError";
  }
}

type CleanupSummary = {
  students: number;
  guardians: number;
  enquiries: number;
  admissions: number;
  invoices: number;
  payments: number;
  receipts: number;
  expenses: number;
  contracts: number;
  contractServices: number;
  daycareRecords: number;
  studentCharges: number;
  financialCorrections: number;
  activityRecords: number;
  attributionRecords: number;
  preschoolPlans: number;
  daycarePlans: number;
  mealPlans: number;
  otherChargeTypes: number;
  legacySettings: number;
};

function emptySummary(): CleanupSummary {
  return {
    students: 0,
    guardians: 0,
    enquiries: 0,
    admissions: 0,
    invoices: 0,
    payments: 0,
    receipts: 0,
    expenses: 0,
    contracts: 0,
    contractServices: 0,
    daycareRecords: 0,
    studentCharges: 0,
    financialCorrections: 0,
    activityRecords: 0,
    attributionRecords: 0,
    preschoolPlans: 0,
    daycarePlans: 0,
    mealPlans: 0,
    otherChargeTypes: 0,
    legacySettings: 0,
  };
}

function addSummary(target: CleanupSummary, source: CleanupSummary) {
  for (const key of Object.keys(target) as Array<keyof CleanupSummary>) {
    target[key] += source[key];
  }
}

function summaryMessage(summary: CleanupSummary, blockers: string[] = []) {
  const labels: Array<[keyof CleanupSummary, string]> = [
    ["students", "students"], ["guardians", "guardians"],
    ["enquiries", "enquiries"], ["admissions", "admissions"],
    ["contracts", "contracts"], ["contractServices", "contract services"],
    ["invoices", "invoices"], ["payments", "payments"],
    ["receipts", "receipts"], ["daycareRecords", "daycare records"],
    ["expenses", "expenses"],
    ["studentCharges", "student charges"],
    ["financialCorrections", "financial corrections"],
    ["preschoolPlans", "preschool programmes/fees"],
    ["daycarePlans", "daycare plans/rates"], ["mealPlans", "meal plans"],
    ["otherChargeTypes", "other charge types"],
    ["legacySettings", "legacy settings"],
    ["activityRecords", "activity records"],
    ["attributionRecords", "attribution records"],
  ];
  const removed = labels
    .filter(([key]) => summary[key] > 0)
    .map(([key, label]) => `${summary[key]} ${label}`);
  const base = removed.length
    ? `Removed ${removed.join(", ")}.`
    : "No safe matching records needed deletion.";
  return blockers.length
    ? `${base} Protected records kept: ${blockers.slice(0, 5).join("; ")}${blockers.length > 5 ? `; and ${blockers.length - 5} more` : ""}.`
    : base;
}

function dateValue(value: Date | null) {
  return value?.toISOString() ?? null;
}

function moneyValue(value: { toString(): string }) {
  return value.toString();
}

async function getCatalogueCleanupPreview() {
  const [
    programmes,
    daycarePlans,
    meals,
    mealCombinations,
    chargeDefinitions,
    legacyProgrammeFees,
    legacyDaycareRates,
    invoiceSources,
    serviceSources,
  ] = await Promise.all([
    prisma.programmeDefinition.findMany({
      orderBy: [{ status: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, status: true,
        feeVersions: { select: { id: true } },
        students: {
          take: 10,
          select: { studentNumber: true, firstName: true, lastName: true },
        },
        enrollmentContracts: {
          take: 10,
          select: {
            contractNumber: true,
            student: { select: { studentNumber: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { students: true, enrollmentContracts: true } },
      },
    }),
    prisma.daycarePlanDefinition.findMany({
      orderBy: [{ status: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, status: true,
        priceVersions: { select: { id: true } },
        studentPlans: {
          take: 10,
          select: { student: { select: { studentNumber: true, firstName: true, lastName: true } } },
        },
        _count: { select: { studentPlans: true } },
      },
    }),
    prisma.mealDefinition.findMany({
      orderBy: [{ status: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, status: true,
        priceVersions: { select: { id: true } },
        combinationItems: {
          take: 10,
          select: { combination: { select: { name: true } } },
        },
        sessionMeals: {
          take: 10,
          select: { session: { select: { student: { select: { studentNumber: true, firstName: true, lastName: true } } } } },
        },
        _count: { select: { combinationItems: true, sessionMeals: true } },
      },
    }),
    prisma.mealCombination.findMany({
      orderBy: [{ status: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, status: true,
        priceVersions: { select: { id: true } },
        studentPlans: {
          take: 10,
          select: { student: { select: { studentNumber: true, firstName: true, lastName: true } } },
        },
        _count: { select: { studentPlans: true } },
      },
    }),
    prisma.chargeDefinition.findMany({
      orderBy: [{ status: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, status: true,
        studentCharges: {
          take: 10,
          select: { student: { select: { studentNumber: true, firstName: true, lastName: true } } },
        },
        _count: { select: { studentCharges: true } },
      },
    }),
    prisma.programmeFeeSetting.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, active: true },
    }),
    prisma.daycareRateSetting.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, active: true,
        sessions: {
          take: 10,
          select: { sessionNumber: true, student: { select: { studentNumber: true, firstName: true, lastName: true } } },
        },
        _count: { select: { sessions: true } },
      },
    }),
    prisma.feeInvoiceItem.findMany({
      where: { OR: [{ sourceId: { not: null } }, { sourceVersionId: { not: null } }] },
      select: {
        sourceId: true,
        sourceVersionId: true,
        invoice: {
          select: {
            invoiceNumber: true,
            student: { select: { studentNumber: true, firstName: true, lastName: true } },
          },
        },
      },
      take: 20_000,
    }),
    prisma.contractService.findMany({
      where: { OR: [{ catalogueItemId: { not: null } }, { sourceVersionId: { not: null } }] },
      select: {
        catalogueItemId: true,
        sourceVersionId: true,
        contract: {
          select: {
            contractNumber: true,
            student: { select: { studentNumber: true, firstName: true, lastName: true } },
          },
        },
      },
      take: 20_000,
    }),
  ]);
  const studentLabel = (student: {
    studentNumber: string;
    firstName: string;
    lastName: string | null;
  }) => `${student.studentNumber} (${[student.firstName, student.lastName].filter(Boolean).join(" ")})`;
  const invoiceUsage = new Map<string, Set<string>>();
  const contractUsage = new Map<string, Set<string>>();
  const addUsage = (map: Map<string, Set<string>>, id: string | null, label: string) => {
    if (!id) return;
    const labels = map.get(id) ?? new Set<string>();
    labels.add(label);
    map.set(id, labels);
  };
  for (const source of invoiceSources) {
    const label = `Invoice ${source.invoice.invoiceNumber} for ${studentLabel(source.invoice.student)}`;
    addUsage(invoiceUsage, source.sourceId, label);
    addUsage(invoiceUsage, source.sourceVersionId, label);
  }
  for (const source of serviceSources) {
    const label = `Contract ${source.contract.contractNumber} for ${studentLabel(source.contract.student)}`;
    addUsage(contractUsage, source.catalogueItemId, label);
    addUsage(contractUsage, source.sourceVersionId, label);
  }
  const usage = (ids: string[]) => ({
    historicalInvoices: Array.from(new Set(ids.flatMap((id) => Array.from(invoiceUsage.get(id) ?? [])))),
    activeContracts: Array.from(new Set(ids.flatMap((id) => Array.from(contractUsage.get(id) ?? [])))),
  });
  const item = (
    id: string,
    name: string,
    type: string,
    status: string,
    dependencies: string[],
  ) => ({
    id, name, type, status, dependencies,
    safeToDelete: dependencies.length === 0,
    recommendation: dependencies.length === 0 ? "delete" : "archive or remove dependencies first",
  });
  return [
    ...programmes.map((record) => {
      const refs = usage([record.id, ...record.feeVersions.map((version) => version.id)]);
      return item(record.id, record.name, "PRESCHOOL_PROGRAMME", record.status, [
        ...record.students.map((student) => `Student ${studentLabel(student)}`),
        ...record.enrollmentContracts.map((contract) => `Contract ${contract.contractNumber} for ${studentLabel(contract.student)}`),
        ...refs.activeContracts,
        ...refs.historicalInvoices,
      ]);
    }),
    ...daycarePlans.map((record) => {
      const refs = usage([record.id, ...record.priceVersions.map((version) => version.id)]);
      return item(record.id, record.name, "DAYCARE_PLAN", record.status, [
        ...record.studentPlans.map((plan) => `Child plan for ${studentLabel(plan.student)}`),
        ...refs.activeContracts,
        ...refs.historicalInvoices,
      ]);
    }),
    ...mealCombinations.map((record) => {
      const refs = usage([record.id, ...record.priceVersions.map((version) => version.id)]);
      return item(record.id, record.name, "MEAL_COMBINATION", record.status, [
        ...record.studentPlans.map((plan) => `Child meal plan for ${studentLabel(plan.student)}`),
        ...refs.activeContracts,
        ...refs.historicalInvoices,
      ]);
    }),
    ...meals.map((record) => {
      const refs = usage([record.id, ...record.priceVersions.map((version) => version.id)]);
      return item(record.id, record.name, "MEAL", record.status, [
        ...record.sessionMeals.map((meal) => `Daycare meal for ${studentLabel(meal.session.student)}`),
        ...record.combinationItems.map((entry) => `Meal combination ${entry.combination.name}`),
        ...refs.activeContracts,
        ...refs.historicalInvoices,
      ]);
    }),
    ...chargeDefinitions.map((record) => {
      const refs = usage([record.id]);
      return item(record.id, record.name, "OTHER_CHARGE", record.status, [
        ...record.studentCharges.map((charge) => `Student charge for ${studentLabel(charge.student)}`),
        ...refs.activeContracts,
        ...refs.historicalInvoices,
      ]);
    }),
    ...legacyProgrammeFees.map((record) => {
      const refs = usage([record.id]);
      return item(record.id, record.title, "LEGACY_PRESCHOOL_FEE", record.active ? "ACTIVE" : "INACTIVE", [
        ...refs.activeContracts,
        ...refs.historicalInvoices,
      ]);
    }),
    ...legacyDaycareRates.map((record) => {
      const refs = usage([record.id]);
      return item(record.id, record.title, "LEGACY_DAYCARE_RATE", record.active ? "ACTIVE" : "INACTIVE", [
        ...record.sessions.map((session) => `Session ${session.sessionNumber} for ${studentLabel(session.student)}`),
        ...refs.activeContracts,
        ...refs.historicalInvoices,
      ]);
    }),
  ];
}

export async function getDataControlSnapshot() {
  const [
    enquiries,
    students,
    invoices,
    standalonePayments,
    expenses,
    enquiryCount,
    studentCount,
    expenseCount,
    followUpCount,
    websiteSubmissionCount,
    guardianCount,
    receiptCount,
    paymentCount,
    invoiceCount,
    attendanceCount,
    daycareSessionCount,
    documentCount,
    activityCount,
  ] = await Promise.all([
    prisma.enquiry.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 250,
      select: {
        id: true,
        enquiryNumber: true,
        parentName: true,
        childName: true,
        phone: true,
        source: true,
        status: true,
        websiteSubmissionCount: true,
        createdAt: true,
        _count: {
          select: {
            followUps: true,
            websiteSubmissions: true,
          },
        },
      },
    }),
    prisma.student.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 250,
      select: {
        id: true,
        studentNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        programme: true,
        status: true,
        createdAt: true,
        admission: { select: { id: true, enquiryId: true } },
        enrollmentContract: {
          select: {
            id: true,
            contractNumber: true,
            preschoolEnabled: true,
            daycareEnabled: true,
            _count: {
              select: {
                services: true,
                invoices: true,
                ledgerCharges: true,
                daycarePlans: true,
                financialCorrections: true,
              },
            },
          },
        },
        feeInvoices: {
          select: { status: true, paidAmount: true },
        },
        _count: {
          select: {
            guardians: true,
            feeAccounts: true,
            feeInvoices: true,
            payments: true,
            receipts: true,
            attendanceRecords: true,
            documents: true,
            daycarePlans: true,
            daycareSessions: true,
            ledgerCharges: true,
            financialCorrections: true,
            whatsappMessages: true,
          },
        },
      },
    }),
    prisma.feeInvoice.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 250,
      select: {
        id: true,
        invoiceNumber: true,
        category: true,
        feePeriodLabel: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        createdAt: true,
        student: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            studentNumber: true,
          },
        },
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            receipt: {
              select: {
                receiptNumber: true,
              },
            },
          },
        },
      },
    }),
    prisma.feePayment.findMany({
      where: {
        invoiceId: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 250,
      select: {
        id: true,
        paymentNumber: true,
        category: true,
        feePeriodLabel: true,
        amountReceived: true,
        status: true,
        createdAt: true,
        student: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            studentNumber: true,
          },
        },
        receipt: {
          select: {
            receiptNumber: true,
          },
        },
      },
    }),
    prisma.expense.findMany({
      orderBy: {
        expenseDate: "desc",
      },
      take: 250,
      select: {
        id: true,
        expenseNumber: true,
        title: true,
        vendorName: true,
        category: true,
        totalAmount: true,
        paymentMethod: true,
        expenseDate: true,
        createdAt: true,
      },
    }),
    prisma.enquiry.count(),
    prisma.student.count(),
    prisma.expense.count(),
    prisma.followUp.count(),
    prisma.websiteLeadSubmission.count(),
    prisma.guardian.count(),
    prisma.receipt.count(),
    prisma.feePayment.count(),
    prisma.feeInvoice.count(),
    prisma.studentAttendance.count(),
    prisma.daycareSession.count(),
    prisma.studentDocument.count(),
    prisma.activityLog.count(),
  ]);
  const catalogue = await getCatalogueCleanupPreview();

  return {
    createdAt: new Date().toISOString(),
    totals: {
      enquiries: enquiryCount,
      followUps: followUpCount,
      websiteSubmissions: websiteSubmissionCount,
      students: studentCount,
      guardians: guardianCount,
      invoices: invoiceCount,
      payments: paymentCount,
      receipts: receiptCount,
      expenses: expenseCount,
      attendance: attendanceCount,
      daycareSessions: daycareSessionCount,
      documents: documentCount,
      activityLogs: activityCount,
    },
    enquiries: enquiries.map((enquiry) => ({
      id: enquiry.id,
      enquiryNumber: enquiry.enquiryNumber,
      parentName: enquiry.parentName,
      childName: enquiry.childName,
      phone: enquiry.phone,
      source: enquiry.source,
      status: enquiry.status,
      websiteSubmissionCount:
        enquiry._count.websiteSubmissions ||
        enquiry.websiteSubmissionCount,
      followUpCount: enquiry._count.followUps,
      createdAt: dateValue(enquiry.createdAt),
    })),
    students: students.map((student) => ({
      id: student.id,
      studentNumber: student.studentNumber,
      name: [
        student.firstName,
        student.middleName,
        student.lastName,
      ]
        .filter(Boolean)
        .join(" "),
      programme: student.programme,
      status: student.status,
      createdAt: dateValue(student.createdAt),
      linked: {
        ...student._count,
        contracts: student.enrollmentContract ? 1 : 0,
        contractServices: student.enrollmentContract?._count.services ?? 0,
        admissions: student.admission ? 1 : 0,
        enquiries: student.admission?.enquiryId ? 1 : 0,
      },
      services: {
        preschool: student.enrollmentContract?.preschoolEnabled ?? false,
        daycare: student.enrollmentContract?.daycareEnabled ?? student._count.daycarePlans > 0,
      },
      protectedFinancialHistory:
        student._count.payments +
        student._count.receipts +
        student._count.financialCorrections +
        student.feeInvoices.filter(
          (invoice) => Number(invoice.paidAmount) > 0 || ["PAID", "PARTIALLY_PAID"].includes(invoice.status),
        ).length,
    })),
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      category: invoice.category,
      feePeriodLabel: invoice.feePeriodLabel,
      totalAmount: moneyValue(invoice.totalAmount),
      paidAmount: moneyValue(invoice.paidAmount),
      status: invoice.status,
      createdAt: dateValue(invoice.createdAt),
      studentNumber: invoice.student.studentNumber,
      studentName: [
        invoice.student.firstName,
        invoice.student.middleName,
        invoice.student.lastName,
      ]
        .filter(Boolean)
        .join(" "),
      payments: invoice.payments.map((payment) => ({
        paymentNumber: payment.paymentNumber,
        receiptNumber: payment.receipt?.receiptNumber ?? null,
      })),
    })),
    standalonePayments: standalonePayments.map((payment) => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      category: payment.category,
      feePeriodLabel: payment.feePeriodLabel,
      amountReceived: moneyValue(payment.amountReceived),
      status: payment.status,
      createdAt: dateValue(payment.createdAt),
      studentNumber: payment.student.studentNumber,
      studentName: [
        payment.student.firstName,
        payment.student.middleName,
        payment.student.lastName,
      ]
        .filter(Boolean)
        .join(" "),
      receiptNumber: payment.receipt?.receiptNumber ?? null,
    })),
    expenses: expenses.map((expense) => ({
      id: expense.id,
      expenseNumber: expense.expenseNumber,
      title: expense.title,
      vendorName: expense.vendorName,
      category: expense.category,
      totalAmount: moneyValue(expense.totalAmount),
      paymentMethod: expense.paymentMethod,
      expenseDate: dateValue(expense.expenseDate),
      createdAt: dateValue(expense.createdAt),
    })),
    catalogue,
  };
}

async function deleteStudentBundle(
  transaction: Prisma.TransactionClient,
  studentId: string,
  options: {
    deleteEnquiry: boolean;
    deleteAttribution: boolean;
    testDataConfirmed: boolean;
  },
) {
  const student = await transaction.student.findUnique({
    where: {
      id: studentId,
    },
    select: {
      id: true,
      studentNumber: true,
      firstName: true,
      middleName: true,
      lastName: true,
      enrollmentContract: {
        select: {
          id: true,
          contractNumber: true,
          services: { select: { id: true } },
        },
      },
      feeInvoices: { select: { id: true, status: true, paidAmount: true } },
      payments: { select: { id: true } },
      receipts: { select: { id: true } },
      daycarePlans: { select: { id: true } },
      daycareSessions: { select: { id: true } },
      ledgerCharges: { select: { id: true } },
      financialCorrections: { select: { id: true } },
      documents: { select: { id: true, storedFileId: true } },
    },
  });

  if (!student) {
    throw new Error("RECORD_NOT_FOUND");
  }

  const studentName = [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
  const protectedInvoices = student.feeInvoices.filter(
    (invoice) =>
      Number(invoice.paidAmount) > 0 ||
      ["PAID", "PARTIALLY_PAID"].includes(invoice.status),
  );
  const protectedFinancialRecords =
    protectedInvoices.length +
    student.payments.length +
    student.receipts.length +
    student.financialCorrections.length;
  if (protectedFinancialRecords > 0 && !options.testDataConfirmed) {
    throw new DataControlBlockedError(
      `Cannot delete ${studentName} because ${protectedFinancialRecords} paid, receipt or financial-correction records are linked. Confirm that this is pre-launch test data after downloading the backup, or archive the genuine student instead.`,
      {
        module: "Fees & Payments",
        studentNumber: student.studentNumber,
        protectedInvoices: protectedInvoices.length,
        payments: student.payments.length,
        receipts: student.receipts.length,
        corrections: student.financialCorrections.length,
      },
    );
  }

  const admission = await transaction.admission.findUnique({
    where: {
      studentId,
    },
    select: {
      id: true,
      enquiryId: true,
    },
  });

  const summary = emptySummary();
  const invoiceIds = student.feeInvoices.map((item) => item.id);
  const paymentIds = student.payments.map((item) => item.id);
  const receiptIds = student.receipts.map((item) => item.id);
  const linkedEntityIds = [
    studentId,
    student.enrollmentContract?.id,
    ...(student.enrollmentContract?.services.map((item) => item.id) ?? []),
    ...invoiceIds,
    ...paymentIds,
    ...receiptIds,
    ...student.daycarePlans.map((item) => item.id),
    ...student.daycareSessions.map((item) => item.id),
    ...student.ledgerCharges.map((item) => item.id),
    ...student.financialCorrections.map((item) => item.id),
    ...student.documents.map((item) => item.id),
    admission?.id,
  ].filter((id): id is string => Boolean(id));

  await transaction.adminNotification.deleteMany({
    where: { entityId: { in: linkedEntityIds } },
  });
  await transaction.whatsAppAutomationMessage.deleteMany({
    where: {
      OR: [
        { studentId },
        ...(invoiceIds.length ? [{ invoiceId: { in: invoiceIds } }] : []),
        ...(receiptIds.length ? [{ receiptId: { in: receiptIds } }] : []),
      ],
    },
  });
  summary.activityRecords += (
    await transaction.activityLog.deleteMany({
      where: { entityId: { in: linkedEntityIds } },
    })
  ).count;
  summary.daycareRecords += (
    await transaction.daycareSession.deleteMany({ where: { studentId } })
  ).count;
  summary.studentCharges += (
    await transaction.studentCharge.deleteMany({ where: { studentId } })
  ).count;
  summary.financialCorrections += (
    await transaction.financialCorrection.deleteMany({ where: { studentId } })
  ).count;
  summary.receipts += (
    await transaction.receipt.deleteMany({ where: { studentId } })
  ).count;
  summary.payments += (
    await transaction.feePayment.deleteMany({ where: { studentId } })
  ).count;
  summary.invoices += (
    await transaction.feeInvoice.deleteMany({ where: { studentId } })
  ).count;
  summary.daycareRecords += (
    await transaction.studentDaycarePlan.deleteMany({ where: { studentId } })
  ).count;
  await transaction.studentFeeAccount.deleteMany({ where: { studentId } });
  await transaction.studentAttendance.deleteMany({ where: { studentId } });
  const storedFileIds = student.documents
    .map((item) => item.storedFileId)
    .filter((id): id is string => Boolean(id));
  if (storedFileIds.length > 0) {
    await transaction.storedFile.updateMany({
      where: { id: { in: storedFileIds }, status: { not: "DELETED" } },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
  }
  await transaction.studentDocument.deleteMany({ where: { studentId } });
  if (student.enrollmentContract) {
    summary.contractServices += (
      await transaction.contractService.deleteMany({
        where: { contractId: student.enrollmentContract.id },
      })
    ).count;
    await transaction.studentEnrollmentContract.delete({
      where: { id: student.enrollmentContract.id },
    });
    summary.contracts += 1;
  }
  if (admission) {
    await transaction.admission.delete({
      where: { id: admission.id },
    });
    summary.admissions += 1;

    if (admission.enquiryId) {
      if (options.deleteEnquiry) {
        summary.attributionRecords += await transaction.websiteLeadSubmission.count({
          where: { enquiryId: admission.enquiryId },
        });
        await transaction.enquiry.delete({ where: { id: admission.enquiryId } });
        summary.enquiries += 1;
      } else {
        if (options.deleteAttribution) {
          summary.attributionRecords += (
            await transaction.websiteLeadSubmission.deleteMany({
              where: { enquiryId: admission.enquiryId },
            })
          ).count;
        }
        await transaction.enquiry.update({
          where: { id: admission.enquiryId },
          data: {
            status: "CONTACTED",
            admittedAt: null,
            nextFollowUpAt: null,
          },
        });
      }
    }
  }
  summary.guardians += (
    await transaction.guardian.deleteMany({ where: { studentId } })
  ).count;
  await transaction.student.delete({
    where: {
      id: studentId,
    },
  });
  summary.students += 1;

  return { recordNumber: student.studentNumber, summary };
}

async function deleteInvoiceBundle(
  transaction: Prisma.TransactionClient,
  invoiceId: string,
) {
  const invoice = await transaction.feeInvoice.findUnique({
    where: {
      id: invoiceId,
    },
    select: {
      invoiceNumber: true,
      payments: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error("RECORD_NOT_FOUND");
  }

  const paymentIds = invoice.payments.map((payment) => payment.id);
  const receipts = paymentIds.length
    ? await transaction.receipt.findMany({
        where: { paymentId: { in: paymentIds } },
        select: { id: true },
      })
    : [];
  const receiptIds = receipts.map((receipt) => receipt.id);

  await transaction.whatsAppAutomationMessage.deleteMany({
    where: {
      OR: [
        { invoiceId },
        ...(receiptIds.length ? [{ receiptId: { in: receiptIds } }] : []),
      ],
    },
  });
  await transaction.adminNotification.deleteMany({
    where: { entityId: { in: [invoiceId, ...paymentIds, ...receiptIds] } },
  });
  await transaction.activityLog.deleteMany({
    where: { entityId: { in: [invoiceId, ...paymentIds, ...receiptIds] } },
  });
  await transaction.financialCorrection.deleteMany({
    where: {
      OR: [
        { invoiceId },
        ...(paymentIds.length ? [{ paymentId: { in: paymentIds } }] : []),
        ...(receiptIds.length ? [{ receiptId: { in: receiptIds } }] : []),
      ],
    },
  });

  if (paymentIds.length > 0) {
    await transaction.receipt.deleteMany({
      where: {
        paymentId: {
          in: paymentIds,
        },
      },
    });
    await transaction.feePayment.deleteMany({
      where: {
        id: {
          in: paymentIds,
        },
      },
    });
  }

  await transaction.daycareSession.updateMany({
    where: {
      feeInvoiceId: invoiceId,
    },
    data: {
      feeInvoiceId: null,
      status: "BOOKED",
    },
  });
  await transaction.studentCharge.updateMany({
    where: {
      feeInvoiceId: invoiceId,
    },
    data: {
      feeInvoiceId: null,
      status: "PENDING",
    },
  });
  await transaction.feeInvoice.delete({
    where: {
      id: invoiceId,
    },
  });

  return invoice.invoiceNumber;
}

async function deletePaymentBundle(
  transaction: Prisma.TransactionClient,
  paymentId: string,
) {
  const payment = await transaction.feePayment.findUnique({
    where: {
      id: paymentId,
    },
    select: {
      paymentNumber: true,
      invoiceId: true,
      receipt: { select: { id: true } },
    },
  });

  if (!payment || payment.invoiceId) {
    throw new Error("RECORD_NOT_FOUND");
  }

  const receiptId = payment.receipt?.id;
  if (receiptId) {
    await transaction.whatsAppAutomationMessage.deleteMany({
      where: { receiptId },
    });
  }
  await transaction.adminNotification.deleteMany({
    where: { entityId: { in: [paymentId, ...(receiptId ? [receiptId] : [])] } },
  });
  await transaction.activityLog.deleteMany({
    where: { entityId: { in: [paymentId, ...(receiptId ? [receiptId] : [])] } },
  });
  await transaction.financialCorrection.deleteMany({
    where: {
      OR: [
        { paymentId },
        ...(receiptId ? [{ receiptId }] : []),
      ],
    },
  });

  await transaction.receipt.deleteMany({
    where: {
      paymentId,
    },
  });
  await transaction.feePayment.delete({
    where: {
      id: paymentId,
    },
  });

  return payment.paymentNumber;
}

async function deleteAllFees(transaction: Prisma.TransactionClient) {
  const summary = emptySummary();
  await transaction.whatsAppAutomationMessage.deleteMany({
    where: { OR: [{ invoiceId: { not: null } }, { receiptId: { not: null } }] },
  });
  summary.financialCorrections += (
    await transaction.financialCorrection.deleteMany()
  ).count;
  summary.receipts += (await transaction.receipt.deleteMany()).count;
  summary.payments += (await transaction.feePayment.deleteMany()).count;
  await transaction.daycareSession.updateMany({
    where: {
      feeInvoiceId: {
        not: null,
      },
    },
    data: {
      feeInvoiceId: null,
      status: "BOOKED",
    },
  });
  await transaction.studentCharge.updateMany({
    where: {
      feeInvoiceId: {
        not: null,
      },
    },
    data: {
      feeInvoiceId: null,
      status: "PENDING",
    },
  });
  summary.invoices += (await transaction.feeInvoice.deleteMany()).count;
  await transaction.studentFeeAccount.deleteMany();
  return summary;
}

async function deleteAllStudents(
  transaction: Prisma.TransactionClient,
  options: {
    deleteEnquiry: boolean;
    deleteAttribution: boolean;
    testDataConfirmed: boolean;
  },
) {
  const students = await transaction.student.findMany({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  const summary = emptySummary();
  for (const student of students) {
    const result = await deleteStudentBundle(transaction, student.id, options);
    addSummary(summary, result.summary);
  }
  return summary;
}

async function deleteCleanupExpenses(
  transaction: Prisma.TransactionClient,
) {
  const payrollNumbers = (
    await transaction.staffPayroll.findMany({
      select: { payrollNumber: true },
    })
  ).map((payroll) => payroll.payrollNumber);

  return (await transaction.expense.deleteMany({
    where:
      payrollNumbers.length > 0
        ? {
            NOT: {
              category: "SALARY",
              invoiceNumber: {
                in: payrollNumbers,
              },
            },
          }
        : undefined,
  })).count;
}

async function deleteWebsiteLeadHistory(
  transaction: Prisma.TransactionClient,
) {
  const deleted = await transaction.websiteLeadSubmission.deleteMany();
  await transaction.enquiry.updateMany({
    data: {
      formSubmissionId: null,
      lastWebsiteSubmissionAt: null,
      websiteSubmissionCount: 0,
      latestPageUrl: null,
      latestLandingPage: null,
      latestReferrer: null,
      latestUtmSource: null,
      latestUtmMedium: null,
      latestUtmCampaign: null,
      latestUtmContent: null,
      latestUtmTerm: null,
      latestGclid: null,
      latestFbclid: null,
    },
  });
  return deleted.count;
}

async function sourceDependencyCounts(
  transaction: Prisma.TransactionClient,
  ids: string[],
) {
  if (ids.length === 0) return { contracts: 0, invoices: 0 };
  const [contracts, invoices] = await Promise.all([
    transaction.contractService.count({
      where: {
        OR: [
          { catalogueItemId: { in: ids } },
          { sourceVersionId: { in: ids } },
        ],
      },
    }),
    transaction.feeInvoiceItem.count({
      where: {
        OR: [{ sourceId: { in: ids } }, { sourceVersionId: { in: ids } }],
      },
    }),
  ]);
  return { contracts, invoices };
}

async function deleteUnusedCatalogue(
  transaction: Prisma.TransactionClient,
  sections: DataControlSection[],
) {
  const summary = emptySummary();
  const blockers: string[] = [];
  if (sections.includes("preschoolCatalogue")) {
    const records = await transaction.programmeDefinition.findMany({
      select: {
        id: true, name: true,
        feeVersions: { select: { id: true } },
        _count: { select: { students: true, enrollmentContracts: true } },
      },
    });
    for (const record of records) {
      const refs = await sourceDependencyCounts(transaction, [
        record.id,
        ...record.feeVersions.map((version) => version.id),
      ]);
      const dependencies =
        record._count.students +
        record._count.enrollmentContracts +
        refs.contracts +
        refs.invoices;
      if (dependencies > 0) {
        blockers.push(
          `${record.name} preschool programme (${dependencies} student, contract or historical invoice dependencies) — archive or remove test dependencies first`,
        );
      } else {
        await transaction.programmeDefinition.delete({ where: { id: record.id } });
        summary.preschoolPlans += 1;
      }
    }
  }
  if (sections.includes("daycareCatalogue")) {
    const records = await transaction.daycarePlanDefinition.findMany({
      select: {
        id: true, name: true,
        priceVersions: { select: { id: true } },
        _count: { select: { studentPlans: true } },
      },
    });
    for (const record of records) {
      const refs = await sourceDependencyCounts(transaction, [
        record.id,
        ...record.priceVersions.map((version) => version.id),
      ]);
      const dependencies = record._count.studentPlans + refs.contracts + refs.invoices;
      if (dependencies > 0) {
        blockers.push(
          `${record.name} daycare plan (${dependencies} child-plan, contract or historical invoice dependencies) — archive or replace first`,
        );
      } else {
        await transaction.daycarePlanDefinition.delete({ where: { id: record.id } });
        summary.daycarePlans += 1;
      }
    }
  }
  if (sections.includes("mealCatalogue")) {
    const combinations = await transaction.mealCombination.findMany({
      select: {
        id: true, name: true,
        priceVersions: { select: { id: true } },
        _count: { select: { studentPlans: true } },
      },
    });
    for (const record of combinations) {
      const refs = await sourceDependencyCounts(transaction, [
        record.id,
        ...record.priceVersions.map((version) => version.id),
      ]);
      const dependencies = record._count.studentPlans + refs.contracts + refs.invoices;
      if (dependencies > 0) {
        blockers.push(
          `${record.name} meal combination (${dependencies} child-plan, contract or historical invoice dependencies) — archive or remove dependencies first`,
        );
      } else {
        await transaction.mealCombination.delete({ where: { id: record.id } });
        summary.mealPlans += 1;
      }
    }
    const meals = await transaction.mealDefinition.findMany({
      select: {
        id: true, name: true,
        priceVersions: { select: { id: true } },
        _count: { select: { combinationItems: true, sessionMeals: true } },
      },
    });
    for (const record of meals) {
      const refs = await sourceDependencyCounts(transaction, [
        record.id,
        ...record.priceVersions.map((version) => version.id),
      ]);
      const dependencies =
        record._count.combinationItems +
        record._count.sessionMeals +
        refs.contracts +
        refs.invoices;
      if (dependencies > 0) {
        blockers.push(
          `${record.name} meal (${dependencies} combination, daycare-session, contract or historical invoice dependencies) — archive or remove dependencies first`,
        );
      } else {
        await transaction.mealDefinition.delete({ where: { id: record.id } });
        summary.mealPlans += 1;
      }
    }
  }
  if (sections.includes("otherChargeCatalogue")) {
    const records = await transaction.chargeDefinition.findMany({
      select: { id: true, name: true, _count: { select: { studentCharges: true } } },
    });
    for (const record of records) {
      const refs = await sourceDependencyCounts(transaction, [record.id]);
      const dependencies = record._count.studentCharges + refs.contracts + refs.invoices;
      if (dependencies > 0) {
        blockers.push(
          `${record.name} charge (${dependencies} student, contract or historical invoice dependencies) — archive instead`,
        );
      } else {
        await transaction.chargeDefinition.delete({ where: { id: record.id } });
        summary.otherChargeTypes += 1;
      }
    }
  }
  if (sections.includes("legacyFeeSettings")) {
    const programmeFees = await transaction.programmeFeeSetting.findMany({
      select: { id: true, title: true },
    });
    for (const record of programmeFees) {
      const refs = await sourceDependencyCounts(transaction, [record.id]);
      if (refs.contracts + refs.invoices > 0) {
        blockers.push(`${record.title} legacy fee (${refs.contracts + refs.invoices} historical dependencies) — keep for audit`);
      } else {
        await transaction.programmeFeeSetting.delete({ where: { id: record.id } });
        summary.legacySettings += 1;
      }
    }
    const daycareRates = await transaction.daycareRateSetting.findMany({
      select: { id: true, title: true, _count: { select: { sessions: true } } },
    });
    for (const record of daycareRates) {
      const refs = await sourceDependencyCounts(transaction, [record.id]);
      const dependencies = record._count.sessions + refs.contracts + refs.invoices;
      if (dependencies > 0) {
        blockers.push(`${record.title} legacy daycare rate (${dependencies} session or historical dependencies) — keep for audit`);
      } else {
        await transaction.daycareRateSetting.delete({ where: { id: record.id } });
        summary.legacySettings += 1;
      }
    }
  }
  return { summary, blockers };
}

export async function executeDataControlAction(input: {
  action: DataControlAction;
  id?: string;
  confirmation: string;
  sections?: DataControlSection[];
  backupConfirmed?: boolean;
  testDataConfirmed?: boolean;
  adminUserId: string;
}) {
  if (input.action === "deleteSelected") {
    if (
      input.confirmation !== DATA_CONTROL_CONFIRMATION ||
      input.backupConfirmed !== true
    ) {
      throw new Error("CONFIRMATION_REQUIRED");
    }

    const sections = Array.from(new Set(input.sections ?? []));

    if (sections.length === 0) {
      throw new Error("NO_SECTIONS_SELECTED");
    }

    const prelaunchSections = new Set<DataControlSection>([
      "students",
      "fees",
      "enquiries",
      "preschoolCatalogue",
      "daycareCatalogue",
      "mealCatalogue",
      "otherChargeCatalogue",
      "legacyFeeSettings",
    ]);
    if (
      sections.some((section) => prelaunchSections.has(section)) &&
      input.testDataConfirmed !== true
    ) {
      throw new Error("TEST_DATA_CONFIRMATION_REQUIRED");
    }

    const result = await prisma.$transaction(async (transaction) => {
      const summary = emptySummary();
      const blockers: string[] = [];
      if (sections.includes("students")) {
        addSummary(
          summary,
          await deleteAllStudents(transaction, {
            deleteEnquiry: sections.includes("enquiries"),
            deleteAttribution: sections.includes("websiteLeadHistory"),
            testDataConfirmed: input.testDataConfirmed === true,
          }),
        );
      } else if (sections.includes("fees")) {
        addSummary(summary, await deleteAllFees(transaction));
      }

      if (sections.includes("enquiries")) {
        summary.admissions += (await transaction.admission.deleteMany({
          where: { studentId: null },
        })).count;
        summary.attributionRecords += await transaction.websiteLeadSubmission.count();
        summary.enquiries += (await transaction.enquiry.deleteMany()).count;
      } else if (sections.includes("websiteLeadHistory")) {
        summary.attributionRecords += await deleteWebsiteLeadHistory(transaction);
      }

      if (sections.includes("expenses")) {
        summary.expenses += await deleteCleanupExpenses(transaction);
      }

      const catalogue = await deleteUnusedCatalogue(transaction, sections);
      addSummary(summary, catalogue.summary);
      blockers.push(...catalogue.blockers);

      if (sections.includes("activityHistory")) {
        summary.activityRecords += (await transaction.activityLog.deleteMany()).count;
      } else {
        await transaction.activityLog.create({
          data: {
            adminUserId: input.adminUserId,
            action: "DELETED",
            entityType: "DATA_CONTROL",
            description: `Owner permanently deleted selected pre-launch data: ${sections.join(", ")}.`,
          },
        });
      }
      return { summary, blockers };
    }, BULK_CLEANUP_TRANSACTION_OPTIONS);

    return {
      message: summaryMessage(result.summary, result.blockers),
      summary: result.summary,
      blockers: result.blockers,
    };
  }

  const id = input.id?.trim();

  if (!id) {
    throw new Error("RECORD_NOT_FOUND");
  }

  if (input.backupConfirmed !== true) {
    throw new Error("CONFIRMATION_REQUIRED");
  }
  if (input.testDataConfirmed !== true) {
    throw new Error("TEST_DATA_CONFIRMATION_REQUIRED");
  }

  const result = await prisma.$transaction(async (transaction) => {
    if (input.action === "deleteEnquiry") {
      const record = await transaction.enquiry.findUnique({
        where: {
          id,
        },
        select: {
          enquiryNumber: true,
          admission: {
            select: {
              id: true,
              studentId: true,
            },
          },
        },
      });

      if (!record) {
        throw new Error("RECORD_NOT_FOUND");
      }

      if (input.confirmation !== `DELETE ${record.enquiryNumber}`) {
        throw new Error("CONFIRMATION_REQUIRED");
      }

      if (record.admission?.studentId) {
        throw new Error("LINKED_STUDENT");
      }

      if (record.admission) {
        await transaction.admission.delete({
          where: { id: record.admission.id },
        });
      }

      await transaction.enquiry.delete({
        where: {
          id,
        },
      });

      return {
        entityType: "ENQUIRY",
        entityId: id,
        recordNumber: record.enquiryNumber,
      };
    }

    if (input.action === "deleteStudent") {
      const record = await transaction.student.findUnique({
        where: {
          id,
        },
        select: {
          studentNumber: true,
        },
      });

      if (!record) {
        throw new Error("RECORD_NOT_FOUND");
      }

      if (input.confirmation !== `DELETE ${record.studentNumber}`) {
        throw new Error("CONFIRMATION_REQUIRED");
      }

      const deleted = await deleteStudentBundle(transaction, id, {
        deleteEnquiry: false,
        deleteAttribution: false,
        testDataConfirmed: true,
      });

      return {
        entityType: "STUDENT",
        entityId: id,
        recordNumber: deleted.recordNumber,
        summary: deleted.summary,
      };
    }

    if (input.action === "deleteInvoice") {
      const record = await transaction.feeInvoice.findUnique({
        where: {
          id,
        },
        select: {
          invoiceNumber: true,
        },
      });

      if (!record) {
        throw new Error("RECORD_NOT_FOUND");
      }

      if (input.confirmation !== `DELETE ${record.invoiceNumber}`) {
        throw new Error("CONFIRMATION_REQUIRED");
      }

      const recordNumber = await deleteInvoiceBundle(transaction, id);

      return {
        entityType: "FEE_INVOICE",
        entityId: id,
        recordNumber,
      };
    }

    if (input.action === "deletePayment") {
      const record = await transaction.feePayment.findUnique({
        where: {
          id,
        },
        select: {
          paymentNumber: true,
          invoiceId: true,
        },
      });

      if (!record || record.invoiceId) {
        throw new Error("RECORD_NOT_FOUND");
      }

      if (input.confirmation !== `DELETE ${record.paymentNumber}`) {
        throw new Error("CONFIRMATION_REQUIRED");
      }

      const recordNumber = await deletePaymentBundle(transaction, id);

      return {
        entityType: "FEE_PAYMENT",
        entityId: id,
        recordNumber,
      };
    }

    const record = await transaction.expense.findUnique({
      where: {
        id,
      },
      select: {
        expenseNumber: true,
        category: true,
        invoiceNumber: true,
      },
    });

    if (!record) {
      throw new Error("RECORD_NOT_FOUND");
    }

    if (input.confirmation !== `DELETE ${record.expenseNumber}`) {
      throw new Error("CONFIRMATION_REQUIRED");
    }

    if (
      record.category === "SALARY" &&
      record.invoiceNumber &&
      (await transaction.staffPayroll.count({
        where: { payrollNumber: record.invoiceNumber },
      })) > 0
    ) {
      throw new Error("LINKED_PAYROLL");
    }

    await transaction.expense.delete({
      where: {
        id,
      },
    });

    return {
      entityType: "EXPENSE",
      entityId: id,
      recordNumber: record.expenseNumber,
    };
  });

  await prisma.activityLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: "DELETED",
      entityType: result.entityType,
      entityId: result.entityId,
      description: `Owner permanently deleted ${result.recordNumber} from Data & History.`,
    },
  });

  return {
    message:
      "summary" in result && result.summary
        ? summaryMessage(result.summary)
        : `${result.recordNumber} and its linked records were permanently removed.`,
  };
}

function jsonSafe(_key: string, value: unknown) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Uint8Array) {
    return {
      encoding: "base64",
      byteLength: value.byteLength,
      data: Buffer.from(value).toString("base64"),
    };
  }

  return value;
}

export async function createDataControlBackup() {
  const [enquiries, students, expenses, activityLogs] = await Promise.all([
    prisma.enquiry.findMany({
      include: {
        followUps: true,
        websiteSubmissions: true,
        admission: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.student.findMany({
      include: {
        admission: true,
        enrollmentContract: {
          include: {
            services: true,
          },
        },
        guardians: true,
        feeAccounts: true,
        feeInvoices: {
          include: {
            payments: {
              include: {
                receipt: true,
              },
            },
            daycareSessions: true,
          },
        },
        payments: {
          include: {
            receipt: true,
          },
        },
        receipts: true,
        attendanceRecords: true,
        documents: true,
        daycarePlans: true,
        daycareSessions: true,
        ledgerCharges: true,
        financialCorrections: true,
        whatsappMessages: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.expense.findMany({
      orderBy: {
        expenseDate: "asc",
      },
    }),
    prisma.activityLog.findMany({
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const [
    programmeDefinitions,
    daycarePlanDefinitions,
    mealDefinitions,
    mealCombinations,
    chargeDefinitions,
    legacyProgrammeFees,
    legacyDaycareRates,
    notifications,
  ] = await Promise.all([
    prisma.programmeDefinition.findMany({
      include: { feeVersions: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.daycarePlanDefinition.findMany({
      include: { priceVersions: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.mealDefinition.findMany({
      include: { priceVersions: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.mealCombination.findMany({
      include: { items: true, priceVersions: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.chargeDefinition.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.programmeFeeSetting.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.daycareRateSetting.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.adminNotification.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return JSON.stringify(
    {
      backupType: "Kidzee CentreOS pre-deletion data export",
      generatedAt: new Date().toISOString(),
      documentFiles:
        "Student document files are included as base64 so this is a complete backup.",
      enquiries,
      students,
      expenses,
      activityLogs,
      catalogue: {
        programmeDefinitions,
        daycarePlanDefinitions,
        mealDefinitions,
        mealCombinations,
        chargeDefinitions,
        legacyProgrammeFees,
        legacyDaycareRates,
      },
      notifications,
    },
    jsonSafe,
    2,
  );
}
