import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Baby,
  CalendarDays,
  GraduationCap,
  HeartPulse,
  Phone,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import AddStudentForm from "@/components/admin/students/AddStudentForm";
import StudentRegister from "@/components/admin/students/StudentRegister";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function calculateAge(dateOfBirth: Date) {
  const today = new Date();

  let years =
    today.getFullYear() - dateOfBirth.getFullYear();

  let months =
    today.getMonth() - dateOfBirth.getMonth();

  if (today.getDate() < dateOfBirth.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0) {
    return months === 1
      ? "1 month"
      : `${months} months`;
  }

  if (months === 0) {
    return years === 1
      ? "1 year"
      : `${years} years`;
  }

  return `${years} years ${months} months`;
}

function getStudentFullName(student: {
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

type AdminStudentsPageProps = {
  searchParams: Promise<{
    enquiryId?: string;
  }>;
};

function formatDateInput(value: Date | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function splitChildName(value: string | null) {
  const parts = (value ?? "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    lastName: parts.length > 1 ? parts.at(-1) ?? "" : "",
  };
}

export default async function AdminStudentsPage({
  searchParams,
}: AdminStudentsPageProps) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    redirect("/admin/login");
  }

  const query = await searchParams;
  const enquiryId = query.enquiryId?.trim() ?? "";

  const sourceEnquiry = enquiryId
    ? await prisma.enquiry.findUnique({
        where: { id: enquiryId },
        select: {
          id: true,
          enquiryNumber: true,
          parentName: true,
          childName: true,
          childDateOfBirth: true,
          phone: true,
          alternatePhone: true,
          email: true,
          programme: true,
          status: true,
          admission: {
            select: {
              studentId: true,
              status: true,
              joiningDate: true,
            },
          },
        },
      })
    : null;

  if (sourceEnquiry?.admission?.studentId) {
    redirect(`/admin/students/${sourceEnquiry.admission.studentId}`);
  }

  if (enquiryId && !sourceEnquiry) {
    redirect(
      "/admin/admissions?error=The+linked+enquiry+could+not+be+found",
    );
  }

  const usableSourceEnquiry =
    sourceEnquiry &&
    sourceEnquiry.status !== "CLOSED" &&
    sourceEnquiry.status !== "NOT_INTERESTED" &&
    sourceEnquiry.admission?.status !== "CANCELLED"
      ? sourceEnquiry
      : null;

  if (sourceEnquiry && !usableSourceEnquiry) {
    redirect(
      "/admin/admissions?error=This+enquiry+is+closed+or+its+admission+was+cancelled",
    );
  }

  const [
    students,
    activeStudents,
    playgroupStudents,
    nurseryStudents,
    juniorKgStudents,
    seniorKgStudents,
    daycareStudents,
    programmeDefinitions,
  ] = await Promise.all([
    prisma.student.findMany({
      include: {
        programmeDefinition: true,
        admission: {
          select: {
            admissionNumber: true,
            status: true,
            documentsComplete: true,
          },
        },
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
        feeInvoices: {
          where: {
            status: {
              in: ["DUE", "OVERDUE", "PARTIALLY_PAID"],
            },
          },
          select: {
            pendingAmount: true,
            status: true,
          },
        },
        enrollmentContract: {
          include: {
            services: {
              where: { status: { in: ["ACTIVE", "DRAFT"] } },
              orderBy: [{ recurring: "desc" }, { serviceType: "asc" }],
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    }),

    prisma.student.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.student.count({
      where: {
        status: "ACTIVE",
        enrollmentContract: { is: { status: "ACTIVE", preschoolEnabled: true, preschoolClass: "Playgroup" } },
      },
    }),

    prisma.student.count({
      where: {
        status: "ACTIVE",
        enrollmentContract: { is: { status: "ACTIVE", preschoolEnabled: true, preschoolClass: "Nursery" } },
      },
    }),

    prisma.student.count({
      where: {
        status: "ACTIVE",
        enrollmentContract: { is: { status: "ACTIVE", preschoolEnabled: true, preschoolClass: { in: ["Junior KG", "LKG"] } } },
      },
    }),

    prisma.student.count({
      where: {
        status: "ACTIVE",
        enrollmentContract: { is: { status: "ACTIVE", preschoolEnabled: true, preschoolClass: { in: ["Senior KG", "UKG"] } } },
      },
    }),

    prisma.student.count({
      where: {
        status: "ACTIVE",
        enrollmentContract: { is: { status: "ACTIVE", daycareEnabled: true } },
      },
    }),

    prisma.programmeDefinition.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        colour: true,
        ageMinimumMonths: true,
        ageMaximumMonths: true,
        capacity: true,
        feeVersions: {
          where: { active: true },
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: {
            id: true,
            admissionFee: true,
            annualFee: true,
            kitFee: true,
            monthlyFee: true,
            combineAnnualAndKit: true,
            admissionGstApplicable: true,
            admissionGstRate: true,
            admissionPriceType: true,
            annualGstApplicable: true,
            annualGstRate: true,
            annualPriceType: true,
            kitGstApplicable: true,
            kitGstRate: true,
            kitPriceType: true,
            monthlyGstApplicable: true,
            monthlyGstRate: true,
            monthlyPriceType: true,
            effectiveFrom: true,
            effectiveTo: true,
          },
        },
      },
    }),
  ]);

  const [daycarePlanDefinitions, mealCombinations, chargeDefinitions] = await Promise.all([
    prisma.daycarePlanDefinition.findMany({
      where: { active: true, status: "ACTIVE" },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        priceVersions: {
          where: { active: true },
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
      },
    }),
    prisma.mealCombination.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        priceVersions: {
          where: { active: true },
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
      },
    }),
    prisma.chargeDefinition.findMany({
      where: { active: true, status: "ACTIVE" },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const summaryCards = [
    {
      title: "Active Students",
      value: activeStudents.toString(),
      description: "Currently enrolled",
      icon: UsersRound,
      accent: "bg-[#F3EAF8] text-[#5B2A86]",
    },
    {
      title: "Playgroup",
      value: playgroupStudents.toString(),
      description: "2–3 years",
      icon: Baby,
      accent: "bg-[#FFF3D5] text-[#8A6100]",
    },
    {
      title: "Nursery",
      value: nurseryStudents.toString(),
      description: "3–4 years",
      icon: GraduationCap,
      accent: "bg-[#E8F4FF] text-[#1769AA]",
    },
    {
      title: "Junior KG",
      value: juniorKgStudents.toString(),
      description: "4–5 years",
      icon: GraduationCap,
      accent: "bg-[#E9F8F2] text-[#28755D]",
    },
    {
      title: "Senior KG",
      value: seniorKgStudents.toString(),
      description: "5–6 years",
      icon: GraduationCap,
      accent: "bg-[#FFF0F3] text-[#A94159]",
    },
    {
      title: "Daycare",
      value: daycareStudents.toString(),
      description: "Daycare records",
      icon: HeartPulse,
      accent: "bg-[#EEF2FF] text-[#4C5DA8]",
    },
  ] as const;

  const configurableSummaryCards = programmeDefinitions.map((programme) => {
    const count = students.filter(
      (student) => student.status === "ACTIVE" &&
        student.enrollmentContract?.status === "ACTIVE" &&
        student.enrollmentContract.preschoolEnabled &&
        student.enrollmentContract.preschoolProgrammeId === programme.id,
    ).length;
    return {
      title: programme.name,
      value: count.toString(),
      description: programme.capacity
        ? `${Math.max(programme.capacity - count, 0)} of ${programme.capacity} seats available`
        : "No capacity limit set",
      icon: programme.code.includes("DAYCARE") ? HeartPulse : GraduationCap,
      accent: "bg-[#F3EAF8] text-[#5B2A86]",
    };
  });

  const visibleSummaryCards = programmeDefinitions.length > 0
    ? [summaryCards[0], ...configurableSummaryCards]
    : summaryCards;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <UsersRound
                    aria-hidden="true"
                    size={23}
                  />
                </span>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B] sm:text-sm">
                  Student Management
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Students
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                Add student profiles, maintain parent contacts,
                record health information and keep programme details
                in one secure database.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#F6C84B]">
                Live database
              </p>

              <p className="mt-1 text-sm font-black text-white">
                {students.length} student records saved
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
            Student overview
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
            Current strength by programme
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {visibleSummaryCards.map((card) => {
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

                  <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2D1736]">
                    {card.value}
                  </p>

                  <p className="mt-2 text-xs font-semibold text-[#928896]">
                    {card.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
            New student record
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
            Add a student
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
            Complete the step-by-step form below. The student number
            will be generated automatically and the record will be
            saved in PostgreSQL.
          </p>

          <div className="mt-6">
            <AddStudentForm
              programmeDefinitions={programmeDefinitions.map((programme) => ({
                id: programme.id,
                code: programme.code,
                name: programme.name,
                ageMinimumMonths: programme.ageMinimumMonths,
                ageMaximumMonths: programme.ageMaximumMonths,
                feeVersion: programme.feeVersions[0]
                  ? {
                      id: programme.feeVersions[0].id,
                      monthlyFee: Number(programme.feeVersions[0].monthlyFee),
                      admissionFee: Number(programme.feeVersions[0].admissionFee),
                      annualFee: Number(programme.feeVersions[0].annualFee),
                      kitFee: Number(programme.feeVersions[0].kitFee),
                      combineAnnualAndKit: programme.feeVersions[0].combineAnnualAndKit,
                      monthlyGstApplicable: programme.feeVersions[0].monthlyGstApplicable,
                      monthlyGstRate: Number(programme.feeVersions[0].monthlyGstRate ?? 0),
                      monthlyPriceType: programme.feeVersions[0].monthlyPriceType,
                      admissionGstApplicable: programme.feeVersions[0].admissionGstApplicable,
                      admissionGstRate: Number(programme.feeVersions[0].admissionGstRate ?? 0),
                      admissionPriceType: programme.feeVersions[0].admissionPriceType,
                      annualGstApplicable: programme.feeVersions[0].annualGstApplicable,
                      annualGstRate: Number(programme.feeVersions[0].annualGstRate ?? 0),
                      annualPriceType: programme.feeVersions[0].annualPriceType,
                      kitGstApplicable: programme.feeVersions[0].kitGstApplicable,
                      kitGstRate: Number(programme.feeVersions[0].kitGstRate ?? 0),
                      kitPriceType: programme.feeVersions[0].kitPriceType,
                    }
                  : null,
              }))}
              daycarePlans={daycarePlanDefinitions.flatMap((plan) =>
                plan.priceVersions[0]
                  ? [{
                      id: plan.id,
                      name: plan.name,
                      description: plan.description,
                      billingType: plan.billingType,
                      hoursIncluded: plan.hoursIncluded ? Number(plan.hoursIncluded) : null,
                      recurring: plan.recurring,
                      maximumVisits: plan.maximumVisits,
                      mealRule: plan.mealRule,
                      amount: Number(plan.priceVersions[0].price),
                      gstApplicable: plan.priceVersions[0].gstApplicable,
                      gstRate: Number(plan.priceVersions[0].gstRate ?? 0),
                      priceType: plan.priceVersions[0].priceType,
                    }]
                  : [],
              )}
              mealCombinations={mealCombinations.flatMap((meal) =>
                meal.priceVersions[0]
                  ? [{
                      id: meal.id,
                      name: meal.name,
                      description: meal.description,
                      amount: Number(meal.priceVersions[0].price),
                      gstApplicable: meal.priceVersions[0].gstApplicable,
                      gstRate: Number(meal.priceVersions[0].gstRate ?? 0),
                      priceType: meal.priceVersions[0].priceType,
                    }]
                  : [],
              )}
              otherCharges={chargeDefinitions.flatMap((charge) =>
                charge.defaultAmount
                  ? [{
                      id: charge.id,
                      name: charge.name,
                      description: charge.description,
                      amount: Number(charge.defaultAmount),
                      gstApplicable: charge.gstApplicable,
                      gstRate: Number(charge.gstRate ?? 0),
                      priceType: charge.priceType,
                    }]
                  : [],
              )}
              canOverridePrice={adminUser.role === "OWNER"}
              enquiryId={usableSourceEnquiry?.id}
              enquiryNumber={usableSourceEnquiry?.enquiryNumber}
              initialValues={
                usableSourceEnquiry
                  ? {
                      ...splitChildName(usableSourceEnquiry.childName),
                      dateOfBirth: formatDateInput(
                        usableSourceEnquiry.childDateOfBirth,
                      ),
                      programme:
                        usableSourceEnquiry.programme ?? "PLAYGROUP",
                      joiningDate: formatDateInput(
                        usableSourceEnquiry.admission?.joiningDate ?? null,
                      ),
                      guardianName: usableSourceEnquiry.parentName,
                      guardianRelationship: "GUARDIAN",
                      guardianPhone: usableSourceEnquiry.phone,
                      guardianAlternatePhone:
                        usableSourceEnquiry.alternatePhone ?? "",
                      guardianEmail: usableSourceEnquiry.email ?? "",
                    }
                  : undefined
              }
            />
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                Student register
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
                Saved students
              </h2>
            </div>

            <p className="text-sm font-bold text-[#817684]">
              Showing {students.length} most recent records
            </p>
          </div>

          <StudentRegister students={students.map((student) => {
            const guardian = student.guardians.find((item) => item.isPrimary) ?? student.guardians[0] ?? null;
            const activeContract = student.enrollmentContract?.status === "ACTIVE";
            const invoiceStatuses = student.feeInvoices.map((invoice) => invoice.status);
            const feeStatus = invoiceStatuses.includes("OVERDUE")
              ? "OVERDUE"
              : invoiceStatuses.includes("PARTIALLY_PAID")
                ? "PART_PAID"
                : invoiceStatuses.length > 0
                  ? "PENDING"
                  : "PAID";
            return {
              id: student.id,
              studentNumber: student.studentNumber,
              admissionNumber: student.admission?.admissionNumber ?? null,
              name: getStudentFullName(student),
              programme: student.programmeDefinition?.name ?? programmeLabels[student.programme] ?? student.programme,
              status: student.status,
              dateOfBirth: student.dateOfBirth.toISOString(),
              joiningDate: student.joiningDate.toISOString(),
              medicalNotes: student.medicalNotes,
              allergies: student.allergies,
              guardianName: guardian?.name ?? null,
              guardianRelationship: guardian?.relationship ?? null,
              guardianPhone: guardian?.phone ?? null,
              contractStatus: student.enrollmentContract?.status ?? null,
              preschoolActive: Boolean(activeContract && student.enrollmentContract?.preschoolEnabled),
              daycareActive: Boolean(activeContract && student.enrollmentContract?.daycareEnabled),
              mealsActive: Boolean(activeContract && student.enrollmentContract?.mealsEnabled),
              documentsPending: Boolean(student.admission && !student.admission.documentsComplete),
              admissionStarted: Boolean(
                student.enrollmentContract?.status === "DRAFT" ||
                student.admission?.status === "DRAFT" ||
                student.admission?.status === "DOCUMENTS_PENDING"
              ),
              feeStatus,
              outstanding: student.feeInvoices.reduce((sum, invoice) => sum + Number(invoice.pendingAmount), 0),
            };
          })} />

          {false && (students.length === 0 ? (
            <div className="mt-6 flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[#DCCFE3] bg-white px-5 py-12 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1E7F5] text-[#5B2A86]">
                <UserRoundPlus
                  aria-hidden="true"
                  size={29}
                />
              </span>

              <h3 className="mt-5 text-xl font-black text-[#2D1736]">
                No student records yet
              </h3>

              <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
                Complete the student form above and save your first
                student. The record will appear here after saving.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {students.map((student) => {
                const primaryGuardian =
                  student.guardians.find(
                    (guardian) => guardian.isPrimary,
                  ) ??
                  student.guardians[0] ??
                  null;

                return (
                  <article
                    key={student.id}
                    className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                          {student.studentNumber}
                        </p>

                        <h3 className="mt-2 text-xl font-black text-[#2D1736]">
                          {getStudentFullName(student)}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-[#817684]">
                          {student.programmeDefinition?.name ??
                            programmeLabels[student.programme] ??
                            student.programme}
                        </p>
                      </div>

                      <span
                        className={[
                          "w-fit rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em]",
                          statusStyles[student.status] ??
                            "border-slate-200 bg-slate-50 text-slate-600",
                        ].join(" ")}
                      >
                        {statusLabels[student.status] ??
                          student.status}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[#FAF8FC] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
                          Age
                        </p>

                        <p className="mt-1 text-sm font-black text-[#2D1736]">
                          {calculateAge(student.dateOfBirth)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FAF8FC] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
                          Joining date
                        </p>

                        <p className="mt-1 text-sm font-black text-[#2D1736]">
                          {formatDate(student.joiningDate)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FAF8FC] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
                          Primary guardian
                        </p>

                        <p className="mt-1 text-sm font-black text-[#2D1736]">
                          {primaryGuardian?.name ??
                            "Not entered"}
                        </p>

                        {primaryGuardian ? (
                          <p className="mt-1 text-xs font-semibold text-[#817684]">
                            {primaryGuardian.relationship.replaceAll(
                              "_",
                              " ",
                            )}
                          </p>
                        ) : null}
                      </div>

                      <div className="rounded-2xl bg-[#FAF8FC] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
                          Parent phone
                        </p>

                        <p className="mt-1 break-all text-sm font-black text-[#2D1736]">
                          {primaryGuardian?.phone ??
                            "Not entered"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#F7F0FA] p-4">
                      <CalendarDays
                        aria-hidden="true"
                        size={18}
                        className="mt-0.5 shrink-0 text-[#5B2A86]"
                      />

                      <div>
                        <p className="text-xs font-black text-[#5B2A86]">
                          Date of birth
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#6D5878]">
                          {formatDate(student.dateOfBirth)}
                        </p>
                      </div>
                    </div>

                    {student.medicalNotes ||
                    student.allergies ? (
                      <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                        <div className="flex items-start gap-3">
                          <HeartPulse
                            aria-hidden="true"
                            size={18}
                            className="mt-0.5 shrink-0 text-red-600"
                          />

                          <div>
                            <p className="text-xs font-black text-red-700">
                              Health information
                            </p>

                            {student.allergies ? (
                              <p className="mt-1 text-sm font-semibold leading-6 text-red-700/80">
                                Allergies: {student.allergies}
                              </p>
                            ) : null}

                            {student.medicalNotes ? (
                              <p className="mt-1 text-sm font-semibold leading-6 text-red-700/80">
                                {student.medicalNotes}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {primaryGuardian?.phone ? (
                        <a
                          href={`tel:${primaryGuardian.phone}`}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
                        >
                          <Phone aria-hidden="true" size={17} />
                          Call Guardian
                        </a>
                      ) : (
                        <div className="hidden sm:block" />
                      )}

                      <Link
                        href={`/admin/students/${student.id}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white transition hover:bg-[#4B206F]"
                      >
                        Open Profile
                        <ArrowRight
                          aria-hidden="true"
                          size={17}
                        />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}
