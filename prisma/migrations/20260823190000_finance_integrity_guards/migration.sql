-- These guards are added NOT VALID intentionally: they protect every new or
-- changed row immediately without deleting or rewriting any legacy record.
-- Existing rows can be reviewed and validated separately after launch.

DO $$
DECLARE
  duplicate_key TEXT;
BEGIN
  SELECT "idempotencyKey"
    INTO duplicate_key
  FROM "FeePayment"
  WHERE "idempotencyKey" IS NOT NULL
  GROUP BY "idempotencyKey"
  HAVING COUNT(*) > 1
  LIMIT 1;

  IF duplicate_key IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot add the FeePayment idempotency guard because duplicate non-null idempotency keys exist. Review and correct the duplicate records first.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "FeePayment_idempotencyKey_key"
  ON "FeePayment"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "ProgrammeFeeSetting_active_effectiveFrom_effectiveTo_idx"
  ON "ProgrammeFeeSetting"("active", "effectiveFrom", "effectiveTo");

CREATE INDEX IF NOT EXISTS "StudentDaycarePlan_studentId_active_effectiveFrom_effectiveTo_idx"
  ON "StudentDaycarePlan"("studentId", "active", "effectiveFrom", "effectiveTo");

CREATE INDEX IF NOT EXISTS "DaycareSession_planId_sessionDate_status_idx"
  ON "DaycareSession"("planId", "sessionDate", "status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daycare_rate_effective_range_ck') THEN
    ALTER TABLE "DaycareRateSetting"
      ADD CONSTRAINT "daycare_rate_effective_range_ck"
      CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom") NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daycare_rate_amounts_ck') THEN
    ALTER TABLE "DaycareRateSetting"
      ADD CONSTRAINT "daycare_rate_amounts_ck"
      CHECK (
        "hourlyRate" > 0 AND "foodCharge" >= 0 AND "fullDayRate" > 0
        AND ("lunchCharge" IS NULL OR "lunchCharge" >= 0)
        AND ("eveningSnackCharge" IS NULL OR "eveningSnackCharge" >= 0)
        AND ("mealComboCharge" IS NULL OR "mealComboCharge" >= 0)
        AND ("monthlyDaycareOnlyRate" IS NULL OR "monthlyDaycareOnlyRate" >= 0)
        AND ("monthlyPreschoolAddonRate" IS NULL OR "monthlyPreschoolAddonRate" >= 0)
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_daycare_plan_range_ck') THEN
    ALTER TABLE "StudentDaycarePlan"
      ADD CONSTRAINT "student_daycare_plan_range_ck"
      CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom") NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_daycare_plan_days_ck') THEN
    ALTER TABLE "StudentDaycarePlan"
      ADD CONSTRAINT "student_daycare_plan_days_ck"
      CHECK (
        ("planType" = 'FLEXIBLE_DAYS' AND "includedDays" BETWEEN 1 AND 31)
        OR ("planType" <> 'FLEXIBLE_DAYS' AND "includedDays" IS NULL)
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daycare_session_amounts_ck') THEN
    ALTER TABLE "DaycareSession"
      ADD CONSTRAINT "daycare_session_amounts_ck"
      CHECK (
        "baseAmount" >= 0 AND "foodCharge" >= 0 AND "totalAmount" >= 0
        AND "totalAmount" = "baseAmount" + "foodCharge"
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_invoice_balance_ck') THEN
    ALTER TABLE "FeeInvoice"
      ADD CONSTRAINT "fee_invoice_balance_ck"
      CHECK (
        "totalAmount" >= 0 AND "paidAmount" >= 0 AND "pendingAmount" >= 0
        AND "paidAmount" + "pendingAmount" = "totalAmount"
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_payment_amounts_ck') THEN
    ALTER TABLE "FeePayment"
      ADD CONSTRAINT "fee_payment_amounts_ck"
      CHECK (
        "amountReceived" > 0 AND "totalAmount" >= "amountReceived"
        AND "pendingAmount" >= 0 AND "cgstAmount" >= 0 AND "sgstAmount" >= 0
        AND "cgstAmount" + "sgstAmount" <= "totalAmount"
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_invoice_item_tax_ck') THEN
    ALTER TABLE "FeeInvoiceItem"
      ADD CONSTRAINT "fee_invoice_item_tax_ck"
      CHECK (
        "taxableAmount" >= 0 AND "cgstAmount" >= 0 AND "sgstAmount" >= 0
        AND "taxableAmount" + "cgstAmount" + "sgstAmount" = "totalAmount"
      ) NOT VALID;
  END IF;
END $$;
