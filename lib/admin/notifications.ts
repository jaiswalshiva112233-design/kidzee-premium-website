import "server-only";

import type { AdminRole, Prisma } from "@/generated/prisma/client";
import { getGoogleAccessToken, firebaseProjectId } from "@/lib/firebase/googleAuth";
import { hasAdminPermissionRequirement } from "@/lib/admin/permissions";
import { prisma } from "@/lib/prisma";

export const NOTIFICATION_CATEGORIES = ["ADMISSION", "FOLLOW_UP", "VISIT", "STUDENT", "FEES", "DAYCARE", "ATTENDANCE", "WHATSAPP", "CAREERS", "REPORTS", "SYSTEM", "AI_GROWTH"] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const operational = new Set<NotificationCategory>(["ADMISSION", "FOLLOW_UP", "VISIT", "STUDENT", "FEES", "DAYCARE", "ATTENDANCE", "WHATSAPP", "CAREERS"]);
const permissionByCategory: Partial<Record<NotificationCategory, string | readonly string[]>> = {
  ADMISSION: ["enquiries.manage", "admissions.manage"], FOLLOW_UP: "enquiries.manage", VISIT: "enquiries.manage", STUDENT: "admissions.manage",
  FEES: "fees.collect", DAYCARE: ["fees.collect", "fees.settings"], ATTENDANCE: "attendance.manage", WHATSAPP: ["fees.collect", "receipts.view"], CAREERS: "staff.view",
};
export const defaultCategoriesForRole = (role: AdminRole) => role === "OWNER" ? [...NOTIFICATION_CATEGORIES] : [...operational];

function stringArray(value: Prisma.JsonValue | null | undefined, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

function validClock(value: string) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
function quietNow(start: string, end: string, date = new Date()) {
  if (!validClock(start) || !validClock(end)) return false;
  const local = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return start <= end ? local >= start && local < end : local >= start || local < end;
}

export async function createAdminNotification(input: {
  category: NotificationCategory; type: string; priority?: NotificationPriority; title: string; body: string; href: string;
  entityType?: string; entityId?: string; eventKey: string; important?: boolean; ownerOnly?: boolean;
}) {
  const users = await prisma.adminUser.findMany({ where: { active: true }, select: { id: true, role: true, permissions: true, notificationPreference: true, pushDevices: { where: { active: true } } } });
  const created = [];
  for (const user of users) {
    if (input.ownerOnly && user.role !== "OWNER") continue;
    if (user.role === "CENTRE_HEAD") {
      if (!operational.has(input.category)) continue;
      const requirement = permissionByCategory[input.category];
      if (requirement && !hasAdminPermissionRequirement({ role: user.role, permissions: stringArray(user.permissions, []) }, requirement)) continue;
    }
    const defaults = defaultCategoriesForRole(user.role);
    const enabled = stringArray(user.notificationPreference?.enabledCategories, defaults);
    if (!enabled.includes(input.category)) continue;
    const idempotencyKey = `${input.type}:${input.eventKey}:${user.id}`.slice(0, 500);
    const record = await prisma.adminNotification.upsert({
      where: { idempotencyKey },
      create: { recipientUserId: user.id, category: input.category, type: input.type.slice(0, 80), priority: input.priority || "MEDIUM", title: input.title.slice(0, 120), body: input.body.slice(0, 250), href: input.href.slice(0, 500), entityType: input.entityType?.slice(0, 80), entityId: input.entityId?.slice(0, 100), idempotencyKey, important: input.important || input.priority === "HIGH" || input.priority === "CRITICAL" },
      update: {},
    });
    const suppress = Boolean(user.notificationPreference?.quietHoursEnabled) && quietNow(user.notificationPreference?.quietStart || "19:00", user.notificationPreference?.quietEnd || "08:30") && input.priority !== "CRITICAL";
    if (!suppress) {
      await prisma.pushNotificationDelivery.createMany({ data: user.pushDevices.filter((device) => stringArray(device.enabledCategories, defaults).includes(input.category)).map((device) => ({ notificationId: record.id, deviceId: device.id })), skipDuplicates: true });
    }
    created.push(record);
  }
  return created;
}

function nextRetry(attempts: number) { return new Date(Date.now() + Math.min(60, 2 ** Math.max(0, attempts)) * 60_000); }

export async function deliverPendingPushNotifications(limit = 100) {
  const project = firebaseProjectId();
  if (!project) return { processed: 0, delivered: 0, failed: 0, configured: false };
  const accessToken = await getGoogleAccessToken();
  const rows = await prisma.pushNotificationDelivery.findMany({ where: { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: new Date() }, attempts: { lt: 5 }, device: { active: true } }, orderBy: { nextAttemptAt: "asc" }, take: Math.min(Math.max(limit, 1), 250), include: { notification: true, device: true } });
  let delivered = 0; let failed = 0;
  for (const row of rows) {
    const claimed = await prisma.pushNotificationDelivery.updateMany({ where: { id: row.id, status: row.status, attempts: row.attempts }, data: { status: "SENDING", attempts: { increment: 1 }, lastAttemptAt: new Date() } });
    if (!claimed.count) continue;
    try {
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(project)}/messages:send`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: { token: row.device.token, data: { title: row.notification.title, body: row.notification.body, href: row.notification.href, notificationId: row.notification.id, category: row.notification.category } }, validate_only: false }), signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`FCM_${response.status}`);
      await prisma.pushNotificationDelivery.update({ where: { id: row.id }, data: { status: "DELIVERED", deliveredAt: new Date(), lastError: null } }); delivered += 1;
    } catch (error) {
      const attempt = row.attempts + 1; const terminal = attempt >= row.maxAttempts;
      await prisma.pushNotificationDelivery.update({ where: { id: row.id }, data: { status: terminal ? "FAILED" : "RETRY", nextAttemptAt: nextRetry(attempt), lastError: error instanceof Error ? error.message.slice(0, 120) : "FCM_FAILED" } }); failed += 1;
    }
  }
  return { processed: rows.length, delivered, failed, configured: true };
}

function dayKey(date = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
export async function scanNotificationEvents(now = new Date()) {
  const today = dayKey(now); const start = new Date(`${today}T00:00:00+05:30`); const end = new Date(start.getTime() + 86_400_000);
  const [followUps, visits, missedVisits, pendingAdmissions, fees, daycare, extraDaycare, careers, whatsapp, conversionFailures, aiRecommendations] = await Promise.all([
    prisma.followUp.findMany({ where: { status: "PENDING", dueAt: { lt: now } }, take: 100, select: { id: true, enquiryId: true, dueAt: true } }),
    prisma.leadAppointment.findMany({ where: { status: "SCHEDULED", scheduledAt: { gte: start, lt: end } }, take: 100, select: { id: true, enquiryId: true, scheduledAt: true } }),
    prisma.leadAppointment.findMany({ where: { status: "NO_SHOW", updatedAt: { gte: start, lt: end } }, take: 100, select: { id: true, enquiryId: true } }),
    prisma.admission.findMany({ where: { status: "DOCUMENTS_PENDING" }, take: 100, select: { id: true, studentId: true } }),
    prisma.feeInvoice.findMany({ where: { dueDate: { lt: start }, status: { in: ["DUE", "PARTIALLY_PAID", "OVERDUE"] } }, take: 100, select: { id: true, studentId: true, dueDate: true } }),
    prisma.daycareSession.findMany({ where: { sessionDate: { gte: start, lt: end }, checkInAt: { not: null }, checkOutAt: null, status: { notIn: ["CANCELLED", "COMPLETED"] } }, take: 100, select: { id: true, studentId: true } }),
    prisma.daycareSession.findMany({ where: { emergencyCare: true, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }, take: 100, select: { id: true } }),
    prisma.careerApplication.findMany({ where: { status: "NEW" }, take: 100, select: { id: true, createdAt: true } }),
    prisma.whatsAppAutomationMessage.findMany({ where: { status: "FAILED", failedAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } }, take: 100, select: { id: true, receiptId: true, failedAt: true } }),
    prisma.marketingConversionJob.findMany({ where: { status: "DEAD" }, take: 100, select: { id: true, provider: true, eventType: true } }),
    prisma.growthRecommendation.findMany({ where: { status: "RECOMMENDED", approvalRequired: true }, take: 100, select: { id: true } }),
  ]);
  for (const item of followUps) await createAdminNotification({ category: "FOLLOW_UP", type: "MISSED_FOLLOW_UP", priority: "HIGH", title: "Follow-up needs attention", body: "One admission follow-up is overdue.", href: `/admin/enquiries/${item.enquiryId}`, entityType: "FOLLOW_UP", entityId: item.id, eventKey: `${item.id}:${dayKey(item.dueAt)}`, important: true });
  for (const item of visits) await createAdminNotification({ category: "VISIT", type: "VISIT_TODAY", title: "Centre visit scheduled today", body: "One family is scheduled to visit the centre today.", href: `/admin/enquiries/${item.enquiryId}`, entityType: "LEAD_APPOINTMENT", entityId: item.id, eventKey: `${item.id}:${today}` });
  for (const item of missedVisits) await createAdminNotification({ category: "VISIT", type: "VISIT_MISSED", priority: "HIGH", title: "Scheduled visit was missed", body: "One family did not attend a scheduled centre visit.", href: `/admin/enquiries/${item.enquiryId}`, entityType: "LEAD_APPOINTMENT", entityId: item.id, eventKey: item.id, important: true });
  for (const item of pendingAdmissions) await createAdminNotification({ category: "STUDENT", type: "ADMISSION_DOCUMENTS_PENDING", title: "Admission documents pending", body: "One admission still needs documents to be completed.", href: item.studentId ? `/admin/students/${item.studentId}?tab=documents` : "/admin/admissions", entityType: "ADMISSION", entityId: item.id, eventKey: `${item.id}:${today}` });
  for (const item of fees) await createAdminNotification({ category: "FEES", type: "FEE_OVERDUE", priority: "HIGH", title: "Fee payment needs attention", body: "Fee payment is overdue for one student.", href: `/admin/students/${item.studentId}?tab=finance`, entityType: "FEE_INVOICE", entityId: item.id, eventKey: `${item.id}:${today}`, important: true });
  for (const item of daycare) await createAdminNotification({ category: "DAYCARE", type: "DAYCARE_CHECKOUT_PENDING", priority: "HIGH", title: "Daycare checkout pending", body: "One daycare child still needs to be checked out.", href: "/admin/daycare", entityType: "DAYCARE_SESSION", entityId: item.id, eventKey: `${item.id}:${today}`, important: true });
  for (const item of extraDaycare) await createAdminNotification({ category: "DAYCARE", type: "EXTRA_DAYCARE_RECORDED", title: "Additional daycare recorded", body: "An additional daycare entry is ready for operational review.", href: "/admin/daycare", entityType: "DAYCARE_SESSION", entityId: item.id, eventKey: item.id });
  for (const item of careers) await createAdminNotification({ category: "CAREERS", type: "CAREER_APPLICATION", title: "New career application received", body: "A new recruitment application is ready for review.", href: `/admin/careers?applicationId=${item.id}`, entityType: "CAREER_APPLICATION", entityId: item.id, eventKey: item.id });
  for (const item of whatsapp) await createAdminNotification({ category: "WHATSAPP", type: "WHATSAPP_DELIVERY_FAILED", priority: "HIGH", title: "WhatsApp receipt delivery failed", body: "One receipt message could not be delivered and needs attention.", href: item.receiptId ? `/admin/receipts/${item.receiptId}` : "/admin/whatsapp", entityType: "WHATSAPP_MESSAGE", entityId: item.id, eventKey: item.id, important: true });
  for (const item of conversionFailures) await createAdminNotification({ category: "SYSTEM", type: "CONVERSION_DELIVERY_FAILED", priority: "HIGH", title: "Marketing conversion delivery failed", body: `One ${item.provider === "GOOGLE_ADS" ? "Google Ads" : "Meta"} conversion reached its retry limit.`, href: "/admin/marketing/conversions", entityType: "MARKETING_CONVERSION_JOB", entityId: item.id, eventKey: item.id, important: true, ownerOnly: true });
  for (const item of aiRecommendations) await createAdminNotification({ category: "AI_GROWTH", type: "AI_RECOMMENDATION_APPROVAL", title: "AI recommendation awaits approval", body: "A new evidence-based recommendation is ready for Owner review.", href: "/admin/growth", entityType: "GROWTH_RECOMMENDATION", entityId: item.id, eventKey: item.id, ownerOnly: true });
  const indiaHour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23" }).format(now));
  if (indiaHour >= 11) {
    const [activeStudents, studentAttendance, activeStaff, staffAttendance] = await Promise.all([
      prisma.student.count({ where: { status: "ACTIVE", joiningDate: { lte: end }, OR: [{ leavingDate: null }, { leavingDate: { gte: start } }] } }),
      prisma.studentAttendance.count({ where: { attendanceDate: { gte: start, lt: end } } }),
      prisma.staff.count({ where: { status: "ACTIVE", joiningDate: { lte: end }, OR: [{ leavingDate: null }, { leavingDate: { gte: start } }] } }),
      prisma.staffAttendance.count({ where: { attendanceDate: { gte: start, lt: end } } }),
    ]);
    if (activeStudents > 0 && studentAttendance === 0) await createAdminNotification({ category: "ATTENDANCE", type: "STUDENT_ATTENDANCE_PENDING", priority: "HIGH", title: "Student attendance not marked", body: "Today’s preschool attendance register has not been saved.", href: `/admin/attendance?date=${today}`, eventKey: today, important: true });
    if (activeStaff > 0 && staffAttendance === 0) await createAdminNotification({ category: "ATTENDANCE", type: "STAFF_ATTENDANCE_PENDING", priority: "HIGH", title: "Staff attendance not marked", body: "Today’s staff attendance register has not been saved.", href: `/admin/staff/attendance?date=${today}`, eventKey: today, important: true });
  }
  return { followUps: followUps.length, visits: visits.length, missedVisits: missedVisits.length, pendingAdmissions: pendingAdmissions.length, fees: fees.length, daycare: daycare.length, extraDaycare: extraDaycare.length, careers: careers.length, whatsapp: whatsapp.length, conversionFailures: conversionFailures.length, aiRecommendations: aiRecommendations.length };
}
