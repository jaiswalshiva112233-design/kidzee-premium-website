import type {
  $Enums,
  Prisma,
} from "@/generated/prisma/client";
import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import {
  allocateReportAmount,
  getCategoryAllocationBasis,
  normalisePaymentComponents,
} from "@/lib/admin/financial-report-allocation";
import { hasAdminPermissionRequirement } from "@/lib/admin/permissions";
import {
  buildOperationalReport,
  isOperationalReportType,
} from "@/lib/admin/operational-report-data";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_TYPES = [
  "total-fees",
  "preschool-fees",
  "admission-fees",
  "annual-fees",
  "daycare-fees",
  "daycare-hourly-fees",
  "daycare-lunch-fees",
  "daycare-snack-fees",
  "daycare-combo-fees",
  "late-fees",
  "pending-fees",
  "gst-summary",
  "expenses",
  "net-income",
  "receipt-register",
  "student-register",
  "admission-register",
  "enquiry-register",
  "attendance-register",
  "staff-register",
  "staff-attendance-register",
  "staff-leave-register",
  "staff-extra-duty-register",
  "payroll-register",
] as const;

const REPORT_RANGES = [
  "month",
  "quarter",
  "year",
  "all",
] as const;

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "PARTIALLY_PAID",
  "CANCELLED",
  "REFUNDED",
] as const;

const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
] as const;

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

const EXPENSE_CATEGORIES = [
  "RENT",
  "GST",
  "SALARY",
  "ELECTRICITY",
  "FOOD",
  "SECURITY",
  "MAINTENANCE",
  "MARKETING",
  "STATIONERY",
  "ACTIVITIES",
  "TRANSPORT",
  "PROFESSIONAL_FEES",
  "SOFTWARE",
  "EQUIPMENT",
  "OTHER",
] as const;

const RECEIPT_STATUSES = [
  "ISSUED",
  "CANCELLED",
  "REFUNDED",
] as const;

type ReportType =
  (typeof REPORT_TYPES)[number];

type ReportRange =
  (typeof REPORT_RANGES)[number];

type DateFilter = {
  gte?: Date;
  lte?: Date;
};

type SchoolProfile = {
  schoolName: string;
  centreName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  centreHeadName: string;
  centreHeadDesignation: string;
};

type ReportFilters = {
  paymentStatus?: $Enums.PaymentStatus;
  paymentMethod?: $Enums.PaymentMethod;
  feeCategory?: $Enums.FeeCategory;
  expenseCategory?: $Enums.ExpenseCategory;
  receiptStatus?: $Enums.ReceiptStatus;
};

type SummaryItem = {
  label: string;
  value: string;
  tone?:
    | "purple"
    | "green"
    | "red"
    | "amber"
    | "blue";
};

type TableColumn = {
  label: string;
  weight: number;
  align?: "left" | "center" | "right";
};

type ReportData = {
  title: string;
  description: string;
  periodLabel: string;
  columns: TableColumn[];
  rows: string[][];
  summaries: SummaryItem[];
  notes?: string[];
};

type FeeReportConfiguration = {
  title: string;
  description: string;
  categories?: $Enums.FeeCategory[];
  pendingOnly?: boolean;
  lateFeeOnly?: boolean;
};

const receivedPaymentStatuses:
  $Enums.PaymentStatus[] = [
    "PAID",
    "PARTIALLY_PAID",
  ];

const daycareFeeCategories:
  $Enums.FeeCategory[] = [
    "DAYCARE_FEE",
    "DAYCARE_LUNCH_FEE",
    "DAYCARE_EVENING_SNACK_FEE",
    "DAYCARE_MEAL_COMBO_FEE",
  ];

const feeReportConfigurations:
  Partial<
    Record<
      ReportType,
      FeeReportConfiguration
    >
  > = {
    "total-fees": {
      title: "Total Fees Received",
      description:
        "Complete fee collection register for the selected period.",
    },

    "preschool-fees": {
      title: "Preschool Fees Received",
      description:
        "Monthly preschool fee collection for the selected period.",
      categories: [
        "MONTHLY_PRESCHOOL_FEE",
      ],
    },

    "admission-fees": {
      title: "Admission Fees Received",
      description:
        "Admission fee collection for the selected period.",
      categories: ["ADMISSION_FEE"],
    },

    "annual-fees": {
      title: "Annual Fees Received",
      description:
        "Annual fee collection for the selected period.",
      categories: ["ANNUAL_FEE"],
    },

    "daycare-fees": {
      title: "Total Daycare Fees Received",
      description:
        "Combined daycare hourly, lunch, evening-snack and meal-combo collections.",
      categories: daycareFeeCategories,
    },

    "daycare-hourly-fees": {
      title: "Daycare Hourly Fees",
      description:
        "Daycare hourly fee collection for the selected period.",
      categories: ["DAYCARE_FEE"],
    },

    "daycare-lunch-fees": {
      title: "Daycare Lunch Fees",
      description:
        "Daycare lunch-plan collection for the selected period.",
      categories: [
        "DAYCARE_LUNCH_FEE",
      ],
    },

    "daycare-snack-fees": {
      title:
        "Daycare Evening-Snack Fees",
      description:
        "Daycare evening-snack plan collection for the selected period.",
      categories: [
        "DAYCARE_EVENING_SNACK_FEE",
      ],
    },

    "daycare-combo-fees": {
      title:
        "Daycare Lunch + Snack Fees",
      description:
        "Combined lunch and evening-snack plan collection for the selected period.",
      categories: [
        "DAYCARE_MEAL_COMBO_FEE",
      ],
    },

    "late-fees": {
      title: "Late Fees Collected",
      description:
        "Late fees collected with school-fee payments.",
      lateFeeOnly: true,
    },

    "pending-fees": {
      title: "Pending Fee Register",
      description:
        "Outstanding balances recorded against student fee payments.",
      pendingOnly: true,
    },
  };

const labelOverrides: Record<
  string,
  string
> = {
  JUNIOR_KG: "Junior KG",
  SENIOR_KG: "Senior KG",
  UPI: "UPI",
  GST: "GST",
  BANK_TRANSFER: "Bank Transfer",
  PARTIALLY_PAID: "Partially Paid",
  MONTHLY_PRESCHOOL_FEE:
    "Monthly Preschool Fee",
  ADMISSION_FEE: "Admission Fee",
  ANNUAL_FEE: "Annual Fee",
  DAYCARE_FEE: "Daycare Hourly Fee",
  DAYCARE_LUNCH_FEE:
    "Daycare Lunch Fee",
  DAYCARE_EVENING_SNACK_FEE:
    "Daycare Evening Snack Fee",
  DAYCARE_MEAL_COMBO_FEE:
    "Daycare Lunch + Snack Fee",
  FOOD_FEE: "Food Fee",
  LATE_FEE: "Late Fee",
  ACTIVITY_FEE: "Activity Fee",
  KIT_FEE: "Kit Fee",
  PROFESSIONAL_FEES:
    "Professional Fees",
};

function cleanText(value: string | null) {
  return value?.trim() ?? "";
}

function isOneOf<
  T extends readonly string[],
>(
  value: string,
  options: T,
): value is T[number] {
  return (
    options as readonly string[]
  ).includes(value);
}

function formatLabel(
  value: string | null | undefined,
) {
  if (!value) {
    return "";
  }

  if (labelOverrides[value]) {
    return labelOverrides[value];
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(
  value: Date | null | undefined,
) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(value);
}

function formatDateTime(
  value: Date | null | undefined,
) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  ).format(value);
}

function formatMoney(value: unknown) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0,
  );
}

function formatInr(value: unknown) {
  return `INR ${formatMoney(value)}`;
}

function getStudentName(student: {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
}) {
  return [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getJsonText(
  value: Record<string, unknown>,
  key: string,
) {
  const item = value[key];

  return typeof item === "string"
    ? item.trim()
    : "";
}

async function getSchoolProfile():
  Promise<SchoolProfile> {
  const setting =
    await prisma.centreSetting.findUnique({
      where: {
        key: "SCHOOL_PROFILE",
      },
    });

  const value = isRecord(setting?.value)
    ? setting.value
    : {};

  const address = [
    getJsonText(value, "addressLine1"),
    getJsonText(value, "addressLine2"),
    getJsonText(value, "locality"),
    getJsonText(value, "city"),
    getJsonText(value, "state"),
    getJsonText(value, "postalCode"),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    schoolName:
      getJsonText(value, "schoolName") ||
      "Kidzee Preschool & Daycare",

    centreName:
      getJsonText(value, "centreName") ||
      "Kidzee Sector 12, Dwarka",

    address:
      address ||
      "Plot No. 19, Block B, Sector 12B, Dwarka, New Delhi",

    phone:
      getJsonText(value, "phone") ||
      "9667038673",

    email:
      getJsonText(value, "email") ||
      "kidzeepreschoolsector12@gmail.com",

    gstNumber:
      getJsonText(value, "gstNumber"),

    centreHeadName:
      getJsonText(
        value,
        "centreHeadName",
      ),

    centreHeadDesignation:
      getJsonText(
        value,
        "centreHeadDesignation",
      ) || "Centre Head",
  };
}

function parseCustomDate(
  value: string,
  endOfDay: boolean,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const time = endOfDay
    ? "23:59:59.999"
    : "00:00:00.000";

  const date = new Date(
    `${value}T${time}+05:30`,
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function getIndiaDateParts(date: Date) {
  const parts =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [
      part.type,
      part.value,
    ]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function createIndiaDate(
  year: number,
  month: number,
  day: number,
) {
  return new Date(
    `${year}-${String(month).padStart(
      2,
      "0",
    )}-${String(day).padStart(
      2,
      "0",
    )}T00:00:00.000+05:30`,
  );
}

function getReportPeriod(
  searchParams: URLSearchParams,
) {
  const fromValue = cleanText(
    searchParams.get("from"),
  );

  const toValue = cleanText(
    searchParams.get("to"),
  );

  const customFrom = parseCustomDate(
    fromValue,
    false,
  );

  const customTo = parseCustomDate(
    toValue,
    true,
  );

  if (customFrom || customTo) {
    const filter: DateFilter = {};

    if (customFrom) {
      filter.gte = customFrom;
    }

    if (customTo) {
      filter.lte = customTo;
    }

    const label =
      customFrom && customTo
        ? `${formatDate(
            customFrom,
          )} to ${formatDate(customTo)}`
        : customFrom
          ? `From ${formatDate(
              customFrom,
            )}`
          : `Up to ${formatDate(
              customTo,
            )}`;

    return {
      filter,
      label,
      token: "custom",
    };
  }

  const rangeValue = cleanText(
    searchParams.get("range"),
  );

  const range: ReportRange =
    isOneOf(
      rangeValue,
      REPORT_RANGES,
    )
      ? rangeValue
      : "month";

  if (range === "all") {
    return {
      filter: undefined,
      label: "All available records",
      token: "all-time",
    };
  }

  const now = new Date();

  const {
    year,
    month,
  } = getIndiaDateParts(now);

  let startDate: Date;

  if (range === "year") {
    startDate = createIndiaDate(
      year,
      1,
      1,
    );
  } else if (range === "quarter") {
    const quarterStart =
      Math.floor((month - 1) / 3) *
        3 +
      1;

    startDate = createIndiaDate(
      year,
      quarterStart,
      1,
    );
  } else {
    startDate = createIndiaDate(
      year,
      month,
      1,
    );
  }

  return {
    filter: {
      gte: startDate,
      lte: now,
    } satisfies DateFilter,

    label: `${formatDate(
      startDate,
    )} to ${formatDate(now)}`,

    token: range,
  };
}

function getReportFilters(
  searchParams: URLSearchParams,
): ReportFilters {
  const paymentStatusValue = cleanText(
    searchParams.get("paymentStatus"),
  );

  const paymentMethodValue = cleanText(
    searchParams.get("paymentMethod"),
  );

  const feeCategoryValue = cleanText(
    searchParams.get("feeCategory"),
  );

  const expenseCategoryValue =
    cleanText(
      searchParams.get(
        "expenseCategory",
      ),
    );

  const receiptStatusValue = cleanText(
    searchParams.get("receiptStatus"),
  );

  return {
    paymentStatus: isOneOf(
      paymentStatusValue,
      PAYMENT_STATUSES,
    )
      ? paymentStatusValue
      : undefined,

    paymentMethod: isOneOf(
      paymentMethodValue,
      PAYMENT_METHODS,
    )
      ? paymentMethodValue
      : undefined,

    feeCategory: isOneOf(
      feeCategoryValue,
      FEE_CATEGORIES,
    )
      ? feeCategoryValue
      : undefined,

    expenseCategory: isOneOf(
      expenseCategoryValue,
      EXPENSE_CATEGORIES,
    )
      ? expenseCategoryValue
      : undefined,

    receiptStatus: isOneOf(
      receiptStatusValue,
      RECEIPT_STATUSES,
    )
      ? receiptStatusValue
      : undefined,
  };
}

function createFeeWhere(
  reportType: ReportType,
  dateFilter: DateFilter | undefined,
  filters: ReportFilters,
) {
  const configuration =
    feeReportConfigurations[
      reportType
    ];

  if (!configuration) {
    throw new Error(
      "Invalid fee report configuration.",
    );
  }

  const where:
    Prisma.FeePaymentWhereInput = {};

  if (dateFilter) {
    where.paymentDate = dateFilter;
  }

  if (filters.paymentMethod) {
    where.paymentMethod =
      filters.paymentMethod;
  }

  if (configuration.pendingOnly) {
    where.status = {
      in: [
        "PENDING",
        "PARTIALLY_PAID",
      ],
    };

    where.pendingAmount = {
      gt: 0,
    };
  } else {
    where.status =
      filters.paymentStatus ?? {
        in: receivedPaymentStatuses,
      };

    where.amountReceived = {
      gt: 0,
    };
  }

  // Category filtering is applied after itemised invoice lines are loaded.
  // A single combined receipt can contain preschool, daycare and food lines.

  if (configuration.lateFeeOnly) {
    where.lateFeeAmount = {
      gt: 0,
    };
  }

  return {
    where,
    configuration,
  };
}

async function buildFeeReport(
  reportType: ReportType,
  dateFilter: DateFilter | undefined,
  periodLabel: string,
  filters: ReportFilters,
): Promise<ReportData> {
  const reportConfiguration =
    feeReportConfigurations[
      reportType
    ];

  if (reportConfiguration?.pendingOnly) {
    const pendingWhere:
      Prisma.FeeInvoiceWhereInput = {
        status: {
          in: [
            "DUE",
            "PARTIALLY_PAID",
            "OVERDUE",
          ],
        },
        pendingAmount: {
          gt: 0,
        },
      };

    if (dateFilter) {
      pendingWhere.issueDate = dateFilter;
    }

    if (
      filters.paymentStatus ===
      "PARTIALLY_PAID"
    ) {
      pendingWhere.status =
        "PARTIALLY_PAID";
    } else if (
      filters.paymentStatus === "PENDING"
    ) {
      pendingWhere.status = {
        in: ["DUE", "OVERDUE"],
      };
    } else if (filters.paymentStatus) {
      pendingWhere.id = "__no_pending_invoice_for_selected_status__";
    }

    if (filters.paymentMethod) {
      pendingWhere.payments = {
        some: {
          paymentMethod: filters.paymentMethod,
          status: {
            in: receivedPaymentStatuses,
          },
        },
      };
    }

    const invoices =
      await prisma.feeInvoice.findMany({
        where: pendingWhere,
        include: {
          student: {
            select: {
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
            dueDate: "asc",
          },
          {
            issueDate: "desc",
          },
        ],
      });

    const pendingEntries = invoices.flatMap((invoice) => {
      const basis = getCategoryAllocationBasis({
        items: invoice.items.map((item) => ({
          category: item.category,
          title: item.title,
          totalAmount: Number(item.totalAmount),
          cgstAmount: Number(item.cgstAmount),
          sgstAmount: Number(item.sgstAmount),
        })),
        selectedCategories: filters.feeCategory
          ? [filters.feeCategory]
          : null,
        fallbackCategory: invoice.category,
        lateFeeAmount: Number(invoice.lateFeeAmount),
        invoiceTotalAmount: Number(invoice.totalAmount),
      });

      if (!basis) return [];

      return [
        {
          invoice,
          feeType:
            basis.feeType || formatLabel(invoice.category),
          billed: allocateReportAmount(
            Number(invoice.totalAmount),
            basis.grossShare,
          ),
          paid: allocateReportAmount(
            Number(invoice.paidAmount),
            basis.grossShare,
          ),
          pending: allocateReportAmount(
            Number(invoice.pendingAmount),
            basis.grossShare,
          ),
          gst: allocateReportAmount(
            Number(invoice.cgstAmount) + Number(invoice.sgstAmount),
            basis.gstShare,
          ),
        },
      ];
    });

    const totals = pendingEntries.reduce(
      (result, entry) => ({
        billed:
          result.billed +
          entry.billed,
        paid:
          result.paid +
          entry.paid,
        pending:
          result.pending +
          entry.pending,
        gst:
          result.gst +
          entry.gst,
      }),
      {
        billed: 0,
        paid: 0,
        pending: 0,
        gst: 0,
      },
    );

    const todayParts = getIndiaDateParts(new Date());
    const today = createIndiaDate(
      todayParts.year,
      todayParts.month,
      todayParts.day,
    );

    const overdueCount = pendingEntries.filter(
      ({ invoice }) =>
        invoice.dueDate < today,
    ).length;

    return {
      title: reportConfiguration.title,
      description:
        "Outstanding balances from the live student invoice ledger.",
      periodLabel,
      summaries: [
        {
          label: "Outstanding Invoices",
          value: pendingEntries.length.toString(),
          tone: "purple",
        },
        {
          label: "Total Billed",
          value: formatInr(totals.billed),
          tone: "blue",
        },
        {
          label: "Amount Paid",
          value: formatInr(totals.paid),
          tone: "green",
        },
        {
          label: "Pending Balance",
          value: formatInr(totals.pending),
          tone: "amber",
        },
        {
          label: "Overdue Invoices",
          value: overdueCount.toString(),
          tone: overdueCount > 0
            ? "red"
            : "green",
        },
        {
          label: "GST Included",
          value: formatInr(totals.gst),
          tone: "purple",
        },
      ],
      columns: [
        { label: "Issue Date", weight: 0.7 },
        { label: "Due Date", weight: 0.7 },
        { label: "Invoice No.", weight: 0.95 },
        { label: "Student", weight: 1.55 },
        { label: "Fee Type", weight: 1.1 },
        { label: "Period", weight: 0.85 },
        { label: "Status", weight: 0.75 },
        {
          label: "GST",
          weight: 0.6,
          align: "right",
        },
        {
          label: "Total",
          weight: 0.75,
          align: "right",
        },
        {
          label: "Paid",
          weight: 0.75,
          align: "right",
        },
        {
          label: "Pending",
          weight: 0.8,
          align: "right",
        },
      ],
      rows: pendingEntries.map(({ invoice, feeType, billed, paid, pending, gst }) => {
        const displayStatus =
          invoice.dueDate < today &&
          invoice.status !== "OVERDUE"
            ? "OVERDUE"
            : invoice.status;

        return [
          formatDate(invoice.issueDate),
          formatDate(invoice.dueDate),
          invoice.invoiceNumber,
          `${getStudentName(
            invoice.student,
          )} (${invoice.student.studentNumber}) - ${formatLabel(
            invoice.student.programme,
          )}`,
          feeType,
          invoice.feePeriodLabel,
          formatLabel(displayStatus),
          formatMoney(gst),
          formatMoney(billed),
          formatMoney(paid),
          formatMoney(pending),
        ];
      }),
      notes: [
        "Balances come from the live FeeInvoice ledger, so partial payments, cancellations and refunds remain accurate.",
        "The selected period uses the invoice issue date. GST is included in the invoice total.",
      ],
    };
  }

  const {
    where,
    configuration,
  } = createFeeWhere(
    reportType,
    dateFilter,
    filters,
  );

  const payments =
    await prisma.feePayment.findMany({
      where,

      include: {
        student: {
          select: {
            studentNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            programme: true,
          },
        },

        receipt: {
          select: {
            receiptNumber: true,
          },
        },

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
    });

  const selectedCategories =
    configuration.lateFeeOnly
      ? (["LATE_FEE"] as const)
      : configuration.categories &&
    configuration.categories.length > 0
      ? configuration.categories
      : filters.feeCategory
        ? [filters.feeCategory]
        : null;

  const reportEntries =
    payments.flatMap((payment) => {
      const invoiceItems =
        payment.invoice?.items ?? [];
      const basis = getCategoryAllocationBasis({
        items: invoiceItems.map((item) => ({
          category: item.category,
          title: item.title,
          totalAmount: Number(item.totalAmount),
          cgstAmount: Number(item.cgstAmount),
          sgstAmount: Number(item.sgstAmount),
        })),
        selectedCategories,
        fallbackCategory: payment.category,
        lateFeeAmount: Number(payment.lateFeeAmount),
        invoiceTotalAmount: Number(payment.totalAmount),
      });

      if (!basis) return [];

      const normalised = normalisePaymentComponents({
        amountReceived: Number(payment.amountReceived),
        totalAmount: Number(payment.totalAmount),
        cgstAmount: Number(payment.cgstAmount),
        sgstAmount: Number(payment.sgstAmount),
        lateFeeAmount: Number(payment.lateFeeAmount),
      });
      const lateFeeReport =
        selectedCategories?.includes("LATE_FEE") ?? false;

      return [
        {
          payment,
          feeType:
            basis.feeType || formatLabel(payment.category),
          totalAmount: lateFeeReport
            ? normalised.lateFeeAmount
            : allocateReportAmount(
                normalised.amountReceived,
                basis.grossShare,
              ),
          received: lateFeeReport
            ? normalised.lateFeeAmount
            : allocateReportAmount(
                normalised.amountReceived,
                basis.grossShare,
              ),
          pending: lateFeeReport
            ? 0
            : allocateReportAmount(
                Number(payment.pendingAmount),
                basis.grossShare,
              ),
          discount: lateFeeReport
            ? 0
            : allocateReportAmount(
                Number(payment.discountAmount) * normalised.snapshotRatio,
                basis.grossShare,
              ),
          lateFee: lateFeeReport
            ? normalised.lateFeeAmount
            : allocateReportAmount(
                normalised.lateFeeAmount,
                basis.grossShare,
              ),
          cgst: allocateReportAmount(
            normalised.cgstAmount,
            basis.gstShare,
          ),
          sgst: allocateReportAmount(
            normalised.sgstAmount,
            basis.gstShare,
          ),
        },
      ];
    });

  const distinctPendingByInvoice = new Map<string, number>();

  for (const entry of reportEntries) {
    const invoice = entry.payment.invoice;

    if (!invoice || distinctPendingByInvoice.has(invoice.id)) continue;

    const basis = getCategoryAllocationBasis({
      items: invoice.items.map((item) => ({
        category: item.category,
        title: item.title,
        totalAmount: Number(item.totalAmount),
        cgstAmount: Number(item.cgstAmount),
        sgstAmount: Number(item.sgstAmount),
      })),
      selectedCategories,
      fallbackCategory: invoice.category,
      lateFeeAmount: Number(invoice.lateFeeAmount),
      invoiceTotalAmount: Number(invoice.totalAmount),
    });

    if (basis) {
      distinctPendingByInvoice.set(
        invoice.id,
        selectedCategories?.includes("LATE_FEE")
          ? 0
          : allocateReportAmount(
              Number(invoice.pendingAmount),
              basis.grossShare,
            ),
      );
    }
  }

  const totals = reportEntries.reduce(
    (result, entry) => ({
      totalAmount:
        result.totalAmount +
        entry.totalAmount,

      received:
        result.received +
        entry.received,

      pending:
        result.pending,

      discount:
        result.discount +
        entry.discount,

      lateFee:
        result.lateFee +
        entry.lateFee,

      cgst:
        result.cgst +
        entry.cgst,

      sgst:
        result.sgst +
        entry.sgst,
    }),

    {
      totalAmount: 0,
      received: 0,
      pending: 0,
      discount: 0,
      lateFee: 0,
      cgst: 0,
      sgst: 0,
    },
  );

  totals.pending = [...distinctPendingByInvoice.values()].reduce(
    (sum, value) => sum + value,
    0,
  );

  return {
    title: configuration.title,
    description:
      configuration.description,
    periodLabel,

    summaries: [
      {
        label: "Payment Records",
        value: reportEntries.length.toString(),
        tone: "purple",
      },
      {
        label: "Amount Received",
        value: formatInr(
          totals.received,
        ),
        tone: "green",
      },
      {
        label: "Pending Balance",
        value: formatInr(
          totals.pending,
        ),
        tone: "amber",
      },
      {
        label: "Late Fee",
        value: formatInr(
          totals.lateFee,
        ),
        tone: "blue",
      },
      {
        label: "Discounts",
        value: formatInr(
          totals.discount,
        ),
        tone: "red",
      },
      {
        label: "Total GST",
        value: formatInr(
          totals.cgst + totals.sgst,
        ),
        tone: "purple",
      },
    ],

    columns: [
      {
        label: "Date",
        weight: 0.75,
      },
      {
        label: "Payment No.",
        weight: 0.95,
      },
      {
        label: "Student",
        weight: 1.35,
      },
      {
        label: "Programme",
        weight: 0.85,
      },
      {
        label: "Fee Type",
        weight: 1.25,
      },
      {
        label: "Period",
        weight: 0.95,
      },
      {
        label: "Method",
        weight: 0.75,
      },
      {
        label: "Status",
        weight: 0.8,
      },
      {
        label: "GST",
        weight: 0.65,
        align: "right",
      },
      {
        label: "Received",
        weight: 0.85,
        align: "right",
      },
      {
        label: "Pending",
        weight: 0.8,
        align: "right",
      },
    ],

    rows: reportEntries.map(
      (entry) => [
        formatDate(
          entry.payment.paymentDate,
        ),
        entry.payment.paymentNumber,
        `${getStudentName(
          entry.payment.student,
        )} (${entry.payment.student.studentNumber})`,
        formatLabel(
          entry.payment.student.programme,
        ),
        entry.feeType,
        entry.payment.feePeriodLabel ?? "-",
        formatLabel(
          entry.payment.paymentMethod,
        ),
        formatLabel(
          entry.payment.status,
        ),
        formatMoney(
          entry.cgst +
            entry.sgst,
        ),
        formatMoney(
          entry.received,
        ),
        formatMoney(
          entry.pending,
        ),
      ],
    ),

    notes: [
      "Amounts shown under GST are included within the recorded fee total.",
      "Cancelled and refunded payments are excluded unless selected explicitly.",
    ],
  };
}

async function buildExpenseReport(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
  filters: ReportFilters,
): Promise<ReportData> {
  const where:
    Prisma.ExpenseWhereInput = {};

  if (dateFilter) {
    where.expenseDate = dateFilter;
  }

  if (filters.expenseCategory) {
    where.category =
      filters.expenseCategory;
  }

  if (filters.paymentMethod) {
    where.paymentMethod =
      filters.paymentMethod;
  }

  const expenses =
    await prisma.expense.findMany({
      where,

      orderBy: {
        expenseDate: "desc",
      },
    });

  const totals = expenses.reduce(
    (result, expense) => ({
      taxable:
        result.taxable +
        Number(
          expense.amountBeforeTax,
        ),

      cgst:
        result.cgst +
        Number(expense.cgstAmount),

      sgst:
        result.sgst +
        Number(expense.sgstAmount),

      total:
        result.total +
        Number(expense.totalAmount),
    }),

    {
      taxable: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
    },
  );

  return {
    title: "Expense Register",
    description:
      "Complete centre expense report for the selected period.",
    periodLabel,

    summaries: [
      {
        label: "Expense Records",
        value: expenses.length.toString(),
        tone: "purple",
      },
      {
        label: "Total Expenses",
        value: formatInr(totals.total),
        tone: "red",
      },
      {
        label: "Amount Before Tax",
        value: formatInr(
          totals.taxable,
        ),
        tone: "blue",
      },
      {
        label: "Input GST",
        value: formatInr(
          totals.cgst + totals.sgst,
        ),
        tone: "amber",
      },
    ],

    columns: [
      {
        label: "Date",
        weight: 0.75,
      },
      {
        label: "Expense No.",
        weight: 0.95,
      },
      {
        label: "Category",
        weight: 1,
      },
      {
        label: "Title",
        weight: 1.4,
      },
      {
        label: "Vendor",
        weight: 1.1,
      },
      {
        label: "Method",
        weight: 0.8,
      },
      {
        label: "Invoice",
        weight: 0.85,
      },
      {
        label: "Before Tax",
        weight: 0.85,
        align: "right",
      },
      {
        label: "CGST",
        weight: 0.65,
        align: "right",
      },
      {
        label: "SGST",
        weight: 0.65,
        align: "right",
      },
      {
        label: "Total",
        weight: 0.85,
        align: "right",
      },
    ],

    rows: expenses.map(
      (expense) => [
        formatDate(expense.expenseDate),
        expense.expenseNumber,
        formatLabel(expense.category),
        expense.title,
        expense.vendorName ?? "-",
        formatLabel(
          expense.paymentMethod,
        ),
        expense.invoiceNumber ?? "-",
        formatMoney(
          expense.amountBeforeTax,
        ),
        formatMoney(expense.cgstAmount),
        formatMoney(expense.sgstAmount),
        formatMoney(expense.totalAmount),
      ],
    ),

    notes: [
      "Input GST is shown from expenses marked as GST applicable.",
      "Invoice references remain available in the CentreOS expense record.",
    ],
  };
}

async function buildGstReport(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
  filters: ReportFilters,
): Promise<ReportData> {
  const feeWhere:
    Prisma.FeePaymentWhereInput = {
      gstApplicable: true,

      amountReceived: {
        gt: 0,
      },

      status: {
        in: receivedPaymentStatuses,
      },
    };

  const expenseWhere:
    Prisma.ExpenseWhereInput = {
      gstApplicable: true,
    };

  if (dateFilter) {
    feeWhere.paymentDate = dateFilter;
    expenseWhere.expenseDate =
      dateFilter;
  }

  if (filters.paymentMethod) {
    feeWhere.paymentMethod =
      filters.paymentMethod;

    expenseWhere.paymentMethod =
      filters.paymentMethod;
  }


  if (filters.paymentStatus) {
    feeWhere.status = receivedPaymentStatuses.includes(filters.paymentStatus)
      ? filters.paymentStatus
      : { in: [] };
  }

  if (filters.expenseCategory) {
    expenseWhere.category =
      filters.expenseCategory;
  }

  const [
    payments,
    expenses,
  ] = await Promise.all([
    prisma.feePayment.findMany({
      where: feeWhere,

      include: {
        student: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            studentNumber: true,
          },
        },
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
    }),

    prisma.expense.findMany({
      where: expenseWhere,

      orderBy: {
        expenseDate: "desc",
      },
    }),
  ]);

  const feeEntries = payments.flatMap((payment) => {
    const normalised = normalisePaymentComponents({
      amountReceived: Number(payment.amountReceived),
      totalAmount: Number(payment.totalAmount),
      cgstAmount: Number(payment.cgstAmount),
      sgstAmount: Number(payment.sgstAmount),
      lateFeeAmount: Number(payment.lateFeeAmount),
    });
    const invoiceItems = payment.invoice?.items ?? [];
    const gstItems = invoiceItems.filter(
      (item) =>
        item.gstApplicable &&
        Number(item.cgstAmount) + Number(item.sgstAmount) > 0,
    );
    const matchingItems = filters.feeCategory
      ? gstItems.filter((item) => item.category === filters.feeCategory)
      : gstItems;

    if (invoiceItems.length === 0) {
      if (
        (filters.feeCategory && payment.category !== filters.feeCategory) ||
        normalised.cgstAmount + normalised.sgstAmount <= 0
      ) {
        return [];
      }

      const taxableValue = Math.max(
        normalised.amountReceived -
          normalised.cgstAmount -
          normalised.sgstAmount,
        0,
      );

      return [
        {
          payment,
          categoryLabel: formatLabel(payment.category),
          gstRateLabel:
            payment.gstRate == null
              ? "Item-wise"
              : `${formatMoney(payment.gstRate)}%`,
          taxableValue,
          cgst: normalised.cgstAmount,
          sgst: normalised.sgstAmount,
          total: taxableValue + normalised.cgstAmount + normalised.sgstAmount,
        },
      ];
    }

    if (matchingItems.length === 0) return [];

    const invoiceGstTotal = gstItems.reduce(
      (sum, item) =>
        sum + Number(item.cgstAmount) + Number(item.sgstAmount),
      0,
    );

    return matchingItems.map((item) => {
      const itemGst = Number(item.cgstAmount) + Number(item.sgstAmount);
      const gstShare = invoiceGstTotal > 0 ? itemGst / invoiceGstTotal : 0;
      const cgst = allocateReportAmount(normalised.cgstAmount, gstShare);
      const sgst = allocateReportAmount(normalised.sgstAmount, gstShare);
      const gstRate = Number(item.gstRate ?? 0);
      const taxableValue =
        gstRate > 0
          ? allocateReportAmount((cgst + sgst) * 100, 1 / gstRate)
          : 0;

      return {
        payment,
        categoryLabel: item.title,
        gstRateLabel: gstRate > 0 ? `${formatMoney(gstRate)}%` : "Item-wise",
        taxableValue,
        cgst,
        sgst,
        total: taxableValue + cgst + sgst,
      };
    });
  });

  const outputCgst = feeEntries.reduce(
    (total, entry) => total + entry.cgst,
    0,
  );

  const outputSgst = feeEntries.reduce(
    (total, entry) => total + entry.sgst,
    0,
  );

  const inputCgst = expenses.reduce(
    (total, expense) =>
      total +
      Number(expense.cgstAmount),
    0,
  );

  const inputSgst = expenses.reduce(
    (total, expense) =>
      total +
      Number(expense.sgstAmount),
    0,
  );

  const outputGst =
    outputCgst + outputSgst;

  const inputGst =
    inputCgst + inputSgst;

  const netGst = outputGst - inputGst;

  const feeRows = feeEntries.map(
    (entry) => {
      const { payment } = entry;
      return {
        date: payment.paymentDate,
        row: [
          formatDate(
            payment.paymentDate,
          ),
          "Fee Collection",
          payment.paymentNumber,
          `${getStudentName(
            payment.student,
          )} (${payment.student.studentNumber})`,
          entry.categoryLabel,
          entry.gstRateLabel,
          formatMoney(entry.taxableValue),
          formatMoney(entry.cgst),
          formatMoney(entry.sgst),
          formatMoney(entry.total),
        ],
      };
    },
  );

  const expenseRows = expenses.map(
    (expense) => ({
      date: expense.expenseDate,

      row: [
        formatDate(expense.expenseDate),
        "Expense",
        expense.expenseNumber,
        expense.vendorName ??
          expense.title,
        formatLabel(expense.category),
        `${formatMoney(
          expense.gstRate,
        )}%`,
        formatMoney(
          expense.amountBeforeTax,
        ),
        formatMoney(expense.cgstAmount),
        formatMoney(expense.sgstAmount),
        formatMoney(expense.totalAmount),
      ],
    }),
  );

  const rows = [
    ...feeRows,
    ...expenseRows,
  ]
    .sort(
      (left, right) =>
        right.date.getTime() -
        left.date.getTime(),
    )
    .map((item) => item.row);

  return {
    title: "GST Summary",
    description:
      "Output GST collected from fees and input GST recorded on expenses.",
    periodLabel,

    summaries: [
      {
        label: "Output GST",
        value: formatInr(outputGst),
        tone: "green",
      },
      {
        label: "Input GST",
        value: formatInr(inputGst),
        tone: "blue",
      },
      {
        label:
          netGst >= 0
            ? "Net GST Payable"
            : "Input Credit Balance",
        value: formatInr(
          Math.abs(netGst),
        ),
        tone:
          netGst >= 0
            ? "amber"
            : "purple",
      },
      {
        label: "GST Records",
        value: rows.length.toString(),
        tone: "purple",
      },
    ],

    columns: [
      {
        label: "Date",
        weight: 0.75,
      },
      {
        label: "Record Type",
        weight: 0.9,
      },
      {
        label: "Reference",
        weight: 0.95,
      },
      {
        label: "Student / Vendor",
        weight: 1.5,
      },
      {
        label: "Category",
        weight: 1.15,
      },
      {
        label: "GST Rate",
        weight: 0.65,
        align: "right",
      },
      {
        label: "Taxable",
        weight: 0.8,
        align: "right",
      },
      {
        label: "CGST",
        weight: 0.7,
        align: "right",
      },
      {
        label: "SGST",
        weight: 0.7,
        align: "right",
      },
      {
        label: "Total",
        weight: 0.85,
        align: "right",
      },
    ],

    rows,

    notes: [
      "Output GST represents GST included in fee-payment records.",
      "Input GST represents GST entered with centre expenses.",
      "Please have the final GST return reviewed by the centre's accountant or CA.",
    ],
  };
}

async function buildNetIncomeReport(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
  filters: ReportFilters,
): Promise<ReportData> {
  const feeWhere:
    Prisma.FeePaymentWhereInput = {
      amountReceived: {
        gt: 0,
      },

      status: {
        in: receivedPaymentStatuses,
      },
    };

  const expenseWhere:
    Prisma.ExpenseWhereInput = {};

  if (dateFilter) {
    feeWhere.paymentDate = dateFilter;
    expenseWhere.expenseDate =
      dateFilter;
  }

  if (filters.paymentMethod) {
    feeWhere.paymentMethod =
      filters.paymentMethod;

    expenseWhere.paymentMethod =
      filters.paymentMethod;
  }

  if (filters.paymentStatus) {
    feeWhere.status = receivedPaymentStatuses.includes(filters.paymentStatus)
      ? filters.paymentStatus
      : { in: [] };
  }

  if (filters.expenseCategory) {
    expenseWhere.category =
      filters.expenseCategory;
  }

  const [
    payments,
    expenses,
  ] = await Promise.all([
    prisma.feePayment.findMany({
      where: feeWhere,

      include: {
        student: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
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
        paymentDate: "asc",
      },
    }),

    prisma.expense.findMany({
      where: expenseWhere,

      orderBy: {
        expenseDate: "asc",
      },
    }),
  ]);

  const incomeEntries = payments.flatMap((payment) => {
    const invoiceItems = payment.invoice?.items ?? [];
    const basis = getCategoryAllocationBasis({
      items: invoiceItems.map((item) => ({
        category: item.category,
        title: item.title,
        totalAmount: Number(item.totalAmount),
        cgstAmount: Number(item.cgstAmount),
        sgstAmount: Number(item.sgstAmount),
      })),
      selectedCategories: filters.feeCategory
        ? [filters.feeCategory]
        : null,
      fallbackCategory: payment.category,
      lateFeeAmount: Number(payment.lateFeeAmount),
      invoiceTotalAmount: Number(payment.totalAmount),
    });

    if (!basis) return [];

    const normalised = normalisePaymentComponents({
      amountReceived: Number(payment.amountReceived),
      totalAmount: Number(payment.totalAmount),
      cgstAmount: Number(payment.cgstAmount),
      sgstAmount: Number(payment.sgstAmount),
      lateFeeAmount: Number(payment.lateFeeAmount),
    });
    const isLateFee = filters.feeCategory === "LATE_FEE";

    return [
      {
        payment,
        feeType: basis.feeType || formatLabel(payment.category),
        amount: isLateFee
          ? normalised.lateFeeAmount
          : allocateReportAmount(
              normalised.amountReceived,
              basis.grossShare,
            ),
      },
    ];
  });

  const income = incomeEntries.reduce(
    (total, entry) => total + entry.amount,
    0,
  );

  const expenseTotal = expenses.reduce(
    (total, expense) =>
      total +
      Number(expense.totalAmount),
    0,
  );

  const transactions = [
    ...incomeEntries.map(({ payment, feeType, amount }) => ({
      date: payment.paymentDate,
      type: "Fee Income",
      reference: payment.paymentNumber,
      details: `${getStudentName(
        payment.student,
      )} - ${feeType}`,
      method: formatLabel(
        payment.paymentMethod,
      ),
      income: amount,
      expense: 0,
    })),

    ...expenses.map((expense) => ({
      date: expense.expenseDate,
      type: "Expense",
      reference: expense.expenseNumber,
      details: `${expense.title}${
        expense.vendorName
          ? ` - ${expense.vendorName}`
          : ""
      }`,
      method: formatLabel(
        expense.paymentMethod,
      ),
      income: 0,
      expense: Number(
        expense.totalAmount,
      ),
    })),
  ].sort(
    (left, right) =>
      left.date.getTime() -
      right.date.getTime(),
  );

  let runningBalance = 0;

  const rows = transactions.map(
    (transaction) => {
      runningBalance +=
        transaction.income -
        transaction.expense;

      return [
        formatDate(transaction.date),
        transaction.type,
        transaction.reference,
        transaction.details,
        transaction.method,
        transaction.income > 0
          ? formatMoney(
              transaction.income,
            )
          : "-",
        transaction.expense > 0
          ? formatMoney(
              transaction.expense,
            )
          : "-",
        formatMoney(runningBalance),
      ];
    },
  );

  const netIncome =
    income - expenseTotal;

  return {
    title: "Income & Expense Report",
    description:
      "Combined financial movement and running balance for the selected period.",
    periodLabel,

    summaries: [
      {
        label: "Fee Income",
        value: formatInr(income),
        tone: "green",
      },
      {
        label: "Expenses",
        value: formatInr(
          expenseTotal,
        ),
        tone: "red",
      },
      {
        label:
          netIncome >= 0
            ? "Net Surplus"
            : "Net Shortfall",
        value: formatInr(
          Math.abs(netIncome),
        ),
        tone:
          netIncome >= 0
            ? "purple"
            : "amber",
      },
      {
        label: "Transactions",
        value:
          transactions.length.toString(),
        tone: "blue",
      },
    ],

    columns: [
      {
        label: "Date",
        weight: 0.75,
      },
      {
        label: "Type",
        weight: 0.8,
      },
      {
        label: "Reference",
        weight: 0.95,
      },
      {
        label: "Details",
        weight: 2,
      },
      {
        label: "Method",
        weight: 0.8,
      },
      {
        label: "Income",
        weight: 0.85,
        align: "right",
      },
      {
        label: "Expense",
        weight: 0.85,
        align: "right",
      },
      {
        label: "Balance",
        weight: 0.9,
        align: "right",
      },
    ],

    rows,

    notes: [
      "The balance is calculated from transactions inside the selected reporting period.",
      "This report does not replace statutory financial statements prepared by a CA.",
    ],
  };
}

async function buildReceiptReport(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
  filters: ReportFilters,
): Promise<ReportData> {
  const where:
    Prisma.ReceiptWhereInput = {};

  if (dateFilter) {
    where.issuedAt = dateFilter;
  }

  if (filters.receiptStatus) {
    where.status =
      filters.receiptStatus;
  }

  if (
    filters.paymentMethod ||
    filters.paymentStatus
  ) {
    where.payment = {
      ...(filters.paymentMethod
        ? {
            paymentMethod:
              filters.paymentMethod,
          }
        : {}),

      ...(filters.paymentStatus
        ? {
            status:
              filters.paymentStatus,
          }
        : {}),

    };
  }

  const receipts =
    await prisma.receipt.findMany({
      where,

      include: {
        student: {
          select: {
            studentNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },

        payment: {
          include: {
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
        },
      },

      orderBy: {
        issuedAt: "desc",
      },
    });

  const receiptEntries = receipts.flatMap((receipt) => {
    const payment = receipt.payment;
    const invoiceItems = payment.invoice?.items ?? [];
    const basis = getCategoryAllocationBasis({
      items: invoiceItems.map((item) => ({
        category: item.category,
        title: item.title,
        totalAmount: Number(item.totalAmount),
        cgstAmount: Number(item.cgstAmount),
        sgstAmount: Number(item.sgstAmount),
      })),
      selectedCategories: filters.feeCategory
        ? [filters.feeCategory]
        : null,
      fallbackCategory: payment.category,
      lateFeeAmount: Number(payment.lateFeeAmount),
      invoiceTotalAmount: Number(payment.totalAmount),
    });

    if (!basis) return [];

    const normalised = normalisePaymentComponents({
      amountReceived: Number(payment.amountReceived),
      totalAmount: Number(payment.totalAmount),
      cgstAmount: Number(payment.cgstAmount),
      sgstAmount: Number(payment.sgstAmount),
      lateFeeAmount: Number(payment.lateFeeAmount),
    });
    const isLateFee = filters.feeCategory === "LATE_FEE";

    return [
      {
        receipt,
        feeType: basis.feeType || formatLabel(payment.category),
        received: isLateFee
          ? normalised.lateFeeAmount
          : allocateReportAmount(
              normalised.amountReceived,
              basis.grossShare,
            ),
        pending: isLateFee
          ? 0
          : allocateReportAmount(
              Number(payment.pendingAmount),
              basis.grossShare,
            ),
      },
    ];
  });

  const totalReceived =
    receiptEntries.reduce(
      (total, entry) =>
        entry.receipt.status === "ISSUED"
          ? total + entry.received
          : total,
      0,
    );

  const reversedAmount = receiptEntries.reduce(
    (total, entry) =>
      entry.receipt.status === "ISSUED"
        ? total
        : total + entry.received,
    0,
  );

  const cancelledCount =
    receiptEntries.filter(
      ({ receipt }) =>
        receipt.status === "CANCELLED",
    ).length;

  const refundedCount =
    receiptEntries.filter(
      ({ receipt }) =>
        receipt.status === "REFUNDED",
    ).length;

  return {
    title: "Fee Receipt Register",
    description:
      "Register of issued, cancelled and refunded fee receipts.",
    periodLabel,

    summaries: [
      {
        label: "Receipt Records",
        value: receiptEntries.length.toString(),
        tone: "purple",
      },
      {
        label: "Active Received",
        value: formatInr(
          totalReceived,
        ),
        tone: "green",
      },
      {
        label: "Reversed Value",
        value: formatInr(reversedAmount),
        tone: "red",
      },
      {
        label: "Cancelled",
        value:
          cancelledCount.toString(),
        tone: "amber",
      },
      {
        label: "Refunded",
        value:
          refundedCount.toString(),
        tone: "blue",
      },
    ],

    columns: [
      {
        label: "Issued",
        weight: 0.8,
      },
      {
        label: "Receipt No.",
        weight: 1,
      },
      {
        label: "Payment No.",
        weight: 1,
      },
      {
        label: "Student",
        weight: 1.5,
      },
      {
        label: "Fee Type",
        weight: 1.25,
      },
      {
        label: "Period",
        weight: 0.95,
      },
      {
        label: "Method",
        weight: 0.8,
      },
      {
        label: "Receipt Status",
        weight: 0.9,
      },
      {
        label: "Received",
        weight: 0.85,
        align: "right",
      },
      {
        label: "Pending",
        weight: 0.8,
        align: "right",
      },
    ],

    rows: receiptEntries.map(
      ({ receipt, feeType, received, pending }) => [
        formatDate(receipt.issuedAt),
        receipt.receiptNumber,
        receipt.payment.paymentNumber,
        `${getStudentName(
          receipt.student,
        )} (${receipt.student.studentNumber})`,
        feeType,
        receipt.payment
          .feePeriodLabel ?? "-",
        formatLabel(
          receipt.payment
            .paymentMethod,
        ),
        formatLabel(receipt.status),
        formatMoney(received),
        formatMoney(pending),
      ],
    ),

    notes: [
      "Cancelled and refunded receipt records remain visible for audit purposes.",
    ],
  };
}

function safePdfText(value: unknown) {
  return String(value ?? "")
    .replace(/₹/g, "INR ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, "?");
}

function truncatePdfText(
  value: string,
  maximumLength = 180,
) {
  const text = safePdfText(value);

  return text.length > maximumLength
    ? `${text.slice(
        0,
        maximumLength - 3,
      )}...`
    : text;
}

function drawReportHeader(
  document: PDFKit.PDFDocument,
  report: ReportData,
  profile: SchoolProfile,
) {
  const pageWidth =
    document.page.width;

  document
    .rect(0, 0, pageWidth, 108)
    .fill("#2D1736");

  document
    .fillColor("#F6C84B")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(
      safePdfText(
        profile.schoolName.toUpperCase(),
      ),
      36,
      25,
      {
        width: pageWidth * 0.55,
      },
    );

  document
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(
      safePdfText(profile.centreName),
      36,
      43,
      {
        width: pageWidth * 0.55,
      },
    );

  document
    .fillColor("#D8CDDC")
    .font("Helvetica")
    .fontSize(8)
    .text(
      safePdfText(profile.address),
      36,
      70,
      {
        width: pageWidth * 0.55,
      },
    );

  document
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(
      safePdfText(
        `Phone: ${profile.phone}`,
      ),
      pageWidth * 0.62,
      27,
      {
        width:
          pageWidth * 0.33 - 36,
        align: "right",
      },
    );

  document
    .fillColor("#D8CDDC")
    .font("Helvetica")
    .fontSize(8)
    .text(
      safePdfText(profile.email),
      pageWidth * 0.62,
      44,
      {
        width:
          pageWidth * 0.33 - 36,
        align: "right",
      },
    );

  if (profile.gstNumber) {
    document
      .fillColor("#F6C84B")
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(
        safePdfText(
          `GSTIN: ${profile.gstNumber}`,
        ),
        pageWidth * 0.62,
        62,
        {
          width:
            pageWidth * 0.33 - 36,
          align: "right",
        },
      );
  }

  document
    .fillColor("#2D1736")
    .font("Helvetica-Bold")
    .fontSize(19)
    .text(
      safePdfText(report.title),
      36,
      126,
      {
        width: pageWidth * 0.58,
      },
    );

  document
    .fillColor("#756A79")
    .font("Helvetica")
    .fontSize(8.5)
    .text(
      safePdfText(
        report.description,
      ),
      36,
      152,
      {
        width: pageWidth * 0.58,
      },
    );

  document
    .roundedRect(
      pageWidth - 275,
      124,
      239,
      48,
      8,
    )
    .fillAndStroke(
      "#F7F2FA",
      "#E0D4E6",
    );

  document
    .fillColor("#7A459C")
    .font("Helvetica-Bold")
    .fontSize(7)
    .text(
      "REPORTING PERIOD",
      pageWidth - 263,
      136,
      {
        width: 215,
        align: "right",
      },
    );

  document
    .fillColor("#2D1736")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      safePdfText(
        report.periodLabel,
      ),
      pageWidth - 263,
      151,
      {
        width: 215,
        align: "right",
      },
    );

  return 190;
}

function getSummaryColours(
  tone: SummaryItem["tone"],
) {
  const colours = {
    purple: {
      background: "#F7F2FA",
      border: "#DCCFE4",
      label: "#7A459C",
      value: "#5B2A86",
    },

    green: {
      background: "#ECFDF5",
      border: "#A7F3D0",
      label: "#047857",
      value: "#065F46",
    },

    red: {
      background: "#FEF2F2",
      border: "#FECACA",
      label: "#B91C1C",
      value: "#991B1B",
    },

    amber: {
      background: "#FFFBEB",
      border: "#FDE68A",
      label: "#B45309",
      value: "#92400E",
    },

    blue: {
      background: "#EFF6FF",
      border: "#BFDBFE",
      label: "#1D4ED8",
      value: "#1E40AF",
    },
  };

  return colours[tone ?? "purple"];
}

function drawSummaries(
  document: PDFKit.PDFDocument,
  summaries: SummaryItem[],
  startY: number,
) {
  if (summaries.length === 0) {
    return startY;
  }

  const left = 36;
  const gap = 8;
  const columns = 4;

  const availableWidth =
    document.page.width - 72;

  const cardWidth =
    (availableWidth -
      gap * (columns - 1)) /
    columns;

  const cardHeight = 47;

  summaries.forEach(
    (summary, index) => {
      const row = Math.floor(
        index / columns,
      );

      const column =
        index % columns;

      const x =
        left +
        column * (cardWidth + gap);

      const y =
        startY +
        row * (cardHeight + gap);

      const colours =
        getSummaryColours(
          summary.tone,
        );

      document
        .roundedRect(
          x,
          y,
          cardWidth,
          cardHeight,
          8,
        )
        .fillAndStroke(
          colours.background,
          colours.border,
        );

      document
        .fillColor(colours.label)
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .text(
          safePdfText(
            summary.label.toUpperCase(),
          ),
          x + 10,
          y + 9,
          {
            width: cardWidth - 20,
          },
        );

      document
        .fillColor(colours.value)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(
          safePdfText(
            summary.value,
          ),
          x + 10,
          y + 24,
          {
            width: cardWidth - 20,
          },
        );
    },
  );

  const rowCount = Math.ceil(
    summaries.length / columns,
  );

  return (
    startY +
    rowCount * (cardHeight + gap) +
    5
  );
}

function drawContinuationHeader(
  document: PDFKit.PDFDocument,
  report: ReportData,
  profile: SchoolProfile,
) {
  document
    .rect(
      0,
      0,
      document.page.width,
      44,
    )
    .fill("#2D1736");

  document
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(
      safePdfText(profile.centreName),
      36,
      14,
      {
        width:
          document.page.width * 0.4,
      },
    );

  document
    .fillColor("#F6C84B")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      safePdfText(report.title),
      document.page.width * 0.48,
      14,
      {
        width:
          document.page.width *
            0.47 -
          36,
        align: "right",
      },
    );

  return 58;
}

function drawReportTable(
  document: PDFKit.PDFDocument,
  report: ReportData,
  profile: SchoolProfile,
  startY: number,
) {
  const left = 36;

  const tableWidth =
    document.page.width - 72;

  const totalWeight =
    report.columns.reduce(
      (total, column) =>
        total + column.weight,
      0,
    );

  const widths =
    report.columns.map(
      (column) =>
        (column.weight /
          totalWeight) *
        tableWidth,
    );

  const headerHeight = 25;

  let y = startY;

  const drawHeader = () => {
    let x = left;

    report.columns.forEach(
      (column, index) => {
        const width = widths[index];

        document
          .rect(
            x,
            y,
            width,
            headerHeight,
          )
          .fill("#2D1736");

        document
          .fillColor("#FFFFFF")
          .font("Helvetica-Bold")
          .fontSize(6.2)
          .text(
            safePdfText(
              column.label.toUpperCase(),
            ),
            x + 5,
            y + 8,
            {
              width: width - 10,
              align:
                column.align ??
                "left",
            },
          );

        x += width;
      },
    );

    y += headerHeight;
  };

  drawHeader();

  if (report.rows.length === 0) {
    document
      .rect(
        left,
        y,
        tableWidth,
        65,
      )
      .fillAndStroke(
        "#FAF8FC",
        "#E5DDE9",
      );

    document
      .fillColor("#817684")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(
        "No records were found for the selected report and filters.",
        left + 20,
        y + 26,
        {
          width: tableWidth - 40,
          align: "center",
        },
      );

    return y + 75;
  }

  report.rows.forEach(
    (row, rowIndex) => {
      document
        .font("Helvetica")
        .fontSize(6.6);

      const cellHeights =
        row.map((cell, index) => {
          const width =
            widths[index] ?? 50;

          const height =
            document.heightOfString(
              truncatePdfText(cell),
              {
                width: width - 10,
                align:
                  report.columns[index]
                    ?.align ?? "left",
              },
            );

          return Math.min(
            Math.max(height + 10, 24),
            42,
          );
        });

      const rowHeight = Math.max(
        24,
        ...cellHeights,
      );

      if (
        y + rowHeight >
        document.page.height - 50
      ) {
        document.addPage();

        y = drawContinuationHeader(
          document,
          report,
          profile,
        );

        drawHeader();
      }

      let x = left;

      row.forEach(
        (cell, index) => {
          const width =
            widths[index] ?? 50;

          document
            .rect(
              x,
              y,
              width,
              rowHeight,
            )
            .fillAndStroke(
              rowIndex % 2 === 0
                ? "#FFFFFF"
                : "#FAF8FC",
              "#EAE3ED",
            );

          document
            .fillColor("#3B2D42")
            .font("Helvetica")
            .fontSize(6.6)
            .text(
              truncatePdfText(cell),
              x + 5,
              y + 6,
              {
                width: width - 10,
                height: rowHeight - 10,
                align:
                  report.columns[index]
                    ?.align ?? "left",
                ellipsis: true,
              },
            );

          x += width;
        },
      );

      y += rowHeight;
    },
  );

  return y + 8;
}

function drawNotes(
  document: PDFKit.PDFDocument,
  report: ReportData,
  profile: SchoolProfile,
  startY: number,
) {
  if (
    !report.notes ||
    report.notes.length === 0
  ) {
    return;
  }

  let y = startY;

  const height =
    31 +
    report.notes.length * 15;

  if (
    y + height >
    document.page.height - 50
  ) {
    document.addPage();

    y = drawContinuationHeader(
      document,
      report,
      profile,
    );
  }

  document
    .roundedRect(
      36,
      y,
      document.page.width - 72,
      height,
      8,
    )
    .fillAndStroke(
      "#FFF9E8",
      "#F3D77A",
    );

  document
    .fillColor("#8A5B00")
    .font("Helvetica-Bold")
    .fontSize(7)
    .text(
      "IMPORTANT NOTES",
      48,
      y + 10,
    );

  report.notes.forEach(
    (note, index) => {
      document
        .fillColor("#6D5A2E")
        .font("Helvetica")
        .fontSize(7)
        .text(
          safePdfText(`• ${note}`),
          48,
          y + 25 + index * 15,
          {
            width:
              document.page.width -
              96,
          },
        );
    },
  );
}

function addPageFooters(
  document: PDFKit.PDFDocument,
  profile: SchoolProfile,
) {
  const range =
    document.bufferedPageRange();

  for (
    let index = range.start;
    index <
    range.start + range.count;
    index += 1
  ) {
    document.switchToPage(index);

    document
      .moveTo(
        36,
        document.page.height - 37,
      )
      .lineTo(
        document.page.width - 36,
        document.page.height - 37,
      )
      .strokeColor("#DED5E2")
      .lineWidth(0.5)
      .stroke();

    document
      .fillColor("#887D8C")
      .font("Helvetica")
      .fontSize(6.5)
      .text(
        safePdfText(
          `Confidential CentreOS report • Generated ${formatDateTime(
            new Date(),
          )}`,
        ),
        36,
        document.page.height - 28,
        {
          width:
            document.page.width - 160,
        },
      );

    document
      .fillColor("#5B2A86")
      .font("Helvetica-Bold")
      .fontSize(6.5)
      .text(
        `Page ${index + 1} of ${
          range.count
        }`,
        document.page.width - 120,
        document.page.height - 28,
        {
          width: 84,
          align: "right",
        },
      );
  }

  if (profile.centreHeadName) {
    document.switchToPage(
      range.start + range.count - 1,
    );
  }
}

async function createReportPdf(
  report: ReportData,
  profile: SchoolProfile,
) {
  const document = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: {
      top: 36,
      right: 36,
      bottom: 48,
      left: 36,
    },
    bufferPages: true,

    info: {
      Title: report.title,
      Author: profile.centreName,
      Subject: report.description,
      Creator: "Kidzee CentreOS",
    },
  });

  const chunks: Buffer[] = [];

  const completedPdf =
    new Promise<Buffer>(
      (resolve, reject) => {
        document.on(
          "data",
          (chunk: Buffer) => {
            chunks.push(
              Buffer.from(chunk),
            );
          },
        );

        document.on("end", () => {
          resolve(
            Buffer.concat(chunks),
          );
        });

        document.on("error", reject);
      },
    );

  const headerBottom =
    drawReportHeader(
      document,
      report,
      profile,
    );

  const summariesBottom =
    drawSummaries(
      document,
      report.summaries,
      headerBottom,
    );

  const tableBottom =
    drawReportTable(
      document,
      report,
      profile,
      summariesBottom,
    );

  drawNotes(
    document,
    report,
    profile,
    tableBottom,
  );

  addPageFooters(
    document,
    profile,
  );

  document.end();

  return completedPdf;
}

function createFileDate() {
  const {
    year,
    month,
    day,
  } = getIndiaDateParts(new Date());

  return `${year}-${String(
    month,
  ).padStart(2, "0")}-${String(
    day,
  ).padStart(2, "0")}`;
}

function createFilename(title: string, extension = "pdf") {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug}-${createFileDate()}.${extension}`;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function createCsvReport(report: ReportData) {
  const lines = [
    [report.title],
    [report.description],
    ["Period", report.periodLabel],
    [],
    ["Summary", "Value"],
    ...report.summaries.map((item) => [item.label, item.value]),
    [],
    report.columns.map((column) => column.label),
    ...report.rows,
    ...(report.notes?.length ? [[], ["Notes"], ...report.notes.map((note) => [note])] : []),
  ];

  return `\uFEFF${lines.map((row) => row.map((cell) => csvCell(String(cell))).join(",")).join("\r\n")}`;
}

function htmlCell(value: string, tag: "td" | "th") {
  const safe = value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  return `<${tag}>${safe}</${tag}>`;
}

function createExcelReport(report: ReportData) {
  const summaryRows = report.summaries.map((item) => `<tr>${htmlCell(item.label, "td")}${htmlCell(item.value, "td")}</tr>`).join("");
  const tableRows = report.rows.map((row) => `<tr>${row.map((cell) => htmlCell(cell, "td")).join("")}</tr>`).join("");
  const notes = report.notes?.length ? `<h2>Notes</h2><ul>${report.notes.map((note) => `<li>${note.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</li>`).join("")}</ul>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;margin:16px 0}th,td{border:1px solid #bbb;padding:6px;vertical-align:top}th{background:#5b2a86;color:#fff}</style></head><body><h1>${report.title}</h1><p>${report.description}</p><p><strong>Period:</strong> ${report.periodLabel}</p><table><tr><th>Summary</th><th>Value</th></tr>${summaryRows}</table><table><tr>${report.columns.map((column) => htmlCell(column.label, "th")).join("")}</tr>${tableRows}</table>${notes}</body></html>`;
}

export async function GET(request: Request) {
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
      !hasAdminPermissionRequirement(
        session,
        "ca_export.download",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to download CA exports.",
        },
        {
          status: 403,
        },
      );
    }

    const url = new URL(request.url);

    const reportValue = cleanText(
      url.searchParams.get("report"),
    );

    const reportType: ReportType =
      isOneOf(
        reportValue,
        REPORT_TYPES,
      )
        ? reportValue
        : "total-fees";

    const period = getReportPeriod(
      url.searchParams,
    );

    if (
      period.filter?.gte &&
      period.filter?.lte &&
      period.filter.gte >
        period.filter.lte
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The starting date cannot be after the ending date.",
        },
        {
          status: 400,
        },
      );
    }

    const filters = getReportFilters(
      url.searchParams,
    );

    const formatValue = cleanText(url.searchParams.get("format")).toUpperCase();
    const format = formatValue === "CSV" || formatValue === "EXCEL" ? formatValue : "PDF";

    const profile =
      await getSchoolProfile();

    let report: ReportData;

    if (
      feeReportConfigurations[
        reportType
      ]
    ) {
      report = await buildFeeReport(
        reportType,
        period.filter,
        period.label,
        filters,
      );
    } else if (
      reportType === "expenses"
    ) {
      report =
        await buildExpenseReport(
          period.filter,
          period.label,
          filters,
        );
    } else if (
      reportType === "gst-summary"
    ) {
      report = await buildGstReport(
        period.filter,
        period.label,
        filters,
      );
    } else if (
      reportType === "net-income"
    ) {
      report =
        await buildNetIncomeReport(
          period.filter,
          period.label,
          filters,
        );
        } else if (
      isOperationalReportType(
        reportType,
      )
    ) {
      report =
        await buildOperationalReport(
          reportType,
          period.filter,
          period.label,
        );
    } else {
      report =
        await buildReceiptReport(
          period.filter,
          period.label,
          filters,
        );
    }

    if (format === "CSV") {
      return new NextResponse(createCsvReport(report), { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${createFilename(report.title, "csv")}"`, "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
    }

    if (format === "EXCEL") {
      return new NextResponse(createExcelReport(report), { status: 200, headers: { "Content-Type": "application/vnd.ms-excel; charset=utf-8", "Content-Disposition": `attachment; filename="${createFilename(report.title, "xls")}"`, "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
    }

    const pdf = await createReportPdf(report, profile);

    return new NextResponse(
      new Uint8Array(pdf),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${createFilename(
              report.title,
            )}"`,

          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "Unable to generate report:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The report could not be generated. Check the server terminal.",
      },
      {
        status: 500,
      },
    );
  }
}
