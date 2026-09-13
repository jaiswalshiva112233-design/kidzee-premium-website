import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { firebaseProjectId, getGoogleAccessToken } from "./googleAuth";

type FirestoreValue = Record<string, unknown>;

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  return { stringValue: String(value) };
}

function toFirestoreFields(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toFirestoreValue(item)]));
}

function baseUrl() {
  const projectId = firebaseProjectId();
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not configured.");
  const rawDatabaseId = process.env.FIREBASE_DATABASE_ID?.trim() || "(default)";
  const databaseId = rawDatabaseId === "default" ? "(default)" : rawDatabaseId;
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents`;
}

export async function upsertFirestoreDocument(
  collection: string,
  documentId: string,
  data: Record<string, unknown>,
) {
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `${baseUrl()}/${encodeURIComponent(collection)}/${encodeURIComponent(documentId)}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!response.ok) {
    const message = (await response.text()).slice(0, 500);
    throw new Error(`Firestore write failed (${response.status}): ${message}`);
  }
  return response.json();
}

export async function safeFirestoreMirror(
  collection: string,
  documentId: string,
  data: Record<string, unknown>,
) {
  if (!firebaseProjectId()) return { mirrored: false, reason: "not-configured" as const };
  try {
    await upsertFirestoreDocument(collection, documentId, data);
    return { mirrored: true };
  } catch (error) {
    console.error("Firebase mirror failed without blocking the primary operation.", error);
    return { mirrored: false, reason: "write-failed" as const };
  }
}

export const FIRESTORE_OUTBOX_MAX_ATTEMPTS = 5;
export const FIRESTORE_OUTBOX_BASE_DELAY_MS = 60 * 1000;
export const FIRESTORE_OUTBOX_MAX_DELAY_MS = 24 * 60 * 60 * 1000;

export function firestoreOutboxRetryDelay(attempts: number) {
  return Math.min(
    FIRESTORE_OUTBOX_MAX_DELAY_MS,
    FIRESTORE_OUTBOX_BASE_DELAY_MS * 2 ** Math.max(0, Math.trunc(attempts) - 1),
  );
}

export type DeliverFirestoreMirrorsDeps = {
  safeFirestoreMirror?: typeof safeFirestoreMirror;
  isConfigured?: () => boolean;
  now?: () => Date;
};

export function buildFirestoreOutboxWhere(
  now: Date = new Date(),
  configured: boolean = Boolean(firebaseProjectId()),
): Prisma.ActivityLogWhereInput {
  const nowIso = now.toISOString();

  const eligibleConditions: Prisma.ActivityLogWhereInput[] = [
    { newData: { path: ["status"], equals: "PENDING" } },
    {
      AND: [
        { newData: { path: ["status"], equals: "RETRY" } },
        {
          OR: [
            { newData: { path: ["nextAttemptAt"], equals: Prisma.AnyNull } },
            { newData: { path: ["nextAttemptAt"], lte: nowIso } },
          ],
        },
      ],
    },
  ];

  if (configured) {
    eligibleConditions.push({
      newData: { path: ["status"], equals: "CONFIG_BLOCKED" },
    });
  }

  const whereClause = {
    entityType: "FIRESTORE_MIRROR_OUTBOX",
    action: { not: "ARCHIVED" },
    OR: eligibleConditions,
  } satisfies Prisma.ActivityLogWhereInput;

  return whereClause;
}

export async function deliverPendingFirestoreMirrors(
  limit = 50,
  client?: any,
  deps?: DeliverFirestoreMirrorsDeps,
) {
  const mirrorFn = deps?.safeFirestoreMirror || safeFirestoreMirror;
  const configured = deps?.isConfigured ? deps.isConfigured() : Boolean(firebaseProjectId());
  const now = deps?.now ? deps.now() : new Date();
  const nowIso = now.toISOString();

  const dbClient = client || (await import("../prisma")).prisma;

  const whereClause = buildFirestoreOutboxWhere(now, configured);

  // DB selection: Select only eligible work now (PENDING, due RETRY, or recoverable CONFIG_BLOCKED).
  // Ineligible future retries and completed/terminal records do NOT occupy the processing limit.
  const pendingLogs = await dbClient.activityLog.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
    take: Math.min(limit, 100),
  });

  let delivered = 0;
  let failed = 0;
  let skipped = 0;

  for (const log of pendingLogs) {
    const data = ((log.newData as Record<string, unknown>) ?? {}) as Record<string, unknown>;

    // Safety guard: skip already completed or terminal failed records
    if (data.status === "DELIVERED" || data.status === "FAILED") continue;
    const attempts = Number(data.attempts || 0);
    if (attempts >= FIRESTORE_OUTBOX_MAX_ATTEMPTS) continue;

    // Enforce exponential backoff delay eligibility: A RETRY record must not be attempted before nextAttemptAt
    if (data.status === "RETRY" && data.nextAttemptAt) {
      const nextAttemptTime = new Date(String(data.nextAttemptAt)).getTime();
      if (!Number.isNaN(nextAttemptTime) && nextAttemptTime > now.getTime()) {
        skipped += 1;
        continue; // Not yet due for retry
      }
    }

    // Explicit check for missing configuration
    if (!configured) {
      // Missing Firebase configuration must never result in DELIVERED.
      // Mark CONFIG_BLOCKED for later delivery; do not increment attempts or count as delivered.
      await dbClient.activityLog.update({
        where: { id: log.id },
        data: {
          action: "UPDATED",
          newData: {
            ...data,
            status: "CONFIG_BLOCKED",
            lastAttemptAt: nowIso,
            nextAttemptAt: null,
            lastError: "Firebase project is not configured (FIREBASE_PROJECT_ID missing)",
          },
        },
      });
      skipped += 1;
      continue;
    }

    const payload = ((data.payload as Record<string, unknown>) ?? {}) as Record<string, Record<string, unknown>>;
    const submissionData = payload.leadSubmission;
    const leadData = payload.lead;
    const submissionId = String(data.submissionId ?? log.entityId ?? "");
    const enquiryNumber = String(data.enquiryNumber ?? "");

    try {
      if (submissionId && submissionData) {
        const subResult = await mirrorFn("leadSubmissions", submissionId, submissionData);
        if (!subResult.mirrored) {
          if (subResult.reason === "not-configured") {
            throw new Error("Firebase project is not configured");
          }
          throw new Error("Failed to write leadSubmission to Firestore");
        }
      }
      if (enquiryNumber && leadData) {
        const leadResult = await mirrorFn("leads", enquiryNumber, leadData);
        if (!leadResult.mirrored) {
          if (leadResult.reason === "not-configured") {
            throw new Error("Firebase project is not configured");
          }
          throw new Error("Failed to write lead to Firestore");
        }
      }

      await dbClient.activityLog.update({
        where: { id: log.id },
        data: {
          action: "ARCHIVED", // Delivered outbox record is archived so it never occupies queue slots
          newData: {
            ...data,
            status: "DELIVERED",
            deliveredAt: nowIso,
            lastError: null,
            nextAttemptAt: null,
          },
        },
      });
      delivered += 1;
    } catch (err) {
      const nextAttempts = attempts + 1;
      const terminal = nextAttempts >= FIRESTORE_OUTBOX_MAX_ATTEMPTS;
      const errorMsg = err instanceof Error ? err.message.slice(0, 500) : "Firestore mirror failed";

      const delayMs = firestoreOutboxRetryDelay(nextAttempts);
      const nextAttemptIso = terminal ? null : new Date(now.getTime() + delayMs).toISOString();

      await dbClient.activityLog.update({
        where: { id: log.id },
        data: {
          action: terminal ? "ARCHIVED" : "UPDATED",
          newData: {
            ...data,
            status: terminal ? "FAILED" : "RETRY",
            attempts: nextAttempts,
            lastError: errorMsg,
            lastAttemptAt: nowIso,
            nextAttemptAt: nextAttemptIso,
          },
        },
      });
      failed += 1;
    }
  }

  return { processed: pendingLogs.length, delivered, failed, skipped };
}
