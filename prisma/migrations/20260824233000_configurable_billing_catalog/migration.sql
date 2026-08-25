-- Extend the existing CentreOS ledger with owner-managed catalogues. Existing
-- enum columns and legacy rate tables remain intact for backwards compatibility.
CREATE TYPE "CatalogueStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ConfigurableDaycareBillingType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');
CREATE TYPE "DaycareMealRule" AS ENUM ('NOT_AVAILABLE', 'OPTIONAL', 'REQUIRED', 'INCLUDED');

ALTER TABLE "Student" ADD COLUMN "programmeDefinitionId" TEXT;
ALTER TABLE "FeeInvoiceItem"
  ADD COLUMN "chargeKey" TEXT,
  ADD COLUMN "sourceId" TEXT,
  ADD COLUMN "sourceType" TEXT,
  ADD COLUMN "sourceVersionId" TEXT;
ALTER TABLE "StudentDaycarePlan"
  ADD COLUMN "billingStoppedAt" TIMESTAMP(3),
  ADD COLUMN "maximumVisitsOverride" INTEGER,
  ADD COLUMN "mealCombinationId" TEXT,
  ADD COLUMN "planDefinitionId" TEXT,
  ADD COLUMN "priceVersionId" TEXT,
  ADD COLUMN "recurring" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "separateInvoice" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DaycareSession"
  ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "emergencyCare" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "invoiceStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "reason" TEXT,
  ADD COLUMN "pickupPerson" TEXT;

CREATE TABLE "ProgrammeDefinition" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT, "ageMinimumMonths" INTEGER, "ageMaximumMonths" INTEGER,
  "colour" TEXT NOT NULL DEFAULT '#5B2A86', "capacity" INTEGER,
  "status" "CatalogueStatus" NOT NULL DEFAULT 'ACTIVE',
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProgrammeDefinition_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProgrammeFeeVersion" (
  "id" TEXT NOT NULL, "programmeId" TEXT NOT NULL,
  "admissionFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "annualFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "monthlyFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false, "gstRate" DECIMAL(5,2),
  "effectiveFrom" TIMESTAMP(3) NOT NULL, "effectiveTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProgrammeFeeVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DaycarePlanDefinition" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT, "billingType" "ConfigurableDaycareBillingType" NOT NULL,
  "hoursIncluded" DECIMAL(6,2), "timeWindowStart" TEXT, "timeWindowEnd" TEXT,
  "mealRule" "DaycareMealRule" NOT NULL DEFAULT 'OPTIONAL',
  "recurring" BOOLEAN NOT NULL DEFAULT false, "maximumVisits" INTEGER,
  "allowConcurrent" BOOLEAN NOT NULL DEFAULT false, "active" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DaycarePlanDefinition_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DaycarePlanPriceVersion" (
  "id" TEXT NOT NULL, "planId" TEXT NOT NULL, "price" DECIMAL(12,2) NOT NULL,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false, "gstRate" DECIMAL(5,2),
  "effectiveFrom" TIMESTAMP(3) NOT NULL, "effectiveTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DaycarePlanPriceVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MealDefinition" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT, "status" "CatalogueStatus" NOT NULL DEFAULT 'ACTIVE',
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MealDefinition_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MealPriceVersion" (
  "id" TEXT NOT NULL, "mealId" TEXT NOT NULL, "price" DECIMAL(12,2) NOT NULL,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false, "gstRate" DECIMAL(5,2),
  "effectiveFrom" TIMESTAMP(3) NOT NULL, "effectiveTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MealPriceVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MealCombination" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT, "status" "CatalogueStatus" NOT NULL DEFAULT 'ACTIVE',
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MealCombination_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MealCombinationItem" (
  "id" TEXT NOT NULL, "combinationId" TEXT NOT NULL, "mealId" TEXT NOT NULL,
  "quantity" DECIMAL(8,2) NOT NULL DEFAULT 1,
  CONSTRAINT "MealCombinationItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MealCombinationPriceVersion" (
  "id" TEXT NOT NULL, "combinationId" TEXT NOT NULL, "price" DECIMAL(12,2) NOT NULL,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false, "gstRate" DECIMAL(5,2),
  "effectiveFrom" TIMESTAMP(3) NOT NULL, "effectiveTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MealCombinationPriceVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DaycareSessionMeal" (
  "id" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "mealId" TEXT NOT NULL,
  "quantity" DECIMAL(8,2) NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(12,2) NOT NULL, "totalAmount" DECIMAL(12,2) NOT NULL,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false, "gstRate" DECIMAL(5,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DaycareSessionMeal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgrammeDefinition_code_key" ON "ProgrammeDefinition"("code");
CREATE INDEX "ProgrammeDefinition_status_displayOrder_idx" ON "ProgrammeDefinition"("status", "displayOrder");
CREATE INDEX "ProgrammeFeeVersion_programmeId_active_effectiveFrom_effect_idx" ON "ProgrammeFeeVersion"("programmeId", "active", "effectiveFrom", "effectiveTo");
CREATE UNIQUE INDEX "ProgrammeFeeVersion_programmeId_effectiveFrom_key" ON "ProgrammeFeeVersion"("programmeId", "effectiveFrom");
CREATE UNIQUE INDEX "DaycarePlanDefinition_code_key" ON "DaycarePlanDefinition"("code");
CREATE INDEX "DaycarePlanDefinition_active_displayOrder_idx" ON "DaycarePlanDefinition"("active", "displayOrder");
CREATE INDEX "DaycarePlanDefinition_billingType_idx" ON "DaycarePlanDefinition"("billingType");
CREATE INDEX "DaycarePlanPriceVersion_planId_active_effectiveFrom_effecti_idx" ON "DaycarePlanPriceVersion"("planId", "active", "effectiveFrom", "effectiveTo");
CREATE UNIQUE INDEX "DaycarePlanPriceVersion_planId_effectiveFrom_key" ON "DaycarePlanPriceVersion"("planId", "effectiveFrom");
CREATE UNIQUE INDEX "MealDefinition_code_key" ON "MealDefinition"("code");
CREATE INDEX "MealDefinition_status_displayOrder_idx" ON "MealDefinition"("status", "displayOrder");
CREATE INDEX "MealPriceVersion_mealId_active_effectiveFrom_effectiveTo_idx" ON "MealPriceVersion"("mealId", "active", "effectiveFrom", "effectiveTo");
CREATE UNIQUE INDEX "MealPriceVersion_mealId_effectiveFrom_key" ON "MealPriceVersion"("mealId", "effectiveFrom");
CREATE UNIQUE INDEX "MealCombination_code_key" ON "MealCombination"("code");
CREATE INDEX "MealCombination_status_displayOrder_idx" ON "MealCombination"("status", "displayOrder");
CREATE INDEX "MealCombinationItem_mealId_idx" ON "MealCombinationItem"("mealId");
CREATE UNIQUE INDEX "MealCombinationItem_combinationId_mealId_key" ON "MealCombinationItem"("combinationId", "mealId");
CREATE INDEX "MealCombinationPriceVersion_combinationId_active_effectiveF_idx" ON "MealCombinationPriceVersion"("combinationId", "active", "effectiveFrom", "effectiveTo");
CREATE UNIQUE INDEX "MealCombinationPriceVersion_combinationId_effectiveFrom_key" ON "MealCombinationPriceVersion"("combinationId", "effectiveFrom");
CREATE INDEX "DaycareSessionMeal_mealId_idx" ON "DaycareSessionMeal"("mealId");
CREATE UNIQUE INDEX "DaycareSessionMeal_sessionId_mealId_key" ON "DaycareSessionMeal"("sessionId", "mealId");
CREATE INDEX "Student_programmeDefinitionId_idx" ON "Student"("programmeDefinitionId");
CREATE UNIQUE INDEX "FeeInvoiceItem_chargeKey_key" ON "FeeInvoiceItem"("chargeKey");
CREATE INDEX "FeeInvoiceItem_sourceType_sourceId_idx" ON "FeeInvoiceItem"("sourceType", "sourceId");
CREATE INDEX "StudentDaycarePlan_planDefinitionId_idx" ON "StudentDaycarePlan"("planDefinitionId");
CREATE INDEX "StudentDaycarePlan_priceVersionId_idx" ON "StudentDaycarePlan"("priceVersionId");
CREATE INDEX "StudentDaycarePlan_mealCombinationId_idx" ON "StudentDaycarePlan"("mealCombinationId");
CREATE INDEX "DaycareSession_approved_invoiceStatus_idx" ON "DaycareSession"("approved", "invoiceStatus");
CREATE INDEX "DaycareSession_approvedById_idx" ON "DaycareSession"("approvedById");

ALTER TABLE "Student" ADD CONSTRAINT "Student_programmeDefinitionId_fkey" FOREIGN KEY ("programmeDefinitionId") REFERENCES "ProgrammeDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProgrammeFeeVersion" ADD CONSTRAINT "ProgrammeFeeVersion_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "ProgrammeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DaycarePlanPriceVersion" ADD CONSTRAINT "DaycarePlanPriceVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DaycarePlanDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealPriceVersion" ADD CONSTRAINT "MealPriceVersion_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "MealDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealCombinationItem" ADD CONSTRAINT "MealCombinationItem_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "MealCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealCombinationItem" ADD CONSTRAINT "MealCombinationItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "MealDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MealCombinationPriceVersion" ADD CONSTRAINT "MealCombinationPriceVersion_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "MealCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentDaycarePlan" ADD CONSTRAINT "StudentDaycarePlan_planDefinitionId_fkey" FOREIGN KEY ("planDefinitionId") REFERENCES "DaycarePlanDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentDaycarePlan" ADD CONSTRAINT "StudentDaycarePlan_priceVersionId_fkey" FOREIGN KEY ("priceVersionId") REFERENCES "DaycarePlanPriceVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentDaycarePlan" ADD CONSTRAINT "StudentDaycarePlan_mealCombinationId_fkey" FOREIGN KEY ("mealCombinationId") REFERENCES "MealCombination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DaycareSession" ADD CONSTRAINT "DaycareSession_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DaycareSessionMeal" ADD CONSTRAINT "DaycareSessionMeal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DaycareSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DaycareSessionMeal" ADD CONSTRAINT "DaycareSessionMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "MealDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Register the existing fixed programmes in the configurable catalogue.
INSERT INTO "ProgrammeDefinition" ("id", "code", "name", "description", "ageMinimumMonths", "ageMaximumMonths", "colour", "capacity", "displayOrder", "updatedAt") VALUES
  ('programme-playgroup', 'PLAYGROUP', 'Playgroup', 'Early preschool programme', 24, 36, '#F4B400', NULL, 10, CURRENT_TIMESTAMP),
  ('programme-nursery', 'NURSERY', 'Nursery', 'Nursery preschool programme', 36, 48, '#7B3FA1', NULL, 20, CURRENT_TIMESTAMP),
  ('programme-junior-kg', 'JUNIOR_KG', 'Junior KG', 'Junior kindergarten programme', 48, 60, '#0F7B6C', NULL, 30, CURRENT_TIMESTAMP),
  ('programme-senior-kg', 'SENIOR_KG', 'Senior KG', 'Senior kindergarten programme', 60, 72, '#2D63B7', NULL, 40, CURRENT_TIMESTAMP),
  ('programme-daycare', 'DAYCARE', 'Daycare Only', 'Daycare-only enrolment', 18, 144, '#D14E73', NULL, 50, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

UPDATE "Student" SET "programmeDefinitionId" = CASE "programme"::text
  WHEN 'PLAYGROUP' THEN 'programme-playgroup' WHEN 'NURSERY' THEN 'programme-nursery'
  WHEN 'JUNIOR_KG' THEN 'programme-junior-kg' WHEN 'SENIOR_KG' THEN 'programme-senior-kg'
  WHEN 'DAYCARE' THEN 'programme-daycare' END
WHERE "programmeDefinitionId" IS NULL;

-- Preserve the most recent legacy programme prices as the first catalogue version.
INSERT INTO "ProgrammeFeeVersion" ("id", "programmeId", "admissionFee", "annualFee", "monthlyFee", "gstApplicable", "gstRate", "effectiveFrom", "active", "updatedAt")
SELECT 'programme-fee-' || lower(p."code"), p."id",
  COALESCE((SELECT s."amount" FROM "ProgrammeFeeSetting" s WHERE s."programme"::text=p."code" AND s."category"='ADMISSION_FEE' ORDER BY s."effectiveFrom" DESC LIMIT 1),0),
  COALESCE((SELECT s."amount" FROM "ProgrammeFeeSetting" s WHERE s."programme"::text=p."code" AND s."category"='ANNUAL_FEE' ORDER BY s."effectiveFrom" DESC LIMIT 1),0),
  COALESCE((SELECT s."amount" FROM "ProgrammeFeeSetting" s WHERE s."programme"::text=p."code" AND s."category"='MONTHLY_PRESCHOOL_FEE' ORDER BY s."effectiveFrom" DESC LIMIT 1),0),
  COALESCE((SELECT s."gstApplicable" FROM "ProgrammeFeeSetting" s WHERE s."programme"::text=p."code" AND s."category"='MONTHLY_PRESCHOOL_FEE' ORDER BY s."effectiveFrom" DESC LIMIT 1),false),
  (SELECT s."gstRate" FROM "ProgrammeFeeSetting" s WHERE s."programme"::text=p."code" AND s."category"='MONTHLY_PRESCHOOL_FEE' ORDER BY s."effectiveFrom" DESC LIMIT 1),
  COALESCE((SELECT MIN(s."effectiveFrom") FROM "ProgrammeFeeSetting" s WHERE s."programme"::text=p."code"), CURRENT_TIMESTAMP), true, CURRENT_TIMESTAMP
FROM "ProgrammeDefinition" p
ON CONFLICT DO NOTHING;

INSERT INTO "DaycarePlanDefinition" ("id", "code", "name", "description", "billingType", "hoursIncluded", "mealRule", "recurring", "maximumVisits", "allowConcurrent", "displayOrder", "updatedAt") VALUES
  ('daycare-hourly', 'HOURLY', 'Hourly Daycare', 'Care billed by actual hours', 'HOURLY', NULL, 'OPTIONAL', false, NULL, true, 10, CURRENT_TIMESTAMP),
  ('daycare-full-day', 'FULL_DAY', 'Full Day Daycare', 'One full day of daycare', 'DAILY', NULL, 'OPTIONAL', false, 1, true, 20, CURRENT_TIMESTAMP),
  ('daycare-flexible', 'FLEXIBLE_DAYS', 'Flexible Day Package', 'A configurable number of daycare visits', 'CUSTOM', NULL, 'OPTIONAL', true, NULL, true, 30, CURRENT_TIMESTAMP),
  ('daycare-monthly-only', 'MONTHLY_DAYCARE_ONLY', 'Monthly Daycare Only', 'Recurring monthly daycare for daycare-only children', 'MONTHLY', 6.5, 'OPTIONAL', true, NULL, false, 40, CURRENT_TIMESTAMP),
  ('daycare-monthly-addon', 'MONTHLY_PRESCHOOL_DAYCARE', 'Preschool + Monthly Daycare', 'Recurring monthly daycare added to preschool', 'MONTHLY', 6, 'OPTIONAL', true, NULL, false, 50, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "MealDefinition" ("id", "code", "name", "description", "displayOrder", "updatedAt") VALUES
  ('meal-lunch', 'LUNCH', 'Lunch', 'Daycare lunch', 10, CURRENT_TIMESTAMP),
  ('meal-evening-snack', 'EVENING_SNACK', 'Evening Snack', 'Daycare evening snack', 20, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "MealCombination" ("id", "code", "name", "description", "displayOrder", "updatedAt") VALUES
  ('meal-combo-lunch-snack', 'LUNCH_SNACK', 'Lunch + Evening Snack', 'Lunch and evening snack together', 10, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "MealCombinationItem" ("id", "combinationId", "mealId", "quantity") VALUES
  ('combo-lunch-item', 'meal-combo-lunch-snack', 'meal-lunch', 1),
  ('combo-snack-item', 'meal-combo-lunch-snack', 'meal-evening-snack', 1)
ON CONFLICT ("combinationId", "mealId") DO NOTHING;

-- Snapshot the current legacy rates into catalogue price versions so the
-- migration is immediately billable without asking the centre to re-enter data.
INSERT INTO "DaycarePlanPriceVersion" ("id", "planId", "price", "gstApplicable", "gstRate", "effectiveFrom", "active", "updatedAt")
SELECT v."id", v."planId", v."price", r."gstApplicable", r."gstRate", r."effectiveFrom", true, CURRENT_TIMESTAMP
FROM (SELECT * FROM "DaycareRateSetting" ORDER BY "effectiveFrom" DESC, "createdAt" DESC LIMIT 1) r
CROSS JOIN LATERAL (VALUES
  ('catalogue-price-hourly', 'daycare-hourly', r."hourlyRate"),
  ('catalogue-price-full-day', 'daycare-full-day', r."fullDayRate"),
  ('catalogue-price-flexible', 'daycare-flexible', r."fullDayRate"),
  ('catalogue-price-monthly-only', 'daycare-monthly-only', COALESCE(r."monthlyDaycareOnlyRate", r."monthlySixHalfHourRate", r."monthlySixHourRate")),
  ('catalogue-price-monthly-addon', 'daycare-monthly-addon', r."monthlyPreschoolAddonRate")
) AS v("id", "planId", "price")
WHERE v."price" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MealPriceVersion" ("id", "mealId", "price", "gstApplicable", "gstRate", "effectiveFrom", "active", "updatedAt")
SELECT v."id", v."mealId", v."price", r."foodGstApplicable", r."foodGstRate", r."effectiveFrom", true, CURRENT_TIMESTAMP
FROM (SELECT * FROM "DaycareRateSetting" ORDER BY "effectiveFrom" DESC, "createdAt" DESC LIMIT 1) r
CROSS JOIN LATERAL (VALUES
  ('catalogue-meal-price-lunch', 'meal-lunch', COALESCE(r."lunchCharge", r."foodCharge")),
  ('catalogue-meal-price-snack', 'meal-evening-snack', COALESCE(r."eveningSnackCharge", r."foodCharge"))
) AS v("id", "mealId", "price")
WHERE v."price" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MealCombinationPriceVersion" ("id", "combinationId", "price", "gstApplicable", "gstRate", "effectiveFrom", "active", "updatedAt")
SELECT 'catalogue-meal-price-combo', 'meal-combo-lunch-snack', COALESCE(r."mealComboCharge", COALESCE(r."lunchCharge", r."foodCharge") + COALESCE(r."eveningSnackCharge", r."foodCharge")), r."foodGstApplicable", r."foodGstRate", r."effectiveFrom", true, CURRENT_TIMESTAMP
FROM (SELECT * FROM "DaycareRateSetting" ORDER BY "effectiveFrom" DESC, "createdAt" DESC LIMIT 1) r
ON CONFLICT ("id") DO NOTHING;

UPDATE "StudentDaycarePlan" SET "planDefinitionId" = CASE "planType"::text
  WHEN 'OCCASIONAL' THEN CASE WHEN "billingMode"::text='HOURLY' THEN 'daycare-hourly' ELSE 'daycare-full-day' END
  WHEN 'FLEXIBLE_DAYS' THEN 'daycare-flexible'
  WHEN 'MONTHLY_DAYCARE_ONLY' THEN 'daycare-monthly-only'
  WHEN 'MONTHLY_PRESCHOOL_DAYCARE' THEN 'daycare-monthly-addon' END
WHERE "planDefinitionId" IS NULL;
UPDATE "StudentDaycarePlan" p SET "priceVersionId" = v."id"
FROM "DaycarePlanPriceVersion" v
WHERE p."planDefinitionId" = v."planId" AND p."priceVersionId" IS NULL;
UPDATE "StudentDaycarePlan" SET "mealCombinationId"='meal-combo-lunch-snack' WHERE "foodOption"='BOTH' AND "mealCombinationId" IS NULL;

-- Existing completed visits were already accepted operationally; retain their
-- billability. New visits use the new explicit approval workflow.
UPDATE "DaycareSession" SET
  "approved" = CASE WHEN "status" IN ('COMPLETED','BILLED') THEN true ELSE false END,
  "approvedAt" = CASE WHEN "status" IN ('COMPLETED','BILLED') THEN "updatedAt" ELSE NULL END,
  "approvedById" = CASE WHEN "status" IN ('COMPLETED','BILLED') THEN "createdById" ELSE NULL END,
  "emergencyCare" = CASE WHEN "planId" IS NULL THEN true ELSE false END,
  "invoiceStatus" = CASE WHEN "feeInvoiceId" IS NOT NULL THEN 'INVOICED' ELSE 'PENDING' END;

ALTER TABLE "ProgrammeDefinition" ADD CONSTRAINT "ProgrammeDefinition_age_check" CHECK ("ageMinimumMonths" IS NULL OR "ageMaximumMonths" IS NULL OR "ageMaximumMonths">="ageMinimumMonths") NOT VALID;
ALTER TABLE "ProgrammeDefinition" ADD CONSTRAINT "ProgrammeDefinition_values_check" CHECK (("ageMinimumMonths" IS NULL OR "ageMinimumMonths">=0) AND ("ageMaximumMonths" IS NULL OR "ageMaximumMonths">=0) AND ("capacity" IS NULL OR "capacity">0) AND "displayOrder">=0) NOT VALID;
ALTER TABLE "ProgrammeFeeVersion" ADD CONSTRAINT "ProgrammeFeeVersion_amount_check" CHECK ("admissionFee">=0 AND "annualFee">=0 AND "monthlyFee">=0 AND ("effectiveTo" IS NULL OR "effectiveTo">="effectiveFrom")) NOT VALID;
ALTER TABLE "ProgrammeFeeVersion" ADD CONSTRAINT "ProgrammeFeeVersion_gst_check" CHECK ((NOT "gstApplicable") OR ("gstRate">=0 AND "gstRate"<=100)) NOT VALID;
ALTER TABLE "DaycarePlanDefinition" ADD CONSTRAINT "DaycarePlanDefinition_values_check" CHECK (("hoursIncluded" IS NULL OR "hoursIncluded">0) AND ("maximumVisits" IS NULL OR "maximumVisits">0) AND "displayOrder">=0) NOT VALID;
ALTER TABLE "DaycarePlanPriceVersion" ADD CONSTRAINT "DaycarePlanPriceVersion_amount_check" CHECK ("price">=0 AND ("effectiveTo" IS NULL OR "effectiveTo">="effectiveFrom")) NOT VALID;
ALTER TABLE "DaycarePlanPriceVersion" ADD CONSTRAINT "DaycarePlanPriceVersion_gst_check" CHECK ((NOT "gstApplicable") OR ("gstRate">=0 AND "gstRate"<=100)) NOT VALID;
ALTER TABLE "MealPriceVersion" ADD CONSTRAINT "MealPriceVersion_amount_check" CHECK ("price">=0 AND ("effectiveTo" IS NULL OR "effectiveTo">="effectiveFrom")) NOT VALID;
ALTER TABLE "MealPriceVersion" ADD CONSTRAINT "MealPriceVersion_gst_check" CHECK ((NOT "gstApplicable") OR ("gstRate">=0 AND "gstRate"<=100)) NOT VALID;
ALTER TABLE "MealCombinationPriceVersion" ADD CONSTRAINT "MealCombinationPriceVersion_amount_check" CHECK ("price">=0 AND ("effectiveTo" IS NULL OR "effectiveTo">="effectiveFrom")) NOT VALID;
ALTER TABLE "MealCombinationPriceVersion" ADD CONSTRAINT "MealCombinationPriceVersion_gst_check" CHECK ((NOT "gstApplicable") OR ("gstRate">=0 AND "gstRate"<=100)) NOT VALID;
ALTER TABLE "StudentDaycarePlan" ADD CONSTRAINT "StudentDaycarePlan_catalogue_values_check" CHECK (("maximumVisitsOverride" IS NULL OR "maximumVisitsOverride">0) AND ("billingStoppedAt" IS NULL OR "billingStoppedAt">="effectiveFrom")) NOT VALID;
ALTER TABLE "DaycareSessionMeal" ADD CONSTRAINT "DaycareSessionMeal_amount_check" CHECK ("quantity">0 AND "unitPrice">=0 AND "totalAmount">=0 AND ((NOT "gstApplicable") OR ("gstRate">=0 AND "gstRate"<=100))) NOT VALID;
