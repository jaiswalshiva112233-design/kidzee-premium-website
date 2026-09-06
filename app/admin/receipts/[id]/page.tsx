import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import ReceiptQuickActions from "@/components/admin/receipts/ReceiptQuickActions";
import { getAdminSession } from "@/lib/admin/auth";
import { formatCentreAddress } from "@/lib/centreAddress";
import { getNextSequence } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";

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
  schoolCode: string;
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
  schoolCode: "7206",
  address: site.address,
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

  const address = formatCentreAddress(value);

  return {
    schoolName:
      cleanText(value.schoolName) ||
      defaultSchoolProfile.schoolName,

    centreName:
      cleanText(value.centreName) ||
      defaultSchoolProfile.centreName,

    schoolCode:
      cleanText(value.schoolCode) ||
      defaultSchoolProfile.schoolCode,

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

function formatProgrammeName(
  programme: string | null | undefined,
  definitionName?: string | null,
) {
  if (definitionName?.trim()) {
    return definitionName.trim();
  }
  switch (programme) {
    case "PLAYGROUP":
      return "Playgroup";
    case "NURSERY":
      return "Nursery";
    case "JUNIOR_KG":
      return "Junior KG";
    case "SENIOR_KG":
      return "Senior KG";
    case "DAYCARE":
      return "Daycare";
    default:
      return programme ?? "Playgroup";
  }
}

function HangingRibbon() {
  return (
    <div className="relative z-10 w-28 sm:w-32 drop-shadow-md">
      <svg
        viewBox="0 0 130 145"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 5 0 L 125 0 L 125 130 L 65 108 L 5 130 Z"
          fill="#2D154B"
        />
        <path
          d="M 12 5 L 118 5 L 118 120 L 65 100 L 12 120 Z"
          stroke="#FFDC48"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          fill="none"
        />
        <text
          x="65"
          y="38"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="900"
          fontFamily="inherit"
          letterSpacing="0.08em"
        >
          WHERE KIDS
        </text>
        <text
          x="65"
          y="60"
          textAnchor="middle"
          fill="#FFDC48"
          fontSize="10"
          fontWeight="900"
          fontFamily="inherit"
          letterSpacing="0.08em"
        >
          LOVE TO LEARN
        </text>
        <text
          x="65"
          y="82"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="900"
          fontFamily="inherit"
          letterSpacing="0.08em"
        >
          AND GROW!
        </text>
      </svg>
    </div>
  );
}

function PaperAirplaneDoodle() {
  return (
    <svg
      viewBox="0 0 70 50"
      className="w-12 sm:w-14 h-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 4 42 C 14 40, 20 30, 26 33 C 32 36, 36 24, 40 21"
        stroke="#25163E"
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />
      <path
        d="M 40 21 L 65 8 L 46 38 L 44 26 Z"
        stroke="#25163E"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="#FFFFFF"
      />
      <path
        d="M 44 26 L 65 8"
        stroke="#25163E"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoodleStar({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 30"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 15 2 L 18.5 11.5 L 28 15 L 18.5 18.5 L 15 28 L 11.5 18.5 L 2 15 L 11.5 11.5 Z"
        fill="#F7C934"
        stroke="#25163E"
        strokeWidth="1"
      />
    </svg>
  );
}

function DoodleStarLoop() {
  return (
    <svg
      viewBox="0 0 60 45"
      className="w-10 sm:w-12 h-9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 35 15 L 37.5 21 L 44 23 L 37.5 25 L 35 31 L 32.5 25 L 26 23 L 32.5 21 Z"
        fill="#F7C934"
        stroke="#25163E"
        strokeWidth="1"
      />
      <path
        d="M 44 10 L 46 4 M 49 14 L 55 12 M 48 18 L 53 23"
        stroke="#25163E"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 35 32 C 32 38, 25 42, 18 36 C 10 30, 20 20, 25 25 C 28 29, 20 42, 10 40"
        stroke="#25163E"
        strokeWidth="1.1"
        strokeDasharray="2.5 2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SmileyDoodle() {
  return (
    <svg
      viewBox="0 0 45 45"
      className="w-9 sm:w-10 h-9 sm:h-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="22" cy="22" r="16" stroke="#E11D48" strokeWidth="2" fill="none" />
      <circle cx="16" cy="18" r="2" fill="#E11D48" />
      <circle cx="28" cy="18" r="2" fill="#E11D48" />
      <path
        d="M 16 26 C 18 30, 26 30, 28 26"
        stroke="#E11D48"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="39" cy="14" r="1.5" fill="#E11D48" />
      <circle cx="35" cy="35" r="2" fill="#25163E" />
      <path d="M 30 7 L 33 2" stroke="#25163E" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 34 8 L 38 6" stroke="#25163E" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function FeeReceiptRibbon() {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        viewBox="0 0 280 40"
        className="w-56 sm:w-64 md:w-72 h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 6 L 25 6 L 25 34 L 0 34 L 14 20 Z" fill="#D99E0F" />
        <path d="M 280 6 L 255 6 L 255 34 L 280 34 L 266 20 Z" fill="#D99E0F" />
        <path d="M 18 0 L 262 0 L 262 40 L 18 40 Z" fill="#F7C934" />
        <text
          x="140"
          y="27"
          textAnchor="middle"
          fill="#25163E"
          fontSize="18"
          fontWeight="900"
          fontFamily="inherit"
          letterSpacing="0.14em"
        >
          FEE RECEIPT
        </text>
      </svg>
    </div>
  );
}

function ReceiptFooterWave() {
  return (
    <div className="relative mt-4 overflow-hidden rounded-b-[20px] bg-[#221037] text-white">
      <svg
        viewBox="0 0 1000 24"
        className="w-full h-3 sm:h-4 block"
        preserveAspectRatio="none"
      >
        <path d="M 0 14 Q 250 -4 500 12 T 1000 8 L 1000 0 L 0 0 Z" fill="#FFFFFF" />
        <path d="M 0 14 Q 250 -4 500 12 T 1000 8 L 1000 18 Q 750 2 500 16 T 0 18 Z" fill="#F7C934" />
      </svg>

      <div className="px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7C934] text-[#221037]">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" stroke="currentColor" strokeWidth="1">
              <path d="M12 2L4 5V11C4 16.55 7.42 21.74 12 23C16.58 21.74 20 16.55 20 11V5L12 2ZM10 16.5L6.5 13L7.91 11.59L10 13.67L16.09 7.59L17.5 9L10 16.5Z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-wider text-white">SAFE ENVIRONMENT</p>
            <p className="text-[9px] font-black uppercase tracking-wider text-[#F7C934]">SECURE FUTURE</p>
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-[#F7C934]">
            <span className="text-xs">✦</span>
            <span className="text-base sm:text-lg font-black italic tracking-wide text-[#FFDF59]" style={{ fontFamily: 'Georgia, serif' }}>
              Thank You!
            </span>
            <span className="text-xs">✦</span>
          </div>
          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.14em] text-white/90">
            FOR YOUR TRUST IN KIDZEE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center text-[#F7C934]">
            <svg viewBox="0 0 36 28" className="w-8 h-6 fill-current">
              <circle cx="9" cy="6" r="3.5" />
              <path d="M4 14 C4 11, 14 11, 14 14 L14 26 L11 26 L11 20 L7 20 L7 26 L4 26 Z" />
              <circle cx="18" cy="4.5" r="3" />
              <path d="M13.5 11.5 C13.5 9, 22.5 9, 22.5 11.5 L22.5 24 L20 24 L20 18 L16 18 L16 24 L13.5 24 Z" />
              <circle cx="27" cy="6" r="3.5" />
              <path d="M22 14 C22 11, 32 11, 32 14 L32 26 L29 26 L29 20 L25 20 L25 26 L22 26 Z" />
            </svg>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[9px] font-black uppercase tracking-wider text-white">NURTURING YOUNG MINDS</p>
            <p className="text-[9px] font-black uppercase tracking-wider text-[#F7C934]">BUILDING BRIGHT FUTURES</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticularRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 py-0.5 text-xs">
      <span className="w-36 shrink-0 font-black text-[#25163E]">
        {label}
      </span>
      <span className="font-black text-[#25163E]">:</span>
      <div className="flex-1 border-b border-[#25163E]/30 pb-0.5 font-bold text-[#1E1235] truncate">
        {value || "—"}
      </div>
    </div>
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
            admission: true,
            programmeDefinition: true,
            enrollmentContract: true,
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
                enrollmentContract: true,
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

  const admissionNumber =
    receipt.student.admission?.admissionNumber ||
    receipt.student.studentNumber;

  const className = formatProgrammeName(
    receipt.student.programme,
    receipt.student.programmeDefinition?.name,
  );

  const rollNumber = receipt.student.studentNumber;

  const parentName =
    primaryGuardian?.name ?? "Parent / Guardian";

  const contactNumber =
    primaryGuardian?.phone ?? schoolProfile.phone;

  const paymentMonth =
    receipt.payment.feePeriodLabel ||
    new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(receipt.payment.paymentDate);

  const academicYear =
    receipt.payment.invoice?.enrollmentContract?.academicSession ||
    receipt.student.enrollmentContract?.academicSession ||
    "2026-27";

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
          className="relative mx-auto max-w-4xl overflow-hidden rounded-[26px] border-2 border-[#25163E]/30 bg-white p-4 sm:p-6 md:p-8 shadow-[0_24px_70px_rgba(45,23,54,0.12)] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
        >
          {receipt.status !== "ISSUED" ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
              <p className="-rotate-12 whitespace-nowrap text-6xl font-black uppercase tracking-[0.12em] text-slate-500/10 sm:text-8xl print:text-slate-500/15">
                {receiptStatusLabels[receipt.status] ?? receipt.status}
              </p>
            </div>
          ) : null}

          {/* Top Header Row with Hanging Ribbon, Kidzee Branding, and Receipt Number Box */}
          <header className="relative flex flex-col md:flex-row items-start justify-between gap-4">
            {/* Top Left Ribbon + Playful Doodles */}
            <div className="flex items-start gap-3">
              <div className="relative -mt-4 sm:-mt-6 md:-mt-8">
                <HangingRibbon />
              </div>
              <div className="hidden sm:flex flex-col gap-2 pt-2">
                <DoodleStar className="w-6 h-6 text-[#F7C934]" />
                <div className="ml-2">
                  <PaperAirplaneDoodle />
                </div>
              </div>
            </div>

            {/* Center: Kidzee Logo, Golden Ribbon Banner, and Centre Name */}
            <div className="flex-1 flex flex-col items-center text-center px-2">
              {schoolProfile.showLogoOnReceipt && schoolProfile.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={schoolProfile.logoUrl}
                  alt={schoolProfile.schoolName}
                  className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-sm"
                />
              ) : (
                <div className="text-2xl sm:text-3xl font-black tracking-wider text-[#25163E]">
                  KIDZEE
                </div>
              )}
              <p className="mt-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-[#25163E]">
                N U R T U R I N G &nbsp; G E N - N E X T
              </p>

              {/* Golden Ribbon: FEE RECEIPT */}
              <div className="my-1">
                <FeeReceiptRibbon />
              </div>

              {/* Centre Title */}
              <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-[#25163E]">
                {schoolProfile.centreName}
              </h2>
            </div>

            {/* Top Right: Smiley Doodle + Receipt No. Box */}
            <div className="flex flex-col items-end gap-2 self-stretch md:self-auto">
              <div className="hidden sm:flex items-center gap-2 pr-2">
                <SmileyDoodle />
                <DoodleStarLoop />
              </div>
              <div className="w-full sm:w-auto rounded-xl border border-[#25163E] bg-white p-3 text-left shadow-sm">
                <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-2 text-xs">
                  <span className="font-black text-[#25163E]">Receipt No.</span>
                  <span className="font-black text-[#25163E]">: <strong className="font-extrabold">{receipt.receiptNumber}</strong></span>
                  <span className="mt-1 font-black text-[#25163E]">Receipt Date</span>
                  <span className="mt-1 font-black text-[#25163E]">: {formatDate(receipt.issuedAt)}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Contact Pill */}
          <div className="mx-auto mt-4 w-full rounded-2xl border border-[#25163E] bg-[#F1F6FB] px-4 py-3 text-xs font-bold text-[#25163E] shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_auto_1fr_auto_1.3fr] items-center gap-3 text-center md:text-left">
              {/* Full Address */}
              <div className="flex items-start justify-center md:justify-start gap-2 min-w-0">
                <MapPin className="w-4 h-4 shrink-0 text-[#25163E] mt-0.5" />
                <span className="text-[11px] leading-snug font-bold text-[#25163E] text-left break-words">
                  {schoolProfile.address}
                </span>
              </div>
              <div className="hidden md:block w-px self-stretch bg-[#25163E]/25 min-h-[32px]" />
              {/* Phone */}
              <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <Phone className="w-4 h-4 shrink-0 text-[#25163E]" />
                <span className="text-[11px] font-black">
                  +91 {schoolProfile.phone}
                </span>
              </div>
              <div className="hidden md:block w-px self-stretch bg-[#25163E]/25 min-h-[32px]" />
              {/* Email */}
              <div className="flex items-center justify-center md:justify-end gap-1.5 min-w-0">
                <Mail className="w-4 h-4 shrink-0 text-[#25163E]" />
                <span className="text-[11px] font-bold text-[#25163E] break-all">
                  {schoolProfile.email}
                </span>
              </div>
            </div>
            {/* Centre Code & GSTIN */}
            <div className="mt-2 flex items-center justify-center gap-3 border-t border-[#25163E]/15 pt-1.5 text-[10px] font-extrabold text-[#25163E]/85">
              <span>Centre Code: <strong>{schoolProfile.schoolCode || "7206"}</strong></span>
              <span>•</span>
              <span>GSTIN: <strong>{schoolProfile.gstNumber || "07CIHPV5007K1ZW"}</strong></span>
            </div>
          </div>

          {/* 2-Column Student & Parent Particulars Box */}
          <section className="mt-4 overflow-hidden rounded-xl border border-[#25163E] bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {/* Left Column: Student Details */}
              <div className="space-y-2">
                <ParticularRow label="Student Name" value={studentName} />
                <ParticularRow label="Admission No." value={admissionNumber} />
                <ParticularRow label="Class / Program" value={className} />
                <ParticularRow label="Roll No." value={rollNumber} />
              </div>

              {/* Right Column: Parent Details (separated by dashed border on md+) */}
              <div className="space-y-2 md:border-l md:border-dashed md:border-[#25163E]/35 md:pl-8">
                <ParticularRow label="Parent / Guardian Name" value={parentName} />
                <ParticularRow label="Contact No." value={contactNumber} />
                <ParticularRow label="Payment Month" value={paymentMonth} />
                <ParticularRow label="Academic Year" value={academicYear} />
              </div>
            </div>
          </section>

          {/* TOTAL AMOUNT RECEIVED Bar */}
          <div className="mt-3 rounded-xl border border-[#25163E] bg-[#ECE5F2] px-4 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-[#25163E]">
                  TOTAL AMOUNT RECEIVED (₹) :
                </span>
                <span className="text-base sm:text-lg font-black text-[#25163E]">
                  ₹ {amountReceived.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="mt-1 text-[11px] font-semibold text-[#3D3050]">
              <strong className="text-[#25163E]">Amount in words:</strong> {numberToWords(amountReceived)}
            </div>
          </div>

          {/* Payment Mode & Received By Row */}
          <section className="mt-3 rounded-xl border border-[#25163E] bg-white p-3.5">
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_auto_1fr] items-center gap-4">
              {/* Left: Payment Mode Checkboxes */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-[#25163E]">
                  PAYMENT MODE :
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: "CASH", label: "Cash" },
                    { id: "UPI", label: "UPI" },
                    { id: "CHEQUE", label: "Cheque" },
                    { id: "BANK_TRANSFER", label: "Bank Transfer" },
                  ].map((mode) => {
                    const isChecked = receipt.payment.paymentMethod === mode.id;
                    return (
                      <div key={mode.id} className="flex items-center gap-1.5 text-xs font-bold text-[#25163E]">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-[#25163E] text-[10px] font-black ${
                            isChecked ? "bg-[#25163E] text-white" : "bg-white text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <span>{mode.label}</span>
                      </div>
                    );
                  })}
                </div>
                {receipt.payment.transactionReference ? (
                  <p className="mt-1.5 text-[10px] font-semibold text-[#5A4F68]">
                    Ref: {receipt.payment.transactionReference}
                  </p>
                ) : null}
              </div>

              <div className="hidden md:block w-px h-16 bg-[#25163E]/20" />

              {/* Right: Received By (Stamp & Authorised Signature) */}
              <div className="flex flex-col items-center md:items-end justify-center">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#25163E] self-start md:self-end">
                  RECEIVED BY :
                </p>
                <div className="mt-1 flex items-center justify-end gap-3 min-h-[50px]">
                  {schoolProfile.showStampOnReceipt && schoolProfile.stampUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={schoolProfile.stampUrl}
                      alt="Centre Stamp"
                      className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
                    />
                  ) : null}
                  {schoolProfile.showSignatureOnReceipt && schoolProfile.signatureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={schoolProfile.signatureUrl}
                      alt="Authorised Signatory"
                      className="h-12 w-28 sm:h-14 sm:w-32 object-contain"
                    />
                  ) : (
                    <div className="h-8 w-28 border-b border-[#25163E]" />
                  )}
                </div>
                <p className="mt-1 text-[10px] font-bold italic text-[#25163E]/80">
                  Authorised Signature
                </p>
              </div>
            </div>
          </section>

          {/* Itemized Fee Breakdown & Balance Details */}
          <section className="mt-3 overflow-hidden rounded-xl border border-[#25163E]/20 bg-white">
            <div className="grid grid-cols-[1fr_auto] bg-[#F5EFF8] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#25163E]">
              <span>Fee Particulars</span>
              <span>Amount</span>
            </div>

            {showFullInvoiceItems ? (
              invoiceItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_auto] border-t border-[#25163E]/10 px-4 py-2 text-xs font-semibold text-[#302042]">
                  <span>
                    {item.title}
                    {item.detail ? ` - ${item.detail}` : ""}
                    {item.gstApplicable ? " (GST inclusive)" : ""}
                  </span>
                  <span className="font-bold">{formatCurrency(Number(item.totalAmount))}</span>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-[1fr_auto] border-t border-[#25163E]/10 px-4 py-2 text-xs font-semibold text-[#302042]">
                <span>
                  {receipt.payment.invoice
                    ? `Payment against ${receipt.payment.invoice.invoiceNumber}`
                    : feeCategoryLabels[receipt.payment.category] ?? receipt.payment.category}
                  {receipt.payment.gstApplicable ? " (GST inclusive)" : ""}
                </span>
                <span className="font-bold">{formatCurrency(feeAmountOnReceipt)}</span>
              </div>
            )}

            {discountAmount > 0 ? (
              <div className="grid grid-cols-[1fr_auto] border-t border-[#25163E]/10 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                <span>Discount applied</span>
                <span className="font-bold">− {formatCurrency(discountAmount)}</span>
              </div>
            ) : null}

            {lateFeeAmount > 0 ? (
              <div className="grid grid-cols-[1fr_auto] border-t border-[#25163E]/10 px-4 py-1.5 text-xs font-semibold text-amber-700">
                <span>Late fee</span>
                <span className="font-bold">{formatCurrency(lateFeeAmount)}</span>
              </div>
            ) : null}

            <div className="grid grid-cols-[1fr_auto] border-t border-[#25163E]/20 bg-[#FAF7FC] px-4 py-2 text-xs font-bold text-[#25163E]">
              <span>Total Payable</span>
              <span className="font-black text-[#5B2A86]">{formatCurrency(totalAmount)}</span>
            </div>

            {paymentPendingAmount > 0 ? (
              <div className="grid grid-cols-[1fr_auto] border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
                <span>{receipt.status === "ISSUED" ? "Balance Pending After This Payment" : "Restored Invoice Balance"}</span>
                <span className="font-black text-amber-900">{formatCurrency(paymentPendingAmount)}</span>
              </div>
            ) : null}

            {receipt.payment.gstApplicable ? (
              <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-emerald-800">
                  GST included wherever applicable
                </p>
                <p className="mt-0.5 text-[10px] font-semibold leading-4 text-emerald-700">
                  The amounts above are the final parent-facing amounts.
                  Statutory tax values remain recorded internally for accounts and CA reports.
                </p>
              </div>
            ) : null}
          </section>

          {/* Bank Details (if enabled in settings) */}
          {schoolProfile.showBankDetailsOnReceipt && bankDetailsAvailable ? (
            <section className="mt-3 rounded-xl border border-[#25163E]/20 bg-[#FAF8FC] p-3 text-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#5B2A86]">
                Bank / Direct Transfer Details
              </p>
              <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-[#4A3D58]">
                {schoolProfile.bankName ? <div>Bank: <strong>{schoolProfile.bankName}</strong></div> : null}
                {schoolProfile.accountName ? <div>A/c Name: <strong>{schoolProfile.accountName}</strong></div> : null}
                {schoolProfile.accountNumber ? <div>A/c No: <strong>{schoolProfile.accountNumber}</strong></div> : null}
                {schoolProfile.ifscCode ? <div>IFSC: <strong>{schoolProfile.ifscCode}</strong></div> : null}
              </div>
            </section>
          ) : null}

          {/* Terms & Conditions Section */}
          {schoolProfile.receiptTerms.length > 0 ? (
            <section className="mt-3 rounded-xl border border-[#25163E]/20 bg-[#FAF8FC] p-3 text-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#5B2A86]">
                Terms &amp; Conditions
              </p>
              <ol className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 pl-4 text-[10px] leading-relaxed text-[#514360]">
                {schoolProfile.receiptTerms.map((term, index) => (
                  <li key={`${term}-${index}`}>
                    {index + 1}. {term}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* Bottom Wavy Footer Banner */}
          <ReceiptFooterWave />
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
