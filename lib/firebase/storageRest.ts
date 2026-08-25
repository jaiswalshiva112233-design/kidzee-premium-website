import "server-only";

import { firebaseProjectId, getGoogleAccessToken } from "@/lib/firebase/googleAuth";

export async function uploadPrivateFile(
  storagePath: string,
  bytes: Uint8Array,
  contentType: string,
) {
  const projectId = firebaseProjectId();
  const bucket = process.env.FIREBASE_STORAGE_BUCKET?.trim() || `${projectId}.firebasestorage.app`;
  if (!projectId || !bucket) throw new Error("Firebase Storage is not configured.");
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
      body: Buffer.from(bytes),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const message = (await response.text()).slice(0, 500);
    throw new Error(`Storage upload failed (${response.status}): ${message}`);
  }
  return response.json() as Promise<{ name: string; bucket: string; size?: string }>;
}

export async function downloadPrivateFile(storagePath: string) {
  const projectId = firebaseProjectId();
  const bucket = process.env.FIREBASE_STORAGE_BUCKET?.trim() || `${projectId}.firebasestorage.app`;
  if (!projectId || !bucket) throw new Error("Firebase Storage is not configured.");
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Storage download failed (${response.status}).`);
  return new Uint8Array(await response.arrayBuffer());
}
