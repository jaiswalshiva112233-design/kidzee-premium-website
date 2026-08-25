CREATE TYPE "StudentChargeStatus" AS ENUM ('PENDING', 'BILLED', 'PAID', 'WAIVED', 'CANCELLED');

CREATE TABLE "ChargeDefinition" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" "FeeCategory" NOT NULL DEFAULT 'OTHER',
  "defaultAmount" DECIMAL(12,2),
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
  "gstRate" DECIMAL(5,2),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChargeDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentCharge" (
  "id" TEXT NOT NULL,
  "chargeNumber" TEXT NOT NULL,
  "chargeKey" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "definitionId" TEXT,
  "feeInvoiceId" TEXT,
  "category" "FeeCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT,
  "chargeDate" TIMESTAMP(3) NOT NULL,
  "academicYear" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
  "gstRate" DECIMAL(5,2),
  "status" "StudentChargeStatus" NOT NULL DEFAULT 'PENDING',
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "approvedAt" TIMESTAMP(3),
  "approvedById" TEXT,
  "createdById" TEXT,
  "notes" TEXT,
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentCharge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChargeDefinition_code_key" ON "ChargeDefinition"("code");
CREATE INDEX "ChargeDefinition_active_displayOrder_idx" ON "ChargeDefinition"("active", "displayOrder");
CREATE INDEX "ChargeDefinition_category_idx" ON "ChargeDefinition"("category");
CREATE UNIQUE INDEX "StudentCharge_chargeNumber_key" ON "StudentCharge"("chargeNumber");
CREATE UNIQUE INDEX "StudentCharge_chargeKey_key" ON "StudentCharge"("chargeKey");
CREATE INDEX "StudentCharge_studentId_status_chargeDate_idx" ON "StudentCharge"("studentId", "status", "chargeDate");
CREATE INDEX "StudentCharge_definitionId_idx" ON "StudentCharge"("definitionId");
CREATE INDEX "StudentCharge_feeInvoiceId_idx" ON "StudentCharge"("feeInvoiceId");
CREATE INDEX "StudentCharge_approved_status_idx" ON "StudentCharge"("approved", "status");
CREATE INDEX "StudentCharge_academicYear_idx" ON "StudentCharge"("academicYear");

ALTER TABLE "StudentCharge" ADD CONSTRAINT "StudentCharge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentCharge" ADD CONSTRAINT "StudentCharge_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "ChargeDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentCharge" ADD CONSTRAINT "StudentCharge_feeInvoiceId_fkey" FOREIGN KEY ("feeInvoiceId") REFERENCES "FeeInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentCharge" ADD CONSTRAINT "StudentCharge_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentCharge" ADD CONSTRAINT "StudentCharge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChargeDefinition" ADD CONSTRAINT "ChargeDefinition_amount_check" CHECK ("defaultAmount" IS NULL OR "defaultAmount" >= 0) NOT VALID;
ALTER TABLE "ChargeDefinition" ADD CONSTRAINT "ChargeDefinition_gst_check" CHECK ((NOT "gstApplicable" AND "gstRate" IS NULL) OR ("gstApplicable" AND "gstRate" >= 0 AND "gstRate" <= 100)) NOT VALID;
ALTER TABLE "StudentCharge" ADD CONSTRAINT "StudentCharge_amount_check" CHECK ("amount" >= 0) NOT VALID;
ALTER TABLE "StudentCharge" ADD CONSTRAINT "StudentCharge_gst_check" CHECK ((NOT "gstApplicable" AND "gstRate" IS NULL) OR ("gstApplicable" AND "gstRate" >= 0 AND "gstRate" <= 100)) NOT VALID;
ALTER TABLE "StudentCharge" ADD CONSTRAINT "StudentCharge_approval_check" CHECK ((NOT "approved" AND "approvedAt" IS NULL AND "approvedById" IS NULL) OR ("approved" AND "approvedAt" IS NOT NULL AND "approvedById" IS NOT NULL)) NOT VALID;
