import type {
  $Enums,
  Prisma,
} from "@/generated/prisma/client";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileWarning,
  Filter,
  GraduationCap,
  MessageCircleMore,
  PencilLine,
  Phone,
  Save,
  Search,
  UserRoundCheck,
  UsersRound,
  XCircle,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { getAdminSession } from "@/lib/admin/auth";
import { generateRecurringInvoices } from "@/lib/admin/recurring-billing";
import { deliverAdmissionConversions } from "@/lib/marketing/admissionConversions";
import { logServerError } from "@/lib/server/safeLogging";
import { prisma } from "@/lib/prisma";
import { queueWhatsAppAutomation } from "@/lib/whatsapp/automation";

export const dynamic = "force-dynamic";

type AdmissionsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    programme?: string;
    success?: string;
    error?: string;
  }>;
};

const programmeOptions: Array<{
  value: $Enums.Programme;
  label: string;
}> = [
  {
    value: "PLAYGROUP",
    label: "Playgroup",
  },
  {
    value: "NURSERY",
    label: "Nursery",
  },
  {
    value: "JUNIOR_KG",
    label: "Junior KG",
  },
  {
    value: "SENIOR_KG",
    label: "Senior KG",
  },
  {
    value: "DAYCARE",
    label: "Daycare",
  },
];

const admissionStatusOptions: Array<{
  value: $Enums.AdmissionStatus;
  label: string;
}> = [
  {
    value: "DRAFT",
    label: "Admission Started",
  },
  {
    value: "DOCUMENTS_PENDING",
    label: "Documents Pending",
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];

const programmeLabels: Record<
  $Enums.Programme,
  string
> = {
  PLAYGROUP: "Playgroup",
  NURSERY: "Nursery",
  JUNIOR_KG: "Junior KG",
  SENIOR_KG: "Senior KG",
  DAYCARE: "Daycare",
};

const statusLabels: Record<
  $Enums.AdmissionStatus,
  string
> = {
  DRAFT: "Admission Started",
  DOCUMENTS_PENDING: "Documents Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

const statusStyles: Record<
  $Enums.AdmissionStatus,
  string
> = {
  DRAFT:
    "border-blue-200 bg-blue-50 text-blue-700",
  DOCUMENTS_PENDING:
    "border-amber-200 bg-amber-50 text-amber-700",
  CONFIRMED:
    "border-green-200 bg-green-50 text-green-700",
  CANCELLED:
    "border-red-200 bg-red-50 text-red-700",
};

function isProgramme(
  value: string,
): value is $Enums.Programme {
  return programmeOptions.some(
    (option) => option.value === value,
  );
}

function isAdmissionStatus(
  value: string,
): value is $Enums.AdmissionStatus {
  return admissionStatusOptions.some(
    (option) => option.value === value,
  );
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(
    `${value}T00:00:00.000+05:30`,
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

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

function redirectWithMessage(
  type: "success" | "error",
  message: string,
): never {
  redirect(
    `/admin/admissions?${type}=${encodeURIComponent(
      message,
    )}`,
  );
}

async function updateAdmissionAction(
  formData: FormData,
) {
  "use server";

  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const canManageAdmissions =
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes(
      "admissions.manage",
    );

  if (!canManageAdmissions) {
    redirect("/admin?access=denied");
  }

  const admissionId = String(
    formData.get("admissionId") ?? "",
  ).trim();

  const programmeValue = String(
    formData.get("programme") ?? "",
  );

  const statusValue = String(
    formData.get("status") ?? "",
  );

  const admissionDateValue = String(
    formData.get("admissionDate") ?? "",
  ).trim();

  const joiningDateValue = String(
    formData.get("joiningDate") ?? "",
  ).trim();

  const notes = String(
    formData.get("notes") ?? "",
  ).trim();

  const documentsComplete =
    formData.get("documentsComplete") === "true";

  if (!admissionId) {
    redirectWithMessage(
      "error",
      "Admission record was not found.",
    );
  }

  if (!isProgramme(programmeValue)) {
    redirectWithMessage(
      "error",
      "Please select a valid programme.",
    );
  }

  if (!isAdmissionStatus(statusValue)) {
    redirectWithMessage(
      "error",
      "Please select a valid admission status.",
    );
  }

  if (notes.length > 2000) {
    redirectWithMessage(
      "error",
      "Admission notes cannot exceed 2,000 characters.",
    );
  }

  const admissionDate = admissionDateValue
    ? parseDateInput(admissionDateValue)
    : null;

  const joiningDate = joiningDateValue
    ? parseDateInput(joiningDateValue)
    : null;

  if (admissionDateValue && !admissionDate) {
    redirectWithMessage(
      "error",
      "Please enter a valid admission date.",
    );
  }

  if (joiningDateValue && !joiningDate) {
    redirectWithMessage(
      "error",
      "Please enter a valid joining date.",
    );
  }

  if (
    admissionDate &&
    joiningDate &&
    joiningDate.getTime() <
      admissionDate.getTime()
  ) {
    redirectWithMessage(
      "error",
      "Joining date cannot be before the admission date.",
    );
  }

  const existingAdmission =
    await prisma.admission.findUnique({
      where: {
        id: admissionId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            enrollmentContract: {
              select: { id: true, status: true },
            },
            guardians: {
              where: { isPrimary: true },
              select: { phone: true },
              take: 1,
            },
          },
        },
        enquiry: {
          select: {
            childName: true,
            status: true,
          },
        },
      },
    });

  if (!existingAdmission) {
    redirectWithMessage(
      "error",
      "Admission record was not found.",
    );
  }

  const childName = existingAdmission.student
    ? getStudentName(existingAdmission.student)
    : existingAdmission.enquiry?.childName ??
      existingAdmission.admissionNumber;

  if (
    statusValue === "CONFIRMED" &&
    !existingAdmission.studentId
  ) {
    redirectWithMessage(
      "error",
      "Complete the student profile before confirming this admission.",
    );
  }

  if (
    statusValue === "CONFIRMED" &&
    !documentsComplete
  ) {
    redirectWithMessage(
      "error",
      "Mark the documents as complete before confirming this admission.",
    );
  }

  if (
    statusValue === "CANCELLED" &&
    existingAdmission.studentId
  ) {
    redirectWithMessage(
      "error",
      "This admission already has a student profile. Use Withdraw Student from the student profile instead.",
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      await transaction.admission.update({
        where: {
          id: admissionId,
        },
        data: {
          programme: programmeValue,
          status: statusValue,
          documentsComplete,
          admissionDate,
          joiningDate,
          notes: notes || null,
        },
      });

      if (existingAdmission.studentId) {
        await transaction.student.update({
          where: {
            id: existingAdmission.studentId,
          },
          data: {
            programme: programmeValue,
            ...(joiningDate
              ? {
                  joiningDate,
                }
              : {}),
          },
        });

        if (existingAdmission.student?.enrollmentContract) {
          if (statusValue === "CONFIRMED") {
            await transaction.studentEnrollmentContract.update({
              where: { id: existingAdmission.student.enrollmentContract.id },
              data: {
                status: "ACTIVE",
                updatedById: session.userId,
                services: {
                  updateMany: {
                    where: { status: "DRAFT" },
                    data: { status: "ACTIVE" },
                  },
                },
                daycarePlans: {
                  updateMany: {
                    where: { lifecycleStatus: "INACTIVE", billingStoppedAt: null },
                    data: { active: true, lifecycleStatus: "ACTIVE" },
                  },
                },
              },
            });
          }
        }
      }

      if (existingAdmission.enquiryId) {
        if (statusValue === "CONFIRMED") {
          await transaction.enquiry.update({
            where: { id: existingAdmission.enquiryId },
            data: {
              status: "ADMITTED",
              admittedAt: admissionDate ?? new Date(),
              stageChangedAt: new Date(),
              closedAt: null,
              nextFollowUpAt: null,
            },
          });
          await transaction.leadActivity.create({
            data: {
              enquiryId: existingAdmission.enquiryId,
              type: "ADMISSION_CONFIRMED",
              fromStatus: existingAdmission.enquiry?.status ?? null,
              toStatus: "ADMITTED",
              title: "Admission confirmed and student profile linked",
              notes: notes || null,
              recordedById: session.userId,
            },
          });
        } else if (statusValue === "CANCELLED") {
          await transaction.enquiry.update({
            where: { id: existingAdmission.enquiryId },
            data: {
              status: "CONTACTED",
              admittedAt: null,
              stageChangedAt: new Date(),
              nextFollowUpAt: null,
            },
          });
          await transaction.leadActivity.create({
            data: {
              enquiryId: existingAdmission.enquiryId,
              type: "STATUS_CHANGED",
              fromStatus: existingAdmission.enquiry?.status ?? null,
              toStatus: "CONTACTED",
              title: "Admission cancelled; lead returned to Contacted",
              notes: notes || null,
              recordedById: session.userId,
            },
          });
        }
      }

      await transaction.activityLog.create({
        data: {
          adminUserId: session.userId,
          action: "UPDATED",
          entityType: "Admission",
          entityId: admissionId,
          description: `${childName}'s admission record was updated.`,
          previousData: {
            programme:
              existingAdmission.programme,
            status: existingAdmission.status,
            documentsComplete:
              existingAdmission.documentsComplete,
            admissionDate:
              existingAdmission.admissionDate?.toISOString() ??
              null,
            joiningDate:
              existingAdmission.joiningDate?.toISOString() ??
              null,
            notes:
              existingAdmission.notes ?? null,
          },
          newData: {
            programme: programmeValue,
            status: statusValue,
            documentsComplete,
            admissionDate:
              admissionDate?.toISOString() ?? null,
            joiningDate:
              joiningDate?.toISOString() ?? null,
            notes: notes || null,
          },
        },
      });
    },
  );

  if (
    statusValue === "CONFIRMED" &&
    existingAdmission.studentId &&
    !existingAdmission.student?.enrollmentContract
  ) {
    await generateRecurringInvoices(
      session.userId,
      joiningDate ?? admissionDate ?? new Date(),
      {
        studentId: existingAdmission.studentId,
        ignoreAutomaticSetting: true,
      },
    );
  }

  if (
    statusValue === "CONFIRMED" &&
    existingAdmission.status !== "CONFIRMED" &&
    existingAdmission.enquiryId
  ) {
    after(async () => {
      try {
        await Promise.all([
          deliverAdmissionConversions(existingAdmission.enquiryId as string),
          existingAdmission.student?.guardians[0]?.phone
            ? queueWhatsAppAutomation({
                type: "ADMISSION_CONFIRMATION",
                deduplicationKey: `ADMISSION_CONFIRMATION:${existingAdmission.id}`,
                recipientPhone: existingAdmission.student.guardians[0].phone,
                enquiryId: existingAdmission.enquiryId,
                studentId: existingAdmission.studentId,
                messageText: `Admission ${existingAdmission.admissionNumber} has been confirmed.`,
                payload: { parameters: [childName, existingAdmission.admissionNumber] },
              })
            : Promise.resolve(null),
        ]);
      } catch (error) {
        logServerError("Admission conversion delivery failed.", error);
      }
    });
  }

  revalidatePath("/admin/admissions");

  redirectWithMessage(
    "success",
    `${childName}'s admission was updated successfully.`,
  );
}

export default async function AdmissionsPage({
  searchParams,
}: AdmissionsPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const canManageAdmissions =
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes(
      "admissions.manage",
    );

  if (!canManageAdmissions) {
    redirect("/admin?access=denied");
  }

  const params = await searchParams;

  const search = String(
    params.search ?? "",
  ).trim();

  const selectedStatus =
    typeof params.status === "string" &&
    isAdmissionStatus(params.status)
      ? params.status
      : "";

  const selectedProgramme =
    typeof params.programme === "string" &&
    isProgramme(params.programme)
      ? params.programme
      : "";

  const where: Prisma.AdmissionWhereInput = {
    ...(selectedStatus
      ? {
          status: selectedStatus,
        }
      : {}),
    ...(selectedProgramme
      ? {
          programme: selectedProgramme,
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              admissionNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              enquiry: {
                is: {
                  OR: [
                    {
                      parentName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                    {
                      childName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                    {
                      phone: {
                        contains: search,
                      },
                    },
                  ],
                },
              },
            },
            {
              student: {
                is: {
                  OR: [
                    {
                      studentNumber: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                    {
                      firstName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                    {
                      middleName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                    {
                      lastName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                    {
                      guardians: {
                        some: {
                          OR: [
                            {
                              name: {
                                contains: search,
                                mode: "insensitive",
                              },
                            },
                            {
                              phone: {
                                contains: search,
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [
    admissions,
    totalAdmissions,
    draftAdmissions,
    pendingDocuments,
    confirmedAdmissions,
  ] = await Promise.all([
    prisma.admission.findMany({
      where,
      include: {
        enquiry: true,
        student: {
          include: {
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
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 250,
    }),

    prisma.admission.count(),

    prisma.admission.count({
      where: {
        status: "DRAFT",
      },
    }),

    prisma.admission.count({
      where: {
        status: "DOCUMENTS_PENDING",
      },
    }),

    prisma.admission.count({
      where: {
        status: "CONFIRMED",
      },
    }),
  ]);

  const summaryCards = [
    {
      title: "Total Admissions",
      value: totalAdmissions,
      description: "Complete admission register",
      icon: UsersRound,
      accent: "bg-[#F2E8F7] text-[#5B2A86]",
    },
    {
      title: "Admission Started",
      value: draftAdmissions,
      description: "Profiles being prepared",
      icon: Clock3,
      accent: "bg-blue-50 text-blue-700",
    },
    {
      title: "Documents Pending",
      value: pendingDocuments,
      description: "Require parent documents",
      icon: FileWarning,
      accent: "bg-amber-50 text-amber-700",
    },
    {
      title: "Confirmed",
      value: confirmedAdmissions,
      description: "Successfully admitted",
      icon: CheckCircle2,
      accent: "bg-green-50 text-green-700",
    },
  ] as const;

  const hasFilters =
    Boolean(search) ||
    Boolean(selectedStatus) ||
    Boolean(selectedProgramme);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <GraduationCap
                    aria-hidden="true"
                    size={24}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B]">
                    CentreOS Admissions
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white/60">
                    Preschool admission pipeline
                  </p>
                </div>
              </div>

              <h1 className="mt-6 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Manage every admission from enquiry
                to confirmed student.
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/70">
                Track documents, joining dates,
                programmes, parent details and admission
                progress from one workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/api/admin/reports/ca-export?report=admission-register&range=all"
                target="_blank"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
              >
                <Download
                  aria-hidden="true"
                  size={18}
                />
                Export PDF
              </Link>

              <Link
                href="/admin/enquiries"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:-translate-y-0.5 hover:bg-[#FFD95F]"
              >
                Open Enquiries
                <ArrowRight
                  aria-hidden="true"
                  size={18}
                />
              </Link>
            </div>
          </div>
        </section>

        {params.success ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800"
          >
            <CheckCircle2
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0"
            />
            {params.success}
          </div>
        ) : null}

        {params.error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800"
          >
            <AlertCircle
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0"
            />
            {params.error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
                      {card.title}
                    </p>

                    <p className="mt-3 text-3xl font-black text-[#2D1736]">
                      {card.value}
                    </p>
                  </div>

                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.accent}`}
                  >
                    <Icon
                      aria-hidden="true"
                      size={21}
                    />
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold text-[#8A7F8E]">
                  {card.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_42px_rgba(45,23,54,0.06)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
              <Filter
                aria-hidden="true"
                size={20}
              />
            </span>

            <div>
              <h2 className="text-xl font-black text-[#2D1736]">
                Find an admission
              </h2>

              <p className="mt-1 text-sm font-semibold text-[#817684]">
                Search by child, parent, phone,
                admission number or student number.
              </p>
            </div>
          </div>

          <form
            method="get"
            className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]"
          >
            <label className="relative">
              <span className="sr-only">
                Search admissions
              </span>

              <Search
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A459C]"
              />

              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search child, parent, phone or ID"
                className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white pl-11 pr-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
              />
            </label>

            <select
              name="status"
              defaultValue={selectedStatus}
              aria-label="Filter by admission status"
              className="min-h-12 rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
            >
              <option value="">All statuses</option>

              {admissionStatusOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>

            <select
              name="programme"
              defaultValue={selectedProgramme}
              aria-label="Filter by programme"
              className="min-h-12 rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
            >
              <option value="">All programmes</option>

              {programmeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#48206C]"
              >
                <Search
                  aria-hidden="true"
                  size={17}
                />
                Search
              </button>

              {hasFilters ? (
                <Link
                  href="/admin/admissions"
                  aria-label="Clear filters"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#DDD2E2] bg-white text-[#5B2A86] transition hover:bg-[#F3EAF8]"
                >
                  <XCircle
                    aria-hidden="true"
                    size={19}
                  />
                </Link>
              ) : null}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.07)]">
          <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
                  <ClipboardCheck
                    aria-hidden="true"
                    size={21}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                    Admission register
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-[#2D1736]">
                    Current admission pipeline
                  </h2>
                </div>
              </div>

              <p className="text-sm font-bold text-[#817684]">
                Showing {admissions.length} of{" "}
                {totalAdmissions}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {admissions.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#DCCFE3] bg-[#FCFAFD] px-5 py-10 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1E7F5] text-[#5B2A86]">
                  <UserRoundCheck
                    aria-hidden="true"
                    size={29}
                  />
                </span>

                <h3 className="mt-5 text-xl font-black text-[#2D1736]">
                  No matching admissions
                </h3>

                <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
                  Clear the filters or open an enquiry
                  and move it to Admitted.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  {hasFilters ? (
                    <Link
                      href="/admin/admissions"
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#D8CBE0] bg-white px-5 text-sm font-black text-[#5B2A86]"
                    >
                      Clear Filters
                    </Link>
                  ) : null}

                  <Link
                    href="/admin/enquiries"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#48206C]"
                  >
                    Open Enquiries
                    <ArrowRight
                      aria-hidden="true"
                      size={17}
                    />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {admissions.map((admission) => {
                  const primaryGuardian =
                    admission.student
                      ?.guardians[0] ?? null;

                  const childName =
                    admission.student
                      ? getStudentName(
                          admission.student,
                        )
                      : admission.enquiry
                          ?.childName ??
                        "Child profile pending";

                  const parentName =
                    primaryGuardian?.name ??
                    admission.enquiry
                      ?.parentName ??
                    "Parent details pending";

                  const phone =
                    primaryGuardian?.phone ??
                    admission.enquiry?.phone ??
                    null;

                  return (
                    <article
                      key={admission.id}
                      className="overflow-hidden rounded-[24px] border border-[#E9E2ED] bg-white transition hover:shadow-[0_18px_45px_rgba(45,23,54,0.09)]"
                    >
                      <div className="p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                              {admission.admissionNumber}
                            </p>

                            <h3 className="mt-2 truncate text-xl font-black text-[#2D1736]">
                              {childName}
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-[#756A79]">
                              Parent: {parentName}
                            </p>
                          </div>

                          <span
                            className={[
                              "w-fit rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.07em]",
                              statusStyles[
                                admission.status
                              ],
                            ].join(" ")}
                          >
                            {
                              statusLabels[
                                admission.status
                              ]
                            }
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-[#FAF8FC] p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8C7F91]">
                              Programme
                            </p>

                            <p className="mt-1 text-sm font-black text-[#2D1736]">
                              {
                                programmeLabels[
                                  admission.programme
                                ]
                              }
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#FAF8FC] p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8C7F91]">
                              Joining date
                            </p>

                            <p className="mt-1 text-sm font-black text-[#2D1736]">
                              {formatDate(
                                admission.joiningDate,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#756A79]">
                          {phone ? (
                            <a
                              href={`tel:${phone}`}
                              className="inline-flex items-center gap-2 rounded-xl bg-[#F3EDF6] px-3 py-2 font-black text-[#5B2A86]"
                            >
                              <Phone
                                aria-hidden="true"
                                size={15}
                              />
                              {phone}
                            </a>
                          ) : null}

                          {phone ? (
                            <a
                              href={`https://wa.me/${phone.replace(/\D/g, "").length === 10 ? "91" : ""}${phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-green-50 px-3 py-2 font-black text-green-700"
                            >
                              <MessageCircleMore aria-hidden="true" size={15} />
                              WhatsApp
                            </a>
                          ) : null}

                          <span
                            className={[
                              "inline-flex items-center gap-2 rounded-xl px-3 py-2 font-black",
                              admission.documentsComplete
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {admission.documentsComplete ? (
                              <CheckCircle2
                                aria-hidden="true"
                                size={15}
                              />
                            ) : (
                              <FileWarning
                                aria-hidden="true"
                                size={15}
                              />
                            )}

                            {admission.documentsComplete
                              ? "Documents Complete"
                              : "Documents Pending"}
                          </span>
                        </div>

                        {admission.enquiry ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-[#FAF8FC] p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8C7F91]">Lead source</p>
                              <p className="mt-1 text-sm font-black text-[#2D1736]">{admission.enquiry.source.replaceAll("_", " ")}</p>
                            </div>
                            <div className="rounded-2xl bg-[#FAF8FC] p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8C7F91]">Campaign</p>
                              <p className="mt-1 break-words text-sm font-black text-[#2D1736]">{admission.enquiry.latestUtmCampaign ?? "Not attributed"}</p>
                            </div>
                          </div>
                        ) : null}

                        {admission.notes ? (
                          <div className="mt-4 rounded-2xl border border-[#EEE7F1] bg-[#FCFAFD] p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8C7F91]">
                              Admission notes
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#6F6474]">
                              {admission.notes}
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-5 flex flex-col gap-3 border-t border-[#EEE8F1] pt-5 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs font-bold text-[#918596]">
                            Started{" "}
                            {formatDate(
                              admission.admissionDate ??
                                admission.createdAt,
                            )}
                          </p>

                          {admission.studentId ? (
                            <Link
                              href={`/admin/students/${admission.studentId}`}
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#2D1736] px-4 text-xs font-black text-white transition hover:bg-[#5B2A86]"
                            >
                              View Student
                              <ArrowRight
                                aria-hidden="true"
                                size={15}
                              />
                            </Link>
                          ) : admission.enquiryId &&
                            admission.status !==
                              "CANCELLED" ? (
                            <Link
                              href={`/admin/students?enquiryId=${encodeURIComponent(
                                admission.enquiryId,
                              )}`}
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white transition hover:bg-[#48206C]"
                            >
                              Complete Student Profile
                              <ArrowRight
                                aria-hidden="true"
                                size={15}
                              />
                            </Link>
                          ) : null}
                        </div>
                      </div>

                      <details className="border-t border-[#EEE8F1] bg-[#FAF8FC]">
                        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black text-[#5B2A86]">
                          <span className="flex items-center gap-2">
                            <PencilLine
                              aria-hidden="true"
                              size={17}
                            />
                            Update Admission
                          </span>
                        </summary>

                        <form
                          action={updateAdmissionAction}
                          className="space-y-5 border-t border-[#EEE8F1] bg-white p-5"
                        >
                          <input
                            type="hidden"
                            name="admissionId"
                            value={admission.id}
                          />

                          <div className="grid gap-4 sm:grid-cols-2">
                            <label>
                              <span className="text-sm font-black text-[#35243E]">
                                Programme
                              </span>

                              <select
                                name="programme"
                                required
                                defaultValue={
                                  admission.programme
                                }
                                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                              >
                                {programmeOptions.map(
                                  (option) => (
                                    <option
                                      key={
                                        option.value
                                      }
                                      value={
                                        option.value
                                      }
                                    >
                                      {option.label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>

                            <label>
                              <span className="text-sm font-black text-[#35243E]">
                                Admission status
                              </span>

                              <select
                                name="status"
                                required
                                defaultValue={
                                  admission.status
                                }
                                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                              >
                                {admissionStatusOptions.map(
                                  (option) => (
                                    <option
                                      key={
                                        option.value
                                      }
                                      value={
                                        option.value
                                      }
                                      disabled={
                                        option.value ===
                                          "CANCELLED" &&
                                        Boolean(
                                          admission.studentId,
                                        )
                                      }
                                    >
                                      {option.label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>

                            <label>
                              <span className="text-sm font-black text-[#35243E]">
                                Admission date
                              </span>

                              <input
                                type="date"
                                name="admissionDate"
                                defaultValue={formatDateInput(
                                  admission.admissionDate,
                                )}
                                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                              />
                            </label>

                            <label>
                              <span className="text-sm font-black text-[#35243E]">
                                Joining date
                              </span>

                              <input
                                type="date"
                                name="joiningDate"
                                defaultValue={formatDateInput(
                                  admission.joiningDate,
                                )}
                                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                              />
                            </label>
                          </div>

                          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#DCCFE4] bg-[#FAF8FC] p-4">
                            <input
                              type="checkbox"
                              name="documentsComplete"
                              value="true"
                              defaultChecked={
                                admission.documentsComplete
                              }
                              className="mt-1 h-4 w-4 rounded border-[#BCAFC2] accent-[#5B2A86]"
                            />

                            <span>
                              <span className="block text-sm font-black text-[#35243E]">
                                Documents complete
                              </span>

                              <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
                                Tick after all required
                                admission documents have
                                been checked.
                              </span>
                            </span>
                          </label>

                          <label className="block">
                            <span className="text-sm font-black text-[#35243E]">
                              Admission notes
                            </span>

                            <textarea
                              name="notes"
                              rows={4}
                              maxLength={2000}
                              defaultValue={
                                admission.notes ?? ""
                              }
                              placeholder="Documents required, parent commitments or internal admission notes"
                              className="mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                            />
                          </label>

                          <button
                            type="submit"
                            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#48206C]"
                          >
                            <Save
                              aria-hidden="true"
                              size={18}
                            />
                            Save Admission Update
                          </button>
                        </form>
                      </details>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
