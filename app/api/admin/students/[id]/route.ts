import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import {
  getAdminSession,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateStudentBody = {
  firstName?: unknown;
  middleName?: unknown;
  lastName?: unknown;
  preferredName?: unknown;
  dateOfBirth?: unknown;
  gender?: unknown;
  programme?: unknown;
  programmeDefinitionId?: unknown;
  status?: unknown;
  joiningDate?: unknown;
  leavingDate?: unknown;
  bloodGroup?: unknown;
  medicalNotes?: unknown;
  allergies?: unknown;

  addressLine1?: unknown;
  addressLine2?: unknown;
  locality?: unknown;
  city?: unknown;
  state?: unknown;
  postalCode?: unknown;
  notes?: unknown;

  guardianId?: unknown;
  guardianName?: unknown;
  guardianRelationship?: unknown;
  guardianPhone?: unknown;
  guardianAlternatePhone?: unknown;
  guardianEmail?: unknown;
  guardianOccupation?: unknown;
  guardianAddress?: unknown;
  authorisedPickup?: unknown;
};

const PROGRAMMES = [
  "PLAYGROUP",
  "NURSERY",
  "JUNIOR_KG",
  "SENIOR_KG",
  "DAYCARE",
] as const;

const STUDENT_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "WITHDRAWN",
  "GRADUATED",
] as const;

const GUARDIAN_RELATIONSHIPS = [
  "MOTHER",
  "FATHER",
  "GRANDMOTHER",
  "GRANDFATHER",
  "GUARDIAN",
  "OTHER",
] as const;

type ProgrammeValue = (typeof PROGRAMMES)[number];

type StudentStatusValue =
  (typeof STUDENT_STATUSES)[number];

type GuardianRelationshipValue =
  (typeof GUARDIAN_RELATIONSHIPS)[number];

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanOptionalText(value: unknown) {
  const cleaned = cleanText(value);

  return cleaned.length > 0
    ? cleaned
    : null;
}

function normalisePhone(value: unknown) {
  return cleanText(value).replace(/[^\d+]/g, "");
}

function parseOptionalDate(value: unknown) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const parsedDate = new Date(`${text}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isProgramme(
  value: string,
): value is ProgrammeValue {
  return PROGRAMMES.includes(
    value as ProgrammeValue,
  );
}

function isStudentStatus(
  value: string,
): value is StudentStatusValue {
  return STUDENT_STATUSES.includes(
    value as StudentStatusValue,
  );
}

function isGuardianRelationship(
  value: string,
): value is GuardianRelationshipValue {
  return GUARDIAN_RELATIONSHIPS.includes(
    value as GuardianRelationshipValue,
  );
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await context.params;

    const student = await prisma.student.findUnique({
      where: {
        id,
      },
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

        admission: true,

        feeAccounts: {
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
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student record not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error(
      "Unable to load student:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load the student record.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await context.params;

    const existingStudent =
      await prisma.student.findUnique({
        where: {
          id,
        },
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
          daycarePlans: {
            where: { active: true },
            select: {
              id: true,
              title: true,
              planType: true,
            },
          },
        },
      });

    if (!existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message: "Student record not found.",
        },
        {
          status: 404,
        },
      );
    }

    let body: UpdateStudentBody;

    try {
      body =
        (await request.json()) as UpdateStudentBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid update request.",
        },
        {
          status: 400,
        },
      );
    }

    const firstName = cleanText(body.firstName);

    const dateOfBirth = parseOptionalDate(
      body.dateOfBirth,
    );

    const joiningDate = parseOptionalDate(
      body.joiningDate,
    );

    const leavingDate = parseOptionalDate(
      body.leavingDate,
    );

    let programmeValue = cleanText(
      body.programme,
    );
    const programmeDefinitionId = cleanOptionalText(body.programmeDefinitionId);

    const statusValue = cleanText(body.status);

    const guardianId = cleanText(
      body.guardianId,
    );

    const guardianName = cleanText(
      body.guardianName,
    );

    const guardianRelationshipValue = cleanText(
      body.guardianRelationship,
    );

    const guardianPhone = normalisePhone(
      body.guardianPhone,
    );

    const guardianAlternatePhone =
      normalisePhone(
        body.guardianAlternatePhone,
      ) || null;

    const guardianEmail = cleanOptionalText(
      body.guardianEmail,
    );

    if (firstName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter the child’s first name.",
        },
        {
          status: 400,
        },
      );
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid date of birth.",
        },
        {
          status: 400,
        },
      );
    }

    if (dateOfBirth > new Date()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Date of birth cannot be in the future.",
        },
        {
          status: 400,
        },
      );
    }

    if (!joiningDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid joining date.",
        },
        {
          status: 400,
        },
      );
    }

    const programmeDefinition = programmeDefinitionId
      ? await prisma.programmeDefinition.findFirst({
          where: { id: programmeDefinitionId, status: "ACTIVE" },
          select: {
            id: true,
            code: true,
            name: true,
            ageMinimumMonths: true,
            ageMaximumMonths: true,
            capacity: true,
            _count: {
              select: { students: { where: { status: "ACTIVE" } } },
            },
          },
        })
      : null;

    if (programmeDefinitionId && !programmeDefinition) {
      return NextResponse.json(
        { success: false, message: "The selected programme is no longer active." },
        { status: 409 },
      );
    }

    if (programmeDefinition) {
      programmeValue = legacyProgrammeForCode(programmeDefinition.code);
      const ageMonths = Math.max(
        0,
        (joiningDate.getFullYear() - dateOfBirth.getFullYear()) * 12 +
          joiningDate.getMonth() - dateOfBirth.getMonth(),
      );
      if (
        (programmeDefinition.ageMinimumMonths != null && ageMonths < programmeDefinition.ageMinimumMonths) ||
        (programmeDefinition.ageMaximumMonths != null && ageMonths > programmeDefinition.ageMaximumMonths)
      ) {
        return NextResponse.json(
          { success: false, message: `The child is outside the configured age range for ${programmeDefinition.name}.` },
          { status: 400 },
        );
      }
      const usesAnotherSeat =
        statusValue === "ACTIVE" &&
        (existingStudent.status !== "ACTIVE" || existingStudent.programmeDefinitionId !== programmeDefinition.id);
      if (
        usesAnotherSeat &&
        programmeDefinition.capacity != null &&
        programmeDefinition._count.students >= programmeDefinition.capacity
      ) {
        return NextResponse.json(
          { success: false, message: `${programmeDefinition.name} has reached its configured capacity.` },
          { status: 409 },
        );
      }
    }

    if (!isProgramme(programmeValue)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid programme.",
        },
        {
          status: 400,
        },
      );
    }

    const incompatibleDaycarePlan =
      existingStudent.daycarePlans.find(
        (plan) =>
          (plan.planType === "MONTHLY_DAYCARE_ONLY" &&
            programmeValue !== "DAYCARE") ||
          (plan.planType === "MONTHLY_PRESCHOOL_DAYCARE" &&
            programmeValue === "DAYCARE"),
      );

    if (incompatibleDaycarePlan) {
      return NextResponse.json(
        {
          success: false,
          message: `End or update the active daycare plan “${incompatibleDaycarePlan.title}” before changing this student's programme.`,
        },
        { status: 409 },
      );
    }

    if (!isStudentStatus(statusValue)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid student status.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      statusValue === "WITHDRAWN" &&
      existingStudent.status !== "WITHDRAWN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Use the Withdraw Student action so the leaving date, fee treatment and history are recorded together.",
        },
        { status: 409 },
      );
    }

    if (
      existingStudent.status === "WITHDRAWN" &&
      statusValue !== "WITHDRAWN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A withdrawn student cannot be reactivated from the edit form. Create a reviewed re-admission instead.",
        },
        { status: 409 },
      );
    }

    if (statusValue === "ACTIVE" && leavingDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An active student cannot have a leaving date.",
        },
        { status: 400 },
      );
    }

    if (statusValue === "GRADUATED" && !leavingDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter the completion date before marking a student as graduated.",
        },
        { status: 400 },
      );
    }

    if (guardianName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter the primary guardian’s name.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isGuardianRelationship(
        guardianRelationshipValue,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select the guardian’s relationship.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      guardianPhone.replace(/\D/g, "").length < 10
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid guardian phone number.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      guardianEmail &&
      !isValidEmail(guardianEmail)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid guardian email address.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      leavingDate &&
      leavingDate < joiningDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Leaving date cannot be before the joining date.",
        },
        {
          status: 400,
        },
      );
    }

    const existingPrimaryGuardian =
      existingStudent.guardians.find(
        (guardian) => guardian.isPrimary,
      ) ??
      existingStudent.guardians[0] ??
      null;

    const guardianToUpdate =
      existingStudent.guardians.find(
        (guardian) => guardian.id === guardianId,
      ) ?? existingPrimaryGuardian;

    const guardianAddress = cleanOptionalText(
      body.guardianAddress,
    );

    const student = await prisma.$transaction(
      async (transaction) => {
        const updatedStudent =
          await transaction.student.update({
            where: {
              id,
            },

            data: {
              firstName,

              middleName: cleanOptionalText(
                body.middleName,
              ),

              lastName: cleanOptionalText(
                body.lastName,
              ),

              preferredName: cleanOptionalText(
                body.preferredName,
              ),

              dateOfBirth,

              gender: cleanOptionalText(
                body.gender,
              ),

              programme:
                programmeValue as $Enums.Programme,

              programmeDefinitionId: programmeDefinition?.id ?? null,

              status:
                statusValue as $Enums.StudentStatus,

              joiningDate,
              leavingDate,

              bloodGroup: cleanOptionalText(
                body.bloodGroup,
              ),

              medicalNotes: cleanOptionalText(
                body.medicalNotes,
              ),

              allergies: cleanOptionalText(
                body.allergies,
              ),

              addressLine1: cleanOptionalText(
                body.addressLine1,
              ),

              addressLine2: cleanOptionalText(
                body.addressLine2,
              ),

              locality: cleanOptionalText(
                body.locality,
              ),

              city: cleanOptionalText(body.city),

              state: cleanOptionalText(
                body.state,
              ),

              postalCode: cleanOptionalText(
                body.postalCode,
              ),

              notes: cleanOptionalText(
                body.notes,
              ),
            },
          });

        if (guardianToUpdate) {
          await transaction.guardian.update({
            where: {
              id: guardianToUpdate.id,
            },

            data: {
              name: guardianName,

              relationship:
                guardianRelationshipValue as $Enums.GuardianRelationship,

              phone: guardianPhone,

              alternatePhone:
                guardianAlternatePhone,

              email: guardianEmail,

              occupation: cleanOptionalText(
                body.guardianOccupation,
              ),

              addressSameAsStudent:
                guardianAddress === null,

              address: guardianAddress,

              isPrimary: true,

              authorisedPickup:
                typeof body.authorisedPickup ===
                "boolean"
                  ? body.authorisedPickup
                  : true,
            },
          });
        } else {
          await transaction.guardian.create({
            data: {
              studentId: id,

              name: guardianName,

              relationship:
                guardianRelationshipValue as $Enums.GuardianRelationship,

              phone: guardianPhone,

              alternatePhone:
                guardianAlternatePhone,

              email: guardianEmail,

              occupation: cleanOptionalText(
                body.guardianOccupation,
              ),

              addressSameAsStudent:
                guardianAddress === null,

              address: guardianAddress,

              isPrimary: true,

              authorisedPickup:
                typeof body.authorisedPickup ===
                "boolean"
                  ? body.authorisedPickup
                  : true,
            },
          });
        }

        if (statusValue !== "ACTIVE") {
          await transaction.studentFeeAccount.updateMany({
            where: {
              studentId: id,
              active: true,
            },
            data: {
              active: false,
              endDate: leavingDate ?? new Date(),
            },
          });
        }

        await transaction.activityLog.create({
          data: {
            adminUserId: session.userId,
            action: "UPDATED",
            entityType: "Student",
            entityId: id,
            description: `Student ${existingStudent.studentNumber} profile updated.`,
            previousData: {
              programme: existingStudent.programme,
              status: existingStudent.status,
              joiningDate: existingStudent.joiningDate.toISOString(),
              leavingDate:
                existingStudent.leavingDate?.toISOString() ?? null,
            },
            newData: {
              programme: programmeValue,
              status: statusValue,
              joiningDate: joiningDate.toISOString(),
              leavingDate: leavingDate?.toISOString() ?? null,
            },
          },
        });

        return transaction.student.findUnique({
          where: {
            id: updatedStudent.id,
          },

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
        });
      },
    );

    return NextResponse.json({
      success: true,
      message:
        "Student record updated successfully.",
      student,
    });
  } catch (error) {
    console.error(
      "Unable to update student:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The student record could not be updated.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await context.params;

    const student = await prisma.student.findUnique({
      where: {
        id,
      },

      include: {
        admission: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            feeAccounts: true,
            feeInvoices: true,
            payments: true,
            receipts: true,
            attendanceRecords: true,
            documents: true,
            daycarePlans: true,
            daycareSessions: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student record not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      student.admission !== null ||
      student._count.feeAccounts > 0 ||
      student._count.feeInvoices > 0 ||
      student._count.payments > 0 ||
      student._count.receipts > 0 ||
      student._count.attendanceRecords > 0 ||
      student._count.documents > 0 ||
      student._count.daycarePlans > 0 ||
      student._count.daycareSessions > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This student has linked admission or operational history and cannot be deleted here. Use Withdraw Student for a genuine record, or the owner-only Data & History cleanup tool for test data.",
        },
        {
          status: 409,
        },
      );
    }

    await prisma.student.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Student record deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Unable to delete student:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The student record could not be deleted.",
      },
      {
        status: 500,
      },
    );
  }
}

function legacyProgrammeForCode(code: string): $Enums.Programme {
  return isProgramme(code)
    ? code
    : code.includes("DAYCARE")
      ? "DAYCARE"
      : "NURSERY";
}
