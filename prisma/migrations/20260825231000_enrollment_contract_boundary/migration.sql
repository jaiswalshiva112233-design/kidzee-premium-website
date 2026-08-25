ALTER TABLE "Student"
  ADD COLUMN "duplicateOfStudentId" TEXT,
  ADD COLUMN "duplicateOverrideReason" TEXT,
  ADD COLUMN "identityFingerprint" TEXT;

ALTER TABLE "FeeInvoice" ADD COLUMN "enrollmentContractId" TEXT;
ALTER TABLE "FeeInvoiceItem"
  ADD COLUMN "contractServiceId" TEXT,
  ADD COLUMN "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "StudentDaycarePlan"
  ADD COLUMN "contractServiceId" TEXT,
  ADD COLUMN "enrollmentContractId" TEXT;
ALTER TABLE "StudentCharge"
  ADD COLUMN "contractServiceId" TEXT,
  ADD COLUMN "enrollmentContractId" TEXT;

CREATE TABLE "StudentEnrollmentContract" (
  "id" TEXT NOT NULL,
  "contractNumber" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "admissionId" TEXT,
  "enquiryId" TEXT,
  "academicSession" TEXT NOT NULL,
  "status" "EnrollmentContractStatus" NOT NULL DEFAULT 'DRAFT',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "preschoolEnabled" BOOLEAN NOT NULL DEFAULT false,
  "preschoolProgrammeId" TEXT,
  "preschoolClass" TEXT,
  "daycareEnabled" BOOLEAN NOT NULL DEFAULT false,
  "mealsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "annualKitEnabled" BOOLEAN NOT NULL DEFAULT false,
  "annualKitSkipReason" TEXT,
  "billingDay" INTEGER NOT NULL DEFAULT 1,
  "dueDay" INTEGER NOT NULL DEFAULT 5,
  "source" TEXT NOT NULL DEFAULT 'DIRECT',
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentEnrollmentContract_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentEnrollmentContract_dates_check" CHECK ("endDate" IS NULL OR "endDate" >= "startDate"),
  CONSTRAINT "StudentEnrollmentContract_billing_day_check" CHECK ("billingDay" BETWEEN 1 AND 28),
  CONSTRAINT "StudentEnrollmentContract_due_day_check" CHECK ("dueDay" BETWEEN 1 AND 31)
);

CREATE TABLE "ContractService" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "serviceType" "ContractServiceType" NOT NULL,
  "category" "FeeCategory" NOT NULL,
  "catalogueItemType" TEXT,
  "catalogueItemId" TEXT,
  "label" TEXT NOT NULL,
  "detail" TEXT,
  "quantity" DECIMAL(8,2) NOT NULL DEFAULT 1,
  "amountSnapshot" DECIMAL(12,2) NOT NULL,
  "discountSnapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
  "gstRate" DECIMAL(5,2),
  "gstInclusive" BOOLEAN NOT NULL DEFAULT true,
  "taxableValue" DECIMAL(12,2) NOT NULL,
  "cgst" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "sgst" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL,
  "recurring" BOOLEAN NOT NULL DEFAULT false,
  "frequency" "ContractServiceFrequency" NOT NULL DEFAULT 'ONE_TIME',
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "status" "ContractServiceStatus" NOT NULL DEFAULT 'ACTIVE',
  "sourceVersionId" TEXT,
  "skipReason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContractService_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContractService_dates_check" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom"),
  CONSTRAINT "ContractService_amounts_check" CHECK (
    "quantity" > 0 AND "amountSnapshot" >= 0 AND "discountSnapshot" >= 0 AND
    "taxableValue" >= 0 AND "cgst" >= 0 AND "sgst" >= 0 AND "total" >= 0
  ),
  CONSTRAINT "ContractService_gst_rate_check" CHECK ("gstRate" IS NULL OR "gstRate" BETWEEN 0 AND 100)
);

CREATE TABLE "FinancialCorrection" (
  "id" TEXT NOT NULL,
  "correctionNumber" TEXT NOT NULL,
  "type" "FinancialCorrectionType" NOT NULL,
  "status" "FinancialCorrectionStatus" NOT NULL DEFAULT 'DRAFT',
  "studentId" TEXT NOT NULL,
  "enrollmentContractId" TEXT,
  "invoiceId" TEXT,
  "paymentId" TEXT,
  "receiptId" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "notes" TEXT,
  "createdById" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "appliedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialCorrection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinancialCorrection_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "FinancialCorrection_reason_check" CHECK (length(trim("reason")) >= 3)
);

CREATE UNIQUE INDEX "StudentEnrollmentContract_contractNumber_key" ON "StudentEnrollmentContract"("contractNumber");
CREATE UNIQUE INDEX "StudentEnrollmentContract_studentId_key" ON "StudentEnrollmentContract"("studentId");
CREATE UNIQUE INDEX "StudentEnrollmentContract_admissionId_key" ON "StudentEnrollmentContract"("admissionId");
CREATE UNIQUE INDEX "StudentEnrollmentContract_enquiryId_key" ON "StudentEnrollmentContract"("enquiryId");
CREATE INDEX "StudentEnrollmentContract_status_startDate_endDate_idx" ON "StudentEnrollmentContract"("status", "startDate", "endDate");
CREATE INDEX "StudentEnrollmentContract_preschoolEnabled_preschoolClass_s_idx" ON "StudentEnrollmentContract"("preschoolEnabled", "preschoolClass", "status");
CREATE INDEX "StudentEnrollmentContract_daycareEnabled_status_idx" ON "StudentEnrollmentContract"("daycareEnabled", "status");
CREATE INDEX "StudentEnrollmentContract_mealsEnabled_status_idx" ON "StudentEnrollmentContract"("mealsEnabled", "status");
CREATE INDEX "StudentEnrollmentContract_preschoolProgrammeId_idx" ON "StudentEnrollmentContract"("preschoolProgrammeId");
CREATE INDEX "StudentEnrollmentContract_academicSession_idx" ON "StudentEnrollmentContract"("academicSession");
CREATE INDEX "ContractService_contractId_status_effectiveFrom_effectiveTo_idx" ON "ContractService"("contractId", "status", "effectiveFrom", "effectiveTo");
CREATE INDEX "ContractService_serviceType_status_idx" ON "ContractService"("serviceType", "status");
CREATE INDEX "ContractService_catalogueItemType_catalogueItemId_idx" ON "ContractService"("catalogueItemType", "catalogueItemId");
CREATE INDEX "ContractService_sourceVersionId_idx" ON "ContractService"("sourceVersionId");
CREATE INDEX "ContractService_frequency_recurring_status_idx" ON "ContractService"("frequency", "recurring", "status");
CREATE UNIQUE INDEX "FinancialCorrection_correctionNumber_key" ON "FinancialCorrection"("correctionNumber");
CREATE INDEX "FinancialCorrection_studentId_createdAt_idx" ON "FinancialCorrection"("studentId", "createdAt");
CREATE INDEX "FinancialCorrection_enrollmentContractId_idx" ON "FinancialCorrection"("enrollmentContractId");
CREATE INDEX "FinancialCorrection_invoiceId_idx" ON "FinancialCorrection"("invoiceId");
CREATE INDEX "FinancialCorrection_paymentId_idx" ON "FinancialCorrection"("paymentId");
CREATE INDEX "FinancialCorrection_receiptId_idx" ON "FinancialCorrection"("receiptId");
CREATE INDEX "FinancialCorrection_type_status_createdAt_idx" ON "FinancialCorrection"("type", "status", "createdAt");
CREATE INDEX "Student_identityFingerprint_idx" ON "Student"("identityFingerprint");
CREATE INDEX "Student_duplicateOfStudentId_idx" ON "Student"("duplicateOfStudentId");
CREATE INDEX "FeeInvoice_enrollmentContractId_idx" ON "FeeInvoice"("enrollmentContractId");
CREATE INDEX "FeeInvoiceItem_contractServiceId_idx" ON "FeeInvoiceItem"("contractServiceId");
CREATE UNIQUE INDEX "StudentDaycarePlan_contractServiceId_key" ON "StudentDaycarePlan"("contractServiceId");
CREATE INDEX "StudentDaycarePlan_enrollmentContractId_idx" ON "StudentDaycarePlan"("enrollmentContractId");
CREATE INDEX "StudentCharge_enrollmentContractId_idx" ON "StudentCharge"("enrollmentContractId");
CREATE INDEX "StudentCharge_contractServiceId_idx" ON "StudentCharge"("contractServiceId");

ALTER TABLE "StudentEnrollmentContract" ADD CONSTRAINT "StudentEnrollmentContract_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentEnrollmentContract" ADD CONSTRAINT "StudentEnrollmentContract_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentEnrollmentContract" ADD CONSTRAINT "StudentEnrollmentContract_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentEnrollmentContract" ADD CONSTRAINT "StudentEnrollmentContract_preschoolProgrammeId_fkey" FOREIGN KEY ("preschoolProgrammeId") REFERENCES "ProgrammeDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContractService" ADD CONSTRAINT "ContractService_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "StudentEnrollmentContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_enrollmentContractId_fkey" FOREIGN KEY ("enrollmentContractId") REFERENCES "StudentEnrollmentContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeeInvoiceItem" ADD CONSTRAINT "FeeInvoiceItem_contractServiceId_fkey" FOREIGN KEY ("contractServiceId") REFERENCES "ContractService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentDaycarePlan" ADD CONSTRAINT "StudentDaycarePlan_enrollmentContractId_fkey" FOREIGN KEY ("enrollmentContractId") REFERENCES "StudentEnrollmentContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentDaycarePlan" ADD CONSTRAINT "StudentDaycarePlan_contractServiceId_fkey" FOREIGN KEY ("contractServiceId") REFERENCES "ContractService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentCharge" ADD CONSTRAINT "StudentCharge_enrollmentContractId_fkey" FOREIGN KEY ("enrollmentContractId") REFERENCES "StudentEnrollmentContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentCharge" ADD CONSTRAINT "StudentCharge_contractServiceId_fkey" FOREIGN KEY ("contractServiceId") REFERENCES "ContractService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialCorrection" ADD CONSTRAINT "FinancialCorrection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialCorrection" ADD CONSTRAINT "FinancialCorrection_enrollmentContractId_fkey" FOREIGN KEY ("enrollmentContractId") REFERENCES "StudentEnrollmentContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialCorrection" ADD CONSTRAINT "FinancialCorrection_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialCorrection" ADD CONSTRAINT "FinancialCorrection_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FeePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialCorrection" ADD CONSTRAINT "FinancialCorrection_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "Student" s
SET "identityFingerprint" = md5(
  lower(regexp_replace(trim(concat_ws(' ', s."firstName", s."middleName", s."lastName")), '[^a-zA-Z0-9]+', '', 'g')) || '|' ||
  to_char(s."dateOfBirth", 'YYYY-MM-DD') || '|' ||
  COALESCE((SELECT regexp_replace(g."phone", '[^0-9]+', '', 'g') FROM "Guardian" g WHERE g."studentId" = s."id" ORDER BY g."isPrimary" DESC, g."createdAt" ASC LIMIT 1), '')
)
WHERE s."identityFingerprint" IS NULL;

INSERT INTO "StudentEnrollmentContract" (
  "id", "contractNumber", "studentId", "admissionId", "enquiryId", "academicSession",
  "status", "startDate", "endDate", "preschoolEnabled", "preschoolProgrammeId",
  "preschoolClass", "daycareEnabled", "mealsEnabled", "annualKitEnabled", "source",
  "createdAt", "updatedAt"
)
SELECT
  'legacy-contract-' || substr(md5(s."id"), 1, 20),
  'KZ-CON-' || s."studentNumber",
  s."id",
  a."id",
  a."enquiryId",
  CASE
    WHEN EXTRACT(MONTH FROM s."joiningDate") >= 4
      THEN EXTRACT(YEAR FROM s."joiningDate")::int || '-' || right((EXTRACT(YEAR FROM s."joiningDate")::int + 1)::text, 2)
    ELSE (EXTRACT(YEAR FROM s."joiningDate")::int - 1) || '-' || right(EXTRACT(YEAR FROM s."joiningDate")::int::text, 2)
  END,
  CASE WHEN s."status" = 'ACTIVE' THEN 'ACTIVE'::"EnrollmentContractStatus" ELSE 'ENDED'::"EnrollmentContractStatus" END,
  s."joiningDate",
  s."leavingDate",
  s."programme" <> 'DAYCARE'::"Programme",
  s."programmeDefinitionId",
  COALESCE(pd."name", replace(initcap(replace(s."programme"::text, '_', ' ')), 'Kg', 'KG')),
  EXISTS (SELECT 1 FROM "StudentDaycarePlan" dp WHERE dp."studentId" = s."id" AND dp."active" = true),
  EXISTS (SELECT 1 FROM "StudentDaycarePlan" dp WHERE dp."studentId" = s."id" AND dp."active" = true AND (dp."mealCombinationId" IS NOT NULL OR dp."foodRequired" = true OR dp."foodOption" <> 'NONE'::"DaycareFoodOption")),
  s."programme" <> 'DAYCARE'::"Programme",
  CASE WHEN a."enquiryId" IS NULL THEN 'DIRECT' ELSE 'ENQUIRY' END,
  s."createdAt",
  CURRENT_TIMESTAMP
FROM "Student" s
LEFT JOIN "Admission" a ON a."studentId" = s."id"
LEFT JOIN "ProgrammeDefinition" pd ON pd."id" = s."programmeDefinitionId"
ON CONFLICT ("studentId") DO NOTHING;

UPDATE "FeeInvoice" i SET "enrollmentContractId" = c."id"
FROM "StudentEnrollmentContract" c
WHERE c."studentId" = i."studentId" AND i."enrollmentContractId" IS NULL;

UPDATE "StudentDaycarePlan" p SET "enrollmentContractId" = c."id"
FROM "StudentEnrollmentContract" c
WHERE c."studentId" = p."studentId" AND p."enrollmentContractId" IS NULL;

UPDATE "StudentCharge" sc SET "enrollmentContractId" = c."id"
FROM "StudentEnrollmentContract" c
WHERE c."studentId" = sc."studentId" AND sc."enrollmentContractId" IS NULL;

INSERT INTO "ContractService" (
  "id", "contractId", "serviceType", "category", "catalogueItemType", "catalogueItemId",
  "label", "amountSnapshot", "gstApplicable", "gstRate", "gstInclusive", "taxableValue",
  "cgst", "sgst", "total", "recurring", "frequency", "effectiveFrom", "effectiveTo",
  "status", "createdAt", "updatedAt"
)
SELECT
  'legacy-service-' || substr(md5('preschool|' || fa."id"), 1, 20), c."id",
  'PRESCHOOL'::"ContractServiceType", fa."category", 'STUDENT_FEE_ACCOUNT', fa."id", fa."title",
  fa."standardAmount", fa."gstApplicable", fa."gstRate", fa."priceType" = 'GST_INCLUSIVE'::"PriceType",
  CASE WHEN fa."gstApplicable" AND COALESCE(fa."gstRate", 0) > 0 AND fa."priceType" = 'GST_INCLUSIVE'::"PriceType"
    THEN round(fa."standardAmount" / (1 + fa."gstRate" / 100), 2) ELSE fa."standardAmount" END,
  CASE WHEN fa."gstApplicable" AND COALESCE(fa."gstRate", 0) > 0
    THEN round((CASE WHEN fa."priceType" = 'GST_INCLUSIVE'::"PriceType" THEN fa."standardAmount" - fa."standardAmount" / (1 + fa."gstRate" / 100) ELSE fa."standardAmount" * fa."gstRate" / 100 END) / 2, 2) ELSE 0 END,
  CASE WHEN fa."gstApplicable" AND COALESCE(fa."gstRate", 0) > 0
    THEN round((CASE WHEN fa."priceType" = 'GST_INCLUSIVE'::"PriceType" THEN fa."standardAmount" - fa."standardAmount" / (1 + fa."gstRate" / 100) ELSE fa."standardAmount" * fa."gstRate" / 100 END) / 2, 2) ELSE 0 END,
  CASE WHEN fa."gstApplicable" AND COALESCE(fa."gstRate", 0) > 0 AND fa."priceType" = 'GST_EXCLUSIVE'::"PriceType"
    THEN round(fa."standardAmount" * (1 + fa."gstRate" / 100), 2) ELSE fa."standardAmount" END,
  true, 'MONTHLY'::"ContractServiceFrequency", COALESCE(fa."startDate", c."startDate"), fa."endDate",
  CASE WHEN fa."active" THEN 'ACTIVE'::"ContractServiceStatus" ELSE 'ENDED'::"ContractServiceStatus" END,
  fa."createdAt", CURRENT_TIMESTAMP
FROM "StudentFeeAccount" fa
JOIN "StudentEnrollmentContract" c ON c."studentId" = fa."studentId"
WHERE fa."category" = 'MONTHLY_PRESCHOOL_FEE'::"FeeCategory";

INSERT INTO "ContractService" (
  "id", "contractId", "serviceType", "category", "catalogueItemType", "catalogueItemId",
  "label", "detail", "amountSnapshot", "gstApplicable", "gstRate", "gstInclusive",
  "taxableValue", "cgst", "sgst", "total", "recurring", "frequency", "effectiveFrom",
  "effectiveTo", "status", "sourceVersionId", "metadata", "createdAt", "updatedAt"
)
SELECT
  'legacy-service-' || substr(md5('daycare|' || p."id"), 1, 20), c."id",
  'DAYCARE'::"ContractServiceType", 'DAYCARE_FEE'::"FeeCategory", 'DAYCARE_PLAN', p."planDefinitionId",
  p."title", concat_ws(' · ', d."name", CASE WHEN p."scheduledWeekdays" <> '{}' THEN array_to_string(p."scheduledWeekdays", ',') || ' weekdays' END),
  COALESCE(p."monthlyFeeOverride", pv."price", 0), COALESCE(pv."gstApplicable", false), pv."gstRate",
  COALESCE(pv."priceType", 'GST_INCLUSIVE'::"PriceType") = 'GST_INCLUSIVE'::"PriceType",
  CASE WHEN COALESCE(pv."gstApplicable", false) AND COALESCE(pv."gstRate", 0) > 0 AND COALESCE(pv."priceType", 'GST_INCLUSIVE'::"PriceType") = 'GST_INCLUSIVE'::"PriceType"
    THEN round(COALESCE(p."monthlyFeeOverride", pv."price", 0) / (1 + pv."gstRate" / 100), 2) ELSE COALESCE(p."monthlyFeeOverride", pv."price", 0) END,
  CASE WHEN COALESCE(pv."gstApplicable", false) AND COALESCE(pv."gstRate", 0) > 0 THEN round((CASE WHEN COALESCE(pv."priceType", 'GST_INCLUSIVE'::"PriceType") = 'GST_INCLUSIVE'::"PriceType" THEN COALESCE(p."monthlyFeeOverride", pv."price", 0) - COALESCE(p."monthlyFeeOverride", pv."price", 0) / (1 + pv."gstRate" / 100) ELSE COALESCE(p."monthlyFeeOverride", pv."price", 0) * pv."gstRate" / 100 END) / 2, 2) ELSE 0 END,
  CASE WHEN COALESCE(pv."gstApplicable", false) AND COALESCE(pv."gstRate", 0) > 0 THEN round((CASE WHEN COALESCE(pv."priceType", 'GST_INCLUSIVE'::"PriceType") = 'GST_INCLUSIVE'::"PriceType" THEN COALESCE(p."monthlyFeeOverride", pv."price", 0) - COALESCE(p."monthlyFeeOverride", pv."price", 0) / (1 + pv."gstRate" / 100) ELSE COALESCE(p."monthlyFeeOverride", pv."price", 0) * pv."gstRate" / 100 END) / 2, 2) ELSE 0 END,
  CASE WHEN COALESCE(pv."gstApplicable", false) AND COALESCE(pv."gstRate", 0) > 0 AND COALESCE(pv."priceType", 'GST_INCLUSIVE'::"PriceType") = 'GST_EXCLUSIVE'::"PriceType" THEN round(COALESCE(p."monthlyFeeOverride", pv."price", 0) * (1 + pv."gstRate" / 100), 2) ELSE COALESCE(p."monthlyFeeOverride", pv."price", 0) END,
  p."recurring", CASE WHEN p."recurring" THEN 'MONTHLY'::"ContractServiceFrequency" ELSE 'CUSTOM'::"ContractServiceFrequency" END,
  p."effectiveFrom", p."effectiveTo", CASE WHEN p."active" THEN 'ACTIVE'::"ContractServiceStatus" ELSE 'ENDED'::"ContractServiceStatus" END,
  p."priceVersionId", jsonb_build_object('scheduledWeekdays', p."scheduledWeekdays", 'dailyHours', p."dailyHours", 'includedDays', p."includedDays"),
  p."createdAt", CURRENT_TIMESTAMP
FROM "StudentDaycarePlan" p
JOIN "StudentEnrollmentContract" c ON c."studentId" = p."studentId"
LEFT JOIN "DaycarePlanDefinition" d ON d."id" = p."planDefinitionId"
LEFT JOIN "DaycarePlanPriceVersion" pv ON pv."id" = p."priceVersionId";

UPDATE "StudentDaycarePlan" p SET "contractServiceId" = cs."id"
FROM "ContractService" cs
WHERE cs."catalogueItemType" = 'DAYCARE_PLAN'
  AND cs."id" = 'legacy-service-' || substr(md5('daycare|' || p."id"), 1, 20)
  AND p."contractServiceId" IS NULL;

INSERT INTO "ContractService" (
  "id", "contractId", "serviceType", "category", "catalogueItemType", "catalogueItemId",
  "label", "amountSnapshot", "gstApplicable", "gstRate", "gstInclusive", "taxableValue",
  "cgst", "sgst", "total", "recurring", "frequency", "effectiveFrom", "effectiveTo",
  "status", "sourceVersionId", "createdAt", "updatedAt"
)
SELECT
  'legacy-service-' || substr(md5('meal|' || p."id"), 1, 20), c."id",
  'MEAL'::"ContractServiceType", 'FOOD_FEE'::"FeeCategory", 'MEAL_COMBINATION', p."mealCombinationId",
  COALESCE(mc."name", 'Daycare meals'), COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0),
  COALESCE(mpv."gstApplicable", false), mpv."gstRate",
  COALESCE(mpv."priceType", 'GST_INCLUSIVE'::"PriceType") = 'GST_INCLUSIVE'::"PriceType",
  CASE WHEN COALESCE(mpv."gstApplicable", false) AND COALESCE(mpv."gstRate", 0) > 0 AND COALESCE(mpv."priceType", 'GST_INCLUSIVE'::"PriceType") = 'GST_INCLUSIVE'::"PriceType"
    THEN round(COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0) / (1 + mpv."gstRate" / 100), 2) ELSE COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0) END,
  CASE WHEN COALESCE(mpv."gstApplicable", false) AND COALESCE(mpv."gstRate", 0) > 0 THEN round((CASE WHEN COALESCE(mpv."priceType", 'GST_INCLUSIVE'::"PriceType") = 'GST_INCLUSIVE'::"PriceType" THEN COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0) - COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0) / (1 + mpv."gstRate" / 100) ELSE COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0) * mpv."gstRate" / 100 END) / 2, 2) ELSE 0 END,
  CASE WHEN COALESCE(mpv."gstApplicable", false) AND COALESCE(mpv."gstRate", 0) > 0 THEN round((CASE WHEN COALESCE(mpv."priceType", 'GST_INCLUSIVE'::"PriceType") = 'GST_INCLUSIVE'::"PriceType" THEN COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0) - COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0) / (1 + mpv."gstRate" / 100) ELSE COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0) * mpv."gstRate" / 100 END) / 2, 2) ELSE 0 END,
  CASE WHEN COALESCE(mpv."gstApplicable", false) AND COALESCE(mpv."gstRate", 0) > 0 AND COALESCE(mpv."priceType", 'GST_INCLUSIVE'::"PriceType") = 'GST_EXCLUSIVE'::"PriceType" THEN round(COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0) * (1 + mpv."gstRate" / 100), 2) ELSE COALESCE(p."monthlyFoodFeeOverride", mpv."price", 0) END,
  p."recurring", CASE WHEN p."recurring" THEN 'MONTHLY'::"ContractServiceFrequency" ELSE 'CUSTOM'::"ContractServiceFrequency" END,
  p."effectiveFrom", p."effectiveTo", CASE WHEN p."active" THEN 'ACTIVE'::"ContractServiceStatus" ELSE 'ENDED'::"ContractServiceStatus" END,
  mpv."id", p."createdAt", CURRENT_TIMESTAMP
FROM "StudentDaycarePlan" p
JOIN "StudentEnrollmentContract" c ON c."studentId" = p."studentId"
LEFT JOIN "MealCombination" mc ON mc."id" = p."mealCombinationId"
LEFT JOIN "MealCombinationPriceVersion" mpv ON mpv."combinationId" = p."mealCombinationId" AND mpv."active" = true AND mpv."effectiveFrom" <= CURRENT_TIMESTAMP AND (mpv."effectiveTo" IS NULL OR mpv."effectiveTo" >= CURRENT_TIMESTAMP)
WHERE p."mealCombinationId" IS NOT NULL OR COALESCE(p."monthlyFoodFeeOverride", 0) > 0;
