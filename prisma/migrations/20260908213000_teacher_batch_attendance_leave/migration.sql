-- AlterEnum
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'TEACHER';

-- CreateEnum
CREATE TYPE "LearningDomain" AS ENUM ('GROSS_MOTOR', 'FINE_MOTOR', 'LANGUAGE_LITERACY', 'COGNITIVE_MATH', 'CREATIVE_ARTS', 'SOCIAL_EMOTIONAL', 'SENSORY_EXPLORATION', 'GENERAL_THEME');

-- CreateEnum
CREATE TYPE "ActivityPlanStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "ObservationReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "BatchAssignmentStatus" AS ENUM ('ACTIVE', 'TRANSFERRED', 'COMPLETED');

-- AlterTable AdminUser
ALTER TABLE "AdminUser" ADD COLUMN "staffId" TEXT;

-- CreateTable Batch
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programme" "Programme" NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2026-2027',
    "room" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 8,
    "primaryTeacherId" TEXT,
    "assistantTeacherId" TEXT,
    "status" "CatalogueStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable StudentBatchAssignment
CREATE TABLE "StudentBatchAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rollNumber" TEXT,
    "status" "BatchAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentBatchAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable TeacherActivity
CREATE TABLE "TeacherActivity" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "domain" "LearningDomain" NOT NULL,
    "description" TEXT NOT NULL,
    "learningOutcome" TEXT,
    "materialsNeeded" TEXT,
    "status" "ActivityPlanStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable StudentObservationReport
CREATE TABLE "StudentObservationReport" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "strengths" TEXT NOT NULL,
    "areasOfGrowth" TEXT NOT NULL,
    "socialEmotionalDevelopment" TEXT,
    "motorSkillsDevelopment" TEXT,
    "languageCommunication" TEXT,
    "cognitiveCuriosity" TEXT,
    "generalObservations" TEXT,
    "status" "ObservationReportStatus" NOT NULL DEFAULT 'DRAFT',
    "centreHeadFeedback" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedToParent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentObservationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable InternalMessage
CREATE TABLE "InternalMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_staffId_key" ON "AdminUser"("staffId");

-- CreateIndex
CREATE INDEX "Batch_programme_idx" ON "Batch"("programme");

-- CreateIndex
CREATE INDEX "Batch_academicYear_idx" ON "Batch"("academicYear");

-- CreateIndex
CREATE INDEX "Batch_status_idx" ON "Batch"("status");

-- CreateIndex
CREATE INDEX "Batch_primaryTeacherId_idx" ON "Batch"("primaryTeacherId");

-- CreateIndex
CREATE INDEX "Batch_assistantTeacherId_idx" ON "Batch"("assistantTeacherId");

-- CreateIndex
CREATE INDEX "StudentBatchAssignment_batchId_status_idx" ON "StudentBatchAssignment"("batchId", "status");

-- CreateIndex
CREATE INDEX "StudentBatchAssignment_studentId_status_idx" ON "StudentBatchAssignment"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentBatchAssignment_studentId_batchId_key" ON "StudentBatchAssignment"("studentId", "batchId");

-- CreateIndex
CREATE INDEX "TeacherActivity_batchId_activityDate_idx" ON "TeacherActivity"("batchId", "activityDate");

-- CreateIndex
CREATE INDEX "TeacherActivity_teacherId_idx" ON "TeacherActivity"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherActivity_weekStartDate_idx" ON "TeacherActivity"("weekStartDate");

-- CreateIndex
CREATE INDEX "TeacherActivity_status_idx" ON "TeacherActivity"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentObservationReport_reportNumber_key" ON "StudentObservationReport"("reportNumber");

-- CreateIndex
CREATE INDEX "StudentObservationReport_studentId_idx" ON "StudentObservationReport"("studentId");

-- CreateIndex
CREATE INDEX "StudentObservationReport_batchId_idx" ON "StudentObservationReport"("batchId");

-- CreateIndex
CREATE INDEX "StudentObservationReport_teacherId_idx" ON "StudentObservationReport"("teacherId");

-- CreateIndex
CREATE INDEX "StudentObservationReport_status_idx" ON "StudentObservationReport"("status");

-- CreateIndex
CREATE INDEX "StudentObservationReport_reportDate_idx" ON "StudentObservationReport"("reportDate");

-- CreateIndex
CREATE INDEX "InternalMessage_threadId_idx" ON "InternalMessage"("threadId");

-- CreateIndex
CREATE INDEX "InternalMessage_senderId_idx" ON "InternalMessage"("senderId");

-- CreateIndex
CREATE INDEX "InternalMessage_recipientId_idx" ON "InternalMessage"("recipientId");

-- CreateIndex
CREATE INDEX "InternalMessage_createdAt_idx" ON "InternalMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_primaryTeacherId_fkey" FOREIGN KEY ("primaryTeacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_assistantTeacherId_fkey" FOREIGN KEY ("assistantTeacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBatchAssignment" ADD CONSTRAINT "StudentBatchAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBatchAssignment" ADD CONSTRAINT "StudentBatchAssignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherActivity" ADD CONSTRAINT "TeacherActivity_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherActivity" ADD CONSTRAINT "TeacherActivity_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherActivity" ADD CONSTRAINT "TeacherActivity_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentObservationReport" ADD CONSTRAINT "StudentObservationReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentObservationReport" ADD CONSTRAINT "StudentObservationReport_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentObservationReport" ADD CONSTRAINT "StudentObservationReport_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentObservationReport" ADD CONSTRAINT "StudentObservationReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMessage" ADD CONSTRAINT "InternalMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMessage" ADD CONSTRAINT "InternalMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
