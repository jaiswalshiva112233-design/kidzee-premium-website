ALTER TABLE "WebsiteLeadSubmission"
  ADD COLUMN IF NOT EXISTS "leadType" TEXT NOT NULL DEFAULT 'admission';

ALTER TABLE "CareerApplication"
  ADD COLUMN IF NOT EXISTS "leadType" TEXT NOT NULL DEFAULT 'recruitment',
  ADD COLUMN IF NOT EXISTS "source" TEXT,
  ADD COLUMN IF NOT EXISTS "medium" TEXT,
  ADD COLUMN IF NOT EXISTS "campaign" TEXT,
  ADD COLUMN IF NOT EXISTS "content" TEXT,
  ADD COLUMN IF NOT EXISTS "term" TEXT,
  ADD COLUMN IF NOT EXISTS "referrer" TEXT,
  ADD COLUMN IF NOT EXISTS "landingPage" TEXT,
  ADD COLUMN IF NOT EXISTS "gclid" TEXT,
  ADD COLUMN IF NOT EXISTS "gbraid" TEXT,
  ADD COLUMN IF NOT EXISTS "wbraid" TEXT,
  ADD COLUMN IF NOT EXISTS "fbclid" TEXT,
  ADD COLUMN IF NOT EXISTS "fbc" TEXT,
  ADD COLUMN IF NOT EXISTS "fbp" TEXT,
  ADD COLUMN IF NOT EXISTS "firstTouch" JSONB,
  ADD COLUMN IF NOT EXISTS "lastTouch" JSONB;

UPDATE "WebsiteLeadSubmission"
SET "leadType" = 'admission'
WHERE "leadType" IS DISTINCT FROM 'admission';

UPDATE "CareerApplication"
SET "leadType" = 'recruitment'
WHERE "leadType" IS DISTINCT FROM 'recruitment';

CREATE INDEX IF NOT EXISTS "WebsiteLeadSubmission_leadType_trafficClass_receivedAt_idx"
  ON "WebsiteLeadSubmission"("leadType", "trafficClass", "receivedAt");

CREATE INDEX IF NOT EXISTS "CareerApplication_leadType_trafficClass_createdAt_idx"
  ON "CareerApplication"("leadType", "trafficClass", "createdAt");

CREATE INDEX IF NOT EXISTS "CareerApplication_source_campaign_createdAt_idx"
  ON "CareerApplication"("source", "campaign", "createdAt");

ALTER TABLE "WebsiteLeadSubmission"
  DROP CONSTRAINT IF EXISTS "WebsiteLeadSubmission_leadType_check";

ALTER TABLE "WebsiteLeadSubmission"
  ADD CONSTRAINT "WebsiteLeadSubmission_leadType_check"
  CHECK ("leadType" = 'admission') NOT VALID;

ALTER TABLE "CareerApplication"
  DROP CONSTRAINT IF EXISTS "CareerApplication_leadType_check";

ALTER TABLE "CareerApplication"
  ADD CONSTRAINT "CareerApplication_leadType_check"
  CHECK ("leadType" = 'recruitment') NOT VALID;
