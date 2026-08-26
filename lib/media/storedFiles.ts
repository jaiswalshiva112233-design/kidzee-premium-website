import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import {
  firebasePublicFileUrl,
  firebaseStorageBucket,
  uploadStoredFile,
} from "@/lib/firebase/storageRest";

import { processPrivateImage, processPublicImage } from "./imageProcessing";
import { getMediaSafetySetting } from "./mediaSafety";

function safeSegment(value: string, fallback: string) {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return cleaned || fallback;
}

export async function storePublicGalleryImage(input: {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
  albumId: string;
  uploadedById: string;
  module?: string;
  linkedRecordType?: string;
  linkedRecordId?: string;
  pathPrefix?: string;
}) {
  const settings = await getMediaSafetySetting();
  const id = randomUUID();
  const albumSegment = safeSegment(input.albumId, "album");
  const root = `${input.pathPrefix ?? "public/gallery/media"}/${albumSegment}/${id}`;
  const webPath = `${root}/web.webp`;
  const thumbnailPath = `${root}/thumbnail.webp`;
  const archivePath = settings.originalArchiveEnabled
    ? `${root}/original-${safeSegment(input.fileName, "image")}`
    : null;
  const sha256 = createHash("sha256").update(input.bytes).digest("hex");

  await prisma.storedFile.create({
    data: {
      id,
      provider: "FIREBASE_STORAGE",
      bucket: firebaseStorageBucket(),
      storagePath: webPath,
      visibility: "PUBLIC",
      module: input.module ?? "WEBSITE_GALLERY",
      linkedRecordType: input.linkedRecordType ?? "WebsiteGalleryAlbum",
      linkedRecordId: input.linkedRecordId ?? input.albumId,
      originalName: input.fileName,
      mimeType: input.mimeType,
      originalSize: input.bytes.byteLength,
      sha256,
      status: "PROCESSING",
      uploadedById: input.uploadedById,
      metadata: { thumbnailPath, archivePath },
    },
  });

  try {
    const processed = await processPublicImage(input.bytes);
    await Promise.all([
      uploadStoredFile(webPath, processed.web, "image/webp"),
      uploadStoredFile(thumbnailPath, processed.thumbnail, "image/webp"),
      archivePath
        ? uploadStoredFile(archivePath, input.bytes, input.mimeType)
        : Promise.resolve(),
    ]);
    return await prisma.storedFile.update({
      where: { id },
      data: {
        publicUrl: firebasePublicFileUrl(webPath),
        optimizedSize: processed.web.byteLength,
        thumbnailSize: processed.thumbnail.byteLength,
        width: processed.width,
        height: processed.height,
        status: "READY",
        mimeType: "image/webp",
        metadata: {
          thumbnailPath,
          thumbnailUrl: firebasePublicFileUrl(thumbnailPath),
          archivePath,
          originalMimeType: input.mimeType,
        },
      },
    });
  } catch (error) {
    await prisma.storedFile.update({
      where: { id },
      data: {
        status: "FAILED",
        processingError: error instanceof Error ? error.name : "ImageProcessingError",
      },
    });
    throw error;
  }
}

export async function storePrivateStudentFile(input: {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
  studentId: string;
  linkedRecordId: string;
  uploadedById: string;
  compressImage: boolean;
}) {
  const id = randomUUID();
  let storedBytes = input.bytes;
  let storedMimeType = input.mimeType;
  let width: number | null = null;
  let height: number | null = null;
  if (input.compressImage && input.mimeType.startsWith("image/")) {
    const processed = await processPrivateImage(input.bytes);
    storedBytes = processed.bytes;
    storedMimeType = processed.mimeType;
    width = processed.width;
    height = processed.height;
  }
  const extension = storedMimeType === "image/webp" ? "webp" : safeSegment(input.fileName, "document");
  const storagePath = `private/students/${safeSegment(input.studentId, "student")}/documents/${id}-${extension}`;
  await uploadStoredFile(storagePath, storedBytes, storedMimeType);
  return prisma.storedFile.create({
    data: {
      id,
      provider: "FIREBASE_STORAGE",
      bucket: firebaseStorageBucket(),
      storagePath,
      publicUrl: null,
      visibility: "PRIVATE",
      module: "STUDENT_DOCUMENTS",
      linkedRecordType: "StudentDocument",
      linkedRecordId: input.linkedRecordId,
      originalName: input.fileName,
      mimeType: storedMimeType,
      originalSize: input.bytes.byteLength,
      optimizedSize: storedBytes.byteLength,
      width,
      height,
      sha256: createHash("sha256").update(input.bytes).digest("hex"),
      status: "READY",
      uploadedById: input.uploadedById,
      metadata: { originalMimeType: input.mimeType },
    },
  });
}
