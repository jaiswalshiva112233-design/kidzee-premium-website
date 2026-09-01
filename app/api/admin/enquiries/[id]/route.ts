import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import {
  canTransitionEnquiry,
  leadActivityTypeForStatus,
} from "@/lib/admin/enquiryWorkflow";
import { prisma } from "@/lib/prisma";
import {
  enqueueQualifiedLeadConversions,
  processAdmissionConversionQueue,
} from "@/lib/marketing/admissionConversions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateEnquiryBody = {
  action?: unknown;
  status?: unknown;
  nextFollowUpAt?: unknown;
  followUpNote?: unknown;
  reason?: unknown;
};

const ENQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "NO_ANSWER",
  "VISIT_SCHEDULED",
  "VISIT_BOOKED",
  "VISIT_COMPLETED",
  "TRIAL_SCHEDULED",
  "TRIAL_COMPLETED",
  "INTERESTED",
  "FOLLOW_UP",
  "QUALIFIED",
  "ADMITTED",
  "NOT_INTERESTED",
  "CLOSED",
] as const;

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanOptionalText(value: unknown) {
  const text = cleanText(value);

  return text || null;
}

function parseDate(value: unknown) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isEnquiryStatus(
  value: string,
): value is $Enums.EnquiryStatus {
  return ENQUIRY_STATUSES.includes(
    value as $Enums.EnquiryStatus,
  );
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
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

async function getEnquiry(id: string) {
  return prisma.enquiry.findUnique({
    where: {
      id,
    },

    include: {
      followUps: {
        orderBy: [
          {
            dueAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
      websiteSubmissions: {
        orderBy: {
          receivedAt: "desc",
        },
        take: 20,
      },
    },
  });
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const enquiry = await getEnquiry(id);

    if (!enquiry) {
      return NextResponse.json(
        {
          success: false,
          message: "Enquiry not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      enquiry,
    });
  } catch (error) {
    console.error(
      "Unable to load enquiry:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load this enquiry.",
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
    const session = await requireAdmin();
    const userId = session.userId || null;

    const { id } = await context.params;

    let body: UpdateEnquiryBody;

    try {
      body =
        (await request.json()) as UpdateEnquiryBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry update request.",
        },
        {
          status: 400,
        },
      );
    }

    const existingEnquiry =
      await prisma.enquiry.findUnique({
        where: {
          id,
        },

               select: {
          id: true,
          parentName: true,
          childName: true,
          programme: true,
          status: true,

          admission: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

    if (!existingEnquiry) {
      return NextResponse.json(
        {
          success: false,
          message: "Enquiry not found.",
        },
        {
          status: 404,
        },
      );
    }

    const action = cleanText(body.action);

    if (action === "SCHEDULE_FOLLOW_UP") {
      const nextFollowUpAt = parseDate(
        body.nextFollowUpAt,
      );

      if (!nextFollowUpAt) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select a valid follow-up date and time.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        nextFollowUpAt.getTime() <
        Date.now() - 60_000
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The next follow-up cannot be scheduled in the past.",
          },
          {
            status: 400,
          },
        );
      }

      const followUpNote =
        cleanOptionalText(body.followUpNote);

      await prisma.$transaction(
        async (transaction) => {
          await transaction.followUp.updateMany({
            where: {
              enquiryId: id,
              status: "PENDING",
            },

            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              completedById: userId,
            },
          });

          await transaction.followUp.create({
            data: {
              enquiryId: id,
              title: `Follow up with ${existingEnquiry.parentName}`,
              notes:
                followUpNote ??
                "Parent requested another follow-up.",
              dueAt: nextFollowUpAt,
              status: "PENDING",
              createdById: userId,
            },
          });

          await transaction.enquiry.update({
            where: {
              id,
            },

            data: {
              status: "FOLLOW_UP",
              stageChangedAt: new Date(),
              nextFollowUpAt,
            },
          });
          await transaction.leadActivity.create({
            data: {
              enquiryId: id,
              type: "FOLLOW_UP_SCHEDULED",
              fromStatus: existingEnquiry.status,
              toStatus: "FOLLOW_UP",
              title: "Follow-up scheduled",
              notes: followUpNote,
              recordedById: userId,
              metadata: { dueAt: nextFollowUpAt.toISOString() },
            },
          });
        },
      );

      const enquiry = await getEnquiry(id);

      return NextResponse.json({
        success: true,
        message: "Next follow-up scheduled.",
        enquiry,
      });
    }

    if (action === "CLOSE") {
      const reason =
        cleanOptionalText(body.reason);

      await prisma.$transaction(
        async (transaction) => {
          await transaction.followUp.updateMany({
            where: {
              enquiryId: id,
              status: "PENDING",
            },

            data: {
              status: "CANCELLED",
              completedAt: new Date(),
              completedById: userId,
            },
          });

          await transaction.followUp.create({
            data: {
              enquiryId: id,
              title: "Enquiry closed",
              notes:
                reason ??
                "Enquiry closed by the centre.",
              dueAt: new Date(),
              completedAt: new Date(),
              status: "COMPLETED",
              createdById: userId,
              completedById: userId,
            },
          });

          await transaction.enquiry.update({
            where: {
              id,
            },

            data: {
              status: "CLOSED",
              stageChangedAt: new Date(),
              closedAt: new Date(),
              lostReason: reason,
              nextFollowUpAt: null,
            },
          });
          await transaction.leadActivity.create({
            data: {
              enquiryId: id,
              type: "CLOSED",
              fromStatus: existingEnquiry.status,
              toStatus: "CLOSED",
              title: "Enquiry closed",
              notes: reason,
              recordedById: userId,
            },
          });
        },
      );

      const enquiry = await getEnquiry(id);

      return NextResponse.json({
        success: true,
        message: "Enquiry closed successfully.",
        enquiry,
      });
    }

    if (action === "REOPEN") {
      await prisma.$transaction(
        async (transaction) => {
          await transaction.enquiry.update({
            where: {
              id,
            },

            data: {
              status: "NEW",
              stageChangedAt: new Date(),
              closedAt: null,
              lostReason: null,
              nextFollowUpAt: null,
            },
          });

          await transaction.followUp.create({
            data: {
              enquiryId: id,
              title: "Enquiry reopened",
              notes:
                cleanOptionalText(body.reason) ??
                "Enquiry returned to the active list.",
              dueAt: new Date(),
              completedAt: new Date(),
              status: "COMPLETED",
              createdById: userId,
              completedById: userId,
            },
          });
          await transaction.leadActivity.create({
            data: {
              enquiryId: id,
              type: "REOPENED",
              fromStatus: existingEnquiry.status,
              toStatus: "NEW",
              title: "Enquiry reopened",
              notes: cleanOptionalText(body.reason),
              recordedById: userId,
            },
          });
        },
      );

      const enquiry = await getEnquiry(id);

      return NextResponse.json({
        success: true,
        message: "Enquiry reopened successfully.",
        enquiry,
      });
    }

    if (action === "UPDATE_STATUS") {
      const status = cleanText(body.status);

      if (!isEnquiryStatus(status)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select a valid enquiry status.",
          },
          {
            status: 400,
          },
        );
      }

      if (status === "CLOSED") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Use the Close Enquiry action when closing an enquiry.",
          },
          {
            status: 400,
          },
        );
      }

      if (!canTransitionEnquiry(existingEnquiry.status, status)) {
        return NextResponse.json(
          {
            success: false,
            message: `This enquiry cannot move directly from ${formatStatus(existingEnquiry.status)} to ${formatStatus(status)}.`,
          },
          { status: 409 },
        );
      }

            const note =
        cleanOptionalText(body.followUpNote);

      const admissionProgramme =
        existingEnquiry.programme;

      if (
        status === "ADMITTED" &&
        !admissionProgramme
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select a programme before starting admission.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        status !== "ADMITTED" &&
        existingEnquiry.admission?.status ===
          "CONFIRMED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A confirmed admission cannot be moved back to an enquiry status.",
          },
          {
            status: 400,
          },
        );
      }

      const statusChangedAt = new Date();

      await prisma.$transaction(
        async (transaction) => {
          if (
            status === "ADMITTED" ||
            status === "NOT_INTERESTED"
          ) {
            await transaction.followUp.updateMany({
              where: {
                enquiryId: id,
                status: "PENDING",
              },

              data: {
                status: "CANCELLED",
                completedAt: statusChangedAt,
                completedById: userId,
              },
            });
          }

          if (
            status === "ADMITTED" &&
            admissionProgramme
          ) {
            await transaction.admission.upsert({
              where: {
                enquiryId: id,
              },

              create: {
                admissionNumber:
                  createAdmissionNumber(),
                enquiryId: id,
                status: "DOCUMENTS_PENDING",
                programme: admissionProgramme,
                admissionDate: statusChangedAt,
                documentsComplete: false,
                notes:
                  note ??
                  `Admission started for ${
                    existingEnquiry.childName ??
                    existingEnquiry.parentName
                  }.`,
              },

              update: {
                programme: admissionProgramme,
                status:
                  existingEnquiry.admission
                    ?.status === "CONFIRMED"
                    ? "CONFIRMED"
                    : "DOCUMENTS_PENDING",
                admissionDate: statusChangedAt,
                ...(note
                  ? {
                      notes: note,
                    }
                  : {}),
              },
            });
          }

          if (
            status !== "ADMITTED" &&
            existingEnquiry.status ===
              "ADMITTED" &&
            existingEnquiry.admission &&
            existingEnquiry.admission.status !==
              "CONFIRMED"
          ) {
            await transaction.admission.update({
              where: {
                id: existingEnquiry.admission.id,
              },

              data: {
                status: "CANCELLED",
              },
            });
          }

          await transaction.enquiry.update({
            where: {
              id,
            },

            data: {
              status,
              stageChangedAt: statusChangedAt,
              qualifiedAt:
                status === "QUALIFIED" ? statusChangedAt : undefined,
              closedAt: status === "NOT_INTERESTED" ? statusChangedAt : null,
              lostReason: status === "NOT_INTERESTED" ? note : null,

              admittedAt:
                status === "ADMITTED"
                  ? statusChangedAt
                  : existingEnquiry.status ===
                      "ADMITTED"
                    ? null
                    : undefined,

              nextFollowUpAt:
                status === "ADMITTED" ||
                status === "NOT_INTERESTED"
                  ? null
                  : undefined,
            },
          });

          await transaction.followUp.create({
            data: {
              enquiryId: id,
              title: `Status changed to ${formatStatus(
                status,
              )}`,
              notes:
                note ??
                `Enquiry status changed from ${formatStatus(
                  existingEnquiry.status,
                )} to ${formatStatus(status)}.`,
              dueAt: statusChangedAt,
              completedAt: statusChangedAt,
              status: "COMPLETED",
              createdById: userId,
              completedById: userId,
            },
          });
          await transaction.leadActivity.create({
            data: {
              enquiryId: id,
              type: leadActivityTypeForStatus(status),
              fromStatus: existingEnquiry.status,
              toStatus: status,
              title: `Status changed to ${formatStatus(status)}`,
              notes: note,
              recordedById: userId,
            },
          });
        },
      );

      if (status === "QUALIFIED") {
        await enqueueQualifiedLeadConversions(id);
        await processAdmissionConversionQueue({ enquiryId: id, limit: 4 });
      }

      const enquiry = await getEnquiry(id);

      return NextResponse.json({
        success: true,
        message: `Enquiry marked as ${formatStatus(
          status,
        )}.`,
        enquiry,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Please select a valid enquiry action.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "Unable to update enquiry:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The enquiry could not be updated. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}
