import WithdrawStudentDialog from "@/components/admin/students/WithdrawStudentDialog";
import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  FileText,
  HeartPulse,
  Home,
  type LucideIcon,
  Mail,
  MapPin,
  MessageCircleMore,
  Phone,
  ReceiptText,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import StudentAccountWorkspace from "@/components/admin/students/StudentAccountWorkspace";
import StudentAttendancePanel from "@/components/admin/students/StudentAttendancePanel";
import StudentDocumentsPanel from "@/components/admin/students/StudentDocumentsPanel";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type StudentProfilePageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    tab?: string;
  }>;
};

type ProfileTab =
  "overview" | "account" | "parents" | "attendance" | "fees" | "documents" | "activity";

const programmeLabels: Record<string, string> = {
  PLAYGROUP: "Playgroup",
  NURSERY: "Nursery",
  JUNIOR_KG: "Junior KG",
  SENIOR_KG: "Senior KG",
  DAYCARE: "Daycare",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  WITHDRAWN: "Withdrawn",
  GRADUATED: "Graduated",
};

const statusStyles: Record<string, string> = {
  ACTIVE: "border-green-200 bg-green-50 text-green-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-600",
  WITHDRAWN: "border-red-200 bg-red-50 text-red-700",
  GRADUATED: "border-blue-200 bg-blue-50 text-blue-700",
};

const guardianRelationshipLabels: Record<string, string> = {
  MOTHER: "Mother",
  FATHER: "Father",
  GRANDMOTHER: "Grandmother",
  GRANDFATHER: "Grandfather",
  GUARDIAN: "Guardian",
  OTHER: "Other",
};

const paymentStatusStyles: Record<string, string> = {
  PAID: "border-green-200 bg-green-50 text-green-700",
  PARTIALLY_PAID: "border-amber-200 bg-amber-50 text-amber-700",
  PENDING: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-600",
  REFUNDED: "border-blue-200 bg-blue-50 text-blue-700",
};

const receiptStatusStyles: Record<string, string> = {
  ISSUED: "border-green-200 bg-green-50 text-green-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
  REFUNDED: "border-blue-200 bg-blue-50 text-blue-700",
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateAge(dateOfBirth: Date) {
  const today = new Date();

  let years = today.getFullYear() - dateOfBirth.getFullYear();

  let months = today.getMonth() - dateOfBirth.getMonth();

  if (today.getDate() < dateOfBirth.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const yearText = years === 1 ? "1 year" : `${years} years`;

  const monthText = months === 1 ? "1 month" : `${months} months`;

  if (years <= 0) {
    return monthText;
  }

  if (months === 0) {
    return yearText;
  }

  return `${yearText} ${monthText}`;
}

function getFullName(student: {
  firstName: string;
  middleName: string | null;
  lastName: string | null;
}) {
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
}

function getAddress(student: {
  addressLine1: string | null;
  addressLine2: string | null;
  locality: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}) {
  const address = [
    student.addressLine1,
    student.addressLine2,
    student.locality,
    student.city,
    student.state,
    student.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return address || "Address not recorded";
}

function createWhatsAppLink(
  phone: string,
  guardianName: string,
  studentName: string,
) {
  const digits = phone.replace(/\D/g, "");

  const number = digits.length === 10 ? `91${digits}` : digits;

  const message = encodeURIComponent(
    `Hello ${guardianName}, this is Kidzee Sector 12, Dwarka regarding ${studentName}.`,
  );

  return `https://wa.me/${number}?text=${message}`;
}

function normaliseTab(value: string | undefined): ProfileTab {
  const tabs: ProfileTab[] = [
    "overview",
    "account",
    "parents",
    "attendance",
    "fees",
    "documents",
    "activity",
  ];

  return tabs.includes(value as ProfileTab)
    ? (value as ProfileTab)
    : "overview";
}

async function loadStudentAccountData(
  studentId: string,
  programmeDefinitionId: string | null,
  joiningDate: Date,
) {
  const now = new Date();
  const programmeEffectiveWhere: Prisma.ProgrammeFeeVersionWhereInput = {
    active: true,
    effectiveFrom: { lte: now },
    OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
  };
  const daycareEffectiveWhere: Prisma.DaycarePlanPriceVersionWhereInput = {
    active: true,
    effectiveFrom: { lte: now },
    OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
  };
  const combinationEffectiveWhere: Prisma.MealCombinationPriceVersionWhereInput = {
    active: true,
    effectiveFrom: { lte: now },
    OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
  };
  const mealEffectiveWhere: Prisma.MealPriceVersionWhereInput = {
    active: true,
    effectiveFrom: { lte: now },
    OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
  };

  const [
    programmeVersion,
    enrollmentContract,
    plans,
    invoices,
    sessions,
    charges,
    definitions,
    planDefinitions,
    mealCombinations,
    meals,
    communications,
  ] = await Promise.all([
    programmeDefinitionId
      ? prisma.programmeFeeVersion.findFirst({
          where: { programmeId: programmeDefinitionId, ...programmeEffectiveWhere },
          orderBy: { effectiveFrom: "desc" },
          include: { programme: { select: { name: true, status: true } } },
        })
      : Promise.resolve(null),
    prisma.studentEnrollmentContract.findUnique({
      where: { studentId },
      include: {
        services: {
          orderBy: [
            { recurring: "desc" },
            { serviceType: "asc" },
            { effectiveFrom: "asc" },
          ],
        },
      },
    }),
    prisma.studentDaycarePlan.findMany({
      where: {
        studentId,
        active: true,
        recurring: true,
        billingStoppedAt: null,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { effectiveFrom: "desc" },
      include: {
        planDefinition: { select: { name: true } },
        priceVersion: true,
        mealCombination: {
          include: {
            priceVersions: {
              where: combinationEffectiveWhere,
              orderBy: { effectiveFrom: "desc" },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.feeInvoice.findMany({
      where: { studentId },
      orderBy: { issueDate: "desc" },
      take: 100,
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.daycareSession.findMany({
      where: { studentId, emergencyCare: true },
      orderBy: { sessionDate: "desc" },
      take: 100,
      include: { meals: { include: { meal: { select: { name: true } } } } },
    }),
    prisma.studentCharge.findMany({
      where: { studentId },
      orderBy: [{ chargeDate: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.chargeDefinition.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.daycarePlanDefinition.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        priceVersions: {
          where: daycareEffectiveWhere,
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
    }),
    prisma.mealCombination.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        priceVersions: {
          where: combinationEffectiveWhere,
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
    }),
    prisma.mealDefinition.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        priceVersions: {
          where: mealEffectiveWhere,
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
    }),
    prisma.whatsAppAutomationMessage.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, type: true, status: true, createdAt: true },
    }),
  ]);

  return {
    contract: enrollmentContract
      ? {
          contractNumber: enrollmentContract.contractNumber,
          academicSession: enrollmentContract.academicSession,
          status: enrollmentContract.status,
          startDate: enrollmentContract.startDate.toISOString(),
          endDate: enrollmentContract.endDate?.toISOString() ?? null,
          services: enrollmentContract.services.map((service) => ({
            id: service.id,
            serviceType: service.serviceType,
            label: service.label,
            detail: service.detail,
            total: Number(service.total),
            recurring: service.recurring,
            frequency: service.frequency,
            effectiveFrom: service.effectiveFrom.toISOString(),
            effectiveTo: service.effectiveTo?.toISOString() ?? null,
            status: service.status,
            gstApplicable: service.gstApplicable,
          })),
        }
      : null,
    programme: programmeVersion
      ? {
          name: programmeVersion.programme.name,
          monthlyFee: Number(programmeVersion.monthlyFee),
          annualFee: Number(programmeVersion.annualFee),
          kitFee: Number(programmeVersion.kitFee),
          combineAnnualAndKit: programmeVersion.combineAnnualAndKit,
          startDate: joiningDate.toISOString(),
          status: programmeVersion.programme.status,
        }
      : null,
    plans: plans.map((plan) => {
      const combinationVersion = plan.mealCombination?.priceVersions[0] ?? null;
      return {
        id: plan.id,
        title: plan.title,
        effectiveFrom: plan.effectiveFrom.toISOString(),
        effectiveTo: plan.effectiveTo?.toISOString() ?? null,
        dailyHours: plan.dailyHours == null ? null : Number(plan.dailyHours),
        scheduledWeekdays: plan.scheduledWeekdays,
        monthlyFee: Number(plan.monthlyFeeOverride ?? plan.priceVersion?.price ?? 0),
        mealFee: Number(plan.monthlyFoodFeeOverride ?? combinationVersion?.price ?? 0),
        mealName: plan.mealCombination?.name ?? "No monthly meal plan",
        planName: plan.planDefinition?.name ?? plan.title,
        separateInvoice: plan.separateInvoice,
      };
    }),
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      feePeriodLabel: invoice.feePeriodLabel,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      pendingAmount: Number(invoice.pendingAmount),
      status: invoice.status,
      items: invoice.items.map((item) => ({ id: item.id, title: item.title, detail: item.detail, totalAmount: Number(item.totalAmount) })),
    })),
    sessions: sessions.map((session) => ({
      id: session.id,
      sessionNumber: session.sessionNumber,
      sessionDate: session.sessionDate.toISOString(),
      billableHours: session.billableHours == null ? null : Number(session.billableHours),
      baseAmount: Number(session.baseAmount),
      foodCharge: Number(session.foodCharge),
      totalAmount: Number(session.totalAmount),
      approved: session.approved,
      invoiceStatus: session.invoiceStatus,
      feeInvoiceId: session.feeInvoiceId,
      notes: session.notes,
      meals: session.meals.map((entry) => entry.meal.name),
    })),
    charges: charges.map((charge) => ({
      id: charge.id,
      chargeNumber: charge.chargeNumber,
      title: charge.title,
      category: charge.category,
      chargeDate: charge.chargeDate.toISOString(),
      academicYear: charge.academicYear,
      amount: Number(charge.amount),
      status: charge.status,
      approved: charge.approved,
      feeInvoiceId: charge.feeInvoiceId,
      notes: charge.notes,
    })),
    definitions: definitions.map((definition) => ({
      id: definition.id,
      name: definition.name,
      category: definition.category,
      defaultAmount: definition.defaultAmount == null ? null : Number(definition.defaultAmount),
    })),
    planDefinitions: planDefinitions
      .filter((plan) => plan.priceVersions[0])
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        billingType: plan.billingType,
        hoursIncluded: plan.hoursIncluded == null ? null : Number(plan.hoursIncluded),
        mealRule: plan.mealRule,
        price: Number(plan.priceVersions[0].price),
      })),
    mealCombinations: mealCombinations
      .filter((combination) => combination.priceVersions[0])
      .map((combination) => ({ id: combination.id, name: combination.name, price: Number(combination.priceVersions[0].price) })),
    meals: meals
      .filter((meal) => meal.priceVersions[0])
      .map((meal) => ({ id: meal.id, name: meal.name, price: Number(meal.priceVersions[0].price) })),
    communications: communications.map((entry) => ({ id: entry.id, type: entry.type, status: entry.status, createdAt: entry.createdAt.toISOString() })),
  };
}

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  params,
  searchParams,
}: StudentProfilePageProps) {
  const session = await getCurrentAdminUser();

  if (!session) {
    redirect("/admin/login");
  }
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const activeTab = normaliseTab(resolvedSearchParams.tab);

  const student = await prisma.student.findUnique({
    where: {
      id,
    },

    include: {
      programmeDefinition: true,
      guardians: {
        orderBy: [
          {
            isPrimary: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
      },

      admission: true,

      enrollmentContract: {
        select: {
          contractNumber: true,
          status: true,
          source: true,
          preschoolEnabled: true,
          daycareEnabled: true,
          mealsEnabled: true,
          annualKitEnabled: true,
          academicSession: true,
        },
      },

      feeAccounts: {
        where: {
          active: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      },

      payments: {
        orderBy: {
          paymentDate: "desc",
        },

        include: {
          receipt: true,
        },
      },

      receipts: {
        orderBy: {
          issuedAt: "desc",
        },
      },

      feeInvoices: {
        orderBy: {
          issueDate: "desc",
        },
        take: 100,
        include: {
          items: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },

      attendanceRecords: {
        orderBy: {
          attendanceDate: "desc",
        },
        include: {
          markedBy: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const studentName = getFullName(student);

  const accountData = activeTab === "account"
    ? await loadStudentAccountData(
        student.id,
        student.programmeDefinitionId,
        student.joiningDate,
      )
    : null;

  const documentActivities =
    activeTab === "activity"
      ? await prisma.activityLog.findMany({
          where: {
            entityType: "StudentDocument",
            description: {
              contains: `(${student.studentNumber})`,
            },
          },
          select: {
            id: true,
            action: true,
            description: true,
            createdAt: true,
            adminUser: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
        })
      : [];

  const primaryGuardian =
    student.guardians.find((guardian) => guardian.isPrimary) ??
    student.guardians[0] ??
    null;

  const totalReceived = student.payments.reduce(
    (total, payment) =>
      ["PAID", "PARTIALLY_PAID"].includes(payment.status)
        ? total + Number(payment.amountReceived)
        : total,
    0,
  );

  const totalPending = student.feeInvoices.reduce(
    (total, invoice) =>
      ["DUE", "OVERDUE", "PARTIALLY_PAID"].includes(invoice.status)
        ? total + Number(invoice.pendingAmount)
        : total,
    0,
  );

  const lastPayment = student.payments.find((payment) =>
    ["PAID", "PARTIALLY_PAID"].includes(payment.status),
  ) ?? null;

  const attendanceDays = student.attendanceRecords.filter(
    (record) => record.status !== "HOLIDAY",
  );

  const attendancePresent = attendanceDays.filter((record) =>
    ["PRESENT", "LATE", "HALF_DAY"].includes(record.status),
  ).length;

  const attendancePercentage =
    attendanceDays.length > 0
      ? Math.round((attendancePresent / attendanceDays.length) * 100)
      : 0;

  const tabs: Array<{
    value: ProfileTab;
    label: string;
    icon: typeof UserRound;
    count?: number;
  }> = [
    {
      value: "overview",
      label: "Overview",
      icon: UserRound,
    },
    {
      value: "account",
      label: "Contract & Services",
      icon: WalletCards,
      count: student.feeInvoices.filter((invoice) =>
        ["DUE", "OVERDUE", "PARTIALLY_PAID"].includes(invoice.status),
      ).length,
    },
    {
      value: "parents",
      label: "Family & Contact",
      icon: UsersRound,
      count: student.guardians.length,
    },
    {
      value: "attendance",
      label: "Attendance",
      icon: CalendarCheck2,
      count: student.attendanceRecords.length,
    },
    {
      value: "fees",
      label: "Fees & Receipts",
      icon: CircleDollarSign,
      count: student.payments.length,
    },
    {
      value: "documents",
      label: "Documents",
      icon: FileText,
    },
    {
      value: "activity",
      label: "Timeline",
      icon: Activity,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />

          <div className="pointer-events-none absolute -bottom-28 right-24 h-60 w-60 rounded-full bg-[#F6C84B]/10 blur-2xl" />

          <div className="relative">
            <Link
              href="/admin/students"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:border-[#F6C84B]/60 hover:text-[#F6C84B]"
            >
              <ArrowLeft aria-hidden="true" size={17} />
              Students
            </Link>

            <div className="mt-7 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex items-start gap-4">
                {student.profilePhotoUrl ? (
                  // Student photos may be stored on external or uploaded URLs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.profilePhotoUrl}
                    alt={studentName}
                    className="h-16 w-16 shrink-0 rounded-[22px] border-2 border-white/20 object-cover sm:h-20 sm:w-20"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#F6C84B] text-[#2D1736] sm:h-20 sm:w-20">
                    <UserRound aria-hidden="true" size={30} />
                  </span>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#F6C84B]">
                    {student.studentNumber}
                  </p>

                  <h1 className="mt-2 break-words text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                    {studentName}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white">
                      {student.programmeDefinition?.name ?? programmeLabels[student.programme] ?? student.programme}
                    </span>

                    <span
                      className={[
                        "rounded-full border px-3 py-1.5 text-xs font-black",
                        statusStyles[student.status] ??
                          "border-white/20 bg-white/10 text-white",
                      ].join(" ")}
                    >
                      {statusLabels[student.status] ?? student.status}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white">
                      {attendancePercentage}% attendance
                    </span>

                    {student.enrollmentContract?.preschoolEnabled && student.enrollmentContract.status === "ACTIVE" ? (
                      <span className="rounded-full border border-purple-200/30 bg-purple-300/15 px-3 py-1.5 text-xs font-black text-white">Preschool</span>
                    ) : null}
                    {student.enrollmentContract?.daycareEnabled && student.enrollmentContract.status === "ACTIVE" ? (
                      <span className="rounded-full border border-blue-200/30 bg-blue-300/15 px-3 py-1.5 text-xs font-black text-white">Daycare</span>
                    ) : null}
                    {student.enrollmentContract?.mealsEnabled && student.enrollmentContract.status === "ACTIVE" ? (
                      <span className="rounded-full border border-green-200/30 bg-green-300/15 px-3 py-1.5 text-xs font-black text-white">Meals</span>
                    ) : null}
                    {student.enrollmentContract ? (
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white">
                        Contract {student.enrollmentContract.status.replaceAll("_", " ")}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/70">
                    <span>Outstanding: {formatCurrency(totalPending)}</span>
                    <span>Last payment: {lastPayment ? `${formatCurrency(Number(lastPayment.amountReceived))} on ${formatDate(lastPayment.paymentDate)}` : "No payment yet"}</span>
                    <span>Source: {student.enrollmentContract?.source?.replaceAll("_", " ") ?? "Not recorded"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {primaryGuardian?.phone ? (
                  <a
                    href={`https://wa.me/${primaryGuardian.phone.replace(/\D/g, "").length === 10 ? "91" : ""}${primaryGuardian.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    <MessageCircleMore aria-hidden="true" size={17} />
                    WhatsApp Parent
                  </a>
                ) : null}
                <Link
                  href={`/admin/fees?studentId=${encodeURIComponent(
                    student.id,
                  )}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
                >
                  <CircleDollarSign aria-hidden="true" size={17} />
                  Collect Fee
                </Link>

                <Link
                  href={`/admin/students/${student.id}/edit`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD65F]"
                >
                  <Edit3 aria-hidden="true" size={17} />
                  Edit Student
                </Link>
              </div>
            </div>
          </div>
        </section>
        <WithdrawStudentDialog
          studentId={student.id}
          studentName={studentName}
          studentNumber={student.studentNumber}
          joiningDate={student.joiningDate}
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="Current age"
            value={calculateAge(student.dateOfBirth)}
            icon={CalendarDays}
            accent="bg-[#F3EAF8] text-[#5B2A86]"
          />

          <SummaryCard
            label="Joining date"
            value={formatDate(student.joiningDate)}
            icon={UsersRound}
            accent="bg-[#E8F4FF] text-[#1769AA]"
          />

          <SummaryCard
            label="Attendance"
            value={`${attendancePercentage}%`}
            icon={CalendarCheck2}
            accent="bg-[#EEF8F4] text-[#28755D]"
          />

          <SummaryCard
            label="Fees received"
            value={formatCurrency(totalReceived)}
            icon={CircleDollarSign}
            accent="bg-[#E9F8F2] text-[#28755D]"
          />

          <SummaryCard
            label="Pending fees"
            value={formatCurrency(totalPending)}
            icon={ReceiptText}
            accent="bg-[#FFF3D5] text-[#8A6100]"
          />

          <SummaryCard
            label="Last payment"
            value={lastPayment ? formatCurrency(Number(lastPayment.amountReceived)) : "None yet"}
            icon={WalletCards}
            accent="bg-[#F3EAF8] text-[#5B2A86]"
          />
        </section>

        <nav
          aria-label="Student profile sections"
          className="overflow-x-auto rounded-[24px] border border-[#E9E2ED] bg-white p-2 shadow-[0_12px_35px_rgba(45,23,54,0.05)]"
        >
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              const active = tab.value === activeTab;

              return (
                <Link
                  key={tab.value}
                  href={`/admin/students/${student.id}?tab=${tab.value}`}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black transition sm:text-sm",
                    active
                      ? "bg-[#5B2A86] text-white shadow-[0_10px_24px_rgba(91,42,134,0.18)]"
                      : "border border-transparent bg-white text-[#65596A] hover:border-[#E1D8E5] hover:bg-[#F6F1F8]",
                  ].join(" ")}
                >
                  <Icon aria-hidden="true" size={16} />

                  {tab.label}

                  {typeof tab.count === "number" ? (
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[9px] font-black",
                        active
                          ? "bg-white/15 text-white"
                          : "bg-[#F3EAF8] text-[#5B2A86]",
                      ].join(" ")}
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>

        {activeTab === "overview" ? (
          <OverviewTab
            student={student}
            studentName={studentName}
            primaryGuardian={primaryGuardian}
          />
        ) : null}

        {activeTab === "account" && accountData ? (
          <StudentAccountWorkspace
            studentId={student.id}
            studentName={studentName}
            isOwner={session.role === "OWNER"}
            contract={accountData.contract}
            programme={accountData.programme}
            plans={accountData.plans}
            invoices={accountData.invoices}
            sessions={accountData.sessions}
            charges={accountData.charges}
            definitions={accountData.definitions}
            planDefinitions={accountData.planDefinitions}
            mealCombinations={accountData.mealCombinations}
            meals={accountData.meals}
            communications={accountData.communications}
          />
        ) : null}

        {activeTab === "parents" ? (
          <ParentsTab guardians={student.guardians} studentName={studentName} />
        ) : null}

        {activeTab === "attendance" ? (
          <StudentAttendancePanel
            studentId={student.id}
            studentName={studentName}
            records={student.attendanceRecords}
          />
        ) : null}

        {activeTab === "fees" ? (
          <FeesTab
            student={student}
            totalReceived={totalReceived}
            totalPending={totalPending}
          />
        ) : null}

        {activeTab === "documents" ? (
          <StudentDocumentsPanel
            studentId={student.id}
            studentName={studentName}
            initialDocumentsComplete={
              student.admission?.documentsComplete ?? false
            }
            canDelete={session.role === "OWNER"}
          />
        ) : null}

        {activeTab === "activity" ? (
          <ActivityTab
            student={student}
            documentActivities={documentActivities}
          />
        ) : null}
      </div>
    </AdminLayout>
  );
}

type StudentProfileData = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.student.findUnique<{
        where: {
          id: string;
        };
        include: {
          programmeDefinition: true;
          guardians: true;
          admission: true;
          feeAccounts: true;
          payments: {
            include: {
              receipt: true;
            };
          };
          receipts: true;
          attendanceRecords: {
            include: {
              markedBy: {
                select: {
                  name: true;
                };
              };
            };
          };
        };
      }>
    >
  >
>;

type OverviewTabProps = {
  student: StudentProfileData;
  studentName: string;
  primaryGuardian: StudentProfileData["guardians"][number] | null;
};

function OverviewTab({
  student,
  studentName,
  primaryGuardian,
}: OverviewTabProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <ProfileSection
          icon={UserRound}
          eyebrow="Student details"
          title="Basic information"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Full name" value={studentName} />

            <DetailItem
              label="Preferred name"
              value={student.preferredName ?? "Not recorded"}
            />

            <DetailItem
              label="Gender"
              value={student.gender ?? "Not recorded"}
            />

            <DetailItem
              label="Date of birth"
              value={formatDate(student.dateOfBirth)}
            />

            <DetailItem
              label="Current age"
              value={calculateAge(student.dateOfBirth)}
            />

            <DetailItem
              label="Programme"
              value={student.programmeDefinition?.name ?? programmeLabels[student.programme] ?? student.programme}
            />

            <DetailItem
              label="Student status"
              value={statusLabels[student.status] ?? student.status}
            />

            <DetailItem
              label="Joining date"
              value={formatDate(student.joiningDate)}
            />

            <DetailItem
              label="Leaving date"
              value={formatDate(student.leavingDate)}
            />
          </div>
        </ProfileSection>

        <ProfileSection
          icon={HeartPulse}
          eyebrow="Health and care"
          title="Medical information"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem
              label="Blood group"
              value={student.bloodGroup ?? "Not recorded"}
            />

            <DetailItem
              label="Allergies"
              value={student.allergies ?? "None recorded"}
            />

            <div className="sm:col-span-2">
              <DetailItem
                label="Medical notes"
                value={student.medicalNotes ?? "No medical notes recorded"}
              />
            </div>
          </div>
        </ProfileSection>

        <ProfileSection icon={Home} eyebrow="Residence" title="Address">
          <div className="flex items-start gap-3 rounded-2xl bg-[#FAF8FC] p-4">
            <MapPin
              aria-hidden="true"
              size={19}
              className="mt-0.5 shrink-0 text-[#5B2A86]"
            />

            <p className="text-sm font-bold leading-7 text-[#514657]">
              {getAddress(student)}
            </p>
          </div>
        </ProfileSection>

        <ProfileSection
          icon={FileText}
          eyebrow="Internal information"
          title="Student notes"
        >
          <DetailItem
            label="Notes"
            value={student.notes ?? "No internal notes recorded"}
          />
        </ProfileSection>
      </div>

      <aside className="space-y-5">
        <section className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
              <UsersRound aria-hidden="true" size={21} />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                Primary contact
              </p>

              <h2 className="text-lg font-black text-[#2D1736]">
                Parent information
              </h2>
            </div>
          </div>

          {primaryGuardian ? (
            <div className="mt-5">
              <GuardianCard
                guardian={primaryGuardian}
                studentName={studentName}
              />
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState text="No guardian has been added." />
            </div>
          )}
        </section>

        <section className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
            Admission record
          </p>

          {student.admission ? (
            <div className="mt-4 space-y-3">
              <DetailItem
                label="Admission number"
                value={student.admission.admissionNumber}
              />

              <DetailItem
                label="Admission status"
                value={student.admission.status.replaceAll("_", " ")}
              />

              <DetailItem
                label="Admission date"
                value={formatDate(student.admission.admissionDate)}
              />

              <DetailItem
                label="Joining date"
                value={formatDate(student.admission.joiningDate)}
              />

              <DetailItem
                label="Documents"
                value={
                  student.admission.documentsComplete ? "Complete" : "Pending"
                }
              />
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState text="No admission record is linked to this student yet." />
            </div>
          )}
        </section>

        <section className="rounded-[26px] bg-[#2D1736] p-5 text-white shadow-[0_18px_48px_rgba(45,23,54,0.16)] sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.13em] text-[#F6C84B]">
            Record information
          </p>

          <h2 className="mt-2 text-lg font-black">System details</h2>

          <div className="mt-5 space-y-4">
            <SystemValue
              label="Created"
              value={formatDateTime(student.createdAt)}
            />

            <SystemValue
              label="Last updated"
              value={formatDateTime(student.updatedAt)}
            />
          </div>
        </section>
      </aside>
    </section>
  );
}

type ParentsTabProps = {
  guardians: StudentProfileData["guardians"];
  studentName: string;
};

function ParentsTab({ guardians, studentName }: ParentsTabProps) {
  return (
    <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
          <UsersRound aria-hidden="true" size={22} />
        </span>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
            Parent management
          </p>

          <h2 className="mt-1 text-xl font-black text-[#2D1736] sm:text-2xl">
            Guardians and authorised contacts
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
            Review parent contact information, pickup permissions and
            communication details.
          </p>
        </div>
      </div>

      {guardians.length === 0 ? (
        <div className="mt-6">
          <EmptyState text="No parent or guardian has been added to this student." />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {guardians.map((guardian) => (
            <GuardianCard
              key={guardian.id}
              guardian={guardian}
              studentName={studentName}
              expanded
            />
          ))}
        </div>
      )}
    </section>
  );
}

type FeesTabProps = {
  student: StudentProfileData;
  totalReceived: number;
  totalPending: number;
};

function FeesTab({ student, totalReceived, totalPending }: FeesTabProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Fee accounts"
          value={student.feeAccounts.length.toString()}
          icon={CircleDollarSign}
          accent="bg-[#F3EAF8] text-[#5B2A86]"
        />

        <SummaryCard
          label="Payments"
          value={student.payments.length.toString()}
          icon={ReceiptText}
          accent="bg-[#E8F4FF] text-[#1769AA]"
        />

        <SummaryCard
          label="Total received"
          value={formatCurrency(totalReceived)}
          icon={CircleDollarSign}
          accent="bg-[#E9F8F2] text-[#28755D]"
        />

        <SummaryCard
          label="Total pending"
          value={formatCurrency(totalPending)}
          icon={ReceiptText}
          accent="bg-[#FFF3D5] text-[#8A6100]"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ProfileSection
          icon={CircleDollarSign}
          eyebrow="Student account"
          title="Fee structure"
        >
          {student.feeAccounts.length === 0 ? (
            <EmptyState text="No active fee structure has been assigned." />
          ) : (
            <div className="space-y-3">
              {student.feeAccounts.map((account) => (
                <article
                  key={account.id}
                  className="rounded-2xl bg-[#FAF8FC] p-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#7A459C]">
                    {account.category.replaceAll("_", " ")}
                  </p>

                  <p className="mt-2 text-sm font-black text-[#2D1736]">
                    {account.title}
                  </p>

                  <p className="mt-2 text-xl font-black text-[#5B2A86]">
                    {formatCurrency(Number(account.standardAmount))}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-[#817684]">
                    {account.gstApplicable
                      ? `GST applicable${
                          account.gstRate
                            ? ` at ${Number(account.gstRate)}%`
                            : ""
                        }`
                      : "GST not applicable"}
                  </p>
                </article>
              ))}
            </div>
          )}

          <Link
            href={`/admin/fees?studentId=${encodeURIComponent(student.id)}`}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white transition hover:bg-[#4B206F]"
          >
            <CircleDollarSign aria-hidden="true" size={17} />
            Collect Fee
          </Link>
        </ProfileSection>

        <ProfileSection
          icon={ReceiptText}
          eyebrow="Payment ledger"
          title="Fee payment history"
        >
          {student.payments.length === 0 ? (
            <EmptyState text="No fee payments have been recorded for this student." />
          ) : (
            <div className="space-y-3">
              {student.payments.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-[20px] bg-[#FAF8FC] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-[#2D1736]">
                        {payment.category.replaceAll("_", " ")}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#817684]">
                        {payment.paymentNumber} ·{" "}
                        {formatDate(payment.paymentDate)}
                      </p>

                      {payment.feePeriodLabel ? (
                        <p className="mt-1 text-xs font-semibold text-[#817684]">
                          Period: {payment.feePeriodLabel}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={[
                        "w-fit rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em]",
                        paymentStatusStyles[payment.status] ??
                          "border-slate-200 bg-slate-50 text-slate-600",
                      ].join(" ")}
                    >
                      {payment.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <LedgerValue
                      label="Total amount"
                      value={formatCurrency(Number(payment.totalAmount))}
                    />

                    <LedgerValue
                      label="Received"
                      value={formatCurrency(Number(payment.amountReceived))}
                    />

                    <LedgerValue
                      label="Pending"
                      value={formatCurrency(Number(payment.pendingAmount))}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-[#817684]">
                      {payment.paymentMethod.replaceAll("_", " ")}

                      {payment.transactionReference
                        ? ` · ${payment.transactionReference}`
                        : ""}
                    </p>

                    {payment.receipt ? (
                      <Link
                        href={`/admin/receipts/${payment.receipt.id}`}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-[#DCCFE4] bg-white px-3 text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
                      >
                        <ReceiptText aria-hidden="true" size={14} />
                        View Receipt
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </ProfileSection>
      </section>

      <ProfileSection
        icon={ReceiptText}
        eyebrow="Receipt register"
        title="Issued receipts"
      >
        {student.receipts.length === 0 ? (
          <EmptyState text="No receipts have been issued for this student." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {student.receipts.map((receipt) => (
              <Link
                key={receipt.id}
                href={`/admin/receipts/${receipt.id}`}
                className="group rounded-[20px] bg-[#FAF8FC] p-4 transition hover:bg-[#F3EAF8]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#5B2A86] shadow-sm">
                    <ReceiptText aria-hidden="true" size={18} />
                  </span>

                  <span
                    className={[
                      "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.07em]",
                      receiptStatusStyles[receipt.status] ??
                        "border-slate-200 bg-slate-50 text-slate-600",
                    ].join(" ")}
                  >
                    {receipt.status}
                  </span>
                </div>

                <p className="mt-4 text-sm font-black text-[#2D1736]">
                  {receipt.receiptNumber}
                </p>

                <p className="mt-1 text-xs font-semibold text-[#817684]">
                  {formatDate(receipt.issuedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </ProfileSection>
    </div>
  );
}

type DocumentActivityLog = {
  id: string;
  action: string;
  description: string;
  createdAt: Date;
  adminUser: {
    name: string;
  } | null;
};

type StudentActivityEvent = {
  id: string;
  date: Date;
  title: string;
  description: string;
  actor?: string;
  icon: LucideIcon;
};

type ActivityTabProps = {
  student: StudentProfileData;
  documentActivities: DocumentActivityLog[];
};

function ActivityTab({ student, documentActivities }: ActivityTabProps) {
  const activities: StudentActivityEvent[] = [
    {
      id: `student-created-${student.id}`,
      date: student.createdAt,
      title: "Student profile created",
      description: "The student record was added to CentreOS.",
      icon: UserRound,
    },

    ...(student.admission
      ? [
          {
            id: `admission-${student.admission.id}`,
            date:
              student.admission.admissionDate ?? student.admission.createdAt,
            title: "Admission record created",
            description: `${student.admission.admissionNumber} · ${student.admission.status.replaceAll(
              "_",
              " ",
            )}`,
            icon: ShieldCheck,
          },
        ]
      : []),

    ...student.payments.map((payment) => ({
      id: `payment-${payment.id}`,
      date: payment.paymentDate,
      title: "Fee payment recorded",
      description: `${payment.category.replaceAll("_", " ")} · ${formatCurrency(
        Number(payment.amountReceived),
      )}`,
      icon: CircleDollarSign,
    })),

    ...student.attendanceRecords.map((record) => ({
      id: `attendance-${record.id}`,
      date: record.updatedAt,
      title: "Attendance marked",
      description: `${record.status.replaceAll("_", " ")} · Attendance date ${formatDate(
        record.attendanceDate,
      )}`,
      actor: record.markedBy?.name ?? "CentreOS system",
      icon: CalendarCheck2,
    })),

    ...documentActivities.map((activity) => ({
      id: `document-${activity.id}`,
      date: activity.createdAt,
      title:
        activity.action === "CREATED"
          ? "Document uploaded"
          : activity.action === "DELETED"
            ? "Document deleted"
            : activity.description.toLowerCase().includes("verified")
              ? "Document verified"
              : activity.description.toLowerCase().includes("rejected")
                ? "Document rejected"
                : activity.description.toLowerCase().includes("pending")
                  ? "Document reset to pending"
                  : "Document status updated",
      description: activity.description,
      actor: activity.adminUser?.name ?? "CentreOS system",
      icon: FileText,
    })),
  ].sort((first, second) => second.date.getTime() - first.date.getTime());

  return (
    <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
          <Activity aria-hidden="true" size={22} />
        </span>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
            Student timeline
          </p>

          <h2 className="mt-1 text-xl font-black text-[#2D1736] sm:text-2xl">
            Recent activity
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
            Admissions, documents, fee payments and attendance events in
            chronological order.
          </p>
        </div>
      </div>

      <div className="mt-7 space-y-0">
        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <article
              key={activity.id}
              className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-4"
            >
              {index < activities.length - 1 ? (
                <span className="absolute left-[21px] top-11 h-[calc(100%-20px)] w-px bg-[#E4DBE8]" />
              ) : null}

              <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <Icon aria-hidden="true" size={19} />
              </span>

              <div className="pb-7">
                <p className="text-sm font-black text-[#2D1736]">
                  {activity.title}
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-[#817684]">
                  {activity.description}
                </p>

                {activity.actor ? (
                  <p className="mt-1 text-[11px] font-bold text-[#6E5E73]">
                    Handled by {activity.actor}
                  </p>
                ) : null}

                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#9A8F9E]">
                  {formatDateTime(activity.date)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type GuardianCardProps = {
  guardian: StudentProfileData["guardians"][number];
  studentName: string;
  expanded?: boolean;
};

function GuardianCard({
  guardian,
  studentName,
  expanded = false,
}: GuardianCardProps) {
  return (
    <article className="rounded-[20px] bg-[#FAF8FC] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-[#2D1736]">{guardian.name}</h3>

          <p className="mt-1 text-xs font-bold text-[#817684]">
            {guardianRelationshipLabels[guardian.relationship] ??
              guardian.relationship}
          </p>
        </div>

        {guardian.isPrimary ? (
          <span className="rounded-full bg-[#F3EAF8] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#5B2A86]">
            Primary
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <a
          href={`tel:${guardian.phone}`}
          className="flex items-center gap-2 text-sm font-bold text-[#514657] hover:text-[#5B2A86]"
        >
          <Phone aria-hidden="true" size={16} />
          {guardian.phone}
        </a>

        {guardian.alternatePhone ? (
          <a
            href={`tel:${guardian.alternatePhone}`}
            className="flex items-center gap-2 text-sm font-bold text-[#514657] hover:text-[#5B2A86]"
          >
            <Phone aria-hidden="true" size={16} />
            {guardian.alternatePhone}
          </a>
        ) : null}

        {guardian.email ? (
          <a
            href={`mailto:${guardian.email}`}
            className="flex items-start gap-2 break-all text-sm font-bold text-[#514657] hover:text-[#5B2A86]"
          >
            <Mail aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            {guardian.email}
          </a>
        ) : null}
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailItem
            label="Occupation"
            value={guardian.occupation ?? "Not recorded"}
          />

          <DetailItem
            label="Address"
            value={
              guardian.addressSameAsStudent
                ? "Same as student"
                : (guardian.address ?? "Not recorded")
            }
          />
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={`tel:${guardian.phone}`}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#DCCFE4] bg-white px-3 text-xs font-black text-[#5B2A86]"
        >
          <Phone aria-hidden="true" size={15} />
          Call
        </a>

        <a
          href={createWhatsAppLink(guardian.phone, guardian.name, studentName)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#1FA855] px-3 text-xs font-black text-white"
        >
          WhatsApp
        </a>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs font-bold">
        <ShieldCheck
          aria-hidden="true"
          size={15}
          className={
            guardian.authorisedPickup ? "text-green-600" : "text-red-600"
          }
        />

        <span className="text-[#817684]">
          {guardian.authorisedPickup
            ? "Authorised for pickup"
            : "Not authorised for pickup"}
        </span>
      </div>
    </article>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  icon: typeof UserRound;
  accent: string;
};

function SummaryCard({ label, value, icon: Icon, accent }: SummaryCardProps) {
  return (
    <article className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}
      >
        <Icon aria-hidden="true" size={20} />
      </span>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
        {label}
      </p>

      <p className="mt-2 break-words text-xl font-black text-[#2D1736]">
        {value}
      </p>
    </article>
  );
}

type ProfileSectionProps = {
  icon: typeof UserRound;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

function ProfileSection({
  icon: Icon,
  eyebrow,
  title,
  children,
}: ProfileSectionProps) {
  return (
    <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
          <Icon aria-hidden="true" size={21} />
        </span>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
            {eyebrow}
          </p>

          <h2 className="text-xl font-black text-[#2D1736]">{title}</h2>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-2xl bg-[#FAF8FC] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black leading-6 text-[#2D1736]">
        {value}
      </p>
    </div>
  );
}

type LedgerValueProps = {
  label: string;
  value: string;
};

function LedgerValue({ label, value }: LedgerValueProps) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8B808F]">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-[#2D1736]">{value}</p>
    </div>
  );
}

type SystemValueProps = {
  label: string;
  value: string;
};

function SystemValue({ label, value }: SystemValueProps) {
  return (
    <div>
      <p className="text-xs font-bold text-white/50">{label}</p>

      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCCFE3] bg-[#FBF9FC] px-4 py-6 text-center">
      <p className="text-sm font-bold leading-6 text-[#817684]">{text}</p>
    </div>
  );
}
