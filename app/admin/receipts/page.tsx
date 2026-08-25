import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  FileText,
  IndianRupee,
  ReceiptText,
  Search,
  UserRound,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const receiptStatusLabels: Record<string, string> = {
  ISSUED: "Issued",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const receiptStatusStyles: Record<string, string> = {
  ISSUED: "border-green-200 bg-green-50 text-green-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
  REFUNDED: "border-blue-200 bg-blue-50 text-blue-700",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  CHEQUE: "Cheque",
  OTHER: "Other",
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

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function startOfMonth() {
  const date = new Date();

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
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

export const dynamic = "force-dynamic";

export default async function AdminReceiptsPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const monthStart = startOfMonth();

  const [
    receipts,
    totalReceipts,
    issuedReceipts,
    cancelledReceipts,
    refundedReceipts,
    todayAmountResult,
    monthlyAmountResult,
  ] = await Promise.all([
    prisma.receipt.findMany({
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
        payment: {
          select: {
            paymentNumber: true,
            category: true,
            feePeriodLabel: true,
            amountReceived: true,
            pendingAmount: true,
            paymentMethod: true,
            paymentDate: true,
            status: true,
          },
        },
      },
      orderBy: {
        issuedAt: "desc",
      },
      take: 250,
    }),

    prisma.receipt.count(),

    prisma.receipt.count({
      where: {
        status: "ISSUED",
      },
    }),

    prisma.receipt.count({
      where: {
        status: "CANCELLED",
      },
    }),

    prisma.receipt.count({
      where: {
        status: "REFUNDED",
      },
    }),

    prisma.feePayment.aggregate({
      where: {
        paymentDate: {
          gte: todayStart,
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
  ]);

  const todayAmount = Number(
    todayAmountResult._sum.amountReceived ?? 0,
  );

  const monthlyAmount = Number(
    monthlyAmountResult._sum.amountReceived ?? 0,
  );

  const summaryCards = [
    {
      title: "Total Receipts",
      value: totalReceipts.toString(),
      description: "All receipt records",
      icon: ReceiptText,
      accent: "bg-[#F3EAF8] text-[#5B2A86]",
    },
    {
      title: "Issued",
      value: issuedReceipts.toString(),
      description: "Active receipt records",
      icon: FileText,
      accent: "bg-[#E9F8F2] text-[#28755D]",
    },
    {
      title: "Cancelled",
      value: cancelledReceipts.toString(),
      description: "Cancelled receipts",
      icon: FileText,
      accent: "bg-[#F1F2F4] text-[#5F6670]",
    },
    {
      title: "Refunded",
      value: refundedReceipts.toString(),
      description: "Refunded receipt records",
      icon: CircleDollarSign,
      accent: "bg-[#E8F4FF] text-[#1769AA]",
    },
    {
      title: "Today's Collection",
      value: formatCurrency(todayAmount),
      description: "Amount received today",
      icon: IndianRupee,
      accent: "bg-[#FFF3D5] text-[#8A6100]",
    },
    {
      title: "This Month",
      value: formatCurrency(monthlyAmount),
      description: "Amount received this month",
      icon: CalendarDays,
      accent: "bg-[#FFF0F3] text-[#A94159]",
    },
  ] as const;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <ReceiptText
                    aria-hidden="true"
                    size={23}
                  />
                </span>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B] sm:text-sm">
                  Receipt Register
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Receipts
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                Review every fee receipt, student payment,
                collection method and receipt status from one place.
              </p>
            </div>

            <Link
              href="/admin/fees"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD65F]"
            >
              Collect Fee
              <ArrowRight
                aria-hidden="true"
                size={17}
              />
            </Link>
          </div>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
            Live receipt overview
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
            Receipt activity at a glance
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)]"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}
                  >
                    <Icon aria-hidden="true" size={22} />
                  </span>

                  <p className="mt-5 text-sm font-bold text-[#746A78]">
                    {card.title}
                  </p>

                  <p className="mt-1 break-words text-2xl font-black tracking-[-0.04em] text-[#2D1736]">
                    {card.value}
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-5 text-[#928896]">
                    {card.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                Receipt register
              </p>

              <h2 className="mt-2 text-xl font-black text-[#2D1736] sm:text-2xl">
                All receipts
              </h2>

              <p className="mt-2 text-sm font-semibold text-[#817684]">
                Showing {receipts.length} recent receipt records
              </p>
            </div>

            <label className="relative block">
              <span className="sr-only">
                Search receipts
              </span>

              <Search
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#968B9A]"
              />

              <input
                type="search"
                disabled
                placeholder="Search receipt or student"
                className="min-h-12 w-full rounded-2xl border border-[#E1D8E5] bg-[#FAF8FC] py-3 pl-11 pr-4 text-sm font-semibold text-[#2D1736] outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:w-72"
              />
            </label>
          </div>

          {receipts.length === 0 ? (
            <div className="mt-6 flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#DCCFE3] bg-[#FBF9FC] px-5 py-12 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1E7F5] text-[#5B2A86]">
                <ReceiptText
                  aria-hidden="true"
                  size={29}
                />
              </span>

              <h3 className="mt-5 text-xl font-black text-[#2D1736]">
                No receipts issued yet
              </h3>

              <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
                Record a fee payment from the Fees page. The receipt
                will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {receipts.map((receipt) => (
                <article
                  key={receipt.id}
                  className="rounded-[22px] border border-[#ECE5F0] bg-[#FAF8FC] p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-[#2D1736]">
                          {getStudentName(receipt.student)}
                        </p>

                        <span
                          className={[
                            "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em]",
                            receiptStatusStyles[
                              receipt.status
                            ] ??
                              "border-slate-200 bg-slate-50 text-slate-600",
                          ].join(" ")}
                        >
                          {receiptStatusLabels[
                            receipt.status
                          ] ?? receipt.status}
                        </span>
                      </div>

                      <p className="mt-1 text-xs font-semibold text-[#817684]">
                        {receipt.student.studentNumber}
                      </p>

                      <p className="mt-2 text-xs font-black uppercase tracking-[0.09em] text-[#7A459C]">
                        {receipt.receiptNumber}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#817684]">
                        Issued {formatDateTime(receipt.issuedAt)}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 xl:min-w-[760px]">
                      <ReceiptValue
                        label="Category"
                        value={
                          feeCategoryLabels[
                            receipt.payment.category
                          ] ?? receipt.payment.category
                        }
                      />

                      <ReceiptValue
                        label="Amount"
                        value={formatCurrency(
                          Number(
                            receipt.payment.amountReceived,
                          ),
                        )}
                      />

                      <ReceiptValue
                        label="Method"
                        value={
                          paymentMethodLabels[
                            receipt.payment.paymentMethod
                          ] ??
                          receipt.payment.paymentMethod
                        }
                      />

                      <ReceiptValue
                        label="Payment Date"
                        value={formatDate(
                          receipt.payment.paymentDate,
                        )}
                      />

                      <Link
                        href={`/admin/receipts/${receipt.id}`}
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white transition hover:bg-[#4B206F]"
                      >
                        Open Receipt
                        <ArrowRight
                          aria-hidden="true"
                          size={16}
                        />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-[#E9E2ED] pt-4 text-xs font-semibold text-[#817684] sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Payment: {receipt.payment.paymentNumber}
                    </span>

                    <span>
                      {receipt.payment.feePeriodLabel
                        ? `Fee period: ${receipt.payment.feePeriodLabel}`
                        : "Fee period not specified"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[28px] bg-[#2D1736] p-5 text-white shadow-[0_18px_48px_rgba(45,23,54,0.16)] sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
              <UserRound
                aria-hidden="true"
                size={22}
              />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#F6C84B]">
                Receipt workflow
              </p>

              <h2 className="mt-2 text-xl font-black">
                Receipts are linked to student records
              </h2>

              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/70">
                Every receipt remains connected to the student and
                payment record, so collection history can be viewed
                later from the Fees, Receipts and Student Profile pages.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

type ReceiptValueProps = {
  label: string;
  value: string;
};

function ReceiptValue({
  label,
  value,
}: ReceiptValueProps) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#8B808F]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-[#2D1736]">
        {value}
      </p>
    </div>
  );
}