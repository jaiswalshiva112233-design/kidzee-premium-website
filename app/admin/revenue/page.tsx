import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

const feeCategoryLabels: Record<
  string,
  string
> = {
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
    "Daycare Meal Combo",
  FOOD_FEE: "Food Fee",
  LATE_FEE: "Late Fee",
  ACTIVITY_FEE: "Activity Fee",
  KIT_FEE: "Kit Fee",
  OTHER: "Other",
};

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

function getIndiaDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function startOfDay(value: Date) {
  return new Date(`${getIndiaDateKey(value)}T00:00:00.000+05:30`);
}

function startOfMonth(value: Date) {
  const [year, month] = getIndiaDateKey(value).split("-");
  return new Date(`${year}-${month}-01T00:00:00.000+05:30`);
}

function addDays(
  value: Date,
  numberOfDays: number,
) {
  return new Date(value.getTime() + numberOfDays * 86_400_000);
}

function addMonths(
  value: Date,
  numberOfMonths: number,
) {
  const [yearText, monthText] = getIndiaDateKey(value).split("-");
  const monthIndex = Number(yearText) * 12 + Number(monthText) - 1 + numberOfMonths;
  const year = Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000+05:30`,
  );
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getPaymentCategoryAllocations(payment: {
  category: string;
  amountReceived: unknown;
  invoice: {
    items: Array<{ category: string; totalAmount: unknown }>;
  } | null;
}) {
  const received = roundMoney(Number(payment.amountReceived));
  const weights = new Map<string, number>();

  for (const item of payment.invoice?.items ?? []) {
    weights.set(
      item.category,
      roundMoney((weights.get(item.category) ?? 0) + Number(item.totalAmount)),
    );
  }

  const entries = [...weights.entries()].filter(([, amount]) => amount > 0);
  const totalWeight = entries.reduce((sum, [, amount]) => sum + amount, 0);

  if (entries.length === 0 || totalWeight <= 0) {
    return [{ category: payment.category, amount: received }];
  }

  let allocated = 0;
  return entries.map(([category, weight], index) => {
    const amount =
      index === entries.length - 1
        ? roundMoney(received - allocated)
        : roundMoney((received * weight) / totalWeight);
    allocated = roundMoney(allocated + amount);
    return { category, amount };
  });
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
  word: string,
) {
  return `${count} ${word}${
    count === 1 ? "" : "s"
  }`;
}

export default async function RevenuePage() {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(
    todayStart,
    1,
  );

  const currentMonthStart =
    startOfMonth(now);

  const nextMonthStart = addMonths(
    currentMonthStart,
    1,
  );

  const previousMonthStart = addMonths(
    currentMonthStart,
    -1,
  );

  const trendStart = addMonths(
    currentMonthStart,
    -5,
  );

  const [
    trendPayments,
    trendExpenses,
    lifetimePaymentTotal,
    lifetimeExpenseTotal,
    pendingFeeTotal,
    openInvoiceCount,
    overdueInvoiceCount,
    currentMonthReceiptCount,
    recentPayments,
  ] = await Promise.all([
    prisma.feePayment.findMany({
      where: {
        paymentDate: {
          gte: trendStart,
          lt: nextMonthStart,
        },

        status: {
          in: [
            "PAID",
            "PARTIALLY_PAID",
          ],
        },
      },

      select: {
        id: true,
        paymentDate: true,
        amountReceived: true,
        paymentMethod: true,
        category: true,
        invoice: {
          select: {
            items: {
              select: {
                category: true,
                totalAmount: true,
              },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },

      orderBy: {
        paymentDate: "asc",
      },
    }),

    prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: trendStart,
          lt: nextMonthStart,
        },
      },

      select: {
        id: true,
        expenseDate: true,
        totalAmount: true,
        category: true,
      },

      orderBy: {
        expenseDate: "asc",
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

    prisma.expense.aggregate({
      _sum: {
        totalAmount: true,
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

    prisma.feeInvoice.count({
      where: {
        status: "OVERDUE",
      },
    }),

    prisma.receipt.count({
      where: {
        status: "ISSUED",

        issuedAt: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
    }),

    prisma.feePayment.findMany({
      where: {
        amountReceived: {
          gt: 0,
        },

        status: {
          in: [
            "PAID",
            "PARTIALLY_PAID",
          ],
        },
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

        receipt: {
          select: {
            id: true,
            receiptNumber: true,
            status: true,
          },
        },

        invoice: {
          select: {
            invoiceNumber: true,
          },
        },
      },

      orderBy: [
        {
          paymentDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],

      take: 8,
    }),
  ]);

  const currentMonthPayments =
    trendPayments.filter(
      (payment) =>
        payment.paymentDate >=
          currentMonthStart &&
        payment.paymentDate <
          nextMonthStart,
    );

  const previousMonthPayments =
    trendPayments.filter(
      (payment) =>
        payment.paymentDate >=
          previousMonthStart &&
        payment.paymentDate <
          currentMonthStart,
    );

  const currentMonthExpenses =
    trendExpenses.filter(
      (expense) =>
        expense.expenseDate >=
          currentMonthStart &&
        expense.expenseDate <
          nextMonthStart,
    );

  const previousMonthExpenses =
    trendExpenses.filter(
      (expense) =>
        expense.expenseDate >=
          previousMonthStart &&
        expense.expenseDate <
          currentMonthStart,
    );

  const currentMonthRevenue =
    currentMonthPayments.reduce(
      (total, payment) =>
        total +
        Number(payment.amountReceived),
      0,
    );

  const previousMonthRevenue =
    previousMonthPayments.reduce(
      (total, payment) =>
        total +
        Number(payment.amountReceived),
      0,
    );

  const currentMonthExpenseTotal =
    currentMonthExpenses.reduce(
      (total, expense) =>
        total +
        Number(expense.totalAmount),
      0,
    );

  const previousMonthExpenseTotal =
    previousMonthExpenses.reduce(
      (total, expense) =>
        total +
        Number(expense.totalAmount),
      0,
    );

  const currentMonthNet =
    currentMonthRevenue -
    currentMonthExpenseTotal;

  const previousMonthNet =
    previousMonthRevenue -
    previousMonthExpenseTotal;

  const todayCollection =
    currentMonthPayments
      .filter(
        (payment) =>
          payment.paymentDate >=
            todayStart &&
          payment.paymentDate <
            tomorrowStart,
      )
      .reduce(
        (total, payment) =>
          total +
          Number(
            payment.amountReceived,
          ),
        0,
      );

  const lifetimeRevenue = Number(
    lifetimePaymentTotal._sum
      .amountReceived ?? 0,
  );

  const lifetimeExpenses = Number(
    lifetimeExpenseTotal._sum
      .totalAmount ?? 0,
  );

  const lifetimeNet =
    lifetimeRevenue -
    lifetimeExpenses;

  const pendingFees = Number(
    pendingFeeTotal._sum.pendingAmount ??
      0,
  );

  const monthLabel =
    new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(now);

  const previousMonthLabel =
    new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(previousMonthStart);

  const revenueChange =
    previousMonthRevenue > 0
      ? ((currentMonthRevenue -
          previousMonthRevenue) /
          previousMonthRevenue) *
        100
      : null;

  const methodBreakdown =
    Object.entries(
      currentMonthPayments.reduce<
        Record<
          string,
          {
            amount: number;
            count: number;
          }
        >
      >((result, payment) => {
        const key =
          payment.paymentMethod;

        const current =
          result[key] ?? {
            amount: 0,
            count: 0,
          };

        result[key] = {
          amount:
            current.amount +
            Number(
              payment.amountReceived,
            ),

          count:
            current.count + 1,
        };

        return result;
      }, {}),
    )
      .map(
        ([method, details]) => ({
          method,

          label:
            paymentMethodLabels[
              method
            ] ?? method,

          amount: details.amount,

          count: details.count,
        }),
      )
      .sort(
        (left, right) =>
          right.amount -
          left.amount,
      );

  const categoryBreakdown =
    Object.entries(
      currentMonthPayments.reduce<
        Record<
          string,
          {
            amount: number;
            count: number;
          }
        >
      >((result, payment) => {
        for (const allocation of getPaymentCategoryAllocations(payment)) {
          const current = result[allocation.category] ?? {
            amount: 0,
            count: 0,
          };

          result[allocation.category] = {
            amount: roundMoney(current.amount + allocation.amount),
            count: current.count + 1,
          };
        }

        return result;
      }, {}),
    )
      .map(
        ([category, details]) => ({
          category,

          label:
            feeCategoryLabels[
              category
            ] ?? category,

          amount: details.amount,

          count: details.count,
        }),
      )
      .sort(
        (left, right) =>
          right.amount -
          left.amount,
      );

  const monthlyTrend = Array.from(
    {
      length: 6,
    },
    (_, index) => {
      const monthStart =
        addMonths(
          trendStart,
          index,
        );

      const monthEnd =
        addMonths(monthStart, 1);

      const income =
        trendPayments
          .filter(
            (payment) =>
              payment.paymentDate >=
                monthStart &&
              payment.paymentDate <
                monthEnd,
          )
          .reduce(
            (total, payment) =>
              total +
              Number(
                payment.amountReceived,
              ),
            0,
          );

      const expenses =
        trendExpenses
          .filter(
            (expense) =>
              expense.expenseDate >=
                monthStart &&
              expense.expenseDate <
                monthEnd,
          )
          .reduce(
            (total, expense) =>
              total +
              Number(
                expense.totalAmount,
              ),
            0,
          );

      return {
        key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,

        label:
          new Intl.DateTimeFormat(
            "en-IN",
            {
              month: "short",
              timeZone:
                "Asia/Kolkata",
            },
          ).format(monthStart),

        income,

        expenses,

        net:
          income - expenses,
      };
    },
  );

  const largestTrendValue = Math.max(
    1,

    ...monthlyTrend.flatMap(
      (month) => [
        month.income,
        month.expenses,
      ],
    ),
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="overflow-hidden rounded-[30px] bg-[#2D1736] text-white shadow-[0_24px_70px_rgba(45,23,54,0.2)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10 lg:py-10">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <TrendingUp
                    aria-hidden="true"
                    size={23}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B]">
                    Accounts
                  </p>

                  <p className="mt-1 text-sm font-bold text-white/60">
                    {monthLabel}
                  </p>
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Revenue & Cash Flow
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                Review valid fee
                collections, expenses,
                payment methods, invoice
                dues and your centre&apos;s
                live financial position.
                Cancelled and refunded
                payments remain in the
                audit history but never
                inflate revenue.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/fees#collect-fee"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD968]"
              >
                <CircleDollarSign
                  aria-hidden="true"
                  size={18}
                />

                Collect Fee
              </Link>

              <Link
                href="/admin/expenses"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
              >
                <HandCoins
                  aria-hidden="true"
                  size={18}
                />

                Add Expense
              </Link>
            </div>
          </div>
        </header>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
            Current position
          </p>

          <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
            {monthLabel} at a glance
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Revenue This Month"
              value={formatCurrency(
                currentMonthRevenue,
              )}
              description={pluralise(
                currentMonthPayments.length,
                "valid payment",
              )}
              icon={
                CircleDollarSign
              }
              tone="green"
            />

            <StatCard
              title="Expenses This Month"
              value={formatCurrency(
                currentMonthExpenseTotal,
              )}
              description={pluralise(
                currentMonthExpenses.length,
                "expense record",
              )}
              icon={HandCoins}
              tone="red"
            />

            <StatCard
              title="Net Position"
              value={formatCurrency(
                currentMonthNet,
              )}
              description={
                currentMonthNet >= 0
                  ? "Positive centre position"
                  : "Expenses are above revenue"
              }
              icon={WalletCards}
              tone={
                currentMonthNet >= 0
                  ? "purple"
                  : "amber"
              }
            />

            <StatCard
              title="Pending Fees"
              value={formatCurrency(
                pendingFees,
              )}
              description={`${pluralise(
                openInvoiceCount,
                "open invoice",
              )}${
                overdueInvoiceCount > 0
                  ? ` · ${pluralise(
                      overdueInvoiceCount,
                      "overdue invoice",
                    )}`
                  : ""
              }`}
              icon={Banknote}
              tone="amber"
            />
          </div>
        </section>

        {overdueInvoiceCount > 0 ? (
          <section className="flex flex-col gap-4 rounded-[24px] border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-red-700"
                size={20}
              />

              <div>
                <p className="text-sm font-black text-red-800">
                  {pluralise(
                    overdueInvoiceCount,
                    "invoice",
                  )}{" "}
                  overdue
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-red-700">
                  Review the outstanding
                  balance and follow up
                  with the parent.
                </p>
              </div>
            </div>

            <Link
              href="/admin/fees"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-700 px-4 text-xs font-black text-white"
            >
              Open Fee Register
            </Link>
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-3">
          <QuickCard
            icon={CalendarDays}
            badge="Today"
            title="Today's Collection"
            value={formatCurrency(
              todayCollection,
            )}
            detail={`Payments received on ${formatDate(
              now,
            )}`}
            tone="emerald"
          />

          <QuickCard
            icon={ReceiptText}
            badge="Receipts"
            title="Receipts This Month"
            value={currentMonthReceiptCount.toString()}
            detail="Valid receipts currently issued"
            tone="blue"
            href="/admin/receipts"
          />

          <QuickCard
            icon={
              currentMonthNet >=
              previousMonthNet
                ? ArrowUpRight
                : ArrowDownRight
            }
            badge="Comparison"
            title="Previous Month Revenue"
            value={formatCurrency(
              previousMonthRevenue,
            )}
            detail={`${previousMonthLabel}${
              revenueChange === null
                ? ""
                : ` · ${
                    revenueChange >= 0
                      ? "+"
                      : ""
                  }${revenueChange.toFixed(
                    1,
                  )}%`
            }`}
            tone={
              currentMonthNet >=
              previousMonthNet
                ? "emerald"
                : "red"
            }
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <article className="rounded-[28px] border border-[#E9E2ED] bg-white p-6 shadow-[0_18px_55px_rgba(45,23,54,0.07)] sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
                <BarChart3
                  aria-hidden="true"
                  size={20}
                />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                  Six-month trend
                </p>

                <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                  Revenue and expenses
                </h2>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              {monthlyTrend.map(
                (month) => (
                  <div key={month.key}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="w-12 text-sm font-black text-[#2D1736]">
                        {month.label}
                      </p>

                      <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs font-bold">
                        <span className="text-emerald-700">
                          Income{" "}
                          {formatCurrency(
                            month.income,
                          )}
                        </span>

                        <span className="text-red-600">
                          Expense{" "}
                          {formatCurrency(
                            month.expenses,
                          )}
                        </span>

                        <span
                          className={
                            month.net >= 0
                              ? "text-[#5B2A86]"
                              : "text-amber-700"
                          }
                        >
                          Net{" "}
                          {formatCurrency(
                            month.net,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 sm:pl-12">
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#F2EEF4]">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${
                              month.income >
                              0
                                ? Math.max(
                                    (month.income /
                                      largestTrendValue) *
                                      100,
                                    4,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-[#F2EEF4]">
                        <div
                          className="h-full rounded-full bg-red-400"
                          style={{
                            width: `${
                              month.expenses >
                              0
                                ? Math.max(
                                    (month.expenses /
                                      largestTrendValue) *
                                      100,
                                    4,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </article>

          <article className="rounded-[28px] bg-[#2D1736] p-6 text-white shadow-[0_20px_60px_rgba(45,23,54,0.18)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#F6C84B]">
              Lifetime position
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Centre financial summary
            </h2>

            <div className="mt-7 space-y-4">
              <LifetimeRow
                label="Total revenue"
                value={formatCurrency(
                  lifetimeRevenue,
                )}
                colour="text-emerald-300"
              />

              <LifetimeRow
                label="Total expenses"
                value={formatCurrency(
                  lifetimeExpenses,
                )}
                colour="text-red-300"
              />

              <LifetimeRow
                label="Net position"
                value={formatCurrency(
                  lifetimeNet,
                )}
                colour={
                  lifetimeNet >= 0
                    ? "text-[#F6C84B]"
                    : "text-amber-300"
                }
                important
              />
            </div>

            <p className="mt-7 rounded-2xl bg-white/10 px-4 py-3 text-xs font-semibold leading-5 text-white/70">
              Revenue uses valid payments
              only. Cancelled and refunded
              receipts remain available
              for audit but are excluded
              from every total.
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <BreakdownCard
            title="Payment methods"
            description="How parents paid this month."
            icon={CreditCard}
            rows={methodBreakdown.map(
              (item) => ({
                key: item.method,
                label: item.label,
                detail: pluralise(
                  item.count,
                  "payment",
                ),
                value: formatCurrency(
                  item.amount,
                ),
              }),
            )}
            emptyMessage="No valid fee payments have been recorded this month."
          />

          <BreakdownCard
            title="Fee categories"
            description="Which services generated revenue this month."
            icon={CircleDollarSign}
            rows={categoryBreakdown.map(
              (item) => ({
                key: item.category,
                label: item.label,
                detail: pluralise(
                  item.count,
                  "payment",
                ),
                value: formatCurrency(
                  item.amount,
                ),
              }),
            )}
            emptyMessage="No fee-category revenue is available this month."
          />
        </section>

        <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-6 shadow-[0_18px_55px_rgba(45,23,54,0.07)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                Recent activity
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
                Latest valid collections
              </h2>

              <p className="mt-2 text-sm font-semibold text-[#817684]">
                Cancelled and refunded
                payments are excluded from
                this list.
              </p>
            </div>

            <Link
              href="/admin/fees"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F3EAF8] px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#EBDDF2]"
            >
              View All Payments
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#DCCFE4] bg-[#FAF8FC] px-5 py-10 text-center">
              <p className="text-sm font-black text-[#817684]">
                No valid fee payments
                recorded yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-[#EEE8F1]">
              {recentPayments.map(
                (payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#2D1736]">
                        {getStudentName(
                          payment.student,
                        )}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#817684]">
                        {
                          payment.student
                            .studentNumber
                        }{" "}
                        ·{" "}
                        {feeCategoryLabels[
                          payment.category
                        ] ??
                          payment.category}

                        {payment.invoice
                          ? ` · ${payment.invoice.invoiceNumber}`
                          : ""}

                        {` · ${formatDate(
                          payment.paymentDate,
                        )}`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="sm:text-right">
                        <p className="text-base font-black text-emerald-700">
                          {formatCurrency(
                            Number(
                              payment.amountReceived,
                            ),
                          )}
                        </p>

                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#918596]">
                          {paymentMethodLabels[
                            payment.paymentMethod
                          ] ??
                            payment.paymentMethod}
                        </p>
                      </div>

                      {payment.receipt ? (
                        <Link
                          href={`/admin/receipts/${payment.receipt.id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#2D1736] px-4 text-xs font-black text-white transition hover:bg-[#5B2A86]"
                        >
                          Receipt
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: typeof CircleDollarSign;
  tone:
    | "green"
    | "red"
    | "purple"
    | "amber";
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: StatCardProps) {
  const toneStyles = {
    green: {
      card:
        "border-emerald-200 bg-emerald-50",
      icon:
        "bg-emerald-100 text-emerald-700",
      value: "text-emerald-800",
    },

    red: {
      card:
        "border-red-200 bg-red-50",
      icon:
        "bg-red-100 text-red-700",
      value: "text-red-800",
    },

    purple: {
      card:
        "border-[#DCCFE4] bg-[#F7F2FA]",
      icon:
        "bg-[#E9DDF0] text-[#5B2A86]",
      value: "text-[#5B2A86]",
    },

    amber: {
      card:
        "border-amber-200 bg-amber-50",
      icon:
        "bg-amber-100 text-amber-700",
      value: "text-amber-800",
    },
  } as const;

  const selectedStyle =
    toneStyles[tone];

  return (
    <article
      className={`rounded-[24px] border p-5 ${selectedStyle.card}`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${selectedStyle.icon}`}
      >
        <Icon
          aria-hidden="true"
          size={20}
        />
      </span>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
        {title}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${selectedStyle.value}`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold leading-5 text-[#817684]">
        {description}
      </p>
    </article>
  );
}

type QuickCardProps = {
  icon: typeof CalendarDays;
  badge: string;
  title: string;
  value: string;
  detail: string;
  tone:
    | "emerald"
    | "blue"
    | "red";
  href?: string;
};

function QuickCard({
  icon: Icon,
  badge,
  title,
  value,
  detail,
  tone,
  href,
}: QuickCardProps) {
  const tones = {
    emerald:
      "bg-emerald-50 text-emerald-700",

    blue:
      "bg-blue-50 text-blue-700",

    red:
      "bg-red-50 text-red-700",
  } as const;

  return (
    <article className="rounded-[26px] border border-[#E9E2ED] bg-white p-6 shadow-[0_18px_50px_rgba(45,23,54,0.07)]">
      <div className="flex items-center justify-between">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          <Icon
            aria-hidden="true"
            size={20}
          />
        </span>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${tones[tone]}`}
        >
          {badge}
        </span>
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-[#2D1736]">
        {value}
      </p>

      <p className="mt-2 text-sm font-semibold text-[#817684]">
        {detail}
      </p>

      {href ? (
        <Link
          href={href}
          className="mt-3 inline-flex text-sm font-black text-[#5B2A86]"
        >
          Open register
        </Link>
      ) : null}
    </article>
  );
}

type LifetimeRowProps = {
  label: string;
  value: string;
  colour: string;
  important?: boolean;
};

function LifetimeRow({
  label,
  value,
  colour,
  important = false,
}: LifetimeRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl ${
        important
          ? "border border-white/15 bg-white/10 p-4"
          : "px-1 py-2"
      }`}
    >
      <p className="text-sm font-bold text-white/65">
        {label}
      </p>

      <p
        className={`${
          important
            ? "text-xl"
            : "text-base"
        } font-black ${colour}`}
      >
        {value}
      </p>
    </div>
  );
}

type BreakdownRow = {
  key: string;
  label: string;
  detail: string;
  value: string;
};

type BreakdownCardProps = {
  title: string;
  description: string;
  icon: typeof CreditCard;
  rows: BreakdownRow[];
  emptyMessage: string;
};

function BreakdownCard({
  title,
  description,
  icon: Icon,
  rows,
  emptyMessage,
}: BreakdownCardProps) {
  return (
    <article className="rounded-[28px] border border-[#E9E2ED] bg-white p-6 shadow-[0_18px_55px_rgba(45,23,54,0.07)] sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
          <Icon
            aria-hidden="true"
            size={20}
          />
        </span>

        <div>
          <h2 className="text-xl font-black text-[#2D1736]">
            {title}
          </h2>

          <p className="mt-1 text-sm font-semibold text-[#817684]">
            {description}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#DCCFE4] bg-[#FAF8FC] px-5 py-9 text-center">
          <p className="text-sm font-bold text-[#817684]">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-[#EEE8F1]">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#2D1736]">
                  {row.label}
                </p>

                <p className="mt-1 text-xs font-semibold text-[#817684]">
                  {row.detail}
                </p>
              </div>

              <p className="shrink-0 text-sm font-black text-[#5B2A86]">
                {row.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
