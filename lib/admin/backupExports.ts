import "server-only";

import type { $Enums } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { sanityServerClient } from "@/lib/sanity/serverClient";

function redactBackupValue(key: string, value: unknown) {
  if (/password|secret|token|credential|private.?key|api.?key/i.test(key)) return undefined;
  if (value instanceof Uint8Array) return { excludedBinary: true, byteLength: value.byteLength };
  if (typeof value === "bigint") return value.toString();
  if (
    typeof value === "string" &&
    (
      /[?&](?:X-Goog-(?:Algorithm|Credential|Date|Expires|Signature|SignedHeaders)|token)=/i.test(value) ||
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i.test(value) ||
      /^Bearer\s+[A-Za-z0-9._~+/=-]+$/i.test(value)
    )
  ) return "[sensitive value excluded]";
  return value;
}

function jsonPayload(exportType: $Enums.BackupExportType, data: unknown) {
  return JSON.stringify(
    {
      format: "Kidzee CentreOS safe logical backup",
      version: 1,
      exportType,
      generatedAt: new Date().toISOString(),
      restoreNotice: "Restore is intentionally not automated. Validate this file with your technical administrator before any recovery operation.",
      data,
    },
    redactBackupValue,
    2,
  );
}

async function databaseBackup() {
  const [
    enquiries,
    leadFamilies,
    leadActivities,
    leadAppointments,
    websiteLeadSubmissions,
    admissions,
    students,
    guardians,
    contracts,
    studentCharges,
    daycareSessions,
    invoices,
    payments,
    receipts,
    corrections,
    expenses,
    staff,
    attendance,
    staffAttendance,
    staffLeave,
    staffExtraDuty,
    payroll,
    activityLogs,
    marketingConversionJobs,
    careers,
    campaignUrls,
  ] = await Promise.all([
    prisma.enquiry.findMany({ include: { followUps: true } }),
    prisma.leadFamily.findMany(),
    prisma.leadActivity.findMany(),
    prisma.leadAppointment.findMany(),
    prisma.websiteLeadSubmission.findMany(),
    prisma.admission.findMany(),
    prisma.student.findMany({
      include: {
        guardians: true,
        documents: {
          select: {
            id: true, studentId: true, documentType: true, title: true, fileName: true,
            mimeType: true, fileSize: true, sha256: true, status: true, notes: true,
            rejectionReason: true, expiresAt: true, storedFileId: true, uploadedById: true,
            verifiedById: true, verifiedAt: true, createdAt: true, updatedAt: true,
          },
        },
        daycarePlans: true,
        daycareSessions: true,
        ledgerCharges: true,
      },
    }),
    prisma.guardian.findMany(),
    prisma.studentEnrollmentContract.findMany({ include: { services: true } }),
    prisma.studentCharge.findMany(),
    prisma.daycareSession.findMany({ include: { meals: true } }),
    prisma.feeInvoice.findMany({ include: { items: true } }),
    prisma.feePayment.findMany(),
    prisma.receipt.findMany(),
    prisma.financialCorrection.findMany(),
    prisma.expense.findMany(),
    prisma.staff.findMany(),
    prisma.studentAttendance.findMany(),
    prisma.staffAttendance.findMany(),
    prisma.staffLeaveRequest.findMany(),
    prisma.staffExtraDuty.findMany(),
    prisma.staffPayroll.findMany(),
    prisma.activityLog.findMany(),
    prisma.marketingConversionJob.findMany(),
    prisma.careerApplication.findMany({
      select: {
        id: true, applicationNumber: true, name: true, phone: true, email: true,
        location: true, position: true, leadType: true, qualification: true,
        experience: true, currentRole: true, expectedSalary: true,
        joiningAvailability: true, message: true, consent: true, status: true,
        resumeFileName: true, resumeMimeType: true, resumeSize: true,
        resumeStoragePath: true, trafficClass: true, source: true, medium: true,
        campaign: true, content: true, term: true, referrer: true,
        landingPage: true, gclid: true, gbraid: true, wbraid: true,
        fbclid: true, fbc: true, fbp: true, firstTouch: true, lastTouch: true,
        notes: true, reviewedAt: true, createdAt: true, updatedAt: true,
      },
    }),
    prisma.campaignUrl.findMany(),
  ]);
  const data = {
    enquiries,
    leadFamilies,
    leadActivities,
    leadAppointments,
    websiteLeadSubmissions,
    admissions,
    students,
    guardians,
    contracts,
    studentCharges,
    daycareSessions,
    invoices,
    payments,
    receipts,
    corrections,
    expenses,
    staff,
    attendance,
    staffAttendance,
    staffLeave,
    staffExtraDuty,
    payroll,
    activityLogs,
    marketingConversionJobs,
    careers,
    campaignUrls,
  };
  return { data, recordCount: Object.values(data).reduce((sum, rows) => sum + rows.length, 0) };
}

async function websiteContentBackup() {
  const [documents, landingPages, landingPageVariants, landingPageVersions, campaignUrls] = await Promise.all([
    sanityServerClient.fetch<unknown[]>(
      `*[_type match "website*"] | order(_type asc, _createdAt asc)`,
      {},
      { cache: "no-store" },
    ),
    prisma.landingPage.findMany(),
    prisma.landingPageVariant.findMany(),
    prisma.landingPageVersion.findMany(),
    prisma.campaignUrl.findMany(),
  ]);
  return {
    data: { sanityDocuments: documents, landingPages, landingPageVariants, landingPageVersions, campaignUrls },
    recordCount: documents.length + landingPages.length + landingPageVariants.length + landingPageVersions.length + campaignUrls.length,
  };
}

async function mediaIndexBackup() {
  const files = await prisma.storedFile.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, provider: true, bucket: true, storagePath: true, visibility: true,
      module: true, linkedRecordType: true, linkedRecordId: true, originalName: true,
      mimeType: true, originalSize: true, optimizedSize: true, thumbnailSize: true,
      width: true, height: true, sha256: true, status: true, processingError: true,
      metadata: true, uploadedById: true, archivedAt: true, deletedAt: true,
      createdAt: true, updatedAt: true,
    },
  });
  const mediaIndex = files.map((file) => {
    const metadata = file.metadata && typeof file.metadata === "object" && !Array.isArray(file.metadata)
      ? file.metadata as Record<string, unknown>
      : {};
    return {
      fileId: file.id,
      fileName: file.originalName,
      module: file.module,
      linkedRecordType: file.linkedRecordType,
      linkedRecordId: file.linkedRecordId,
      storageProvider: file.provider,
      bucket: file.bucket,
      optimizedImagePath: file.storagePath,
      thumbnailPath: typeof metadata.thumbnailPath === "string" ? metadata.thumbnailPath : null,
      originalArchivePath: typeof metadata.archivePath === "string" ? metadata.archivePath : null,
      visibility: file.visibility,
      mimeType: file.mimeType,
      originalSize: file.originalSize,
      optimizedSize: file.optimizedSize,
      thumbnailSize: file.thumbnailSize,
      width: file.width,
      height: file.height,
      sha256: file.sha256,
      status: file.status,
      processingError: file.processingError,
      uploadedById: file.uploadedById,
      uploadedAt: file.createdAt,
      archivedAt: file.archivedAt,
      deletedAt: file.deletedAt,
      updatedAt: file.updatedAt,
    };
  });
  return { data: { files: mediaIndex, note: "Binary media and signed URLs are not included. Storage paths are an index only." }, recordCount: mediaIndex.length };
}

async function settingsBackup() {
  const [centre, programmes, daycarePlans, meals, mealCombinations, charges, programmeFees, daycareRates, mediaSafety] = await Promise.all([
    prisma.centreSetting.findMany(),
    prisma.programmeDefinition.findMany({ include: { feeVersions: true } }),
    prisma.daycarePlanDefinition.findMany({ include: { priceVersions: true } }),
    prisma.mealDefinition.findMany({ include: { priceVersions: true } }),
    prisma.mealCombination.findMany({ include: { items: true, priceVersions: true } }),
    prisma.chargeDefinition.findMany(),
    prisma.programmeFeeSetting.findMany(),
    prisma.daycareRateSetting.findMany(),
    prisma.mediaSafetySetting.findMany(),
  ]);
  const data = { centre, programmes, daycarePlans, meals, mealCombinations, charges, programmeFees, daycareRates, mediaSafety };
  return { data, recordCount: Object.values(data).reduce((sum, rows) => sum + rows.length, 0) };
}

export async function createSafeBackup(input: {
  exportType: $Enums.BackupExportType;
  userId: string;
  userName: string;
}) {
  const history = await prisma.backupExport.create({
    data: { exportType: input.exportType, createdById: input.userId, createdByName: input.userName },
  });
  try {
    const result = input.exportType === "DATABASE"
      ? await databaseBackup()
      : input.exportType === "WEBSITE_CONTENT"
        ? await websiteContentBackup()
        : input.exportType === "MEDIA_INDEX"
          ? await mediaIndexBackup()
          : await settingsBackup();
    const payload = jsonPayload(input.exportType, result.data);
    const fileName = `kidzee-centreos-${input.exportType.toLowerCase().replaceAll("_", "-")}-${new Date().toISOString().slice(0, 10)}.json`;
    const completed = await prisma.backupExport.update({
      where: { id: history.id },
      data: { status: "COMPLETED", fileName, sizeBytes: Buffer.byteLength(payload), recordCount: result.recordCount, completedAt: new Date() },
    });
    await prisma.activityLog.create({
      data: {
        adminUserId: input.userId,
        action: "EXPORTED",
        entityType: "BackupExport",
        entityId: history.id,
        description: `${input.exportType.replaceAll("_", " ")} backup downloaded by Owner.`,
        newData: { fileName, sizeBytes: completed.sizeBytes, recordCount: result.recordCount },
      },
    });
    return { payload, history: completed };
  } catch (error) {
    await prisma.backupExport.update({
      where: { id: history.id },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.name : "BackupError", completedAt: new Date() },
    });
    throw error;
  }
}
