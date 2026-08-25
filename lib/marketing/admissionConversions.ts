import "server-only";

import { randomUUID } from "node:crypto";

import type { $Enums, Prisma } from "@/generated/prisma/client";
import { sendGoogleConversion } from "@/lib/marketing/googleAdsConversions";
import { sendMetaConversionEvent } from "@/lib/marketing/metaConversions";
import {
  MARKETING_MAX_ATTEMPTS,
  marketingRetryDelay,
} from "@/lib/marketing/retryPolicy";
import { prisma } from "@/lib/prisma";
import { getWebsiteTrackingSettings } from "@/lib/sanity/websiteSettings";
import { logServerError } from "@/lib/server/safeLogging";

const STALE_LOCK_MS = 15 * 60 * 1000;

type ConversionEventType = $Enums.MarketingConversionEvent;

type ConversionPayload = {
  enquiryNumber: string;
  conversionTime: string;
  pageUrl: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  phone: string;
  parentName: string;
  email: string | null;
  fbc: string | null;
  fbp: string | null;
};

function jsonPayload(value: ConversionPayload): Prisma.InputJsonObject {
  return value as unknown as Prisma.InputJsonObject;
}

function validDate(value: unknown) {
  const date = new Date(typeof value === "string" ? value : "");
  return Number.isNaN(date.getTime()) ? null : date;
}

function eventTime(
  eventType: ConversionEventType,
  enquiry: {
    createdAt: Date;
    qualifiedAt: Date | null;
    admittedAt: Date | null;
  },
) {
  if (eventType === "QUALIFIED_LEAD") {
    return enquiry.qualifiedAt ?? new Date();
  }
  if (eventType === "ADMISSION") {
    return enquiry.admittedAt ?? new Date();
  }
  return enquiry.createdAt;
}

function eligibleForEvent(
  eventType: ConversionEventType,
  status: $Enums.EnquiryStatus,
) {
  if (eventType === "LEAD") return true;
  if (eventType === "QUALIFIED_LEAD") {
    return status === "QUALIFIED" || status === "ADMITTED";
  }
  return status === "ADMITTED";
}

export async function enqueueMarketingConversions(
  enquiryId: string,
  eventType: ConversionEventType,
) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    select: {
      id: true,
      enquiryNumber: true,
      parentName: true,
      phone: true,
      email: true,
      status: true,
      createdAt: true,
      qualifiedAt: true,
      admittedAt: true,
      websiteSubmissions: {
        where: {
          marketingConsent: true,
          leadType: "admission",
          trafficClass: "GENUINE",
          isInternal: false,
          isTest: false,
          isBot: false,
        },
        orderBy: { receivedAt: "desc" },
        select: {
          source: true,
          trafficChannel: true,
          pageUrl: true,
          gclid: true,
          gbraid: true,
          wbraid: true,
          fbclid: true,
          fbc: true,
          fbp: true,
        },
      },
    },
  });

  if (!enquiry || !eligibleForEvent(eventType, enquiry.status)) {
    return { eligible: false, queued: 0 };
  }

  const googleSubmission = enquiry.websiteSubmissions.find(
    (submission) =>
      submission.source === "GOOGLE_ADS" ||
      submission.trafficChannel === "GOOGLE_ADS" ||
      Boolean(submission.gclid || submission.gbraid || submission.wbraid),
  );
  const metaSubmission = enquiry.websiteSubmissions.find(
    (submission) =>
      submission.source === "META_ADS" ||
      submission.trafficChannel === "META_ADS" ||
      Boolean(submission.fbclid || submission.fbc || submission.fbp),
  );
  const conversionTime = eventTime(eventType, enquiry).toISOString();
  const jobs: Array<Promise<unknown>> = [];

  if (googleSubmission) {
    const deduplicationKey = `GOOGLE_ADS:${eventType}:${enquiry.enquiryNumber}`;
    const payload = jsonPayload({
      enquiryNumber: enquiry.enquiryNumber,
      conversionTime,
      pageUrl: googleSubmission.pageUrl,
      gclid: googleSubmission.gclid,
      gbraid: googleSubmission.gbraid,
      wbraid: googleSubmission.wbraid,
      phone: enquiry.phone,
      parentName: enquiry.parentName,
      email: enquiry.email,
      fbc: null,
      fbp: null,
    });
    jobs.push(
      prisma.marketingConversionJob.upsert({
        where: { deduplicationKey },
        create: {
          provider: "GOOGLE_ADS",
          eventType,
          deduplicationKey,
          enquiryId: enquiry.id,
          maxAttempts: MARKETING_MAX_ATTEMPTS,
          payload,
        },
        update: { payload },
      }),
    );
  }

  if (metaSubmission) {
    const deduplicationKey = `META:${eventType}:${enquiry.enquiryNumber}`;
    const payload = jsonPayload({
      enquiryNumber: enquiry.enquiryNumber,
      conversionTime,
      pageUrl: metaSubmission.pageUrl,
      gclid: null,
      gbraid: null,
      wbraid: null,
      phone: enquiry.phone,
      parentName: enquiry.parentName,
      email: enquiry.email,
      fbc: metaSubmission.fbc,
      fbp: metaSubmission.fbp,
    });
    jobs.push(
      prisma.marketingConversionJob.upsert({
        where: { deduplicationKey },
        create: {
          provider: "META",
          eventType,
          deduplicationKey,
          enquiryId: enquiry.id,
          maxAttempts: MARKETING_MAX_ATTEMPTS,
          payload,
        },
        update: { payload },
      }),
    );
  }

  await Promise.all(jobs);
  return { eligible: jobs.length > 0, queued: jobs.length };
}

export function enqueueLeadConversions(enquiryId: string) {
  return enqueueMarketingConversions(enquiryId, "LEAD");
}

export function enqueueQualifiedLeadConversions(enquiryId: string) {
  return enqueueMarketingConversions(enquiryId, "QUALIFIED_LEAD");
}

export function enqueueAdmissionConversions(enquiryId: string) {
  return enqueueMarketingConversions(enquiryId, "ADMISSION");
}

async function attemptJob(jobId: string, workerId: string) {
  const now = new Date();
  const claimed = await prisma.marketingConversionJob.updateMany({
    where: {
      id: jobId,
      status: { in: ["PENDING", "RETRY"] },
      nextAttemptAt: { lte: now },
    },
    data: { status: "PROCESSING", lockedAt: now, lockedBy: workerId },
  });
  if (claimed.count !== 1) {
    return { claimed: false, sent: false, provider: null, dead: false };
  }

  const job = await prisma.marketingConversionJob.findUnique({
    where: { id: jobId },
  });
  if (!job) {
    return { claimed: false, sent: false, provider: null, dead: false };
  }

  let sent = false;
  let reason: string | null = "invalid_payload";
  try {
    const payload = job.payload as unknown as Record<string, unknown>;
    const conversionTime = validDate(payload.conversionTime);
    if (conversionTime && job.provider === "GOOGLE_ADS") {
      const result = await sendGoogleConversion(job.eventType, {
        enquiryNumber: String(payload.enquiryNumber ?? ""),
        conversionTime,
        gclid: typeof payload.gclid === "string" ? payload.gclid : null,
        gbraid: typeof payload.gbraid === "string" ? payload.gbraid : null,
        wbraid: typeof payload.wbraid === "string" ? payload.wbraid : null,
        phone: String(payload.phone ?? ""),
        email: typeof payload.email === "string" ? payload.email : null,
      });
      sent = result.sent;
      reason = result.reason;
    } else if (conversionTime && job.provider === "META") {
      const tracking = await getWebsiteTrackingSettings();
      const eventName =
        job.eventType === "LEAD"
          ? "Lead"
          : job.eventType === "QUALIFIED_LEAD"
            ? "QualifiedLead"
            : "CompleteRegistration";
      const enquiryNumber = String(payload.enquiryNumber ?? "");
      const eventId =
        job.eventType === "LEAD"
          ? enquiryNumber
          : `${job.eventType.toLowerCase()}-${enquiryNumber}`;
      const result =
        tracking.metaPixelEnabled && tracking.metaPixelId
          ? await sendMetaConversionEvent(eventName, {
              pixelId: tracking.metaPixelId,
              eventId,
              eventTime: conversionTime,
              eventSourceUrl:
                typeof payload.pageUrl === "string" ? payload.pageUrl : null,
              phone: String(payload.phone ?? ""),
              parentName: String(payload.parentName ?? ""),
              email: typeof payload.email === "string" ? payload.email : null,
              externalId: enquiryNumber,
              fbc: typeof payload.fbc === "string" ? payload.fbc : null,
              fbp: typeof payload.fbp === "string" ? payload.fbp : null,
            })
          : { sent: false, reason: "not_configured" as const };
      sent = result.sent;
      reason = result.reason;
    }
  } catch (error) {
    logServerError("Marketing conversion attempt failed.", error);
    reason = "unexpected_error";
  }

  const attemptNumber = job.attempts + 1;
  const dead = !sent && attemptNumber >= job.maxAttempts;
  const attemptedAt = new Date();
  await prisma.$transaction(async (transaction) => {
    await transaction.marketingConversionJob.update({
      where: { id: job.id },
      data: {
        status: sent ? "SUCCEEDED" : dead ? "DEAD" : "RETRY",
        attempts: attemptNumber,
        nextAttemptAt:
          sent || dead
            ? attemptedAt
            : new Date(attemptedAt.getTime() + marketingRetryDelay(attemptNumber)),
        lockedAt: null,
        lockedBy: null,
        lastAttemptAt: attemptedAt,
        completedAt: sent ? attemptedAt : null,
        lastError: sent ? null : String(reason ?? "failed").slice(0, 120),
      },
    });

    if (job.eventType === "ADMISSION") {
      await transaction.enquiry.update({
        where: { id: job.enquiryId },
        data:
          job.provider === "GOOGLE_ADS"
            ? {
                googleAdmissionAttemptAt: attemptedAt,
                googleAdmissionAttempts: { increment: 1 },
                googleAdmissionSentAt: sent ? attemptedAt : undefined,
                googleAdmissionError: sent
                  ? null
                  : String(reason ?? "failed").slice(0, 120),
              }
            : {
                metaAdmissionAttemptAt: attemptedAt,
                metaAdmissionAttempts: { increment: 1 },
                metaAdmissionSentAt: sent ? attemptedAt : undefined,
                metaAdmissionError: sent
                  ? null
                  : String(reason ?? "failed").slice(0, 120),
              },
      });
    }

    await transaction.activityLog.create({
      data: {
        action: sent ? "UPDATED" : dead ? "CANCELLED" : "UPDATED",
        entityType: "MARKETING_CONVERSION_JOB",
        entityId: job.id,
        description: sent
          ? `${job.provider} ${job.eventType} conversion delivered.`
          : dead
            ? `${job.provider} ${job.eventType} conversion reached its retry limit.`
            : `${job.provider} ${job.eventType} conversion scheduled for retry.`,
        newData: {
          provider: job.provider,
          eventType: job.eventType,
          attempt: attemptNumber,
          status: sent ? "SUCCEEDED" : dead ? "DEAD" : "RETRY",
          reason: sent ? null : String(reason ?? "failed").slice(0, 120),
        },
      },
    });
  });

  return { claimed: true, sent, provider: job.provider, dead };
}

export async function processAdmissionConversionQueue(
  options: { limit?: number; enquiryId?: string } = {},
) {
  const limit = Math.min(100, Math.max(1, options.limit ?? 25));
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS);
  await prisma.marketingConversionJob.updateMany({
    where: { status: "PROCESSING", lockedAt: { lt: staleBefore } },
    data: {
      status: "RETRY",
      lockedAt: null,
      lockedBy: null,
      nextAttemptAt: new Date(),
    },
  });

  const due = await prisma.marketingConversionJob.findMany({
    where: {
      status: { in: ["PENDING", "RETRY"] },
      nextAttemptAt: { lte: new Date() },
      ...(options.enquiryId ? { enquiryId: options.enquiryId } : {}),
    },
    select: { id: true },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
  const workerId = randomUUID();
  const results = [];
  for (const job of due) results.push(await attemptJob(job.id, workerId));
  return {
    processed: results.filter((result) => result.claimed).length,
    sent: results.filter((result) => result.sent).length,
    dead: results.filter((result) => result.dead).length,
    googleSent: results.filter(
      (result) => result.sent && result.provider === "GOOGLE_ADS",
    ).length,
    metaSent: results.filter(
      (result) => result.sent && result.provider === "META",
    ).length,
  };
}

export async function retryMarketingConversion(jobId: string, actorId?: string | null) {
  const job = await prisma.marketingConversionJob.findUnique({ where: { id: jobId } });
  if (!job || job.status === "SUCCEEDED") return false;

  await prisma.$transaction([
    prisma.marketingConversionJob.update({
      where: { id: jobId },
      data: {
        status: "RETRY",
        nextAttemptAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: null,
      },
    }),
    prisma.leadActivity.create({
      data: {
        enquiryId: job.enquiryId,
        type: "CONVERSION_RESENT",
        title: `${job.provider} ${job.eventType} conversion queued again`,
        recordedById: actorId ?? null,
        metadata: { jobId: job.id },
      },
    }),
  ]);
  return true;
}

export async function enqueuePendingAdmissionConversions(limit = 100) {
  const enquiries = await prisma.enquiry.findMany({
    where: {
      status: "ADMITTED",
      websiteSubmissions: {
        some: {
          marketingConsent: true,
          leadType: "admission",
          trafficClass: "GENUINE",
          isInternal: false,
          isTest: false,
          isBot: false,
        },
      },
    },
    select: { id: true },
    orderBy: { admittedAt: "asc" },
    take: Math.min(500, Math.max(1, limit)),
  });
  for (const enquiry of enquiries) await enqueueAdmissionConversions(enquiry.id);
  return enquiries.length;
}

export async function deliverMarketingConversions(
  enquiryId: string,
  eventType: ConversionEventType,
) {
  const queued = await enqueueMarketingConversions(enquiryId, eventType);
  if (!queued.eligible) {
    return { eligible: false, google: "skipped", meta: "skipped" } as const;
  }
  const result = await processAdmissionConversionQueue({ enquiryId, limit: 6 });
  return {
    eligible: true,
    google: result.googleSent ? "sent" : "queued",
    meta: result.metaSent ? "sent" : "queued",
  } as const;
}

export function deliverAdmissionConversions(enquiryId: string) {
  return deliverMarketingConversions(enquiryId, "ADMISSION");
}
