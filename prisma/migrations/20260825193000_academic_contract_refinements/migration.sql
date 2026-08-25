DO $$ BEGIN
  CREATE TYPE "PriceType" AS ENUM ('GST_INCLUSIVE', 'GST_EXCLUSIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "ProgrammeFeeVersion"
  ADD COLUMN IF NOT EXISTS "kitFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "combineAnnualAndKit" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "admissionGstApplicable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "admissionGstRate" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "admissionPriceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE',
  ADD COLUMN IF NOT EXISTS "annualGstApplicable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "annualGstRate" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "annualPriceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE',
  ADD COLUMN IF NOT EXISTS "kitGstApplicable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "kitGstRate" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "kitPriceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE',
  ADD COLUMN IF NOT EXISTS "monthlyGstApplicable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "monthlyGstRate" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "monthlyPriceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';

UPDATE "ProgrammeFeeVersion"
SET
  "admissionGstApplicable" = "gstApplicable",
  "admissionGstRate" = "gstRate",
  "annualGstApplicable" = "gstApplicable",
  "annualGstRate" = "gstRate",
  "kitGstApplicable" = "gstApplicable",
  "kitGstRate" = "gstRate",
  "monthlyGstApplicable" = "gstApplicable",
  "monthlyGstRate" = "gstRate";

ALTER TABLE "DaycarePlanPriceVersion" ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';
ALTER TABLE "MealPriceVersion" ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';
ALTER TABLE "MealCombinationPriceVersion" ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';
ALTER TABLE "ChargeDefinition" ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';
ALTER TABLE "DaycareRateSetting"
  ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE',
  ADD COLUMN IF NOT EXISTS "foodPriceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';
ALTER TABLE "StudentFeeAccount" ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';
ALTER TABLE "FeeInvoiceItem" ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';
ALTER TABLE "DaycareSession"
  ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE',
  ADD COLUMN IF NOT EXISTS "foodPriceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';
ALTER TABLE "DaycareSessionMeal" ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';
ALTER TABLE "StudentCharge" ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'GST_INCLUSIVE';

ALTER TABLE "ProgrammeFeeVersion"
  ADD CONSTRAINT "ProgrammeFeeVersion_kitFee_nonnegative"
  CHECK ("kitFee" >= 0) NOT VALID;
