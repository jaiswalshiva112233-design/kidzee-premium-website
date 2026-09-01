import type { $Enums } from "@/generated/prisma/client";
import { after, NextResponse } from "next/server";

import { getCurrentAdminUser, isAdminAuthenticated } from "@/lib/admin/auth";
import {
  createEnrollmentContractAndDraftInvoice,
  findPossibleDuplicateStudent,
  type EnrollmentContractSelection,
} from "@/lib/admin/enrollment-contract";
import { deliverAdmissionConversions } from "@/lib/marketing/admissionConversions";
import { logServerError } from "@/lib/server/safeLogging";
import { prisma } from "@/lib/prisma";

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

type CreateStudentBody = {
  enquiryId?: unknown;
  documentsComplete?: unknown;

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

  guardianName?: unknown;
  guardianRelationship?: unknown;
  guardianPhone?: unknown;
  guardianAlternatePhone?: unknown;
  guardianEmail?: unknown;
  guardianOccupation?: unknown;
  guardianAddress?: unknown;
  authorisedPickup?: unknown;
  contract?: unknown;
  duplicateOverrideStudentId?: unknown;
  duplicateOverrideReason?: unknown;
};

type RawContractSelection = {
  academicSession?: unknown;
  preschoolEnabled?: unknown;
  preschoolProgrammeId?: unknown;
  daycareSelections?: unknown;
  mealCombinationId?: unknown;
  includeAdmissionFee?: unknown;
  includeAnnualFee?: unknown;
  includeKitFee?: unknown;
  annualKitSkipReason?: unknown;
  otherChargeIds?: unknown;
  approvedDiscount?: unknown;
  billingDay?: unknown;
  dueDay?: unknown;
};

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

function parseRequiredDate(value: unknown) {
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

function createStudentNumber() {
  const year = new Date().getFullYear();

  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `KZ-${year}-${timestamp}-${randomPart}`;
}

function createAdmissionNumber() {
  const year = new Date().getFullYear();

  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `ADM-${year}-${timestamp}-${randomPart}`;
}

export async function GET(request: Request) {
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

    const url = new URL(request.url);

    const search = cleanText(
      url.searchParams.get("search"),
    );

    const requestedProgramme = cleanText(
      url.searchParams.get("programme"),
    );

    const requestedStatus = cleanText(
      url.searchParams.get("status"),
    );

    const programme = isProgramme(
      requestedProgramme,
    )
      ? (requestedProgramme as $Enums.Programme)
      : undefined;

    const status = isStudentStatus(
      requestedStatus,
    )
      ? (requestedStatus as $Enums.StudentStatus)
      : undefined;

    const students = await prisma.student.findMany({
      where: {
        ...(programme
          ? {
              programme,
            }
          : {}),

        ...(status
          ? {
              status,
            }
          : {}),

        ...(search
          ? {
              OR: [
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
                  studentNumber: {
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
            }
          : {}),
      },

      include: {
        programmeDefinition: true,
        guardians: {
          orderBy: {
            isPrimary: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 250,
    });

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error(
      "Unable to load students:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load students. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminUser =
      await getCurrentAdminUser();

    if (!adminUser) {
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

    let body: CreateStudentBody;

    try {
      body =
        (await request.json()) as CreateStudentBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid student request.",
        },
        {
          status: 400,
        },
      );
    }

    const firstName = cleanText(body.firstName);

    const middleName = cleanOptionalText(
      body.middleName,
    );

    const lastName = cleanOptionalText(
      body.lastName,
    );

    const preferredName = cleanOptionalText(
      body.preferredName,
    );

    const dateOfBirth = parseRequiredDate(
      body.dateOfBirth,
    );

    const joiningDate = parseRequiredDate(
      body.joiningDate,
    );

    let programmeValue = cleanText(
      body.programme,
    );

    const programmeDefinitionId = cleanOptionalText(
      body.programmeDefinitionId,
    );

    const statusValue = cleanText(
      body.status,
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
      if (
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

    if (
      statusValue &&
      !isStudentStatus(statusValue)
    ) {
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

        const guardianAddress = cleanOptionalText(
      body.guardianAddress,
    );

    const enquiryId = cleanOptionalText(
      body.enquiryId,
    );

    const documentsComplete =
      body.documentsComplete === true;

    const contractSelection = parseContractSelection(
      body.contract,
      joiningDate,
      programmeDefinition?.id ?? null,
    );
    if (!contractSelection) {
      return NextResponse.json(
        {
          success: false,
          message: "Complete the preschool/daycare contract, academic session and billing dates before saving.",
        },
        { status: 400 },
      );
    }
    if (contractSelection.preschoolEnabled && !contractSelection.preschoolProgrammeId) {
      return NextResponse.json(
        { success: false, message: "Select the preschool programme for this contract." },
        { status: 400 },
      );
    }
    if (contractSelection.approvedDiscount > 0 && adminUser.role !== "OWNER") {
      return NextResponse.json(
        { success: false, message: "Only the Owner can approve a contract-level discount." },
        { status: 403 },
      );
    }

    const duplicateOverrideStudentId = cleanOptionalText(body.duplicateOverrideStudentId);
    const duplicateOverrideReason = cleanOptionalText(body.duplicateOverrideReason);
    const duplicateCheck = await findPossibleDuplicateStudent({
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      guardianPhone,
      guardianEmail,
    });
    if (duplicateCheck.possible && duplicateCheck.possible.id !== duplicateOverrideStudentId) {
      return NextResponse.json(
        {
          success: false,
          code: "POSSIBLE_DUPLICATE_STUDENT",
          message: "Possible existing student found. Open the existing profile, or continue with a sibling/twin reason.",
          possibleDuplicate: {
            id: duplicateCheck.possible.id,
            studentNumber: duplicateCheck.possible.studentNumber,
            name: [duplicateCheck.possible.firstName, duplicateCheck.possible.middleName, duplicateCheck.possible.lastName].filter(Boolean).join(" "),
            guardian: duplicateCheck.possible.guardians[0]?.name ?? null,
            phone: duplicateCheck.possible.guardians[0]?.phone ?? null,
            programme: duplicateCheck.possible.programmeDefinition?.name ?? null,
            status: duplicateCheck.possible.status,
            createdAt: duplicateCheck.possible.createdAt,
          },
        },
        { status: 409 },
      );
    }
    if (duplicateOverrideStudentId && (!duplicateCheck.possible || duplicateCheck.possible.id !== duplicateOverrideStudentId || !duplicateOverrideReason || duplicateOverrideReason.length < 5)) {
      return NextResponse.json(
        { success: false, message: "Continuing as a sibling/twin requires the matching student and a clear reason." },
        { status: 400 },
      );
    }

    const sourceEnquiry = enquiryId
      ? await prisma.enquiry.findUnique({
          where: {
            id: enquiryId,
          },

          select: {
            id: true,
            parentName: true,
            programme: true,
            status: true,
            admittedAt: true,

            admission: {
              select: {
                id: true,
                studentId: true,
                status: true,
                admissionDate: true,
              },
            },
          },
        })
      : null;

    if (enquiryId && !sourceEnquiry) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The original enquiry could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      sourceEnquiry?.admission?.studentId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A student profile has already been created from this enquiry.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      sourceEnquiry &&
      (sourceEnquiry.status === "CLOSED" ||
        sourceEnquiry.status === "NOT_INTERESTED" ||
        sourceEnquiry.admission?.status === "CANCELLED")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Reopen the enquiry or admission before creating a student profile.",
        },
        { status: 409 },
      );
    }

    const admissionStatus:
      $Enums.AdmissionStatus =
      documentsComplete
        ? "CONFIRMED"
        : "DOCUMENTS_PENDING";

    const admissionChangedAt = new Date();

    const student =
      await prisma.$transaction(
        async (transaction) => {
          const createdStudent =
            await transaction.student.create({
              data: {
                studentNumber:
                  createStudentNumber(),

                firstName,
                middleName,
                lastName,
                preferredName,
                dateOfBirth,

                gender: cleanOptionalText(
                  body.gender,
                ),

                programme:
                  programmeValue as $Enums.Programme,

                programmeDefinitionId:
                  programmeDefinition?.id ?? null,

                status: statusValue
                  ? (statusValue as $Enums.StudentStatus)
                  : ("ACTIVE" as $Enums.StudentStatus),

                joiningDate,

                identityFingerprint:
                  duplicateCheck.fingerprint,

                duplicateOfStudentId:
                  duplicateOverrideStudentId,

                duplicateOverrideReason,

                bloodGroup: cleanOptionalText(
                  body.bloodGroup,
                ),

                medicalNotes:
                  cleanOptionalText(
                    body.medicalNotes,
                  ),

                allergies: cleanOptionalText(
                  body.allergies,
                ),

                addressLine1:
                  cleanOptionalText(
                    body.addressLine1,
                  ),

                addressLine2:
                  cleanOptionalText(
                    body.addressLine2,
                  ),

                locality: cleanOptionalText(
                  body.locality,
                ),

                city: cleanOptionalText(
                  body.city,
                ),

                state: cleanOptionalText(
                  body.state,
                ),

                postalCode:
                  cleanOptionalText(
                    body.postalCode,
                  ),

                notes: cleanOptionalText(
                  body.notes,
                ),

                guardians: {
                  create: {
                    name: guardianName,

                    relationship:
                      guardianRelationshipValue as $Enums.GuardianRelationship,

                    phone: guardianPhone,

                    alternatePhone:
                      guardianAlternatePhone,

                    email: guardianEmail,

                    occupation:
                      cleanOptionalText(
                        body.guardianOccupation,
                      ),

                    addressSameAsStudent:
                      guardianAddress === null,

                    address:
                      guardianAddress,

                    isPrimary: true,

                    authorisedPickup:
                      typeof body.authorisedPickup ===
                      "boolean"
                        ? body.authorisedPickup
                        : true,
                  },
                },
              },

              include: {
                guardians: true,
              },
            });

          let savedAdmission;

          if (enquiryId) {
            await transaction.followUp.updateMany({
              where: {
                enquiryId,
                status: "PENDING",
              },

              data: {
                status: "CANCELLED",
              },
            });

            savedAdmission = await transaction.admission.upsert({
              where: {
                enquiryId,
              },

              create: {
                admissionNumber:
                  createAdmissionNumber(),
                enquiryId,
                studentId: createdStudent.id,
                status: admissionStatus,
                programme:
                  programmeValue as $Enums.Programme,
                admissionDate:
                  admissionChangedAt,
                joiningDate,
                documentsComplete,
                notes:
                  "Student profile created from the parent enquiry.",
              },

              update: {
                studentId: createdStudent.id,
                status: admissionStatus,
                programme:
                  programmeValue as $Enums.Programme,
                admissionDate:
                  sourceEnquiry?.admission
                    ?.admissionDate ??
                  admissionChangedAt,
                joiningDate,
                documentsComplete,
              },
            });

            await transaction.enquiry.update({
              where: {
                id: enquiryId,
              },

              data: {
                status: documentsComplete
                  ? "ADMITTED"
                  : sourceEnquiry?.status === "NEW"
                    ? "QUALIFIED"
                    : sourceEnquiry?.status,
                programme:
                  programmeValue as $Enums.Programme,
                admittedAt: documentsComplete
                  ? sourceEnquiry?.admittedAt ?? admissionChangedAt
                  : null,
                nextFollowUpAt: documentsComplete ? null : undefined,
              },
            });

            await transaction.followUp.create({
              data: {
                enquiryId,
                title:
                  "Student profile created",
                notes: `Student profile created for ${firstName} from ${sourceEnquiry?.parentName ?? "the parent"}'s enquiry.`,
                dueAt: admissionChangedAt,
                completedAt:
                  admissionChangedAt,
                status: "COMPLETED",
              },
            });
          } else {
            savedAdmission = await transaction.admission.create({
              data: {
                admissionNumber:
                  createAdmissionNumber(),
                studentId: createdStudent.id,
                status: admissionStatus,
                programme:
                  programmeValue as $Enums.Programme,
                admissionDate:
                  admissionChangedAt,
                joiningDate,
                documentsComplete,
                notes:
                  "Direct student admission created from CentreOS.",
              },
            });
          }

          const contractResult =
            await createEnrollmentContractAndDraftInvoice(
              transaction,
              {
                studentId: createdStudent.id,
                studentNumber: createdStudent.studentNumber,
                admissionId: savedAdmission.id,
                enquiryId,
                programmeClass:
                  programmeDefinition?.name ??
                  programmeValue.replaceAll("_", " "),
                joiningDate,
                documentsComplete,
                createdById: adminUser.userId,
                selection: contractSelection,
              },
            );

          return {
            ...createdStudent,
            enrollmentContractId:
              contractResult.contract.id,
            draftInvoiceId:
              contractResult.invoice.id,
          };
        },
        { isolationLevel: "Serializable" },
      );

    if (enquiryId && documentsComplete) {
      after(async () => {
        try {
          await deliverAdmissionConversions(enquiryId);
        } catch (error) {
          logServerError("Admission conversion delivery failed.", error);
        }
      });
    }

    return NextResponse.json(
      {
        success: true,

        message: enquiryId
          ? "Student, enrollment contract and combined draft bill created and linked to the enquiry."
          : "Student, enrollment contract and combined draft bill created successfully.",

        student,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Unable to create student:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The student could not be saved. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}

function parseOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseContractSelection(
  value: unknown,
  joiningDate: Date,
  programmeDefinitionId: string | null,
): EnrollmentContractSelection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as RawContractSelection;
  const academicSession = cleanText(raw.academicSession);
  const preschoolEnabled = raw.preschoolEnabled === true;
  const daycareSelections = Array.isArray(raw.daycareSelections)
    ? raw.daycareSelections.flatMap((candidate) => {
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return [];
        const record = candidate as Record<string, unknown>;
        const planDefinitionId = cleanText(record.planDefinitionId);
        const start = parseRequiredDate(record.effectiveFrom) ?? joiningDate;
        const end = cleanText(record.effectiveTo) ? parseRequiredDate(record.effectiveTo) : null;
        const weekdays = Array.isArray(record.scheduledWeekdays)
          ? [...new Set(record.scheduledWeekdays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
          : [];
        return planDefinitionId && (!end || end >= start)
          ? [{ planDefinitionId, effectiveFrom: start, effectiveTo: end, scheduledWeekdays: weekdays }]
          : [];
      })
    : [];
  const otherChargeIds = Array.isArray(raw.otherChargeIds)
    ? [...new Set(raw.otherChargeIds.map(cleanText).filter(Boolean))]
    : [];
  const billingDay = Math.trunc(parseOptionalNumber(raw.billingDay) ?? 1);
  const dueDay = Math.trunc(parseOptionalNumber(raw.dueDay) ?? 5);
  const approvedDiscount = Math.max(0, parseOptionalNumber(raw.approvedDiscount) ?? 0);
  if (!/^\d{4}-\d{2}$/.test(academicSession) || billingDay < 1 || billingDay > 28 || dueDay < 1 || dueDay > 31) {
    return null;
  }
  if (!preschoolEnabled && daycareSelections.length === 0) return null;
  return {
    academicSession,
    preschoolEnabled,
    preschoolProgrammeId: preschoolEnabled
      ? cleanOptionalText(raw.preschoolProgrammeId) ?? programmeDefinitionId
      : null,
    daycareSelections,
    mealCombinationId: cleanOptionalText(raw.mealCombinationId),
    includeAdmissionFee: raw.includeAdmissionFee === true,
    includeAnnualFee: raw.includeAnnualFee === true,
    includeKitFee: raw.includeKitFee === true,
    annualKitSkipReason: cleanOptionalText(raw.annualKitSkipReason),
    otherCharges: otherChargeIds.map((definitionId) => ({ definitionId })),
    approvedDiscount,
    billingDay,
    dueDay,
  };
}

function legacyProgrammeForCode(code: string): $Enums.Programme {
  return isProgramme(code)
    ? code
    : code.includes("DAYCARE")
      ? "DAYCARE"
      : "NURSERY";
}
