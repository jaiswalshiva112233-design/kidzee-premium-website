import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  UserRound,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import EditStudentForm, {
  type EditStudentInitialData,
} from "@/components/admin/students/EditStudentForm";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type EditStudentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateForInput(value: Date | null) {
  if (!value) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(
    2,
    "0",
  );
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const dynamic = "force-dynamic";

export default async function EditStudentPage({
  params,
}: EditStudentPageProps) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const [student, programmeDefinitions] = await Promise.all([
    prisma.student.findUnique({
      where: { id },
      include: {
        guardians: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    }),
    prisma.programmeDefinition.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        ageMinimumMonths: true,
        ageMaximumMonths: true,
      },
    }),
  ]);

  if (!student) {
    notFound();
  }

  const primaryGuardian =
    student.guardians.find(
      (guardian) => guardian.isPrimary,
    ) ??
    student.guardians[0] ??
    null;

  const initialData: EditStudentInitialData = {
    id: student.id,
    studentNumber: student.studentNumber,

    firstName: student.firstName,
    middleName: student.middleName ?? "",
    lastName: student.lastName ?? "",
    preferredName: student.preferredName ?? "",

    dateOfBirth: formatDateForInput(
      student.dateOfBirth,
    ),

    gender: student.gender ?? "",

    programme: student.programme,
    programmeDefinitionId: student.programmeDefinitionId ?? "",

    status: student.status,

    joiningDate: formatDateForInput(
      student.joiningDate,
    ),

    leavingDate: formatDateForInput(
      student.leavingDate,
    ),

    bloodGroup: student.bloodGroup ?? "",
    medicalNotes: student.medicalNotes ?? "",
    allergies: student.allergies ?? "",

    addressLine1: student.addressLine1 ?? "",
    addressLine2: student.addressLine2 ?? "",
    locality: student.locality ?? "",
    city: student.city ?? "",
    state: student.state ?? "",
    postalCode: student.postalCode ?? "",

    notes: student.notes ?? "",

    guardianId: primaryGuardian?.id ?? "",
    guardianName: primaryGuardian?.name ?? "",

    guardianRelationship:
      primaryGuardian?.relationship ?? "MOTHER",

    guardianPhone: primaryGuardian?.phone ?? "",

    guardianAlternatePhone:
      primaryGuardian?.alternatePhone ?? "",

    guardianEmail:
      primaryGuardian?.email ?? "",

    guardianOccupation:
      primaryGuardian?.occupation ?? "",

    guardianAddress:
      primaryGuardian?.address ?? "",

    authorisedPickup:
      primaryGuardian?.authorisedPickup ?? true,
  };

  const studentName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link
                href={`/admin/students/${student.id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:border-[#F6C84B]/60 hover:text-[#F6C84B]"
              >
                <ArrowLeft
                  aria-hidden="true"
                  size={17}
                />
                Student Profile
              </Link>

              <div className="mt-7 flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[#F6C84B] text-[#2D1736]">
                  <Edit3
                    aria-hidden="true"
                    size={25}
                  />
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#F6C84B]">
                    {student.studentNumber}
                  </p>

                  <h1 className="mt-2 break-words text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                    Edit {studentName}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                    Update student information, parent
                    contact details, programme, status,
                    health records and address.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/admin/students"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
            >
              <UserRound
                aria-hidden="true"
                size={17}
              />
              All Students
            </Link>
          </div>
        </section>

        <EditStudentForm
          initialData={initialData}
          programmeDefinitions={programmeDefinitions}
        />
      </div>
    </AdminLayout>
  );
}
