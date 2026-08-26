ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'VIEWED';
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'DOWNLOADED';
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE TYPE "StoredFileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "StoredFileStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED', 'ARCHIVED', 'DELETED');
CREATE TYPE "BackupExportType" AS ENUM ('DATABASE', 'WEBSITE_CONTENT', 'MEDIA_INDEX', 'SETTINGS');
CREATE TYPE "BackupExportStatus" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'FIREBASE_STORAGE',
    "bucket" TEXT,
    "storagePath" TEXT,
    "publicUrl" TEXT,
    "visibility" "StoredFileVisibility" NOT NULL,
    "module" TEXT NOT NULL,
    "linkedRecordType" TEXT,
    "linkedRecordId" TEXT,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalSize" INTEGER NOT NULL,
    "optimizedSize" INTEGER,
    "thumbnailSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "sha256" TEXT,
    "status" "StoredFileStatus" NOT NULL DEFAULT 'PROCESSING',
    "processingError" TEXT,
    "metadata" JSONB,
    "uploadedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaSafetySetting" (
    "id" TEXT NOT NULL DEFAULT 'centre-media-safety',
    "aiMediaFeaturesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "directVideoUploadEnabled" BOOLEAN NOT NULL DEFAULT false,
    "externalEmbedsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "originalArchiveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "compressionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "privateProtectionLocked" BOOLEAN NOT NULL DEFAULT true,
    "backupWarningsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "growthWarningsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaSafetySetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BackupExport" (
    "id" TEXT NOT NULL,
    "exportType" "BackupExportType" NOT NULL,
    "status" "BackupExportStatus" NOT NULL DEFAULT 'GENERATING',
    "fileName" TEXT,
    "sizeBytes" INTEGER,
    "recordCount" INTEGER,
    "errorMessage" TEXT,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BackupExport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoredFile_storagePath_key" ON "StoredFile"("storagePath");
CREATE INDEX "StoredFile_visibility_status_idx" ON "StoredFile"("visibility", "status");
CREATE INDEX "StoredFile_module_linkedRecordType_linkedRecordId_idx" ON "StoredFile"("module", "linkedRecordType", "linkedRecordId");
CREATE INDEX "StoredFile_uploadedById_createdAt_idx" ON "StoredFile"("uploadedById", "createdAt");
CREATE INDEX "StoredFile_createdAt_idx" ON "StoredFile"("createdAt");
CREATE INDEX "BackupExport_exportType_createdAt_idx" ON "BackupExport"("exportType", "createdAt");
CREATE INDEX "BackupExport_status_createdAt_idx" ON "BackupExport"("status", "createdAt");
CREATE INDEX "BackupExport_createdById_createdAt_idx" ON "BackupExport"("createdById", "createdAt");

ALTER TABLE "StudentDocument" ADD COLUMN "storedFileId" TEXT;
ALTER TABLE "StudentDocument" ALTER COLUMN "fileData" DROP NOT NULL;
CREATE UNIQUE INDEX "StudentDocument_storedFileId_key" ON "StudentDocument"("storedFileId");
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_storedFileId_fkey"
  FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "StoredFile" (
  "id", "provider", "visibility", "module", "linkedRecordType", "linkedRecordId",
  "originalName", "mimeType", "originalSize", "sha256", "status", "uploadedById",
  "createdAt", "updatedAt"
)
SELECT
  'legacy-student-document-' || d."id",
  'DATABASE_LEGACY',
  'PRIVATE'::"StoredFileVisibility",
  'STUDENT_DOCUMENTS',
  'StudentDocument',
  d."id",
  d."fileName",
  d."mimeType",
  d."fileSize",
  d."sha256",
  'READY'::"StoredFileStatus",
  d."uploadedById",
  d."createdAt",
  d."updatedAt"
FROM "StudentDocument" d
WHERE d."fileData" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

UPDATE "StudentDocument"
SET "storedFileId" = 'legacy-student-document-' || "id"
WHERE "fileData" IS NOT NULL AND "storedFileId" IS NULL;

INSERT INTO "MediaSafetySetting" ("id", "createdAt", "updatedAt")
VALUES ('centre-media-safety', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_nonnegative_sizes_check"
  CHECK (
    "originalSize" >= 0 AND
    ("optimizedSize" IS NULL OR "optimizedSize" >= 0) AND
    ("thumbnailSize" IS NULL OR "thumbnailSize" >= 0)
  );

ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_visibility_path_check"
  CHECK (
    ("visibility" = 'PRIVATE' AND "publicUrl" IS NULL) OR
    ("visibility" = 'PUBLIC')
  );
