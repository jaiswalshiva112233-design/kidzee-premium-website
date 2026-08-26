import "server-only";

import { firebaseProjectId, getGoogleAccessToken } from "@/lib/firebase/googleAuth";

export function firebaseStorageBucket() {
  const projectId = firebaseProjectId();
  const bucket = process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    (projectId ? `${projectId}.firebasestorage.app` : "");
  if (!projectId || !bucket) throw new Error("Firebase Storage is not configured.");
  return bucket;
}

export function firebasePublicFileUrl(storagePath: string) {
  const bucket = firebaseStorageBucket();
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}?alt=media`;
}

export async function uploadStoredFile(
  storagePath: string,
  bytes: Uint8Array,
  contentType: string,
) {
  const bucket = firebaseStorageBucket();
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
      body: Buffer.from(bytes),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) {
    throw new Error(`Storage upload failed (${response.status}).`);
  }
  return response.json() as Promise<{ name: string; bucket: string; size?: string }>;
}

export const uploadPrivateFile = uploadStoredFile;

export async function downloadPrivateFile(storagePath: string) {
  const bucket = firebaseStorageBucket();
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) throw new Error(`Storage download failed (${response.status}).`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function deleteStoredFile(storagePath: string) {
  const bucket = firebaseStorageBucket();
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`Storage deletion failed (${response.status}).`);
  }
}
