import "server-only";

import { getMediaSafetySetting } from "@/lib/media/mediaSafety";
import { prisma } from "@/lib/prisma";
import { sanityServerClient } from "@/lib/sanity/serverClient";

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getStorageHealthSnapshot() {
  const [settings, files, largestFiles, failedFiles, recentBackups, legacyBlobCount] = await Promise.all([
    getMediaSafetySetting(),
    prisma.storedFile.findMany({
      where: { status: { not: "DELETED" } },
      select: {
        id: true,
        provider: true,
        visibility: true,
        module: true,
        linkedRecordType: true,
        linkedRecordId: true,
        storagePath: true,
        publicUrl: true,
        originalSize: true,
        optimizedSize: true,
        thumbnailSize: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.storedFile.findMany({
      where: { status: { not: "DELETED" } },
      orderBy: { originalSize: "desc" },
      take: 10,
      select: { id: true, originalName: true, module: true, visibility: true, originalSize: true, optimizedSize: true, status: true, createdAt: true },
    }),
    prisma.storedFile.findMany({
      where: { status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, originalName: true, module: true, processingError: true, updatedAt: true },
    }),
    prisma.backupExport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT (
        (SELECT COUNT(*) FROM "StudentDocument" WHERE "fileData" IS NOT NULL) +
        (SELECT COUNT(*) FROM "CareerApplication" WHERE "resumeData" IS NOT NULL) +
        (SELECT COUNT(*) FROM "AcademicCalendarDocument" WHERE "fileData" IS NOT NULL)
      )::bigint AS count
    `,
  ]);

  let galleryDiagnostics = { missingThumbnails: 0, brokenPublishedMedia: 0 };
  try {
    galleryDiagnostics = await sanityServerClient.fetch<typeof galleryDiagnostics>(
      `{
        "missingThumbnails": count(*[_type == "websiteGalleryMedia" && mediaType == "VIDEO" && !defined(image.asset) && !defined(externalImageUrl)]),
        "brokenPublishedMedia": count(*[_type == "websiteGalleryMedia" && published == true && ((mediaType == "PHOTO" && !defined(image.asset) && !defined(externalImageUrl)) || (mediaType == "VIDEO" && !defined(video.asset) && !defined(embedUrl)))])
      }`,
      {},
      { cache: "no-store" },
    );
  } catch {
    galleryDiagnostics = { missingThumbnails: 0, brokenPublishedMedia: 0 };
  }

  const monthlyGrowth = new Map<string, { files: number; bytes: number }>();
  for (const file of files) {
    const key = monthKey(file.createdAt);
    const current = monthlyGrowth.get(key) ?? { files: 0, bytes: 0 };
    current.files += 1;
    current.bytes += file.optimizedSize ?? file.originalSize;
    monthlyGrowth.set(key, current);
  }

  const publicPrivateMismatches = files.filter((file) =>
    (file.visibility === "PRIVATE" && Boolean(file.publicUrl)) ||
    (file.visibility === "PRIVATE" && Boolean(file.storagePath) && !file.storagePath?.startsWith("private/")) ||
    (file.visibility === "PUBLIC" && Boolean(file.storagePath) && file.storagePath?.startsWith("private/")),
  ).length;
  const orphanedFiles = files.filter((file) =>
    file.status !== "ARCHIVED" && (!file.linkedRecordType || !file.linkedRecordId),
  ).length;
  const totalBytes = files.reduce((sum, file) => sum + (file.optimizedSize ?? file.originalSize), 0);
  const publicBytes = files.filter((file) => file.visibility === "PUBLIC").reduce((sum, file) => sum + (file.optimizedSize ?? file.originalSize), 0);
  const privateBytes = totalBytes - publicBytes;

  return {
    settings,
    totals: {
      files: files.length,
      bytes: totalBytes,
      publicFiles: files.filter((file) => file.visibility === "PUBLIC").length,
      publicBytes,
      privateFiles: files.filter((file) => file.visibility === "PRIVATE").length,
      privateBytes,
      archivedFiles: files.filter((file) => file.status === "ARCHIVED").length,
      failedFiles: failedFiles.length,
      orphanedFiles,
      publicPrivateMismatches,
      legacyDatabaseFiles: Number(legacyBlobCount[0]?.count ?? 0),
      missingThumbnails: galleryDiagnostics.missingThumbnails,
      brokenPublishedMedia: galleryDiagnostics.brokenPublishedMedia,
    },
    largestFiles,
    failedFiles,
    monthlyGrowth: Array.from(monthlyGrowth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, value]) => ({ month, ...value })),
    recentBackups,
    provider: {
      configured: Boolean(process.env.FIREBASE_PROJECT_ID?.trim() && process.env.FIREBASE_STORAGE_BUCKET?.trim()),
      bucket: process.env.FIREBASE_STORAGE_BUCKET?.trim() || null,
    },
  };
}
