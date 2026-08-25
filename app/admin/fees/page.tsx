import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  IndianRupee,
  ReceiptText,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import CollectFeeForm from "@/components/admin/fees/CollectFeeForm";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const feeCategoryLabels: Record<string, string> = {
  ADMISSION_FEE: "Admission Fee",
  ANNUAL_FEE: "Annual Fee",
  MONTHLY_PRESCHOOL_FEE:
    "Monthly Preschool Fee",
  DAYCARE_FEE: "Daycare Hourly Fee",
  DAYCARE_LUNCH_FEE:
    "Daycare Lunch Plan",
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

const paymentMethodLabels: Record<
  string,
  string
> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

const paymentStatusLabels: Record<
  string,
  string
> = {
  PENDING: "Pending",
  PAID: "Paid",
  PARTIALLY_PAID: "Partially Paid",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const paymentStatusStyles: Record<
  string,
  string
> = {
  PAID:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  PARTIALLY_PAID:
    "border-amber-200 bg-amber-50 text-amber-700",
  PENDING:
    "border-orange-200 bg-orange-50 text-orange-700",
  CANCELLED:
    "border-slate-200 bg-slate-100 text-slate-600",
  REFUNDED:
    "border-blue-200 bg-blue-50 text-blue-700",
};

const invoiceStatusLabels: Record<
  string,
  string
> = {
  DRAFT: "Draft",
  DUE: "Due",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  WAIVED: "Waived",
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

function pluralise(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return count === 1
    ? singular
    : plural;
}

export const dynamic = "force-dynamic";

export default async function AdminFeesPage() {
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const canAdjustInvoice =
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("fees.settings");

  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const monthStart = startOfMonth();

  const [
    activeStudents,
    payments,
    recentReceipts,
    todayCollectionResult,
    monthlyCollectionResult,
    pendingBalanceResult,
    totalCollectionResult,
    issuedReceiptCount,
    paidInvoiceCount,
    partialInvoiceCount,
    overdueInvoiceCount,
    openInvoiceCount,
    activePaymentCount,
  ] = await Promise.all([
    prisma.student.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.feePayment.findMany({
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
          select: {
            invoiceNumber: true,
            pendingAmount: true,
            status: true,
          },
        },
      },

      orderBy: {
        paymentDate: "desc",
      },

      take: 100,
    }),

    prisma.receipt.findMany({
      where: {
        status: "ISSUED",
      },

      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },

        payment: {
          select: {
            paymentNumber: true,
            amountReceived: true,
            paymentMethod: true,
            category: true,
            paymentDate: true,
          },
        },
      },

      orderBy: {
        issuedAt: "desc",
      },

      take: 6,
    }),

    prisma.feePayment.aggregate({
      where: {
        paymentDate: {
          gte: todayStart,
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

    prisma.feePayment.aggregate({
      where: {
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

    prisma.receipt.count({
      where: {
        status: "ISSUED",
      },
    }),

    prisma.feeInvoice.count({
      where: {
        status: "PAID",
      },
    }),

    prisma.feeInvoice.count({
      where: {
        status: "PARTIALLY_PAID",
      },
    }),

    prisma.feeInvoice.count({
      where: {
        status: "OVERDUE",
      },
    }),

    prisma.feeInvoice.count({
      where: {
        status: {
          in: [
            "DUE",
            "PARTIALLY_PAID",
            "OVERDUE",
          ],
        },
      },
    }),

    prisma.feePayment.count({
      where: {
        status: {
          in: [
            "PAID",
            "PARTIALLY_PAID",
          ],
        },
      },
    }),
  ]);

  const todayCollection = Number(
    todayCollectionResult._sum
      .amountReceived ?? 0,
  );

  const monthlyCollection = Number(
    monthlyCollectionResult._sum
      .amountReceived ?? 0,
  );

  const pendingBalance = Number(
    pendingBalanceResult._sum
      .pendingAmount ?? 0,
  );

  const totalCollection = Number(
    totalCollectionResult._sum
      .amountReceived ?? 0,
  );

  const paymentsToday =
    payments.filter(
      (payment) =>
        [
          "PAID",
          "PARTIALLY_PAID",
        ].includes(payment.status) &&
        payment.paymentDate >=
          todayStart &&
        payment.paymentDate <=
          todayEnd,
    ).length;

  const summaryCards = [
    {
      title: "Today's Collection",
      value: formatCurrency(
        todayCollection,
      ),
      description: `${paymentsToday} ${pluralise(
        paymentsToday,
        "payment",
      )} recorded today`,
      icon: IndianRupee,
      accent:
        "bg-[#E9F8F2] text-[#28755D]",
    },
    {
      title: "This Month",
      value: formatCurrency(
        monthlyCollection,
      ),
      description:
        "Valid fee payments received this month",
      icon: CalendarDays,
      accent:
        "bg-[#F3EAF8] text-[#5B2A86]",
    },
    {
      title: "Pending Balance",
      value: formatCurrency(
        pendingBalance,
      ),
      description: `${openInvoiceCount} open ${pluralise(
        openInvoiceCount,
        "invoice",
      )}${
        overdueInvoiceCount > 0
          ? ` · ${overdueInvoiceCount} overdue`
          : ""
      }`,
      icon: Clock3,
      accent:
        "bg-[#FFF3D5] text-[#8A6100]",
    },
    {
      title: "Lifetime Collection",
      value: formatCurrency(
        totalCollection,
      ),
      description:
        "Cancelled and refunded payments excluded",
      icon: CircleDollarSign,
      accent:
        "bg-[#E8F4FF] text-[#1769AA]",
    },
    {
      title: "Receipts Issued",
      value:
        issuedReceiptCount.toString(),
      description:
        "Currently valid receipt records",
      icon: ReceiptText,
      accent:
        "bg-[#FFF0F3] text-[#A94159]",
    },
    {
      title: "Active Students",
      value:
        activeStudents.toString(),
      description:
        "Available for fee billing and collection",
      icon: UsersRound,
      accent:
        "bg-[#EEF2FF] text-[#4C5DA8]",
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
                  Fee Management
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Fees & Payments
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                Open the child&apos;s prepared combined bill, collect a full or
                partial payment, and issue the receipt from one secure
                workflow. Normal recurring fees come only from the Student
                Contract.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/receipts"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
              >
                <ReceiptText
                  aria-hidden="true"
                  size={17}
                />

                View Receipts
              </Link>

              <a
                href="#collect-fee"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD65F]"
              >
                Collect Fee

                <ArrowRight
                  aria-hidden="true"
                  size={17}
                />
              </a>
            </div>
          </div>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
            Live financial overview
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
            Collection position at a
            glance
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
            Collection figures use valid
            payments. Outstanding figures
            use the invoice ledger, so
            repeated partial payments are
            never counted twice.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {summaryCards.map(
              (card) => {
                const Icon =
                  card.icon;

                return (
                  <article
                    key={card.title}
                    className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)]"
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}
                    >
                      <Icon
                        aria-hidden="true"
                        size={22}
                      />
                    </span>

                    <p className="mt-5 text-sm font-bold text-[#746A78]">
                      {card.title}
                    </p>

                    <p className="mt-1 break-words text-2xl font-black tracking-[-0.04em] text-[#2D1736]">
                      {card.value}
                    </p>

                    <p className="mt-2 text-xs font-semibold leading-5 text-[#928896]">
                      {
                        card.description
                      }
                    </p>
                  </article>
                );
              },
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                Invoice health
              </p>

              <h2 className="mt-2 text-xl font-black text-[#2D1736] sm:text-2xl">
                Current billing position
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <HealthCard
                  icon={CheckCircle2}
                  title="Paid Invoices"
                  value={
                    paidInvoiceCount
                  }
                  colour="bg-[#F2FAF6] text-emerald-700"
                />

                <HealthCard
                  icon={WalletCards}
                  title="Partly Paid"
                  value={
                    partialInvoiceCount
                  }
                  colour="bg-[#FFF9EA] text-amber-700"
                />

                <HealthCard
                  icon={
                    AlertTriangle
                  }
                  title="Overdue"
                  value={
                    overdueInvoiceCount
                  }
                  colour="bg-[#FFF1F1] text-red-700"
                />

                <HealthCard
                  icon={Banknote}
                  title="Valid Payments"
                  value={
                    activePaymentCount
                  }
                  colour="bg-[#F3EAF8] text-[#5B2A86]"
                />
              </div>
            </section>

            <section
              id="collect-fee"
              className="scroll-mt-24"
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                New fee entry
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
                Collect student fee
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
                Select a student and an
                open invoice. The receipt,
                invoice balance and
                collection totals update
                together after saving.
              </p>

              <div className="mt-6">
                <CollectFeeForm canAdjustInvoice={canAdjustInvoice} />
              </div>
            </section>

            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                    Audit-friendly
                    register
                  </p>

                  <h2 className="mt-2 text-xl font-black text-[#2D1736] sm:text-2xl">
                    Recent fee payments
                  </h2>
                </div>

                <p className="text-sm font-bold text-[#817684]">
                  Showing{" "}
                  {payments.length} recent
                  records
                </p>
              </div>

              {payments.length === 0 ? (
                <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#DCCFE3] bg-[#FBF9FC] px-5 py-12 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1E7F5] text-[#5B2A86]">
                    <CreditCard
                      aria-hidden="true"
                      size={29}
                    />
                  </span>

                  <h3 className="mt-5 text-xl font-black text-[#2D1736]">
                    No payments recorded
                    yet
                  </h3>

                  <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
                    Activate a student and
                    use the collection form
                    above to record the
                    first payment.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {payments.map(
                    (payment) => {
                      const currentPending =
                        payment.invoice
                          ? Number(
                              payment
                                .invoice
                                .pendingAmount,
                            )
                          : Number(
                              payment.pendingAmount,
                            );

                      return (
                        <article
                          key={payment.id}
                          className="rounded-[22px] border border-[#ECE5F0] bg-[#FAF8FC] p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-black text-[#2D1736]">
                                  {getStudentName(
                                    payment.student,
                                  )}
                                </p>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${
                                    paymentStatusStyles[
                                      payment
                                        .status
                                    ] ??
                                    "border-slate-200 bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  {paymentStatusLabels[
                                    payment
                                      .status
                                  ] ??
                                    payment.status}
                                </span>
                              </div>

                              <p className="mt-1 text-xs font-semibold text-[#817684]">
                                {
                                  payment
                                    .student
                                    .studentNumber
                                }{" "}
                                ·{" "}
                                {feeCategoryLabels[
                                  payment
                                    .category
                                ] ??
                                  payment.category}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-[#817684]">
                                {
                                  payment.paymentNumber
                                }{" "}
                                ·{" "}
                                {formatDateTime(
                                  payment.paymentDate,
                                )}
                              </p>

                              <p className="mt-1 text-xs font-bold text-[#7A459C]">
                                {payment.invoice
                                  ? `Invoice ${
                                      payment
                                        .invoice
                                        .invoiceNumber
                                    } · ${
                                      invoiceStatusLabels[
                                        payment
                                          .invoice
                                          .status
                                      ] ??
                                      payment
                                        .invoice
                                        .status
                                    }`
                                  : "Legacy payment without invoice"}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[500px]">
                              <PaymentValue
                                label="Payable"
                                value={formatCurrency(
                                  Number(
                                    payment.totalAmount,
                                  ),
                                )}
                              />

                              <PaymentValue
                                label="Received"
                                value={formatCurrency(
                                  Number(
                                    payment.amountReceived,
                                  ),
                                )}
                              />

                              <PaymentValue
                                label={
                                  payment.invoice
                                    ? "Invoice Due"
                                    : "Balance"
                                }
                                value={formatCurrency(
                                  currentPending,
                                )}
                              />

                              <PaymentValue
                                label="Method"
                                value={
                                  paymentMethodLabels[
                                    payment
                                      .paymentMethod
                                  ] ??
                                  payment.paymentMethod
                                }
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 border-t border-[#E9E2ED] pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-semibold text-[#817684]">
                              {payment.feePeriodLabel
                                ? `Fee period: ${payment.feePeriodLabel}`
                                : "Fee period not specified"}
                            </p>

                            {payment.receipt ? (
                              <Link
                                href={`/admin/receipts/${payment.receipt.id}`}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white transition hover:bg-[#4B206F]"
                              >
                                <ReceiptText
                                  aria-hidden="true"
                                  size={
                                    15
                                  }
                                />

                                Open Receipt
                              </Link>
                            ) : (
                              <span className="text-xs font-bold text-amber-700">
                                Receipt
                                unavailable
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                  <ReceiptText
                    aria-hidden="true"
                    size={21}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                    Recent activity
                  </p>

                  <h2 className="text-lg font-black text-[#2D1736]">
                    Latest valid receipts
                  </h2>
                </div>
              </div>

              {recentReceipts.length ===
              0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-[#DCCFE3] bg-[#FBF9FC] px-4 py-6 text-center">
                  <p className="text-sm font-bold text-[#817684]">
                    No receipts issued
                    yet.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {recentReceipts.map(
                    (receipt) => (
                      <Link
                        key={receipt.id}
                        href={`/admin/receipts/${receipt.id}`}
                        className="block rounded-[20px] bg-[#FAF8FC] p-4 transition hover:bg-[#F3EAF8]"
                      >
                        <p className="text-sm font-black text-[#2D1736]">
                          {getStudentName(
                            receipt.student,
                          )}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#817684]">
                          {
                            receipt.receiptNumber
                          }
                        </p>

                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-[#5B2A86]">
                              {formatCurrency(
                                Number(
                                  receipt
                                    .payment
                                    .amountReceived,
                                ),
                              )}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#817684]">
                              {formatDate(
                                receipt.issuedAt,
                              )}
                            </p>
                          </div>

                          <ArrowRight
                            aria-hidden="true"
                            size={17}
                            className="text-[#998CA0]"
                          />
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              )}

              <Link
                href="/admin/receipts"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
              >
                View All Receipts

                <ArrowRight
                  aria-hidden="true"
                  size={16}
                />
              </Link>
            </section>

            <section className="rounded-[26px] bg-[#2D1736] p-5 text-white shadow-[0_18px_48px_rgba(45,23,54,0.16)] sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                <UserRound
                  aria-hidden="true"
                  size={21}
                />
              </span>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.13em] text-[#F6C84B]">
                Protected fee workflow
              </p>

              <h2 className="mt-2 text-xl font-black">
                One payment updates every
                record
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-white/70">
                Saving a payment updates
                the linked invoice, student
                account, collection totals
                and receipt register.
                Cancelling or refunding a
                receipt reverses those
                totals without deleting
                the audit trail.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </AdminLayout>
  );
}

type HealthCardProps = {
  icon: typeof Banknote;
  title: string;
  value: number;
  colour: string;
};

function HealthCard({
  icon: Icon,
  title,
  value,
  colour,
}: HealthCardProps) {
  return (
    <article
      className={`rounded-[22px] p-5 ${colour}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
        <Icon
          aria-hidden="true"
          size={19}
        />
      </span>

      <p className="mt-4 text-sm font-bold text-[#746A78]">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black text-[#2D1736]">
        {value}
      </p>
    </article>
  );
}

type PaymentValueProps = {
  label: string;
  value: string;
};

function PaymentValue({
  label,
  value,
}: PaymentValueProps) {
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
