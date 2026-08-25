-- Reconcile the historical migration chain with the production Prisma schema.
-- Every operation is additive so databases previously created with `db push`
-- keep their records, while a blank database can be built with migrate deploy.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FeeInvoiceStatus') THEN
    CREATE TYPE "FeeInvoiceStatus" AS ENUM ('DUE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'WAIVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DaycareBillingMode') THEN
    CREATE TYPE "DaycareBillingMode" AS ENUM ('HOURLY', 'FULL_DAY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DaycarePlanType') THEN
    CREATE TYPE "DaycarePlanType" AS ENUM ('OCCASIONAL', 'FLEXIBLE_DAYS', 'MONTHLY_DAYCARE_ONLY', 'MONTHLY_PRESCHOOL_DAYCARE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CareerApplicationStatus') THEN
    CREATE TYPE "CareerApplicationStatus" AS ENUM ('NEW', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'JOINED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DaycareFoodOption') THEN
    CREATE TYPE "DaycareFoodOption" AS ENUM ('NONE', 'LUNCH', 'EVENING_SNACK', 'BOTH');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DaycareSessionStatus') THEN
    CREATE TYPE "DaycareSessionStatus" AS ENUM ('BOOKED', 'COMPLETED', 'BILLED', 'CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CalendarEventType') THEN
    CREATE TYPE "CalendarEventType" AS ENUM ('ACADEMIC', 'ACTIVITY', 'CELEBRATION', 'HOLIDAY', 'MEETING', 'DEADLINE', 'OTHER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StudentDocumentType') THEN
    CREATE TYPE "StudentDocumentType" AS ENUM ('BIRTH_CERTIFICATE', 'CHILD_AADHAAR_CARD', 'PARENT_ID_PROOF', 'ADDRESS_PROOF', 'IMMUNISATION_RECORD', 'MEDICAL_CERTIFICATE', 'PASSPORT_PHOTO', 'TRANSFER_CERTIFICATE', 'OTHER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StudentDocumentStatus') THEN
    CREATE TYPE "StudentDocumentStatus" AS ENUM ('UPLOADED', 'VERIFIED', 'REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StaffExtraDutyStatus') THEN
    CREATE TYPE "StaffExtraDutyStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StaffPayrollStatus') THEN
    CREATE TYPE "StaffPayrollStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StaffPaidLeaveCycle') THEN
    CREATE TYPE "StaffPaidLeaveCycle" AS ENUM ('NONE', 'MONTHLY', 'YEARLY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StaffLeaveType') THEN
    CREATE TYPE "StaffLeaveType" AS ENUM ('PAID_LEAVE', 'UNPAID_LEAVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StaffLeaveStatus') THEN
    CREATE TYPE "StaffLeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarketingConversionProvider') THEN
    CREATE TYPE "MarketingConversionProvider" AS ENUM ('GOOGLE_ADS', 'META');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarketingConversionEvent') THEN
    CREATE TYPE "MarketingConversionEvent" AS ENUM ('ADMISSION');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarketingConversionStatus') THEN
    CREATE TYPE "MarketingConversionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'RETRY', 'DEAD');
  END IF;
END $$;

ALTER TYPE "FeeCategory" ADD VALUE IF NOT EXISTS 'DAYCARE_LUNCH_FEE';
ALTER TYPE "FeeCategory" ADD VALUE IF NOT EXISTS 'DAYCARE_EVENING_SNACK_FEE';
ALTER TYPE "FeeCategory" ADD VALUE IF NOT EXISTS 'DAYCARE_MEAL_COMBO_FEE';
ALTER TYPE "FeeCategory" ADD VALUE IF NOT EXISTS 'FOOD_FEE';

ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "failedAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "permissions" JSONB;

ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "lastWebsiteSubmissionAt" TIMESTAMP(3);
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "websiteSubmissionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestPageUrl" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestLandingPage" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestReferrer" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestUtmSource" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestUtmMedium" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestUtmCampaign" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestUtmContent" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestUtmTerm" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestGclid" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestGbraid" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestWbraid" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestFbclid" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestTrafficChannel" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "latestTrafficClass" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "firstTouchAttribution" JSONB;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "lastTouchAttribution" JSONB;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "googleAdmissionSentAt" TIMESTAMP(3);
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "googleAdmissionAttemptAt" TIMESTAMP(3);
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "googleAdmissionAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "googleAdmissionError" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "metaAdmissionSentAt" TIMESTAMP(3);
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "metaAdmissionAttemptAt" TIMESTAMP(3);
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "metaAdmissionAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "metaAdmissionError" TEXT;

ALTER TABLE "FeePayment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN IF NOT EXISTS "invoiceId" TEXT;
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "refundReason" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "paidLeaveCycle" "StaffPaidLeaveCycle" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "paidLeaveAllowance" DECIMAL(6,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "WebsiteLeadSubmission" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "enquiryId" TEXT NOT NULL,
  "source" "EnquirySource" NOT NULL,
  "enquiryType" TEXT NOT NULL,
  "pageUrl" TEXT,
  "landingPage" TEXT,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "gclid" TEXT,
  "gbraid" TEXT,
  "wbraid" TEXT,
  "fbclid" TEXT,
  "trafficChannel" TEXT,
  "trafficClass" TEXT NOT NULL DEFAULT 'GENUINE',
  "isInternal" BOOLEAN NOT NULL DEFAULT false,
  "isTest" BOOLEAN NOT NULL DEFAULT false,
  "isBot" BOOLEAN NOT NULL DEFAULT false,
  "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
  "fbc" TEXT,
  "fbp" TEXT,
  "firstTouch" JSONB,
  "lastTouch" JSONB,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebsiteLeadSubmission_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "WebsiteLeadSubmission" ADD COLUMN IF NOT EXISTS "firstTouch" JSONB;
ALTER TABLE "WebsiteLeadSubmission" ADD COLUMN IF NOT EXISTS "lastTouch" JSONB;

CREATE TABLE IF NOT EXISTS "CareerApplication" (
  "id" TEXT NOT NULL, "applicationNumber" TEXT NOT NULL, "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL, "email" TEXT, "location" TEXT, "position" TEXT NOT NULL,
  "qualification" TEXT, "experience" TEXT, "currentRole" TEXT, "expectedSalary" TEXT,
  "joiningAvailability" TEXT, "message" TEXT, "consent" BOOLEAN NOT NULL DEFAULT false,
  "status" "CareerApplicationStatus" NOT NULL DEFAULT 'NEW', "resumeFileName" TEXT,
  "resumeMimeType" TEXT, "resumeSize" INTEGER, "resumeStoragePath" TEXT,
  "resumeData" BYTEA, "trafficClass" TEXT NOT NULL DEFAULT 'GENUINE', "notes" TEXT,
  "reviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiSeoRevision" (
  "id" TEXT NOT NULL, "pageKey" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'APPLIED',
  "currentData" JSONB NOT NULL, "proposedData" JSONB NOT NULL, "evidence" JSONB,
  "createdById" TEXT, "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "undoneAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "AiSeoRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudentDocument" (
  "id" TEXT NOT NULL, "studentId" TEXT NOT NULL, "documentType" "StudentDocumentType" NOT NULL,
  "title" TEXT NOT NULL, "fileName" TEXT NOT NULL, "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL, "fileData" BYTEA NOT NULL, "sha256" TEXT NOT NULL,
  "status" "StudentDocumentStatus" NOT NULL DEFAULT 'UPLOADED', "notes" TEXT,
  "rejectionReason" TEXT, "expiresAt" TIMESTAMP(3), "uploadedById" TEXT,
  "verifiedById" TEXT, "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DaycareRateSetting" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "hourlyRate" DECIMAL(12,2) NOT NULL,
  "foodCharge" DECIMAL(12,2) NOT NULL DEFAULT 0, "lunchCharge" DECIMAL(12,2),
  "eveningSnackCharge" DECIMAL(12,2), "mealComboCharge" DECIMAL(12,2),
  "fullDayRate" DECIMAL(12,2) NOT NULL, "fullDayFoodIncluded" BOOLEAN NOT NULL DEFAULT true,
  "monthlyDaycareOnlyRate" DECIMAL(12,2), "monthlyPreschoolAddonRate" DECIMAL(12,2),
  "gstApplicable" BOOLEAN NOT NULL DEFAULT true, "gstRate" DECIMAL(5,2),
  "foodGstApplicable" BOOLEAN NOT NULL DEFAULT true, "foodGstRate" DECIMAL(5,2) DEFAULT 5,
  "effectiveFrom" TIMESTAMP(3) NOT NULL, "effectiveTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "DaycareRateSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FeeInvoice" (
  "id" TEXT NOT NULL, "invoiceNumber" TEXT NOT NULL, "billingKey" TEXT NOT NULL,
  "studentId" TEXT NOT NULL, "category" "FeeCategory" NOT NULL, "feePeriodKey" TEXT,
  "feePeriodLabel" TEXT NOT NULL, "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3) NOT NULL, "amountBeforeTax" DECIMAL(12,2) NOT NULL,
  "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0, "lateFeeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false, "gstRate" DECIMAL(5,2),
  "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0, "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(12,2) NOT NULL, "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "pendingAmount" DECIMAL(12,2) NOT NULL, "status" "FeeInvoiceStatus" NOT NULL DEFAULT 'DUE',
  "createdById" TEXT, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "FeeInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FeeInvoiceItem" (
  "id" TEXT NOT NULL, "invoiceId" TEXT NOT NULL, "category" "FeeCategory" NOT NULL,
  "title" TEXT NOT NULL, "detail" TEXT, "quantity" DECIMAL(8,2) NOT NULL DEFAULT 1,
  "unitAmount" DECIMAL(12,2) NOT NULL, "amount" DECIMAL(12,2) NOT NULL,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false, "gstRate" DECIMAL(5,2),
  "taxableAmount" DECIMAL(12,2) NOT NULL, "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0, "totalAmount" DECIMAL(12,2) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "FeeInvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudentDaycarePlan" (
  "id" TEXT NOT NULL, "studentId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "planType" "DaycarePlanType" NOT NULL DEFAULT 'OCCASIONAL',
  "billingMode" "DaycareBillingMode" NOT NULL, "scheduledWeekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  "foodRequired" BOOLEAN NOT NULL DEFAULT false, "foodOption" "DaycareFoodOption" NOT NULL DEFAULT 'NONE',
  "dailyHours" DECIMAL(6,2), "includedDays" INTEGER, "monthlyFeeOverride" DECIMAL(12,2),
  "monthlyFoodFeeOverride" DECIMAL(12,2), "hourlyRateOverride" DECIMAL(12,2),
  "foodChargeOverride" DECIMAL(12,2), "fullDayRateOverride" DECIMAL(12,2),
  "fullDayFoodIncluded" BOOLEAN, "effectiveFrom" TIMESTAMP(3) NOT NULL, "effectiveTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentDaycarePlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DaycareSession" (
  "id" TEXT NOT NULL, "sessionNumber" TEXT NOT NULL, "studentId" TEXT NOT NULL,
  "planId" TEXT, "rateSettingId" TEXT, "feeInvoiceId" TEXT, "sessionDate" TIMESTAMP(3) NOT NULL,
  "billingMode" "DaycareBillingMode" NOT NULL, "checkInAt" TIMESTAMP(3), "checkOutAt" TIMESTAMP(3),
  "billableHours" DECIMAL(6,2), "foodProvided" BOOLEAN NOT NULL DEFAULT false,
  "foodOption" "DaycareFoodOption" NOT NULL DEFAULT 'NONE', "hourlyRate" DECIMAL(12,2),
  "foodCharge" DECIMAL(12,2) NOT NULL DEFAULT 0, "fullDayRate" DECIMAL(12,2),
  "baseAmount" DECIMAL(12,2) NOT NULL, "totalAmount" DECIMAL(12,2) NOT NULL,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT true, "gstRate" DECIMAL(5,2),
  "foodGstApplicable" BOOLEAN NOT NULL DEFAULT false, "foodGstRate" DECIMAL(5,2),
  "status" "DaycareSessionStatus" NOT NULL DEFAULT 'BOOKED', "notes" TEXT, "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DaycareSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StaffLeaveRequest" (
  "id" TEXT NOT NULL, "leaveNumber" TEXT NOT NULL, "staffId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3) NOT NULL,
  "leaveType" "StaffLeaveType" NOT NULL, "status" "StaffLeaveStatus" NOT NULL DEFAULT 'PENDING',
  "requestedDays" DECIMAL(6,2) NOT NULL, "sandwichDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "chargedDays" DECIMAL(6,2) NOT NULL, "paidDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "unpaidDays" DECIMAL(6,2) NOT NULL DEFAULT 0, "reason" TEXT, "notes" TEXT,
  "createdById" TEXT, "approvedById" TEXT, "approvedAt" TIMESTAMP(3), "rejectedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StaffLeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StaffAttendance" (
  "id" TEXT NOT NULL, "staffId" TEXT NOT NULL, "attendanceDate" TIMESTAMP(3) NOT NULL,
  "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT', "checkInAt" TIMESTAMP(3),
  "checkOutAt" TIMESTAMP(3), "notes" TEXT, "markedById" TEXT, "leaveRequestId" TEXT,
  "isSandwichDay" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StaffPayroll" (
  "id" TEXT NOT NULL, "payrollNumber" TEXT NOT NULL, "staffId" TEXT NOT NULL,
  "payrollMonth" TIMESTAMP(3) NOT NULL, "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL, "status" "StaffPayrollStatus" NOT NULL DEFAULT 'DRAFT',
  "staffNumberSnapshot" TEXT NOT NULL, "staffNameSnapshot" TEXT NOT NULL,
  "designationSnapshot" TEXT NOT NULL, "baseSalary" DECIMAL(12,2) NOT NULL,
  "workingDaysInMonth" INTEGER NOT NULL, "standardHoursPerDay" DECIMAL(6,2) NOT NULL,
  "dailyRate" DECIMAL(12,2) NOT NULL, "hourlyRate" DECIMAL(12,2) NOT NULL,
  "presentDays" DECIMAL(6,2) NOT NULL DEFAULT 0, "lateDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "halfDays" DECIMAL(6,2) NOT NULL DEFAULT 0, "holidayDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "paidLeaveDays" DECIMAL(6,2) NOT NULL DEFAULT 0, "unpaidLeaveDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "absentDays" DECIMAL(6,2) NOT NULL DEFAULT 0, "unmarkedDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "deductionDays" DECIMAL(6,2) NOT NULL DEFAULT 0, "leaveDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "absenceDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0, "manualDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "extraDutyHours" DECIMAL(8,2) NOT NULL DEFAULT 0, "extraDutyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "manualAddition" DECIMAL(12,2) NOT NULL DEFAULT 0, "grossEarnings" DECIMAL(12,2) NOT NULL,
  "totalDeductions" DECIMAL(12,2) NOT NULL, "netPayable" DECIMAL(12,2) NOT NULL,
  "manualAdjustmentNotes" TEXT, "notes" TEXT, "paymentMethod" "PaymentMethod",
  "paymentReference" TEXT, "generatedById" TEXT, "approvedById" TEXT, "paidById" TEXT,
  "approvedAt" TIMESTAMP(3), "paidAt" TIMESTAMP(3), "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffPayroll_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StaffExtraDuty" (
  "id" TEXT NOT NULL, "dutyNumber" TEXT NOT NULL, "coveringStaffId" TEXT NOT NULL,
  "absentStaffId" TEXT, "dutyDate" TIMESTAMP(3) NOT NULL, "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL, "hours" DECIMAL(6,2) NOT NULL, "hourlyRate" DECIMAL(12,2) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL, "reason" TEXT NOT NULL DEFAULT 'LEAVE_COVER',
  "status" "StaffExtraDutyStatus" NOT NULL DEFAULT 'PENDING', "notes" TEXT,
  "createdById" TEXT, "approvedById" TEXT, "payrollId" TEXT, "approvedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StaffExtraDuty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AcademicCalendarDocument" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "academicYear" TEXT, "sourceRegion" TEXT,
  "fileName" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "fileSize" INTEGER NOT NULL,
  "fileData" BYTEA NOT NULL, "sha256" TEXT NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true,
  "uploadedById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "AcademicCalendarDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AcademicCalendarEvent" (
  "id" TEXT NOT NULL, "documentId" TEXT, "title" TEXT NOT NULL,
  "eventType" "CalendarEventType" NOT NULL DEFAULT 'ACADEMIC', "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3), "allDay" BOOLEAN NOT NULL DEFAULT true, "startTime" TEXT, "endTime" TEXT,
  "programmes" "Programme"[] DEFAULT ARRAY[]::"Programme"[], "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcademicCalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MarketingConversionJob" (
  "id" TEXT NOT NULL, "provider" "MarketingConversionProvider" NOT NULL,
  "eventType" "MarketingConversionEvent" NOT NULL, "status" "MarketingConversionStatus" NOT NULL DEFAULT 'PENDING',
  "deduplicationKey" TEXT NOT NULL, "enquiryId" TEXT NOT NULL, "payload" JSONB NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0, "maxAttempts" INTEGER NOT NULL DEFAULT 8,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT, "lastAttemptAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketingConversionJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
  "id" TEXT NOT NULL, "bucketKey" TEXT NOT NULL, "scope" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL, "windowEnd" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebsiteLeadSubmission_submissionId_key" ON "WebsiteLeadSubmission"("submissionId");
CREATE INDEX IF NOT EXISTS "WebsiteLeadSubmission_enquiryId_receivedAt_idx" ON "WebsiteLeadSubmission"("enquiryId", "receivedAt");
CREATE INDEX IF NOT EXISTS "WebsiteLeadSubmission_source_receivedAt_idx" ON "WebsiteLeadSubmission"("source", "receivedAt");
CREATE INDEX IF NOT EXISTS "WebsiteLeadSubmission_trafficClass_receivedAt_idx" ON "WebsiteLeadSubmission"("trafficClass", "receivedAt");
CREATE INDEX IF NOT EXISTS "WebsiteLeadSubmission_receivedAt_idx" ON "WebsiteLeadSubmission"("receivedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "CareerApplication_applicationNumber_key" ON "CareerApplication"("applicationNumber");
CREATE INDEX IF NOT EXISTS "CareerApplication_status_createdAt_idx" ON "CareerApplication"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "CareerApplication_phone_idx" ON "CareerApplication"("phone");
CREATE INDEX IF NOT EXISTS "CareerApplication_createdAt_idx" ON "CareerApplication"("createdAt");
CREATE INDEX IF NOT EXISTS "AiSeoRevision_pageKey_createdAt_idx" ON "AiSeoRevision"("pageKey", "createdAt");
CREATE INDEX IF NOT EXISTS "AiSeoRevision_status_createdAt_idx" ON "AiSeoRevision"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "AiSeoRevision_createdAt_idx" ON "AiSeoRevision"("createdAt");
CREATE INDEX IF NOT EXISTS "StudentDocument_studentId_idx" ON "StudentDocument"("studentId");
CREATE INDEX IF NOT EXISTS "StudentDocument_studentId_documentType_idx" ON "StudentDocument"("studentId", "documentType");
CREATE INDEX IF NOT EXISTS "StudentDocument_status_idx" ON "StudentDocument"("status");
CREATE INDEX IF NOT EXISTS "StudentDocument_createdAt_idx" ON "StudentDocument"("createdAt");
CREATE INDEX IF NOT EXISTS "DaycareRateSetting_effectiveFrom_idx" ON "DaycareRateSetting"("effectiveFrom");
CREATE INDEX IF NOT EXISTS "DaycareRateSetting_active_idx" ON "DaycareRateSetting"("active");
CREATE UNIQUE INDEX IF NOT EXISTS "FeeInvoice_invoiceNumber_key" ON "FeeInvoice"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "FeeInvoice_billingKey_key" ON "FeeInvoice"("billingKey");
CREATE INDEX IF NOT EXISTS "FeeInvoice_studentId_idx" ON "FeeInvoice"("studentId");
CREATE INDEX IF NOT EXISTS "FeeInvoice_category_idx" ON "FeeInvoice"("category");
CREATE INDEX IF NOT EXISTS "FeeInvoice_feePeriodKey_idx" ON "FeeInvoice"("feePeriodKey");
CREATE INDEX IF NOT EXISTS "FeeInvoice_dueDate_idx" ON "FeeInvoice"("dueDate");
CREATE INDEX IF NOT EXISTS "FeeInvoice_status_idx" ON "FeeInvoice"("status");
CREATE INDEX IF NOT EXISTS "FeeInvoiceItem_invoiceId_idx" ON "FeeInvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "FeeInvoiceItem_category_idx" ON "FeeInvoiceItem"("category");
CREATE INDEX IF NOT EXISTS "StudentDaycarePlan_studentId_idx" ON "StudentDaycarePlan"("studentId");
CREATE INDEX IF NOT EXISTS "StudentDaycarePlan_planType_idx" ON "StudentDaycarePlan"("planType");
CREATE INDEX IF NOT EXISTS "StudentDaycarePlan_billingMode_idx" ON "StudentDaycarePlan"("billingMode");
CREATE INDEX IF NOT EXISTS "StudentDaycarePlan_active_idx" ON "StudentDaycarePlan"("active");
CREATE INDEX IF NOT EXISTS "StudentDaycarePlan_effectiveFrom_idx" ON "StudentDaycarePlan"("effectiveFrom");
CREATE UNIQUE INDEX IF NOT EXISTS "DaycareSession_sessionNumber_key" ON "DaycareSession"("sessionNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "DaycareSession_studentId_sessionDate_key" ON "DaycareSession"("studentId", "sessionDate");
CREATE INDEX IF NOT EXISTS "DaycareSession_studentId_idx" ON "DaycareSession"("studentId");
CREATE INDEX IF NOT EXISTS "DaycareSession_planId_idx" ON "DaycareSession"("planId");
CREATE INDEX IF NOT EXISTS "DaycareSession_rateSettingId_idx" ON "DaycareSession"("rateSettingId");
CREATE INDEX IF NOT EXISTS "DaycareSession_feeInvoiceId_idx" ON "DaycareSession"("feeInvoiceId");
CREATE INDEX IF NOT EXISTS "DaycareSession_sessionDate_idx" ON "DaycareSession"("sessionDate");
CREATE INDEX IF NOT EXISTS "DaycareSession_status_idx" ON "DaycareSession"("status");
CREATE INDEX IF NOT EXISTS "DaycareSession_createdById_idx" ON "DaycareSession"("createdById");
CREATE INDEX IF NOT EXISTS "FeePayment_invoiceId_idx" ON "FeePayment"("invoiceId");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffAttendance_staffId_attendanceDate_key" ON "StaffAttendance"("staffId", "attendanceDate");
CREATE INDEX IF NOT EXISTS "StaffAttendance_attendanceDate_idx" ON "StaffAttendance"("attendanceDate");
CREATE INDEX IF NOT EXISTS "StaffAttendance_status_idx" ON "StaffAttendance"("status");
CREATE INDEX IF NOT EXISTS "StaffAttendance_staffId_idx" ON "StaffAttendance"("staffId");
CREATE INDEX IF NOT EXISTS "StaffAttendance_markedById_idx" ON "StaffAttendance"("markedById");
CREATE INDEX IF NOT EXISTS "StaffAttendance_leaveRequestId_idx" ON "StaffAttendance"("leaveRequestId");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffLeaveRequest_leaveNumber_key" ON "StaffLeaveRequest"("leaveNumber");
CREATE INDEX IF NOT EXISTS "StaffLeaveRequest_staffId_idx" ON "StaffLeaveRequest"("staffId");
CREATE INDEX IF NOT EXISTS "StaffLeaveRequest_startDate_idx" ON "StaffLeaveRequest"("startDate");
CREATE INDEX IF NOT EXISTS "StaffLeaveRequest_endDate_idx" ON "StaffLeaveRequest"("endDate");
CREATE INDEX IF NOT EXISTS "StaffLeaveRequest_status_idx" ON "StaffLeaveRequest"("status");
CREATE INDEX IF NOT EXISTS "StaffLeaveRequest_leaveType_idx" ON "StaffLeaveRequest"("leaveType");
CREATE INDEX IF NOT EXISTS "StaffLeaveRequest_createdById_idx" ON "StaffLeaveRequest"("createdById");
CREATE INDEX IF NOT EXISTS "StaffLeaveRequest_approvedById_idx" ON "StaffLeaveRequest"("approvedById");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffExtraDuty_dutyNumber_key" ON "StaffExtraDuty"("dutyNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffExtraDuty_coveringStaffId_dutyDate_startAt_endAt_key" ON "StaffExtraDuty"("coveringStaffId", "dutyDate", "startAt", "endAt");
CREATE INDEX IF NOT EXISTS "StaffExtraDuty_coveringStaffId_idx" ON "StaffExtraDuty"("coveringStaffId");
CREATE INDEX IF NOT EXISTS "StaffExtraDuty_absentStaffId_idx" ON "StaffExtraDuty"("absentStaffId");
CREATE INDEX IF NOT EXISTS "StaffExtraDuty_dutyDate_idx" ON "StaffExtraDuty"("dutyDate");
CREATE INDEX IF NOT EXISTS "StaffExtraDuty_status_idx" ON "StaffExtraDuty"("status");
CREATE INDEX IF NOT EXISTS "StaffExtraDuty_createdById_idx" ON "StaffExtraDuty"("createdById");
CREATE INDEX IF NOT EXISTS "StaffExtraDuty_approvedById_idx" ON "StaffExtraDuty"("approvedById");
CREATE INDEX IF NOT EXISTS "StaffExtraDuty_payrollId_idx" ON "StaffExtraDuty"("payrollId");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffPayroll_payrollNumber_key" ON "StaffPayroll"("payrollNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffPayroll_staffId_payrollMonth_key" ON "StaffPayroll"("staffId", "payrollMonth");
CREATE INDEX IF NOT EXISTS "StaffPayroll_payrollMonth_idx" ON "StaffPayroll"("payrollMonth");
CREATE INDEX IF NOT EXISTS "StaffPayroll_status_idx" ON "StaffPayroll"("status");
CREATE INDEX IF NOT EXISTS "StaffPayroll_staffId_idx" ON "StaffPayroll"("staffId");
CREATE INDEX IF NOT EXISTS "StaffPayroll_generatedById_idx" ON "StaffPayroll"("generatedById");
CREATE INDEX IF NOT EXISTS "StaffPayroll_approvedById_idx" ON "StaffPayroll"("approvedById");
CREATE INDEX IF NOT EXISTS "StaffPayroll_paidById_idx" ON "StaffPayroll"("paidById");
CREATE INDEX IF NOT EXISTS "AcademicCalendarDocument_academicYear_idx" ON "AcademicCalendarDocument"("academicYear");
CREATE INDEX IF NOT EXISTS "AcademicCalendarDocument_active_idx" ON "AcademicCalendarDocument"("active");
CREATE INDEX IF NOT EXISTS "AcademicCalendarDocument_uploadedById_idx" ON "AcademicCalendarDocument"("uploadedById");
CREATE INDEX IF NOT EXISTS "AcademicCalendarDocument_createdAt_idx" ON "AcademicCalendarDocument"("createdAt");
CREATE INDEX IF NOT EXISTS "AcademicCalendarEvent_documentId_idx" ON "AcademicCalendarEvent"("documentId");
CREATE INDEX IF NOT EXISTS "AcademicCalendarEvent_eventType_idx" ON "AcademicCalendarEvent"("eventType");
CREATE INDEX IF NOT EXISTS "AcademicCalendarEvent_startDate_idx" ON "AcademicCalendarEvent"("startDate");
CREATE INDEX IF NOT EXISTS "AcademicCalendarEvent_endDate_idx" ON "AcademicCalendarEvent"("endDate");
CREATE INDEX IF NOT EXISTS "AcademicCalendarEvent_active_idx" ON "AcademicCalendarEvent"("active");
CREATE INDEX IF NOT EXISTS "AcademicCalendarEvent_createdById_idx" ON "AcademicCalendarEvent"("createdById");
CREATE UNIQUE INDEX IF NOT EXISTS "MarketingConversionJob_deduplicationKey_key" ON "MarketingConversionJob"("deduplicationKey");
CREATE INDEX IF NOT EXISTS "MarketingConversionJob_status_nextAttemptAt_idx" ON "MarketingConversionJob"("status", "nextAttemptAt");
CREATE INDEX IF NOT EXISTS "MarketingConversionJob_enquiryId_idx" ON "MarketingConversionJob"("enquiryId");
CREATE INDEX IF NOT EXISTS "MarketingConversionJob_provider_eventType_idx" ON "MarketingConversionJob"("provider", "eventType");
CREATE INDEX IF NOT EXISTS "MarketingConversionJob_lockedAt_idx" ON "MarketingConversionJob"("lockedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "RateLimitBucket_bucketKey_key" ON "RateLimitBucket"("bucketKey");
CREATE INDEX IF NOT EXISTS "RateLimitBucket_scope_windowEnd_idx" ON "RateLimitBucket"("scope", "windowEnd");
CREATE INDEX IF NOT EXISTS "RateLimitBucket_windowEnd_idx" ON "RateLimitBucket"("windowEnd");
CREATE INDEX IF NOT EXISTS "Enquiry_lastWebsiteSubmissionAt_idx" ON "Enquiry"("lastWebsiteSubmissionAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebsiteLeadSubmission_enquiryId_fkey') THEN
    ALTER TABLE "WebsiteLeadSubmission" ADD CONSTRAINT "WebsiteLeadSubmission_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentDocument_studentId_fkey') THEN
    ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentDocument_uploadedById_fkey') THEN
    ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentDocument_verifiedById_fkey') THEN
    ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FeeInvoice_studentId_fkey') THEN
    ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FeeInvoice_createdById_fkey') THEN
    ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FeeInvoiceItem_invoiceId_fkey') THEN
    ALTER TABLE "FeeInvoiceItem" ADD CONSTRAINT "FeeInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentDaycarePlan_studentId_fkey') THEN
    ALTER TABLE "StudentDaycarePlan" ADD CONSTRAINT "StudentDaycarePlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DaycareSession_studentId_fkey') THEN
    ALTER TABLE "DaycareSession" ADD CONSTRAINT "DaycareSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DaycareSession_planId_fkey') THEN
    ALTER TABLE "DaycareSession" ADD CONSTRAINT "DaycareSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudentDaycarePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DaycareSession_rateSettingId_fkey') THEN
    ALTER TABLE "DaycareSession" ADD CONSTRAINT "DaycareSession_rateSettingId_fkey" FOREIGN KEY ("rateSettingId") REFERENCES "DaycareRateSetting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DaycareSession_feeInvoiceId_fkey') THEN
    ALTER TABLE "DaycareSession" ADD CONSTRAINT "DaycareSession_feeInvoiceId_fkey" FOREIGN KEY ("feeInvoiceId") REFERENCES "FeeInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DaycareSession_createdById_fkey') THEN
    ALTER TABLE "DaycareSession" ADD CONSTRAINT "DaycareSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FeePayment_invoiceId_fkey') THEN
    ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffLeaveRequest_staffId_fkey') THEN
    ALTER TABLE "StaffLeaveRequest" ADD CONSTRAINT "StaffLeaveRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffLeaveRequest_createdById_fkey') THEN
    ALTER TABLE "StaffLeaveRequest" ADD CONSTRAINT "StaffLeaveRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffLeaveRequest_approvedById_fkey') THEN
    ALTER TABLE "StaffLeaveRequest" ADD CONSTRAINT "StaffLeaveRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffAttendance_staffId_fkey') THEN
    ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffAttendance_markedById_fkey') THEN
    ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffAttendance_leaveRequestId_fkey') THEN
    ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "StaffLeaveRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffPayroll_staffId_fkey') THEN
    ALTER TABLE "StaffPayroll" ADD CONSTRAINT "StaffPayroll_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffPayroll_generatedById_fkey') THEN
    ALTER TABLE "StaffPayroll" ADD CONSTRAINT "StaffPayroll_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffPayroll_approvedById_fkey') THEN
    ALTER TABLE "StaffPayroll" ADD CONSTRAINT "StaffPayroll_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffPayroll_paidById_fkey') THEN
    ALTER TABLE "StaffPayroll" ADD CONSTRAINT "StaffPayroll_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffExtraDuty_coveringStaffId_fkey') THEN
    ALTER TABLE "StaffExtraDuty" ADD CONSTRAINT "StaffExtraDuty_coveringStaffId_fkey" FOREIGN KEY ("coveringStaffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffExtraDuty_absentStaffId_fkey') THEN
    ALTER TABLE "StaffExtraDuty" ADD CONSTRAINT "StaffExtraDuty_absentStaffId_fkey" FOREIGN KEY ("absentStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffExtraDuty_createdById_fkey') THEN
    ALTER TABLE "StaffExtraDuty" ADD CONSTRAINT "StaffExtraDuty_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffExtraDuty_approvedById_fkey') THEN
    ALTER TABLE "StaffExtraDuty" ADD CONSTRAINT "StaffExtraDuty_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffExtraDuty_payrollId_fkey') THEN
    ALTER TABLE "StaffExtraDuty" ADD CONSTRAINT "StaffExtraDuty_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "StaffPayroll"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AcademicCalendarDocument_uploadedById_fkey') THEN
    ALTER TABLE "AcademicCalendarDocument" ADD CONSTRAINT "AcademicCalendarDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AcademicCalendarEvent_documentId_fkey') THEN
    ALTER TABLE "AcademicCalendarEvent" ADD CONSTRAINT "AcademicCalendarEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AcademicCalendarDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AcademicCalendarEvent_createdById_fkey') THEN
    ALTER TABLE "AcademicCalendarEvent" ADD CONSTRAINT "AcademicCalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MarketingConversionJob_enquiryId_fkey') THEN
    ALTER TABLE "MarketingConversionJob" ADD CONSTRAINT "MarketingConversionJob_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
