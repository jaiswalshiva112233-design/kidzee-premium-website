import "server-only";

import { firebaseProjectId, getGoogleAccessToken } from "@/lib/firebase/googleAuth";

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
  const databaseId = process.env.FIREBASE_DATABASE_ID?.trim() || "(default)";
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
