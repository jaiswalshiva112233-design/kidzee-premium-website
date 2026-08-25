import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import {
  allowedEnquiryTransitions,
  canTransitionEnquiry,
  formatEnquiryStatus,
  isClosedEnquiryStatus,
  leadActivityTypeForStatus,
} from "@/lib/admin/enquiryWorkflow";
import {
  enqueueQualifiedLeadConversions,
  processAdmissionConversionQueue,
  retryMarketingConversion,
} from "@/lib/marketing/admissionConversions";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";

type RouteContext = { params: Promise<{ id: string }> };

type WorkflowBody = {
  action?: unknown;
  status?: unknown;
  notes?: unknown;
  dueAt?: unknown;
  kind?: unknown;
  appointmentId?: unknown;
  scheduledAt?: unknown;
  outcome?: unknown;
  parentFeedback?: unknown;
  followUpId?: unknown;
  siblingEnquiryId?: unknown;
  familyName?: unknown;
  jobId?: unknown;
};

const STATUSES: readonly $Enums.EnquiryStatus[] = [
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
];

function text(value: unknown, maximum = 2_000) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function date(value: unknown) {
  const parsed = new Date(text(value, 100));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isStatus(value: string): value is $Enums.EnquiryStatus {
  return STATUSES.includes(value as $Enums.EnquiryStatus);
}

function actorId(session: Awaited<ReturnType<typeof requireAdmin>>) {
  return session.userId || null;
}

async function journey(id: string) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: {
      activities: {
        include: {
          recordedBy: { select: { name: true, role: true } },
        },
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        take: 100,
      },
      appointments: {
        include: {
          recordedBy: { select: { name: true, role: true } },
        },
        orderBy: { scheduledAt: "desc" },
      },
      followUps: {
        include: {
          createdBy: { select: { name: true } },
          completedBy: { select: { name: true } },
        },
        orderBy: [{ dueAt: "desc" }, { createdAt: "desc" }],
      },
      marketingJobs: {
        orderBy: [{ eventType: "asc" }, { provider: "asc" }],
      },
      family: {
        include: {
          enquiries: {
            select: {
              id: true,
              enquiryNumber: true,
              parentName: true,
              childName: true,
              status: true,
            },
          },
        },
      },
      admission: {
        select: { id: true, admissionNumber: true, status: true, studentId: true },
      },
    },
  });

  if (!enquiry) return null;
  const conversionHistory = enquiry.marketingJobs.length
    ? await prisma.activityLog.findMany({
        where: {
          entityType: "MARKETING_CONVERSION_JOB",
          entityId: { in: enquiry.marketingJobs.map((job) => job.id) },
        },
        select: {
          id: true,
          entityId: true,
          description: true,
          newData: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return { ...enquiry, conversionHistory };
}

function responseJourney(enquiry: NonNullable<Awaited<ReturnType<typeof journey>>>) {
  return {
    ...enquiry,
    allowedTransitions: allowedEnquiryTransitions(enquiry.status),
    overdueFollowUps: enquiry.followUps.filter(
      (followUp) => followUp.status === "PENDING" && followUp.dueAt < new Date(),
    ).length,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const enquiry = await journey(id);
    if (!enquiry) {
      return NextResponse.json({ success: false, message: "Enquiry not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, enquiry: responseJourney(enquiry) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: "You are not authorised." }, { status: 401 });
    }
    logServerError("Unable to load the enquiry journey.", error);
    return NextResponse.json({ success: false, message: "Unable to load the enquiry journey." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as WorkflowBody;
    const action = text(body.action, 50).toUpperCase();
    const notes = text(body.notes) || null;
    const existing = await prisma.enquiry.findUnique({
      where: { id },
      include: { admission: { select: { id: true, status: true } } },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Enquiry not found." }, { status: 404 });
    }
    const userId = actorId(session);
    const now = new Date();

    if (action === "TRANSITION") {
      const status = text(body.status, 50);
      if (!isStatus(status)) {
        return NextResponse.json({ success: false, message: "Select a valid funnel stage." }, { status: 400 });
      }
      if (status === "ADMITTED") {
        return NextResponse.json(
          { success: false, message: "Confirm admission from Admissions after the student profile and documents are ready." },
          { status: 409 },
        );
      }
      if (!canTransitionEnquiry(existing.status, status)) {
        return NextResponse.json(
          { success: false, message: `${formatEnquiryStatus(existing.status)} cannot move directly to ${formatEnquiryStatus(status)}.` },
          { status: 409 },
        );
      }
      await prisma.$transaction(async (transaction) => {
        if (isClosedEnquiryStatus(status)) {
          await transaction.followUp.updateMany({
            where: { enquiryId: id, status: "PENDING" },
            data: { status: "CANCELLED", completedAt: now, completedById: userId },
          });
        }
        await transaction.enquiry.update({
          where: { id },
          data: {
            status,
            stageChangedAt: now,
            qualifiedAt: status === "QUALIFIED" ? now : existing.qualifiedAt,
            closedAt: isClosedEnquiryStatus(status) ? now : null,
            lostReason: isClosedEnquiryStatus(status) ? notes : null,
            nextFollowUpAt: isClosedEnquiryStatus(status) ? null : undefined,
          },
        });
        await transaction.leadActivity.create({
          data: {
            enquiryId: id,
            type: leadActivityTypeForStatus(status),
            fromStatus: existing.status,
            toStatus: status,
            title: `Moved to ${formatEnquiryStatus(status)}`,
            notes,
            recordedById: userId,
          },
        });
        await transaction.activityLog.create({
          data: {
            adminUserId: userId,
            action: "UPDATED",
            entityType: "ENQUIRY",
            entityId: id,
            description: `Enquiry moved from ${existing.status} to ${status}.`,
            previousData: { status: existing.status },
            newData: { status, notes },
          },
        });
      });
      if (status === "QUALIFIED") {
        await enqueueQualifiedLeadConversions(id);
        await processAdmissionConversionQueue({ enquiryId: id, limit: 4 });
      }
    } else if (action === "ADD_NOTE") {
      if (!notes) {
        return NextResponse.json({ success: false, message: "Enter a note." }, { status: 400 });
      }
      await prisma.leadActivity.create({
        data: { enquiryId: id, type: "NOTE_ADDED", title: "CRM note", notes, recordedById: userId },
      });
    } else if (action === "SCHEDULE_FOLLOW_UP") {
      const dueAt = date(body.dueAt);
      if (!dueAt || dueAt <= now) {
        return NextResponse.json({ success: false, message: "Choose a future follow-up time." }, { status: 400 });
      }
      if (!canTransitionEnquiry(existing.status, "FOLLOW_UP")) {
        return NextResponse.json(
          { success: false, message: "Reopen this lead before scheduling another follow-up." },
          { status: 409 },
        );
      }
      await prisma.$transaction(async (transaction) => {
        await transaction.followUp.create({
          data: {
            enquiryId: id,
            title: `Follow up with ${existing.parentName}`,
            notes,
            dueAt,
            createdById: userId,
          },
        });
        await transaction.enquiry.update({
          where: { id },
          data: { nextFollowUpAt: dueAt, status: "FOLLOW_UP", stageChangedAt: now },
        });
        await transaction.leadActivity.create({
          data: {
            enquiryId: id,
            type: "FOLLOW_UP_SCHEDULED",
            fromStatus: existing.status,
            toStatus: "FOLLOW_UP",
            title: "Follow-up scheduled",
            notes,
            recordedById: userId,
            occurredAt: now,
            metadata: { dueAt: dueAt.toISOString() },
          },
        });
      });
    } else if (action === "COMPLETE_FOLLOW_UP") {
      const followUpId = text(body.followUpId, 100);
      const followUp = await prisma.followUp.findFirst({ where: { id: followUpId, enquiryId: id } });
      if (!followUp || followUp.status !== "PENDING") {
        return NextResponse.json({ success: false, message: "Pending follow-up not found." }, { status: 404 });
      }
      await prisma.$transaction(async (transaction) => {
        await transaction.followUp.update({
          where: { id: followUp.id },
          data: { status: "COMPLETED", completedAt: now, completedById: userId, notes: notes ?? followUp.notes },
        });
        await transaction.leadActivity.create({
          data: { enquiryId: id, type: "FOLLOW_UP_COMPLETED", title: "Follow-up completed", notes, recordedById: userId },
        });
        const nextFollowUp = await transaction.followUp.findFirst({
          where: { enquiryId: id, status: "PENDING" },
          orderBy: { dueAt: "asc" },
          select: { dueAt: true },
        });
        await transaction.enquiry.update({
          where: { id },
          data: { nextFollowUpAt: nextFollowUp?.dueAt ?? null },
        });
      });
    } else if (action === "SCHEDULE_APPOINTMENT") {
      const kind = text(body.kind, 20) as $Enums.LeadAppointmentKind;
      const scheduledAt = date(body.scheduledAt);
      if (!(["VISIT", "TRIAL"] as const).includes(kind) || !scheduledAt || scheduledAt <= now) {
        return NextResponse.json({ success: false, message: "Choose a valid future visit or trial time." }, { status: 400 });
      }
      const nextStatus: $Enums.EnquiryStatus = kind === "VISIT" ? "VISIT_BOOKED" : "TRIAL_SCHEDULED";
      if (!canTransitionEnquiry(existing.status, nextStatus)) {
        return NextResponse.json({ success: false, message: `${formatEnquiryStatus(existing.status)} cannot book this appointment yet.` }, { status: 409 });
      }
      await prisma.$transaction(async (transaction) => {
        const appointment = await transaction.leadAppointment.create({
          data: { enquiryId: id, kind, scheduledAt, notes, recordedById: userId },
        });
        await transaction.enquiry.update({
          where: { id },
          data: {
            status: nextStatus,
            stageChangedAt: now,
            preferredVisitDate: kind === "VISIT" ? scheduledAt : existing.preferredVisitDate,
            trialDate: kind === "TRIAL" ? scheduledAt : existing.trialDate,
          },
        });
        await transaction.leadActivity.create({
          data: {
            enquiryId: id,
            type: kind === "VISIT" ? "VISIT_BOOKED" : "TRIAL_SCHEDULED",
            fromStatus: existing.status,
            toStatus: nextStatus,
            title: `${kind === "VISIT" ? "Visit" : "Trial"} booked`,
            notes,
            recordedById: userId,
            metadata: { appointmentId: appointment.id, scheduledAt: scheduledAt.toISOString() },
          },
        });
      });
    } else if (action === "COMPLETE_APPOINTMENT" || action === "NO_SHOW") {
      const appointmentId = text(body.appointmentId, 100);
      const appointment = await prisma.leadAppointment.findFirst({
        where: { id: appointmentId, enquiryId: id },
      });
      if (!appointment || appointment.status !== "SCHEDULED") {
        return NextResponse.json({ success: false, message: "Scheduled appointment not found." }, { status: 404 });
      }
      const noShow = action === "NO_SHOW";
      const nextStatus: $Enums.EnquiryStatus =
        noShow ? "FOLLOW_UP" : appointment.kind === "VISIT" ? "VISIT_COMPLETED" : "TRIAL_COMPLETED";
      await prisma.$transaction([
        prisma.leadAppointment.update({
          where: { id: appointment.id },
          data: {
            status: noShow ? "NO_SHOW" : "COMPLETED",
            completedAt: now,
            outcome: text(body.outcome) || (noShow ? "Parent did not attend" : null),
            parentFeedback: text(body.parentFeedback) || null,
            notes: notes ?? appointment.notes,
          },
        }),
        prisma.enquiry.update({
          where: { id },
          data: { status: nextStatus, stageChangedAt: now },
        }),
        prisma.leadActivity.create({
          data: {
            enquiryId: id,
            type: noShow
              ? "VISIT_NO_SHOW"
              : appointment.kind === "VISIT"
                ? "VISIT_COMPLETED"
                : "TRIAL_COMPLETED",
            fromStatus: existing.status,
            toStatus: nextStatus,
            title: noShow ? `${appointment.kind} no-show` : `${appointment.kind} completed`,
            notes,
            recordedById: userId,
            metadata: { appointmentId: appointment.id, outcome: text(body.outcome), parentFeedback: text(body.parentFeedback) },
          },
        }),
      ]);
    } else if (action === "PARENT_FEEDBACK") {
      const feedback = text(body.parentFeedback);
      if (!feedback) {
        return NextResponse.json({ success: false, message: "Enter parent feedback." }, { status: 400 });
      }
      await prisma.leadActivity.create({
        data: { enquiryId: id, type: "PARENT_FEEDBACK", title: "Parent feedback", notes: feedback, recordedById: userId },
      });
    } else if (action === "CLOSE") {
      if (existing.status === "ADMITTED" || isClosedEnquiryStatus(existing.status)) {
        return NextResponse.json({ success: false, message: "This lead cannot be closed from its current stage." }, { status: 409 });
      }
      if (!notes) {
        return NextResponse.json({ success: false, message: "Enter the reason for closing this lead." }, { status: 400 });
      }
      await prisma.$transaction([
        prisma.followUp.updateMany({
          where: { enquiryId: id, status: "PENDING" },
          data: { status: "CANCELLED", completedAt: now, completedById: userId },
        }),
        prisma.leadAppointment.updateMany({
          where: { enquiryId: id, status: "SCHEDULED" },
          data: { status: "CANCELLED", completedAt: now },
        }),
        prisma.enquiry.update({
          where: { id },
          data: { status: "CLOSED", stageChangedAt: now, closedAt: now, lostReason: notes, nextFollowUpAt: null },
        }),
        prisma.leadActivity.create({
          data: { enquiryId: id, type: "CLOSED", fromStatus: existing.status, toStatus: "CLOSED", title: "Lead closed", notes, recordedById: userId },
        }),
        prisma.activityLog.create({
          data: {
            adminUserId: userId,
            action: "UPDATED",
            entityType: "ENQUIRY",
            entityId: id,
            description: "Enquiry closed from the CRM journey.",
            previousData: { status: existing.status },
            newData: { status: "CLOSED", reason: notes },
          },
        }),
      ]);
    } else if (action === "REOPEN") {
      if (!isClosedEnquiryStatus(existing.status)) {
        return NextResponse.json({ success: false, message: "Only a closed lead can be reopened." }, { status: 409 });
      }
      await prisma.$transaction([
        prisma.enquiry.update({
          where: { id },
          data: { status: "NEW", stageChangedAt: now, closedAt: null, lostReason: null },
        }),
        prisma.leadActivity.create({
          data: { enquiryId: id, type: "REOPENED", fromStatus: existing.status, toStatus: "NEW", title: "Lead reopened", notes, recordedById: userId },
        }),
        prisma.activityLog.create({
          data: {
            adminUserId: userId,
            action: "UPDATED",
            entityType: "ENQUIRY",
            entityId: id,
            description: "Closed enquiry reopened in the CRM journey.",
            previousData: { status: existing.status },
            newData: { status: "NEW", notes },
          },
        }),
      ]);
    } else if (action === "LINK_SIBLING") {
      const siblingId = text(body.siblingEnquiryId, 100);
      const sibling = await prisma.enquiry.findUnique({ where: { id: siblingId } });
      if (!sibling || sibling.id === id) {
        return NextResponse.json({ success: false, message: "Choose another valid enquiry." }, { status: 400 });
      }
      await prisma.$transaction(async (transaction) => {
        const familyId = existing.familyId ?? sibling.familyId ?? (await transaction.leadFamily.create({
          data: {
            familyName: text(body.familyName, 120) || `${existing.parentName} family`,
            primaryPhone: existing.phone,
          },
          select: { id: true },
        })).id;
        await transaction.enquiry.updateMany({ where: { id: { in: [id, sibling.id] } }, data: { familyId } });
        await transaction.leadActivity.create({
          data: { enquiryId: id, type: "SIBLING_LINKED", title: `Sibling linked: ${sibling.childName ?? sibling.enquiryNumber}`, recordedById: userId, metadata: { siblingId: sibling.id, familyId } },
        });
      });
    } else if (action === "RESEND_CONVERSION") {
      const jobId = text(body.jobId, 100);
      const job = await prisma.marketingConversionJob.findFirst({ where: { id: jobId, enquiryId: id } });
      if (!job || !(await retryMarketingConversion(job.id, userId))) {
        return NextResponse.json({ success: false, message: "This conversion cannot be resent." }, { status: 409 });
      }
      await processAdmissionConversionQueue({ enquiryId: id, limit: 1 });
    } else {
      return NextResponse.json({ success: false, message: "Choose a valid CRM action." }, { status: 400 });
    }

    const updated = await journey(id);
    return NextResponse.json({ success: true, enquiry: updated ? responseJourney(updated) : null });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: "You are not authorised." }, { status: 401 });
    }
    logServerError("Unable to update the enquiry journey.", error);
    return NextResponse.json({ success: false, message: "The CRM action could not be saved." }, { status: 500 });
  }
}
