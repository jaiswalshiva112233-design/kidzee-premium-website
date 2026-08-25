-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'NOTE_ADDED', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_COMPLETED', 'VISIT_BOOKED', 'VISIT_COMPLETED', 'VISIT_NO_SHOW', 'TRIAL_SCHEDULED', 'TRIAL_COMPLETED', 'PARENT_FEEDBACK', 'ADMISSION_STARTED', 'ADMISSION_CONFIRMED', 'CLOSED', 'REOPENED', 'SIBLING_LINKED', 'CONVERSION_RESENT');

-- CreateEnum
CREATE TYPE "LeadAppointmentKind" AS ENUM ('VISIT', 'TRIAL');

-- CreateEnum
CREATE TYPE "LeadAppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GrowthRecommendationStatus" AS ENUM ('RECOMMENDED', 'APPROVED', 'REJECTED', 'APPLIED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "WhatsAppAutomationType" AS ENUM ('ENQUIRY_NOTIFICATION', 'VISIT_REMINDER', 'ADMISSION_CONFIRMATION', 'FEE_REMINDER', 'RECEIPT_DOCUMENT', 'DAYCARE_REMINDER', 'FOLLOW_UP_REMINDER');

-- CreateEnum
CREATE TYPE "WhatsAppAutomationStatus" AS ENUM ('PENDING', 'PROCESSING', 'ACCEPTED', 'SENT', 'DELIVERED', 'READ', 'RETRY', 'FAILED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EnquiryStatus" ADD VALUE 'VISIT_BOOKED';
ALTER TYPE "EnquiryStatus" ADD VALUE 'VISIT_COMPLETED';
ALTER TYPE "EnquiryStatus" ADD VALUE 'TRIAL_COMPLETED';
ALTER TYPE "EnquiryStatus" ADD VALUE 'QUALIFIED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MarketingConversionEvent" ADD VALUE 'LEAD';
ALTER TYPE "MarketingConversionEvent" ADD VALUE 'QUALIFIED_LEAD';

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "familyId" TEXT,
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "qualifiedAt" TIMESTAMP(3),
ADD COLUMN     "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "completedById" TEXT;

-- AlterTable
ALTER TABLE "DaycareRateSetting" ADD COLUMN     "monthlySixHalfHourRate" DECIMAL(12,2),
ADD COLUMN     "monthlySixHourRate" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "LeadFamily" (
    "id" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "primaryPhone" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "fromStatus" "EnquiryStatus",
    "toStatus" "EnquiryStatus",
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "recordedById" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAppointment" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "kind" "LeadAppointmentKind" NOT NULL,
    "status" "LeadAppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "parentFeedback" TEXT,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthRecommendation" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "preview" JSONB NOT NULL,
    "affectedModules" JSONB NOT NULL,
    "evidence" JSONB,
    "status" "GrowthRecommendationStatus" NOT NULL DEFAULT 'RECOMMENDED',
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "rollbackPlan" TEXT NOT NULL,
    "createdById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppAutomationMessage" (
    "id" TEXT NOT NULL,
    "type" "WhatsAppAutomationType" NOT NULL,
    "status" "WhatsAppAutomationStatus" NOT NULL DEFAULT 'PENDING',
    "deduplicationKey" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "templateName" TEXT,
    "templateLanguage" TEXT DEFAULT 'en',
    "messageText" TEXT,
    "documentUrl" TEXT,
    "documentFilename" TEXT,
    "providerMessageId" TEXT,
    "enquiryId" TEXT,
    "studentId" TEXT,
    "invoiceId" TEXT,
    "receiptId" TEXT,
    "payload" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 8,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppAutomationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadFamily_primaryPhone_idx" ON "LeadFamily"("primaryPhone");

-- CreateIndex
CREATE INDEX "LeadActivity_enquiryId_occurredAt_idx" ON "LeadActivity"("enquiryId", "occurredAt");

-- CreateIndex
CREATE INDEX "LeadActivity_type_occurredAt_idx" ON "LeadActivity"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "LeadActivity_recordedById_idx" ON "LeadActivity"("recordedById");

-- CreateIndex
CREATE INDEX "LeadAppointment_enquiryId_scheduledAt_idx" ON "LeadAppointment"("enquiryId", "scheduledAt");

-- CreateIndex
CREATE INDEX "LeadAppointment_kind_status_scheduledAt_idx" ON "LeadAppointment"("kind", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "LeadAppointment_recordedById_idx" ON "LeadAppointment"("recordedById");

-- CreateIndex
CREATE UNIQUE INDEX "GrowthRecommendation_fingerprint_key" ON "GrowthRecommendation"("fingerprint");

-- CreateIndex
CREATE INDEX "GrowthRecommendation_status_createdAt_idx" ON "GrowthRecommendation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GrowthRecommendation_category_createdAt_idx" ON "GrowthRecommendation"("category", "createdAt");

-- CreateIndex
CREATE INDEX "GrowthRecommendation_createdById_idx" ON "GrowthRecommendation"("createdById");

-- CreateIndex
CREATE INDEX "GrowthRecommendation_reviewedById_idx" ON "GrowthRecommendation"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppAutomationMessage_deduplicationKey_key" ON "WhatsAppAutomationMessage"("deduplicationKey");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppAutomationMessage_providerMessageId_key" ON "WhatsAppAutomationMessage"("providerMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppAutomationMessage_status_nextAttemptAt_idx" ON "WhatsAppAutomationMessage"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "WhatsAppAutomationMessage_providerMessageId_idx" ON "WhatsAppAutomationMessage"("providerMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppAutomationMessage_enquiryId_createdAt_idx" ON "WhatsAppAutomationMessage"("enquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppAutomationMessage_studentId_createdAt_idx" ON "WhatsAppAutomationMessage"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppAutomationMessage_invoiceId_idx" ON "WhatsAppAutomationMessage"("invoiceId");

-- CreateIndex
CREATE INDEX "WhatsAppAutomationMessage_receiptId_idx" ON "WhatsAppAutomationMessage"("receiptId");

-- CreateIndex
CREATE INDEX "Enquiry_familyId_idx" ON "Enquiry"("familyId");

-- CreateIndex
CREATE INDEX "Enquiry_stageChangedAt_idx" ON "Enquiry"("stageChangedAt");

-- CreateIndex
CREATE INDEX "FollowUp_completedById_idx" ON "FollowUp"("completedById");

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "LeadFamily"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAppointment" ADD CONSTRAINT "LeadAppointment_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAppointment" ADD CONSTRAINT "LeadAppointment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthRecommendation" ADD CONSTRAINT "GrowthRecommendation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthRecommendation" ADD CONSTRAINT "GrowthRecommendation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppAutomationMessage" ADD CONSTRAINT "WhatsAppAutomationMessage_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppAutomationMessage" ADD CONSTRAINT "WhatsAppAutomationMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppAutomationMessage" ADD CONSTRAINT "WhatsAppAutomationMessage_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppAutomationMessage" ADD CONSTRAINT "WhatsAppAutomationMessage_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
