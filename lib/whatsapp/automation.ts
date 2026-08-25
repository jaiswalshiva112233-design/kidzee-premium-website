import "server-only";

import { randomUUID } from "node:crypto";

import type { $Enums, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildSiteContact } from "@/lib/siteContact";
import { logServerError } from "@/lib/server/safeLogging";
import { sendWhatsAppDocument, sendWhatsAppTemplate } from "@/lib/whatsapp/cloud";
import { createReceiptDocumentUrl } from "@/lib/whatsapp/receiptLink";

const STALE_LOCK_MS = 15 * 60 * 1_000;

type QueueInput = {
  type: $Enums.WhatsAppAutomationType;
  deduplicationKey: string;
  recipientPhone: string;
  messageText?: string | null;
  documentUrl?: string | null;
  documentFilename?: string | null;
  enquiryId?: string | null;
  studentId?: string | null;
  invoiceId?: string | null;
  receiptId?: string | null;
  payload?: Prisma.InputJsonValue;
  nextAttemptAt?: Date;
};

const templateEnvironment: Record<$Enums.WhatsAppAutomationType, string> = {
  ENQUIRY_NOTIFICATION: "WHATSAPP_TEMPLATE_ENQUIRY_NOTIFICATION",
  VISIT_REMINDER: "WHATSAPP_TEMPLATE_VISIT_REMINDER",
  ADMISSION_CONFIRMATION: "WHATSAPP_TEMPLATE_ADMISSION_CONFIRMATION",
  FEE_REMINDER: "WHATSAPP_TEMPLATE_FEE_REMINDER",
  RECEIPT_DOCUMENT: "WHATSAPP_TEMPLATE_RECEIPT_DOCUMENT",
  DAYCARE_REMINDER: "WHATSAPP_TEMPLATE_DAYCARE_REMINDER",
  FOLLOW_UP_REMINDER: "WHATSAPP_TEMPLATE_FOLLOW_UP_REMINDER",
};

function digits(value: string) {
  const cleaned = value.replace(/\D/g, "");
  return cleaned.length === 10 ? `91${cleaned}` : cleaned;
}

function retryDelay(attempt: number) {
  return Math.min(24 * 60 * 60 * 1_000, 5 * 60 * 1_000 * 2 ** Math.max(0, attempt - 1));
}

export async function queueWhatsAppAutomation(input: QueueInput) {
  const recipientPhone = digits(input.recipientPhone);
  if (!/^91[6-9]\d{9}$/.test(recipientPhone)) return null;
  const templateName = process.env[templateEnvironment[input.type]]?.trim() || null;
  return prisma.whatsAppAutomationMessage.upsert({
    where: { deduplicationKey: input.deduplicationKey },
    create: {
      type: input.type,
      deduplicationKey: input.deduplicationKey,
      recipientPhone,
      templateName,
      messageText: input.messageText ?? null,
      documentUrl: input.documentUrl ?? null,
      documentFilename: input.documentFilename ?? null,
      enquiryId: input.enquiryId ?? null,
      studentId: input.studentId ?? null,
      invoiceId: input.invoiceId ?? null,
      receiptId: input.receiptId ?? null,
      payload: input.payload,
      nextAttemptAt: input.nextAttemptAt ?? new Date(),
    },
    update: {
      recipientPhone,
      messageText: input.messageText ?? undefined,
      payload: input.payload,
    },
  });
}

export async function queueReceiptWhatsApp(receiptId: string) {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      payment: { select: { amountReceived: true } },
      student: {
        select: {
          id: true,
          firstName: true,
          guardians: { where: { isPrimary: true }, select: { phone: true }, take: 1 },
        },
      },
    },
  });
  const phone = receipt?.student.guardians[0]?.phone;
  if (!receipt || !phone) return null;
  return queueWhatsAppAutomation({
    type: "RECEIPT_DOCUMENT",
    deduplicationKey: `RECEIPT_DOCUMENT:${receipt.id}`,
    recipientPhone: phone,
    studentId: receipt.student.id,
    receiptId: receipt.id,
    documentFilename: `${receipt.receiptNumber}.pdf`,
    messageText: `Fee receipt ${receipt.receiptNumber} for ${receipt.student.firstName}. Amount received: INR ${Number(receipt.payment.amountReceived).toFixed(2)}.`,
  });
}

async function sendJob(id: string, workerId: string) {
  const now = new Date();
  const claimed = await prisma.whatsAppAutomationMessage.updateMany({
    where: { id, status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: now } },
    data: { status: "PROCESSING", lastAttemptAt: now },
  });
  if (claimed.count !== 1) return { claimed: false, sent: false };
  const job = await prisma.whatsAppAutomationMessage.findUnique({ where: { id } });
  if (!job) return { claimed: false, sent: false };

  let providerMessageId: string | null = null;
  let failure: string | null = null;
  try {
    if (job.type === "RECEIPT_DOCUMENT" && job.receiptId) {
      const documentUrl = job.documentUrl || createReceiptDocumentUrl(job.receiptId);
      const filename = job.documentFilename || "Kidzee-fee-receipt.pdf";
      const result = job.templateName
        ? await sendWhatsAppTemplate({
            to: job.recipientPhone,
            templateName: job.templateName,
            language: job.templateLanguage ?? "en",
            bodyParameters: [],
            headerDocument: { url: documentUrl, filename },
          })
        : await sendWhatsAppDocument({
            to: job.recipientPhone,
            documentUrl,
            filename,
            caption: job.messageText || "Your Kidzee fee receipt is attached.",
          });
      providerMessageId = result.messages?.[0]?.id ?? null;
    } else if (job.templateName) {
      const payload = job.payload && typeof job.payload === "object" && !Array.isArray(job.payload)
        ? (job.payload as Record<string, unknown>)
        : {};
      const parameters = Array.isArray(payload.parameters)
        ? payload.parameters.filter((value): value is string => typeof value === "string")
        : [];
      const result = await sendWhatsAppTemplate({
        to: job.recipientPhone,
        templateName: job.templateName,
        language: job.templateLanguage ?? "en",
        bodyParameters: parameters,
      });
      providerMessageId = result.messages?.[0]?.id ?? null;
    } else {
      throw new Error("Approved WhatsApp template is not configured for this automation.");
    }
    if (!providerMessageId) throw new Error("WhatsApp did not return a message ID.");
  } catch (error) {
    failure = error instanceof Error ? error.message.slice(0, 180) : "WhatsApp delivery failed.";
    logServerError("WhatsApp automation delivery failed.", error);
  }

  const attempts = job.attempts + 1;
  const failed = !providerMessageId && attempts >= job.maxAttempts;
  await prisma.$transaction(async (transaction) => {
    await transaction.whatsAppAutomationMessage.update({
      where: { id: job.id },
      data: {
        status: providerMessageId ? "ACCEPTED" : failed ? "FAILED" : "RETRY",
        attempts,
        providerMessageId,
        acceptedAt: providerMessageId ? new Date() : null,
        failedAt: failed ? new Date() : null,
        nextAttemptAt: providerMessageId || failed ? new Date() : new Date(Date.now() + retryDelay(attempts)),
        lastError: providerMessageId ? null : failure,
      },
    });
    if (providerMessageId && job.receiptId) {
      await transaction.receipt.update({ where: { id: job.receiptId }, data: { whatsappSentAt: new Date() } });
    }
    await transaction.activityLog.create({
      data: {
        action: providerMessageId ? "UPDATED" : failed ? "CANCELLED" : "UPDATED",
        entityType: "WHATSAPP_AUTOMATION",
        entityId: job.id,
        description: providerMessageId
          ? `${job.type} accepted by WhatsApp.`
          : failed
            ? `${job.type} reached its delivery retry limit.`
            : `${job.type} scheduled for another retry.`,
        newData: { status: providerMessageId ? "ACCEPTED" : failed ? "FAILED" : "RETRY", attempts, workerId, failure },
      },
    });
  });
  return { claimed: true, sent: Boolean(providerMessageId) };
}

export async function sendWhatsAppAutomationMessage(id: string) {
  return sendJob(id, randomUUID());
}

export async function processWhatsAppAutomationQueue(limit = 50) {
  await prisma.whatsAppAutomationMessage.updateMany({
    where: { status: "PROCESSING", lastAttemptAt: { lt: new Date(Date.now() - STALE_LOCK_MS) } },
    data: { status: "RETRY", nextAttemptAt: new Date() },
  });
  const due = await prisma.whatsAppAutomationMessage.findMany({
    where: { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: new Date() } },
    select: { id: true },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: Math.max(1, Math.min(100, limit)),
  });
  const workerId = randomUUID();
  const results = [];
  for (const job of due) results.push(await sendJob(job.id, workerId));
  return { processed: results.filter((item) => item.claimed).length, accepted: results.filter((item) => item.sent).length };
}

export async function discoverWhatsAppAutomation() {
  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1_000);
  const contact = buildSiteContact(await getWebsiteContactSettings());
  const [appointments, followUps, overdueInvoices, daycareSessions] = await Promise.all([
    prisma.leadAppointment.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gte: tomorrowStart, lt: tomorrowEnd } },
      include: { enquiry: { select: { id: true, parentName: true, phone: true } } },
      take: 200,
    }),
    prisma.followUp.findMany({
      where: { status: "PENDING", dueAt: { lte: new Date(now.getTime() + 30 * 60 * 1_000) } },
      include: { enquiry: { select: { id: true, parentName: true } } },
      take: 200,
    }),
    prisma.feeInvoice.findMany({
      where: { status: { in: ["DUE", "PARTIALLY_PAID", "OVERDUE"] }, dueDate: { lt: now } },
      include: { student: { include: { guardians: { where: { isPrimary: true }, take: 1 } } } },
      take: 200,
    }),
    prisma.daycareSession.findMany({
      where: { status: "BOOKED", sessionDate: { gte: tomorrowStart, lt: tomorrowEnd } },
      include: { student: { include: { guardians: { where: { isPrimary: true }, take: 1 } } } },
      take: 200,
    }),
  ]);
  let discovered = 0;
  for (const appointment of appointments) {
    if (await queueWhatsAppAutomation({
      type: "VISIT_REMINDER",
      deduplicationKey: `VISIT_REMINDER:${appointment.id}`,
      recipientPhone: appointment.enquiry.phone,
      enquiryId: appointment.enquiry.id,
      messageText: `Reminder for your ${appointment.kind.toLowerCase()} at Kidzee Sector 12B, Dwarka.`,
      payload: { parameters: [appointment.enquiry.parentName, appointment.scheduledAt.toLocaleString("en-IN")] },
    })) discovered += 1;
  }
  for (const followUp of followUps) {
    if (await queueWhatsAppAutomation({
      type: "FOLLOW_UP_REMINDER",
      deduplicationKey: `FOLLOW_UP_REMINDER:${followUp.id}`,
      recipientPhone: contact.phone,
      enquiryId: followUp.enquiry.id,
      messageText: `CentreOS follow-up reminder for ${followUp.enquiry.parentName}.`,
      payload: { parameters: [followUp.enquiry.parentName, followUp.dueAt.toLocaleString("en-IN")] },
    })) discovered += 1;
  }
  for (const invoice of overdueInvoices) {
    const phone = invoice.student.guardians[0]?.phone;
    if (phone && await queueWhatsAppAutomation({
      type: "FEE_REMINDER",
      deduplicationKey: `FEE_REMINDER:${invoice.id}:${now.getFullYear()}-${now.getMonth() + 1}`,
      recipientPhone: phone,
      studentId: invoice.studentId,
      invoiceId: invoice.id,
      messageText: `Fee reminder for invoice ${invoice.invoiceNumber}.`,
      payload: { parameters: [invoice.student.firstName, invoice.invoiceNumber, Number(invoice.pendingAmount).toFixed(2)] },
    })) discovered += 1;
  }
  for (const session of daycareSessions) {
    const phone = session.student.guardians[0]?.phone;
    if (phone && await queueWhatsAppAutomation({
      type: "DAYCARE_REMINDER",
      deduplicationKey: `DAYCARE_REMINDER:${session.id}`,
      recipientPhone: phone,
      studentId: session.studentId,
      messageText: `Daycare reminder for ${session.student.firstName}.`,
      payload: { parameters: [session.student.firstName, session.sessionDate.toLocaleDateString("en-IN")] },
    })) discovered += 1;
  }
  return discovered;
}
