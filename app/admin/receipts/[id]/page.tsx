import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import ReceiptQuickActions from "@/components/admin/receipts/ReceiptQuickActions";
import { getAdminSession } from "@/lib/admin/auth";
import { getNextSequence } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";

type ReceiptPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

type SchoolProfile = {
  schoolName: string;
  centreName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  logoUrl: string;
  stampUrl: string;
  signatureUrl: string;
  upiQrUrl: string;
  receiptFooter: string;
  receiptTerms: string[];
  showLogoOnReceipt: boolean;
  showStampOnReceipt: boolean;
  showSignatureOnReceipt: boolean;
  showBankDetailsOnReceipt: boolean;
  showQrOnReceipt: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  upiId: string;
};

const defaultSchoolProfile: SchoolProfile = {
  schoolName: "Kidzee Preschool & Daycare",
  centreName: "Kidzee Sector 12, Dwarka",
  address:
    "Plot No. 19, Block B, Sector 12B, Dwarka, New Delhi, Delhi",
  phone: "9667038673",
  email: "kidzeepreschoolsector12@gmail.com",
  gstNumber: "",
  logoUrl: "",
  stampUrl: "",
  signatureUrl: "",
  upiQrUrl: "",
  receiptFooter:
    "Thank you for choosing Kidzee Sector 12, Dwarka.",
  receiptTerms: [
    "Please retain this receipt for future reference.",
  ],
  showLogoOnReceipt: true,
  showStampOnReceipt: true,
  showSignatureOnReceipt: true,
  showBankDetailsOnReceipt: false,
  showQrOnReceipt: false,
  bankName: "",
  accountName: "",
  accountNumber: "",
  ifscCode: "",
  bankBranch: "",
  upiId: "",
};

const feeCategoryLabels: Record<string, string> = {
  ADMISSION_FEE: "Admission Fee",
  ANNUAL_FEE: "Annual Fee",
  MONTHLY_PRESCHOOL_FEE: "Monthly Preschool Fee",
  DAYCARE_FEE: "Daycare Hourly Fee",
  DAYCARE_LUNCH_FEE: "Daycare Lunch Plan",
  DAYCARE_EVENING_SNACK_FEE:
    "Daycare Evening Snack Plan",
  DAYCARE_MEAL_COMBO_FEE:
    "Daycare Lunch + Evening Snack Plan",
  FOOD_FEE: "Other Food Fee",
  LATE_FEE: "Late Fee",
  ACTIVITY_FEE: "Activity Fee",
  KIT_FEE: "Kit Fee",
  OTHER: "Other",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PARTIALLY_PAID: "Partially Paid",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const receiptStatusLabels: Record<string, string> = {
  ISSUED: "Issued",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const receiptStatusStyles: Record<string, string> = {
  ISSUED:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED:
    "border-slate-300 bg-slate-100 text-slate-700",
  REFUNDED:
    "border-blue-200 bg-blue-50 text-blue-700",
};

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanBoolean(
  value: unknown,
  fallback: boolean,
) {
  return typeof value === "boolean"
    ? value
    : fallback;
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

function normaliseReceiptTerms(value: unknown) {
  if (!Array.isArray(value)) {
    return defaultSchoolProfile.receiptTerms;
  }

  const terms = value
    .map((term) => cleanText(term))
    .filter(Boolean)
    .slice(0, 20);

  return terms.length > 0
    ? terms
    : defaultSchoolProfile.receiptTerms;
}

function normaliseSchoolProfile(
  value: Prisma.JsonValue | null,
): SchoolProfile {
  if (!isRecord(value)) {
    return defaultSchoolProfile;
  }

  const address = [
    cleanText(value.addressLine1),
    cleanText(value.addressLine2),
    cleanText(value.locality),
    cleanText(value.city),
    cleanText(value.state),
    cleanText(value.postalCode),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    schoolName:
      cleanText(value.schoolName) ||
      defaultSchoolProfile.schoolName,

    centreName:
      cleanText(value.centreName) ||
      defaultSchoolProfile.centreName,

    address:
      address ||
      defaultSchoolProfile.address,

    phone:
      cleanText(value.phone) ||
      defaultSchoolProfile.phone,

    email:
      cleanText(value.email) ||
      defaultSchoolProfile.email,

    gstNumber:
      cleanText(value.gstNumber),

    logoUrl:
      cleanText(value.logoUrl),

    stampUrl:
      cleanText(value.stampUrl),

    signatureUrl:
      cleanText(value.signatureUrl),

    upiQrUrl:
      cleanText(value.upiQrUrl),

    receiptFooter:
      cleanText(value.receiptFooter) ||
      defaultSchoolProfile.receiptFooter,

    receiptTerms:
      normaliseReceiptTerms(
        value.receiptTerms,
      ),

    showLogoOnReceipt:
      cleanBoolean(
        value.showLogoOnReceipt,
        defaultSchoolProfile.showLogoOnReceipt,
      ),

    showStampOnReceipt:
      cleanBoolean(
        value.showStampOnReceipt,
        defaultSchoolProfile.showStampOnReceipt,
      ),

    showSignatureOnReceipt:
      cleanBoolean(
        value.showSignatureOnReceipt,
        defaultSchoolProfile.showSignatureOnReceipt,
      ),

    showBankDetailsOnReceipt:
      cleanBoolean(
        value.showBankDetailsOnReceipt,
        defaultSchoolProfile.showBankDetailsOnReceipt,
      ),

    showQrOnReceipt:
      cleanBoolean(
        value.showQrOnReceipt,
        defaultSchoolProfile.showQrOnReceipt,
      ),

    bankName:
      cleanText(value.bankName),

    accountName:
      cleanText(value.accountName),

    accountNumber:
      cleanText(value.accountNumber),

    ifscCode:
      cleanText(value.ifscCode),

    bankBranch:
      cleanText(value.bankBranch),

    upiId:
      cleanText(value.upiId),
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function getStudentName(student: {
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

function roundMoney(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

function numberToWords(value: number) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertBelowHundred(
    number: number,
  ) {
    if (number < 20) {
      return ones[number];
    }

    const ten =
      Math.floor(number / 10);

    const remainder =
      number % 10;

    return `${tens[ten]}${
      remainder
        ? ` ${ones[remainder]}`
        : ""
    }`;
  }

  function convertBelowThousand(
    number: number,
  ) {
    if (number < 100) {
      return convertBelowHundred(
        number,
      );
    }

    const hundred =
      Math.floor(number / 100);

    const remainder =
      number % 100;

    return `${ones[hundred]} Hundred${
      remainder
        ? ` ${convertBelowHundred(
            remainder,
          )}`
        : ""
    }`;
  }

  const roundedValue =
    Math.round(value);

  if (roundedValue === 0) {
    return "Zero Rupees Only";
  }

  let remaining =
    roundedValue;

  const parts: string[] = [];

  const crore =
    Math.floor(
      remaining / 10000000,
    );

  if (crore > 0) {
    parts.push(
      `${convertBelowThousand(
        crore,
      )} Crore`,
    );

    remaining %= 10000000;
  }

  const lakh =
    Math.floor(
      remaining / 100000,
    );

  if (lakh > 0) {
    parts.push(
      `${convertBelowThousand(
        lakh,
      )} Lakh`,
    );

    remaining %= 100000;
  }

  const thousand =
    Math.floor(
      remaining / 1000,
    );

  if (thousand > 0) {
    parts.push(
      `${convertBelowThousand(
        thousand,
      )} Thousand`,
    );

    remaining %= 1000;
  }

  if (remaining > 0) {
    parts.push(
      convertBelowThousand(
        remaining,
      ),
    );
  }

  return `${parts.join(
    " ",
  )} Rupees Only`;
}

function buildReceiptPath(
  receiptId: string,
  key: "success" | "error",
  message: string,
) {
  const query =
    new URLSearchParams({
      [key]: message,
    });

  return `/admin/receipts/${encodeURIComponent(
    receiptId,
  )}?${query.toString()}`;
}

async function reverseReceiptAction(
  formData: FormData,
) {
  "use server";

  const session =
    await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const receiptId =
    cleanText(
      formData.get("receiptId"),
    );

  const action =
    cleanText(
      formData.get("action"),
    );

  const reason =
    cleanText(
      formData.get("reason"),
    );

  if (!receiptId) {
    redirect("/admin/receipts");
  }

  if (session.role !== "OWNER") {
    redirect(
      buildReceiptPath(
        receiptId,
        "error",
        "Only the Owner can cancel or refund a receipt.",
      ),
    );
  }

  if (
    action !== "cancel" &&
    action !== "refund"
  ) {
    redirect(
      buildReceiptPath(
        receiptId,
        "error",
        "Please choose Cancel receipt or Record refund.",
      ),
    );
  }

  if (reason.length < 5) {
    redirect(
      buildReceiptPath(
        receiptId,
        "error",
        "Please enter a clear reason of at least 5 characters.",
      ),
    );
  }

  if (reason.length > 500) {
    redirect(
      buildReceiptPath(
        receiptId,
        "error",
        "The reason must be 500 characters or fewer.",
      ),
    );
  }

  const now = new Date();

  let failureMessage = "";

  try {
    await prisma.$transaction(
      async (transaction) => {
        const currentReceipt =
          await transaction.receipt.findUnique(
            {
              where: {
                id: receiptId,
              },

              include: {
                payment: {
                  include: {
                    invoice: true,
                  },
                },
              },
            },
          );

        if (!currentReceipt) {
          throw new Error(
            "RECEIPT_NOT_FOUND",
          );
        }

        if (
          currentReceipt.status !==
            "ISSUED" ||
          currentReceipt.payment
            .status ===
            "CANCELLED" ||
          currentReceipt.payment
            .status ===
            "REFUNDED"
        ) {
          throw new Error(
            "RECEIPT_ALREADY_REVERSED",
          );
        }

        const receiptStatus =
          action === "refund"
            ? "REFUNDED"
            : "CANCELLED";

        const paymentStatus =
          action === "refund"
            ? "REFUNDED"
            : "CANCELLED";

        const claimed =
          await transaction.receipt.updateMany(
            {
              where: {
                id: receiptId,
                status: "ISSUED",
              },

              data:
                action === "refund"
                  ? {
                      status:
                        receiptStatus,

                      refundedAt:
                        now,

                      refundReason:
                        reason,

                      cancelledAt:
                        null,

                      cancellationReason:
                        null,
                    }
                  : {
                      status:
                        receiptStatus,

                      cancelledAt:
                        now,

                      cancellationReason:
                        reason,

                      refundedAt:
                        null,

                      refundReason:
                        null,
                    },
            },
          );

        if (claimed.count !== 1) {
          throw new Error(
            "RECEIPT_ALREADY_REVERSED",
          );
        }

        const amountReceived =
          Number(
            currentReceipt
              .payment
              .amountReceived,
          );

        let restoredInvoiceBalance:
          | number
          | null = null;

        let updatedInvoiceStatus:
          | string
          | null = null;

        if (
          currentReceipt
            .payment
            .invoice
        ) {
          const invoice =
            currentReceipt
              .payment
              .invoice;

          const invoiceTotal =
            Number(
              invoice.totalAmount,
            );

          const currentPaid =
            Number(
              invoice.paidAmount,
            );
          if (currentPaid < amountReceived) {
            throw new Error("INVOICE_CHANGED");
          }
          const claimedInvoice = await transaction.feeInvoice.updateMany({
            where: {
              id: invoice.id,
              paidAmount: invoice.paidAmount,
              pendingAmount: invoice.pendingAmount,
            },
            data: {
              paidAmount: { decrement: amountReceived },
              pendingAmount: { increment: amountReceived },
            },
          });

          if (claimedInvoice.count !== 1) {
            throw new Error("INVOICE_CHANGED");
          }

          const restoredInvoice = await transaction.feeInvoice.findUniqueOrThrow({
            where: { id: invoice.id },
            select: { paidAmount: true, pendingAmount: true, dueDate: true },
          });
          const newPaid = Math.min(
            Math.max(roundMoney(Number(restoredInvoice.paidAmount)), 0),
            invoiceTotal,
          );
          const newPending = Math.min(
            Math.max(roundMoney(Number(restoredInvoice.pendingAmount)), 0),
            invoiceTotal,
          );

          const invoiceStatus =
            newPending <= 0
              ? "PAID"
              : restoredInvoice.dueDate.getTime() <
                  now.getTime()
                ? "OVERDUE"
                : newPaid > 0
                  ? "PARTIALLY_PAID"
                  : "DUE";

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

          restoredInvoiceBalance =
            newPending;

          updatedInvoiceStatus =
            invoiceStatus;
        }

        await transaction.feePayment.update(
          {
            where: {
              id:
                currentReceipt
                  .paymentId,
            },

            data: {
              status:
                paymentStatus,

              ...(restoredInvoiceBalance !==
              null
                ? {
                    pendingAmount:
                      restoredInvoiceBalance,
                  }
                : {}),
            },
          },
        );

        const correctionSequence = await getNextSequence(transaction, {
          key: "FINANCIAL_CORRECTION",
          prefix: "KZ-COR",
          minimumWidth: 5,
        });
        await transaction.financialCorrection.create({
          data: {
            correctionNumber: correctionSequence.formattedNumber,
            type: action === "refund" ? "REFUND" : "REVERSAL",
            status: "APPLIED",
            studentId: currentReceipt.studentId,
            enrollmentContractId:
              currentReceipt.payment.invoice?.enrollmentContractId ?? null,
            invoiceId: currentReceipt.payment.invoiceId,
            paymentId: currentReceipt.paymentId,
            receiptId: currentReceipt.id,
            amount: amountReceived,
            reason,
            createdById: session.userId,
            approvedById: session.userId,
            approvedAt: now,
            appliedAt: now,
          },
        });

        await transaction.activityLog.create(
          {
            data: {
              adminUserId:
                session.userId,

              action:
                action === "refund"
                  ? "UPDATED"
                  : "CANCELLED",

              entityType:
                "Receipt",

              entityId:
                currentReceipt.id,

              description:
                action === "refund"
                  ? `Receipt ${currentReceipt.receiptNumber} was refunded. The linked payment was removed from collections.`
                  : `Receipt ${currentReceipt.receiptNumber} was cancelled. The linked payment was removed from collections.`,

              previousData: {
                receiptStatus:
                  currentReceipt.status,

                paymentStatus:
                  currentReceipt
                    .payment
                    .status,

                amountReceived,

                invoiceId:
                  currentReceipt
                    .payment
                    .invoiceId,

                invoicePaidAmount:
                  currentReceipt
                    .payment
                    .invoice
                    ? Number(
                        currentReceipt
                          .payment
                          .invoice
                          .paidAmount,
                      )
                    : null,

                invoicePendingAmount:
                  currentReceipt
                    .payment
                    .invoice
                    ? Number(
                        currentReceipt
                          .payment
                          .invoice
                          .pendingAmount,
                      )
                    : null,
              },

              newData: {
                receiptStatus,

                paymentStatus,

                reason,

                reversedAt:
                  now.toISOString(),

                restoredInvoiceBalance,

                invoiceStatus:
                  updatedInvoiceStatus,
              },
            },
          },
        );
      },
    );
  } catch (error) {
    console.error(
      "Unable to reverse receipt:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "RECEIPT_NOT_FOUND"
    ) {
      failureMessage =
        "This receipt no longer exists.";
    } else if (
      error instanceof Error &&
      error.message ===
        "RECEIPT_ALREADY_REVERSED"
    ) {
      failureMessage =
        "This receipt has already been cancelled or refunded.";
    } else if (
      error instanceof Error &&
      error.message === "INVOICE_CHANGED"
    ) {
      failureMessage =
        "The linked invoice changed at the same time. Refresh and try once more; no receipt was reversed.";
    } else {
      failureMessage =
        "The receipt could not be updated. No financial record was changed. Please try again.";
    }
  }

  if (failureMessage) {
    redirect(
      buildReceiptPath(
        receiptId,
        "error",
        failureMessage,
      ),
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/fees");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin/receipts");

  revalidatePath(
    `/admin/receipts/${receiptId}`,
  );

  redirect(
    buildReceiptPath(
      receiptId,
      "success",
      action === "refund"
        ? "Refund recorded. The payment was removed from collections and the linked invoice balance was restored."
        : "Receipt cancelled. The payment was removed from collections and the linked invoice balance was restored.",
    ),
  );
}

export const dynamic =
  "force-dynamic";

export default async function ReceiptDetailsPage({
  params,
  searchParams,
}: ReceiptPageProps) {
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const [{ id }, query] =
    await Promise.all([
      params,
      searchParams,
    ]);

  const [
    receipt,
    schoolSetting,
  ] = await Promise.all([
    prisma.receipt.findUnique({
      where: {
        id,
      },

      include: {
        student: {
          include: {
            guardians: {
              orderBy: [
                {
                  isPrimary:
                    "desc",
                },
                {
                  createdAt:
                    "asc",
                },
              ],
            },
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
    }),

    prisma.centreSetting.findUnique({
      where: {
        key: "SCHOOL_PROFILE",
      },
    }),
  ]);

  if (!receipt) {
    notFound();
  }

  const schoolProfile =
    normaliseSchoolProfile(
      schoolSetting?.value ??
        null,
    );

  const studentName =
    getStudentName(
      receipt.student,
    );

  const primaryGuardian =
    receipt.student.guardians.find(
      (guardian) =>
        guardian.isPrimary,
    ) ??
    receipt.student.guardians[0] ??
    null;

  const amountBeforeTax =
    Number(
      receipt.payment
        .amountBeforeTax,
    );

  const invoiceItems =
    receipt.payment.invoice
      ?.items ?? [];

  const discountAmount =
    Number(
      receipt.payment
        .discountAmount,
    );

  const lateFeeAmount =
    Number(
      receipt.payment
        .lateFeeAmount,
    );

  const totalAmount =
    Number(
      receipt.payment.totalAmount,
    );

  const showFullInvoiceItems =
    invoiceItems.length > 0 &&
    receipt.payment.invoice != null &&
    Math.abs(
      totalAmount - Number(receipt.payment.invoice.totalAmount),
    ) < 0.01;

  const amountReceived =
    Number(
      receipt.payment
        .amountReceived,
    );

  const paymentPendingAmount =
    Number(
      receipt.payment
        .pendingAmount,
    );

  const invoicePendingAmount =
    receipt.payment.invoice
      ? Number(
          receipt.payment
            .invoice
            .pendingAmount,
        )
      : null;

  const feeAmountOnReceipt =
    roundMoney(
      amountBeforeTax -
        lateFeeAmount,
    );

  const reversalReason =
    receipt.status === "REFUNDED"
      ? receipt.refundReason
      : receipt.cancellationReason;

  const reversedAt =
    receipt.status === "REFUNDED"
      ? receipt.refundedAt
      : receipt.cancelledAt;

  const isOwner =
    session.role === "OWNER";

  const bankDetailsAvailable =
    Boolean(
      schoolProfile.bankName ||
        schoolProfile.accountNumber ||
        schoolProfile.ifscCode ||
        schoolProfile.upiId,
    );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {query.success ? (
          <div className="print:hidden flex items-start gap-3 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={20}
            />

            <p className="text-sm font-bold leading-6">
              {query.success}
            </p>
          </div>
        ) : null}

        {query.error ? (
          <div className="print:hidden flex items-start gap-3 rounded-[22px] border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={20}
            />

            <p className="text-sm font-bold leading-6">
              {query.error}
            </p>
          </div>
        ) : null}

        <section className="print:hidden">
          <div className="flex flex-col gap-4 rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <ReceiptText
                  aria-hidden="true"
                  size={21}
                />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                  Receipt details
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-black text-[#2D1736] sm:text-2xl">
                    {
                      receipt.receiptNumber
                    }
                  </h1>

                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                      receiptStatusStyles[
                        receipt.status
                      ] ??
                      "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {receiptStatusLabels[
                      receipt.status
                    ] ??
                      receipt.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/receipts"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
              >
                <ArrowLeft
                  aria-hidden="true"
                  size={17}
                />

                All Receipts
              </Link>

              <ReceiptQuickActions
                receiptId={receipt.id}
                guardianName={
                  primaryGuardian?.name ??
                  "Parent"
                }
                guardianPhone={
                  primaryGuardian?.phone ??
                  ""
                }
                receiptNumber={
                  receipt.receiptNumber
                }
                studentName={studentName}
                amountReceived={
                  formatCurrency(
                    amountReceived,
                  )
                }
              />
            </div>
          </div>
        </section>

        <article
          id="fee-receipt-print"
          className="relative mx-auto max-w-4xl overflow-hidden rounded-[30px] border border-[#DED4E3] bg-white shadow-[0_24px_70px_rgba(45,23,54,0.12)] print:max-w-none print:rounded-none print:border-0 print:shadow-none"
        >
          {receipt.status !==
          "ISSUED" ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
              <p className="-rotate-12 whitespace-nowrap text-6xl font-black uppercase tracking-[0.12em] text-slate-500/10 sm:text-8xl print:text-slate-500/15">
                {receiptStatusLabels[
                  receipt.status
                ] ??
                  receipt.status}
              </p>
            </div>
          ) : null}

          <header className="relative bg-[#2D1736] px-6 py-7 text-white sm:px-9 sm:py-9 print:bg-white print:px-0 print:py-5 print:text-black">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                {schoolProfile.showLogoOnReceipt &&
                schoolProfile.logoUrl ? (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        schoolProfile.logoUrl
                      }
                      alt={`${schoolProfile.schoolName} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </span>
                ) : null}

                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F6C84B] print:text-black">
                    {
                      schoolProfile.schoolName
                    }
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                    Fee Receipt
                  </h2>

                  <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-white/70 print:text-black">
                    {
                      schoolProfile.address
                    }
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white/70 print:text-black">
                    Phone:{" "}
                    {
                      schoolProfile.phone
                    }

                    {schoolProfile.email
                      ? ` · ${schoolProfile.email}`
                      : ""}
                  </p>

                  {schoolProfile.gstNumber ? (
                    <p className="mt-1 text-xs font-bold text-white/60 print:text-black">
                      GSTIN:{" "}
                      {
                        schoolProfile.gstNumber
                      }
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[20px] border border-white/15 bg-white/10 p-4 sm:text-right print:border-black print:bg-white">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#F6C84B] print:text-black">
                  Receipt number
                </p>

                <p className="mt-1 text-lg font-black">
                  {
                    receipt.receiptNumber
                  }
                </p>

                <p className="mt-3 text-xs font-bold text-white/60 print:text-black">
                  Issued on
                </p>

                <p className="mt-1 text-sm font-black">
                  {formatDateTime(
                    receipt.issuedAt,
                  )}
                </p>
              </div>
            </div>
          </header>

          <div className="relative space-y-7 p-6 sm:p-9 print:px-0">
            <section className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={UserRound}
                label="Student"
                value={studentName}
                secondary={
                  receipt.student
                    .studentNumber
                }
              />

              <InfoCard
                icon={UserRound}
                label="Parent / Guardian"
                value={
                  primaryGuardian?.name ??
                  "Not recorded"
                }
                secondary={
                  primaryGuardian?.phone ??
                  "Phone not recorded"
                }
              />

              <InfoCard
                icon={CalendarDays}
                label="Payment date"
                value={formatDate(
                  receipt.payment
                    .paymentDate,
                )}
                secondary={
                  receipt.payment
                    .feePeriodLabel
                    ? `Fee period: ${receipt.payment.feePeriodLabel}`
                    : "Fee period not specified"
                }
              />

              <InfoCard
                icon={CreditCard}
                label="Payment method"
                value={
                  paymentMethodLabels[
                    receipt.payment
                      .paymentMethod
                  ] ??
                  receipt.payment
                    .paymentMethod
                }
                secondary={
                  receipt.payment
                    .transactionReference ??
                  "No transaction reference"
                }
              />
            </section>

            <section className="overflow-hidden rounded-[24px] border border-[#E8DFEC]">
              <div className="grid grid-cols-[1fr_auto] bg-[#F7F2FA] px-5 py-4">
                <p className="text-sm font-black text-[#2D1736]">
                  Fee particulars
                </p>

                <p className="text-sm font-black text-[#2D1736]">
                  Amount
                </p>
              </div>

              {showFullInvoiceItems ? (
                invoiceItems.map(
                  (item) => (
                    <ReceiptRow
                      key={item.id}
                      label={`${
                        item.title
                      }${
                        item.detail
                          ? ` - ${item.detail}`
                          : ""
                      }${
                        item.gstApplicable
                          ? " (GST inclusive)"
                          : ""
                      }`}
                      value={Number(
                        item.totalAmount,
                      )}
                    />
                  ),
                )
              ) : (
                <ReceiptRow
                  label={`${
                    receipt.payment.invoice
                      ? `Payment against ${receipt.payment.invoice.invoiceNumber}`
                      : feeCategoryLabels[receipt.payment.category] ??
                        receipt.payment.category
                  }${receipt.payment.gstApplicable ? " (GST inclusive)" : ""}`}
                  value={
                    feeAmountOnReceipt
                  }
                />
              )}

              {receipt.payment
                .feePeriodLabel ? (
                <div className="border-t border-[#EEE8F1] px-5 py-3">
                  <p className="text-xs font-semibold text-[#817684]">
                    Fee period:{" "}
                    {
                      receipt.payment
                        .feePeriodLabel
                    }
                  </p>
                </div>
              ) : null}

              {discountAmount > 0 ? (
                <ReceiptRow
                  label="Discount"
                  value={
                    discountAmount
                  }
                  negative
                />
              ) : null}

              {lateFeeAmount > 0 ? (
                <ReceiptRow
                  label="Late fee"
                  value={
                    lateFeeAmount
                  }
                />
              ) : null}

              {receipt.payment.gstApplicable ? (
                <div className="border-t border-emerald-200 bg-emerald-50 px-5 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-emerald-800">
                    GST included wherever applicable
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-emerald-700">
                    The amounts above are the final parent-facing amounts.
                    Statutory tax values remain recorded internally for accounts and CA reports.
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-[1fr_auto] border-t-2 border-[#D9CBE0] bg-[#F3EAF8] px-5 py-4">
                <p className="text-base font-black text-[#2D1736]">
                  Total payable
                </p>

                <p className="text-base font-black text-[#5B2A86]">
                  {formatCurrency(
                    totalAmount,
                  )}
                </p>
              </div>

              <div className="grid grid-cols-[1fr_auto] border-t border-[#E3D8E8] px-5 py-4">
                <p className="text-base font-black text-[#2D1736]">
                  Amount received
                </p>

                <p className="text-lg font-black text-emerald-700">
                  {formatCurrency(
                    amountReceived,
                  )}
                </p>
              </div>

              {paymentPendingAmount >
              0 ? (
                <div className="grid grid-cols-[1fr_auto] border-t border-amber-200 bg-amber-50 px-5 py-4">
                  <p className="text-base font-black text-amber-800">
                    {receipt.status ===
                    "ISSUED"
                      ? "Balance after this payment"
                      : "Restored invoice balance"}
                  </p>

                  <p className="text-lg font-black text-amber-700">
                    {formatCurrency(
                      paymentPendingAmount,
                    )}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="rounded-[22px] bg-[#FAF8FC] p-5">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                Amount in words
              </p>

              <p className="mt-2 text-sm font-black leading-7 text-[#2D1736]">
                {numberToWords(
                  amountReceived,
                )}
              </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailCard
                label="Payment number"
                value={
                  receipt.payment
                    .paymentNumber
                }
              />

              <DetailCard
                label="Payment status"
                value={
                  paymentStatusLabels[
                    receipt.payment
                      .status
                  ] ??
                  receipt.payment
                    .status
                }
              />

              <DetailCard
                label="Invoice number"
                value={
                  receipt.payment
                    .invoice
                    ?.invoiceNumber ??
                  "Legacy payment"
                }
              />

              <DetailCard
                label="Current invoice balance"
                value={
                  invoicePendingAmount !==
                  null
                    ? formatCurrency(
                        invoicePendingAmount,
                      )
                    : "Not linked"
                }
              />
            </section>

            {receipt.payment.notes ? (
              <section className="rounded-[22px] border border-[#E8DFEC] p-5">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                  Payment notes
                </p>

                <p className="mt-2 text-sm font-semibold leading-7 text-[#625768]">
                  {
                    receipt.payment
                      .notes
                  }
                </p>
              </section>
            ) : null}

            {receipt.status !==
            "ISSUED" ? (
              <section
                className={`rounded-[22px] border p-5 ${
                  receiptStatusStyles[
                    receipt.status
                  ] ??
                  "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  {receipt.status ===
                  "REFUNDED" ? (
                    <RotateCcw
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      size={20}
                    />
                  ) : (
                    <XCircle
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      size={20}
                    />
                  )}

                  <div>
                    <p className="text-sm font-black">
                      Receipt status:{" "}
                      {receiptStatusLabels[
                        receipt.status
                      ] ??
                        receipt.status}
                    </p>

                    {reversalReason ? (
                      <p className="mt-2 text-sm font-semibold leading-6">
                        Reason:{" "}
                        {
                          reversalReason
                        }
                      </p>
                    ) : null}

                    {reversedAt ? (
                      <p className="mt-1 text-xs font-bold opacity-75">
                        Updated on{" "}
                        {formatDateTime(
                          reversedAt,
                        )}
                      </p>
                    ) : null}

                    <p className="mt-3 text-xs font-bold leading-5">
                      This amount is
                      excluded from
                      collection totals.
                      The original record
                      remains available for
                      audit.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            {schoolProfile.showBankDetailsOnReceipt &&
            bankDetailsAvailable ? (
              <section className="grid gap-5 rounded-[22px] border border-[#E8DFEC] p-5 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                    Payment details
                  </p>

                  <div className="mt-3 grid gap-1 text-xs font-semibold leading-5 text-[#625768] sm:grid-cols-2 sm:gap-x-6">
                    {schoolProfile.bankName ? (
                      <p>
                        Bank:{" "}
                        {
                          schoolProfile.bankName
                        }
                      </p>
                    ) : null}

                    {schoolProfile.accountName ? (
                      <p>
                        Account name:{" "}
                        {
                          schoolProfile.accountName
                        }
                      </p>
                    ) : null}

                    {schoolProfile.accountNumber ? (
                      <p>
                        Account number:{" "}
                        {
                          schoolProfile.accountNumber
                        }
                      </p>
                    ) : null}

                    {schoolProfile.ifscCode ? (
                      <p>
                        IFSC:{" "}
                        {
                          schoolProfile.ifscCode
                        }
                      </p>
                    ) : null}

                    {schoolProfile.bankBranch ? (
                      <p>
                        Branch:{" "}
                        {
                          schoolProfile.bankBranch
                        }
                      </p>
                    ) : null}

                    {schoolProfile.upiId ? (
                      <p>
                        UPI ID:{" "}
                        {
                          schoolProfile.upiId
                        }
                      </p>
                    ) : null}
                  </div>
                </div>

                {schoolProfile.showQrOnReceipt &&
                schoolProfile.upiQrUrl ? (
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-[#E8DFEC] bg-white p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        schoolProfile.upiQrUrl
                      }
                      alt="Payment QR code"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            {schoolProfile
              .receiptTerms.length >
            0 ? (
              <section className="rounded-[22px] bg-[#FAF8FC] p-5">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                  Receipt terms
                </p>

                <ol className="mt-3 space-y-1.5 pl-4 text-xs font-semibold leading-5 text-[#817684]">
                  {schoolProfile.receiptTerms.map(
                    (
                      term,
                      index,
                    ) => (
                      <li
                        key={`${term}-${index}`}
                      >
                        {index + 1}.{" "}
                        {term}
                      </li>
                    ),
                  )}
                </ol>
              </section>
            ) : null}

            <footer className="border-t border-[#E8DFEC] pt-7">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-black text-[#2D1736]">
                    {
                      schoolProfile.receiptFooter
                    }
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-6 text-[#817684]">
                    This is a
                    computer-generated
                    receipt linked to the
                    CentreOS payment and
                    invoice records.
                  </p>
                </div>

                <div className="flex items-end justify-end gap-4 sm:text-right">
                  {schoolProfile.showStampOnReceipt &&
                  schoolProfile.stampUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        schoolProfile.stampUrl
                      }
                      alt="Centre stamp"
                      className="h-16 w-20 object-contain"
                    />
                  ) : null}

                  <div>
                    {schoolProfile.showSignatureOnReceipt &&
                    schoolProfile.signatureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          schoolProfile.signatureUrl
                        }
                        alt="Authorised signature"
                        className="ml-auto h-12 w-32 object-contain"
                      />
                    ) : (
                      <div className="ml-auto hidden h-14 w-36 border-b border-[#5B2A86] sm:block" />
                    )}

                    <p className="mt-2 text-sm font-black text-[#2D1736]">
                      Authorised Signatory
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#817684]">
                      {
                        schoolProfile.centreName
                      }
                    </p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </article>

        {isOwner &&
        receipt.status === "ISSUED" ? (
          <section className="print:hidden mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-red-200 bg-white shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
            <div className="border-b border-red-100 bg-red-50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
                  <ShieldCheck
                    aria-hidden="true"
                    size={21}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-red-600">
                    Owner-only financial
                    control
                  </p>

                  <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                    Cancel or refund this
                    receipt
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#6F626F]">
                    Both actions remove
                    this payment from
                    collection totals and
                    restore the linked
                    invoice balance. The
                    receipt is never
                    deleted and the action
                    is stored in the
                    permanent audit
                    history.
                  </p>
                </div>
              </div>
            </div>

            <form
              action={
                reverseReceiptAction
              }
              className="space-y-5 p-5 sm:p-6"
            >
              <input
                type="hidden"
                name="receiptId"
                value={receipt.id}
              />

              <div>
                <label
                  htmlFor="reversal-reason"
                  className="text-sm font-black text-[#2D1736]"
                >
                  Reason for this action
                </label>

                <textarea
                  id="reversal-reason"
                  name="reason"
                  required
                  minLength={5}
                  maxLength={500}
                  rows={3}
                  placeholder="Example: Duplicate payment entered by mistake"
                  className="mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A79CA9] focus:border-[#7A459C] focus:ring-4 focus:ring-[#F3EAF8]"
                />
              </div>

              {!receipt.payment
                .invoice ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    size={18}
                  />

                  <p className="text-xs font-bold leading-5">
                    This is an older
                    payment without a
                    linked invoice. The
                    payment will be
                    removed from
                    collection totals, but
                    there is no invoice
                    balance to restore.
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  name="action"
                  value="cancel"
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-red-300 bg-white px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-50"
                >
                  <XCircle
                    aria-hidden="true"
                    size={18}
                  />

                  Cancel incorrect receipt
                </button>

                <button
                  type="submit"
                  name="action"
                  value="refund"
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#2D1736] px-5 py-3 text-sm font-black text-white transition hover:bg-[#45224F]"
                >
                  <RotateCcw
                    aria-hidden="true"
                    size={18}
                  />

                  Record money refunded
                </button>
              </div>

              <div className="grid gap-3 text-xs font-semibold leading-5 text-[#6F626F] sm:grid-cols-2">
                <p className="rounded-2xl bg-[#FAF8FC] p-3">
                  <strong className="text-[#2D1736]">
                    Cancel receipt:
                  </strong>{" "}
                  use when the entry was
                  incorrect, duplicate, or
                  the money was never
                  actually received.
                </p>

                <p className="rounded-2xl bg-[#FAF8FC] p-3">
                  <strong className="text-[#2D1736]">
                    Record refund:
                  </strong>{" "}
                  use only when the money
                  has genuinely been
                  returned to the parent.
                </p>
              </div>
            </form>
          </section>
        ) : null}

        {!isOwner &&
        receipt.status === "ISSUED" ? (
          <section className="print:hidden mx-auto max-w-4xl rounded-[22px] border border-[#E8DFEC] bg-white p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[#7A459C]"
                size={19}
              />

              <p className="text-sm font-semibold leading-6 text-[#625768]">
                Receipt cancellation and
                refund controls are
                restricted to the Owner.
                Centre Head users can view
                and print this receipt.
              </p>
            </div>
          </section>
        ) : null}

        <section className="print:hidden">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:justify-between">
            <Link
              href={`/admin/students/${receipt.student.id}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-white px-5 text-sm font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
            >
              <UserRound
                aria-hidden="true"
                size={17}
              />

              Open Student Profile
            </Link>

            <Link
              href="/admin/fees"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#4B206F]"
            >
              <IndianRupee
                aria-hidden="true"
                size={17}
              />

              Record Another Payment
            </Link>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

type InfoCardProps = {
  icon: typeof UserRound;
  label: string;
  value: string;
  secondary: string;
};

function InfoCard({
  icon: Icon,
  label,
  value,
  secondary,
}: InfoCardProps) {
  return (
    <article className="flex items-start gap-3 rounded-[20px] bg-[#FAF8FC] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B2A86] shadow-sm">
        <Icon
          aria-hidden="true"
          size={18}
        />
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-black text-[#2D1736]">
          {value}
        </p>

        <p className="mt-1 break-words text-xs font-semibold text-[#817684]">
          {secondary}
        </p>
      </div>
    </article>
  );
}

type ReceiptRowProps = {
  label: string;
  value: number;
  negative?: boolean;
};

function ReceiptRow({
  label,
  value,
  negative = false,
}: ReceiptRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] border-t border-[#EEE8F1] px-5 py-4">
      <p className="text-sm font-semibold text-[#514657]">
        {label}
      </p>

      <p
        className={`text-sm font-black ${
          negative
            ? "text-red-600"
            : "text-[#2D1736]"
        }`}
      >
        {negative ? "− " : ""}

        {formatCurrency(value)}
      </p>
    </div>
  );
}

type DetailCardProps = {
  label: string;
  value: string;
};

function DetailCard({
  label,
  value,
}: DetailCardProps) {
  return (
    <article className="rounded-[20px] bg-[#FAF8FC] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-[#2D1736]">
        {value}
      </p>
    </article>
  );
}
