import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  CircleDollarSign,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  HandCoins,
  ReceiptText,
  TrendingUp,
  UserRoundPlus,
  UsersRound,
  WalletCards,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ReportRange =
  | "month"
  | "quarter"
  | "year"
  | "all";

type ReportsPageProps = {
  searchParams: Promise<{
    range?: string;
  }>;
};

const rangeOptions: Array<{
  value: ReportRange;
  label: string;
}> = [
  {
    value: "month",
    label: "This Month",
  },
  {
    value: "quarter",
    label: "This Quarter",
  },
  {
    value: "year",
    label: "This Year",
  },
  {
    value: "all",
    label: "All Time",
  },
];

const enquiryStatusLabels: Record<
  string,
  string
> = {
  NEW: "New",
  CONTACTED: "Contacted",
  NO_ANSWER: "No Answer",
  VISIT_SCHEDULED: "Visit Scheduled",
  TRIAL_SCHEDULED: "Trial Scheduled",
  INTERESTED: "Interested",
  FOLLOW_UP: "Follow-up",
  ADMITTED: "Admitted",
  NOT_INTERESTED: "Not Interested",
  CLOSED: "Closed",
};

const admissionStatusLabels: Record<
  string,
  string
> = {
  DRAFT: "Draft",
  DOCUMENTS_PENDING:
    "Documents Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

const attendanceStatusLabels: Record<
  string,
  string
> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  LEAVE: "Leave",
  HOLIDAY: "Holiday",
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
  }).format(value);
}

function getRangeStart(
  range: ReportRange,
  now: Date,
) {
  if (range === "all") {
    return null;
  }

  if (range === "year") {
    return new Date(
      now.getFullYear(),
      0,
      1,
      0,
      0,
      0,
      0,
    );
  }

  if (range === "quarter") {
    const quarterStartMonth =
      Math.floor(now.getMonth() / 3) * 3;

    return new Date(
      now.getFullYear(),
      quarterStartMonth,
      1,
      0,
      0,
      0,
      0,
    );
  }

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );
}

export default async function ReportsPage({
  searchParams,
}: ReportsPageProps) {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const params = await searchParams;

  const requestedRange =
    params.range;

  const range: ReportRange =
    rangeOptions.some(
      (option) =>
        option.value === requestedRange,
    )
      ? (requestedRange as ReportRange)
      : "month";

  const now = new Date();

  const rangeStart = getRangeStart(
    range,
    now,
  );

  const createdAtFilter = rangeStart
    ? {
        gte: rangeStart,
      }
    : undefined;

  const [
    totalStudents,
    activeStudents,
    preschoolStrength,
    daycareStrength,
    mealStrength,
    recurringContractValue,
    studentsByProgramme,
    enquiryCount,
    enquiriesByStatus,
    admissionCount,
    admissionsByStatus,
    attendanceCount,
    attendanceByStatus,
    feeCollection,
    feePaymentCount,
    pendingFeeTotal,
    expenseTotal,
    expenseCount,
    receiptCount,
    activeStaffCount,
    careerApplicationCount,
    careersByStatus,
  ] = await Promise.all([
    prisma.student.count(),

    prisma.studentEnrollmentContract.count({
      where: {
        status: "ACTIVE",
        student: { status: "ACTIVE" },
      },
    }),

    prisma.studentEnrollmentContract.count({
      where: {
        status: "ACTIVE",
        preschoolEnabled: true,
        student: { status: "ACTIVE" },
      },
    }),

    prisma.studentEnrollmentContract.count({
      where: {
        status: "ACTIVE",
        daycareEnabled: true,
        student: { status: "ACTIVE" },
      },
    }),

    prisma.studentEnrollmentContract.count({
      where: {
        status: "ACTIVE",
        mealsEnabled: true,
        student: { status: "ACTIVE" },
      },
    }),

    prisma.contractService.aggregate({
      where: {
        status: "ACTIVE",
        recurring: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        contract: { status: "ACTIVE", student: { status: "ACTIVE" } },
      },
      _sum: { total: true },
    }),

    prisma.studentEnrollmentContract.findMany({
      where: {
        status: "ACTIVE",
        preschoolEnabled: true,
        student: { status: "ACTIVE" },
      },
      select: { preschoolClass: true },
    }),

    prisma.enquiry.count({
      where: {
        createdAt: createdAtFilter,
      },
    }),

    prisma.enquiry.groupBy({
      by: ["status"],

      where: {
        createdAt: createdAtFilter,
      },

      _count: {
        _all: true,
      },

      orderBy: {
        status: "asc",
      },
    }),

    prisma.admission.count({
      where: {
        createdAt: createdAtFilter,
      },
    }),

    prisma.admission.groupBy({
      by: ["status"],

      where: {
        createdAt: createdAtFilter,
      },

      _count: {
        _all: true,
      },

      orderBy: {
        status: "asc",
      },
    }),

    prisma.studentAttendance.count({
      where: {
        attendanceDate:
          createdAtFilter,
      },
    }),

    prisma.studentAttendance.groupBy({
      by: ["status"],

      where: {
        attendanceDate:
          createdAtFilter,
      },

      _count: {
        _all: true,
      },

      orderBy: {
        status: "asc",
      },
    }),

        prisma.feePayment.aggregate({
      where: {
        paymentDate: createdAtFilter,

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

    prisma.feePayment.count({
      where: {
        paymentDate: createdAtFilter,

        status: {
          in: [
            "PAID",
            "PARTIALLY_PAID",
          ],
        },
      },
    }),

    prisma.feeInvoice.aggregate({
      where: {
        issueDate: createdAtFilter,

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

    prisma.expense.aggregate({
      where: {
        expenseDate: createdAtFilter,
      },

      _sum: {
        totalAmount: true,
      },
    }),

    prisma.expense.count({
      where: {
        expenseDate: createdAtFilter,
      },
    }),

    prisma.receipt.count({
      where: {
        issuedAt: createdAtFilter,
        status: "ISSUED",
      },
    }),

    prisma.staff.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.careerApplication.count({
      where: { createdAt: createdAtFilter },
    }),

    prisma.careerApplication.groupBy({
      by: ["status"],
      where: { createdAt: createdAtFilter },
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
  ]);

  const revenue = Number(
    feeCollection._sum.amountReceived ??
      0,
  );

  const expenses = Number(
    expenseTotal._sum.totalAmount ?? 0,
  );

  const pendingFees = Number(
    pendingFeeTotal._sum
      .pendingAmount ?? 0,
  );

  const netPosition =
    revenue - expenses;

  const admittedEnquiries =
    enquiriesByStatus.find(
      (item) =>
        item.status === "ADMITTED",
    )?._count._all ?? 0;

  const conversionRate =
    enquiryCount > 0
      ? (admittedEnquiries /
          enquiryCount) *
        100
      : 0;

  const presentAttendance =
    attendanceByStatus
      .filter((item) =>
        [
          "PRESENT",
          "LATE",
          "HALF_DAY",
        ].includes(item.status),
      )
      .reduce(
        (total, item) =>
          total + item._count._all,
        0,
      );

  const attendanceRate =
    attendanceCount > 0
      ? (presentAttendance /
          attendanceCount) *
        100
      : 0;

  const selectedRangeLabel =
    rangeOptions.find(
      (option) =>
        option.value === range,
    )?.label ?? "This Month";

  const rangeDescription =
    rangeStart === null
      ? "All records saved in CentreOS"
      : `From ${formatDate(
          rangeStart,
        )} to ${formatDate(now)}`;

  const programmeRows = Array.from(
    studentsByProgramme.reduce((counts, item) => {
      const label = item.preschoolClass || "Preschool";
      counts.set(label, (counts.get(label) ?? 0) + 1);
      return counts;
    }, new Map<string, number>()),
    ([label, count]) => ({ key: label, label, count }),
  );

  const enquiryRows =
    enquiriesByStatus
      .map((item) => ({
        key: item.status,
        label:
          enquiryStatusLabels[
            item.status
          ] ?? item.status,
        count: item._count._all,
      }))
      .sort(
        (left, right) =>
          right.count - left.count,
      );

  const admissionRows =
    admissionsByStatus
      .map((item) => ({
        key: item.status,
        label:
          admissionStatusLabels[
            item.status
          ] ?? item.status,
        count: item._count._all,
      }))
      .sort(
        (left, right) =>
          right.count - left.count,
      );

  const attendanceRows =
    attendanceByStatus
      .map((item) => ({
        key: item.status,
        label:
          attendanceStatusLabels[
            item.status
          ] ?? item.status,
        count: item._count._all,
      }))
      .sort(
        (left, right) =>
          right.count - left.count,
      );

  const careerRows = careersByStatus
    .map((item) => ({
      key: item.status,
      label: item.status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
      count: item._count._all,
    }))
    .sort((left, right) => right.count - left.count);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="overflow-hidden rounded-[30px] bg-[#2D1736] text-white shadow-[0_24px_70px_rgba(45,23,54,0.2)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10 lg:py-10">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <FileSpreadsheet
                    aria-hidden="true"
                    size={23}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B]">
                    Centre analytics
                  </p>

                  <p className="mt-1 text-sm font-bold text-white/60">
                    {selectedRangeLabel}
                  </p>
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Reports & Insights
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                Review students,
                enquiries, admissions,
                attendance, collections,
                expenses and centre
                performance from one place.
              </p>

              <p className="mt-3 text-xs font-bold text-white/50">
                {rangeDescription}
              </p>
            </div>

            <Link
              href="/admin/revenue"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD968]"
            >
              <TrendingUp
                aria-hidden="true"
                size={18}
              />

              Open Revenue
            </Link>
          </div>

          <div className="border-t border-white/10 px-6 py-4 sm:px-8 lg:px-10">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {rangeOptions.map(
                (option) => (
                  <Link
                    key={option.value}
                    href={`/admin/reports?range=${option.value}`}
                    className={[
                      "inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl px-4 text-xs font-black transition",
                      range === option.value
                        ? "bg-white text-[#2D1736]"
                        : "border border-white/15 bg-white/5 text-white hover:bg-white/10",
                    ].join(" ")}
                  >
                    {option.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        </header>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
            Performance overview
          </p>

          <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
            Important numbers at a glance
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportStat
              title="Active Students"
              value={activeStudents.toString()}
              description={`${totalStudents} total student record${
                totalStudents === 1
                  ? ""
                  : "s"
              }`}
              icon={UsersRound}
              tone="purple"
            />

            <ReportStat
              title="Preschool Strength"
              value={preschoolStrength.toString()}
              description="Active preschool contract participation"
              icon={UsersRound}
              tone="purple"
            />

            <ReportStat
              title="Daycare Strength"
              value={daycareStrength.toString()}
              description={`${mealStrength} active meal plan${mealStrength === 1 ? "" : "s"}`}
              icon={CalendarCheck2}
              tone="green"
            />

            <ReportStat
              title="Recurring Contract Value"
              value={formatCurrency(Number(recurringContractValue._sum.total ?? 0))}
              description="Current monthly service snapshots"
              icon={CircleDollarSign}
              tone="blue"
            />

            <ReportStat
              title="New Enquiries"
              value={enquiryCount.toString()}
              description={`${conversionRate.toFixed(
                1,
              )}% converted to admission`}
              icon={ClipboardCheck}
              tone="blue"
            />

            <ReportStat
              title="Career Applications"
              value={careerApplicationCount.toString()}
              description="Recruitment applications, kept separate from parent leads"
              icon={BriefcaseBusiness}
              tone="purple"
            />

            <ReportStat
              title="Admissions"
              value={admissionCount.toString()}
              description={`${admittedEnquiries} admitted enquiry record${
                admittedEnquiries === 1
                  ? ""
                  : "s"
              }`}
              icon={UserRoundPlus}
              tone="green"
            />

            <ReportStat
              title="Attendance Rate"
              value={`${attendanceRate.toFixed(
                1,
              )}%`}
              description={`${attendanceCount} attendance entr${
                attendanceCount === 1
                  ? "y"
                  : "ies"
              }`}
              icon={CalendarCheck2}
              tone="amber"
            />

            <ReportStat
              title="Fee Collection"
              value={formatCurrency(revenue)}
              description={`${feePaymentCount} payment record${
                feePaymentCount === 1
                  ? ""
                  : "s"
              }`}
              icon={CircleDollarSign}
              tone="green"
            />

            <ReportStat
              title="Expenses"
              value={formatCurrency(expenses)}
              description={`${expenseCount} expense record${
                expenseCount === 1
                  ? ""
                  : "s"
              }`}
              icon={HandCoins}
              tone="red"
            />

            <ReportStat
              title="Net Position"
              value={formatCurrency(
                netPosition,
              )}
              description={
                netPosition >= 0
                  ? "Positive financial position"
                  : "Expenses are above revenue"
              }
              icon={WalletCards}
              tone={
                netPosition >= 0
                  ? "purple"
                  : "amber"
              }
            />

            <ReportStat
              title="Pending Fees"
              value={formatCurrency(
                pendingFees,
              )}
              description={`${receiptCount} issued receipt${
                receiptCount === 1
                  ? ""
                  : "s"
              }`}
              icon={ReceiptText}
              tone="amber"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <BreakdownPanel
            title="Active students by programme"
            description="Current centre strength across each programme."
            icon={GraduationCap}
            rows={programmeRows}
            emptyMessage="No active students have been added yet."
          />

          <BreakdownPanel
            title="Enquiry pipeline"
            description={`Parent enquiries received during ${selectedRangeLabel.toLowerCase()}.`}
            icon={ClipboardCheck}
            rows={enquiryRows}
            emptyMessage="No enquiries are available for this period."
          />

          <BreakdownPanel
            title="Admission status"
            description="Admission records and document progress."
            icon={UserRoundPlus}
            rows={admissionRows}
            emptyMessage="No admission records are available for this period."
          />

          <BreakdownPanel
            title="Attendance status"
            description="Student attendance position for the selected period."
            icon={CalendarCheck2}
            rows={attendanceRows}
            emptyMessage="No attendance has been recorded for this period."
          />

          <BreakdownPanel
            title="Careers pipeline"
            description={`Recruitment applications received during ${selectedRangeLabel.toLowerCase()}; never included in admissions.`}
            icon={BriefcaseBusiness}
            rows={careerRows}
            emptyMessage="No career applications are available for this period."
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
                  Financial summary
                </p>

                <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                  Revenue, expenses and
                  pending fees
                </h2>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <FinancialSummary
                label="Fee revenue"
                value={formatCurrency(
                  revenue,
                )}
                description="Payments received"
                colour="green"
              />

              <FinancialSummary
                label="Centre expenses"
                value={formatCurrency(
                  expenses,
                )}
                description="Expenses recorded"
                colour="red"
              />

              <FinancialSummary
                label="Net position"
                value={formatCurrency(
                  netPosition,
                )}
                description={
                  netPosition >= 0
                    ? "Revenue after expenses"
                    : "Current financial shortfall"
                }
                colour={
                  netPosition >= 0
                    ? "purple"
                    : "amber"
                }
              />

              <FinancialSummary
                label="Pending balance"
                value={formatCurrency(
                  pendingFees,
                )}
                description="Recorded unpaid balance"
                colour="amber"
              />
            </div>
          </article>

          <article className="rounded-[28px] bg-[#2D1736] p-6 text-white shadow-[0_20px_60px_rgba(45,23,54,0.18)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#F6C84B]">
              Centre operations
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Current records
            </h2>

            <div className="mt-7 space-y-4">
              <OperationRow
                label="Active staff"
                value={activeStaffCount}
              />

              <OperationRow
                label="Fee payments"
                value={feePaymentCount}
              />

              <OperationRow
                label="Receipts issued"
                value={receiptCount}
              />

              <OperationRow
                label="Expenses saved"
                value={expenseCount}
              />
            </div>

            <p className="mt-7 rounded-2xl bg-white/10 px-4 py-3 text-xs font-semibold leading-5 text-white/70">
              All reports update
              automatically from the
              CentreOS database. No manual
              calculation is required.
            </p>
          </article>
        </section>

                <section className="rounded-[28px] border border-[#DCCFE4] bg-[#F8F3FA] p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B2A86] shadow-sm">
                <FileSpreadsheet
                  aria-hidden="true"
                  size={20}
                />
              </span>

              <div>
                <h2 className="text-xl font-black text-[#2D1736]">
                  CA-ready PDF exports are live
                </h2>

                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#817684]">
                  Download fee, daycare, GST,
                  expense, income and receipt
                  reports with your preferred
                  period and filters.
                </p>
              </div>
            </div>

            <Link
              href="/admin/reports/ca-export"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_10px_25px_rgba(91,42,134,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4B2172]"
            >
              <FileSpreadsheet
                aria-hidden="true"
                size={17}
              />
              Open CA Export
            </Link>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

type ReportTone =
  | "purple"
  | "blue"
  | "green"
  | "red"
  | "amber";

type ReportStatProps = {
  title: string;
  value: string;
  description: string;
  icon: typeof UsersRound;
  tone: ReportTone;
};

function ReportStat({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: ReportStatProps) {
  const toneStyles: Record<
    ReportTone,
    {
      card: string;
      icon: string;
      value: string;
    }
  > = {
    purple: {
      card: "border-[#DCCFE4] bg-[#F7F2FA]",
      icon: "bg-[#E9DDF0] text-[#5B2A86]",
      value: "text-[#5B2A86]",
    },

    blue: {
      card: "border-blue-200 bg-blue-50",
      icon: "bg-blue-100 text-blue-700",
      value: "text-blue-800",
    },

    green: {
      card: "border-emerald-200 bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-700",
      value: "text-emerald-800",
    },

    red: {
      card: "border-red-200 bg-red-50",
      icon: "bg-red-100 text-red-700",
      value: "text-red-800",
    },

    amber: {
      card: "border-amber-200 bg-amber-50",
      icon: "bg-amber-100 text-amber-700",
      value: "text-amber-800",
    },
  };

  const selectedStyle =
    toneStyles[tone];

  return (
    <article
      className={[
        "rounded-[24px] border p-5",
        selectedStyle.card,
      ].join(" ")}
    >
      <span
        className={[
          "flex h-11 w-11 items-center justify-center rounded-2xl",
          selectedStyle.icon,
        ].join(" ")}
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
        className={[
          "mt-2 text-2xl font-black",
          selectedStyle.value,
        ].join(" ")}
      >
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold leading-5 text-[#817684]">
        {description}
      </p>
    </article>
  );
}

type BreakdownRow = {
  key: string;
  label: string;
  count: number;
};

type BreakdownPanelProps = {
  title: string;
  description: string;
  icon: typeof UsersRound;
  rows: BreakdownRow[];
  emptyMessage: string;
};

function BreakdownPanel({
  title,
  description,
  icon: Icon,
  rows,
  emptyMessage,
}: BreakdownPanelProps) {
  const largestValue = Math.max(
    1,
    ...rows.map((row) => row.count),
  );

  const total = rows.reduce(
    (result, row) =>
      result + row.count,
    0,
  );

  return (
    <article className="rounded-[28px] border border-[#E9E2ED] bg-white p-6 shadow-[0_18px_55px_rgba(45,23,54,0.07)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
            <Icon
              aria-hidden="true"
              size={20}
            />
          </span>

          <div>
            <h2 className="text-xl font-black text-[#2D1736]">
              {title}
            </h2>

            <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
              {description}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#F4EEF7] px-3 py-1 text-xs font-black text-[#5B2A86]">
          {total}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#DCCFE4] bg-[#FAF8FC] px-5 py-9 text-center">
          <p className="text-sm font-bold text-[#817684]">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-black text-[#35243E]">
                  {row.label}
                </p>

                <p className="text-sm font-black text-[#5B2A86]">
                  {row.count}
                </p>
              </div>

              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#F0EBF3]">
                <div
                  className="h-full rounded-full bg-[#6A328F]"
                  style={{
                    width: `${Math.max(
                      (row.count /
                        largestValue) *
                        100,
                      5,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

type FinancialColour =
  | "green"
  | "red"
  | "purple"
  | "amber";

type FinancialSummaryProps = {
  label: string;
  value: string;
  description: string;
  colour: FinancialColour;
};

function FinancialSummary({
  label,
  value,
  description,
  colour,
}: FinancialSummaryProps) {
  const styles: Record<
    FinancialColour,
    string
  > = {
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    red: "border-red-200 bg-red-50 text-red-800",
    purple:
      "border-[#DCCFE4] bg-[#F7F2FA] text-[#5B2A86]",
    amber:
      "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div
      className={[
        "rounded-2xl border p-4",
        styles[colour],
      ].join(" ")}
    >
      <p className="text-xs font-black uppercase tracking-[0.08em] opacity-70">
        {label}
      </p>

      <p className="mt-2 text-xl font-black">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold opacity-70">
        {description}
      </p>
    </div>
  );
}

type OperationRowProps = {
  label: string;
  value: number;
};

function OperationRow({
  label,
  value,
}: OperationRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-sm font-bold text-white/70">
        {label}
      </p>

      <p className="text-lg font-black text-[#F6C84B]">
        {value}
      </p>
    </div>
  );
}
