CREATE TYPE "AiModelScope" AS ENUM ('WEBSITE', 'ADS', 'CHAT', 'MIRA', 'TERRA', 'LUNA');
CREATE TYPE "LandingPageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "GrowthExperimentStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED');
CREATE TYPE "GrowthVersionStatus" AS ENUM ('DRAFT', 'APPROVED', 'APPLIED', 'ROLLED_BACK');
CREATE TYPE "GrowthDataSource" AS ENUM ('CENTREOS', 'WEBSITE', 'GOOGLE_ANALYTICS', 'SEARCH_CONSOLE', 'GOOGLE_ADS', 'META_ADS', 'GBP', 'PAGESPEED', 'MANUAL');
CREATE TYPE "InternalIdentityType" AS ENUM ('FINGERPRINT', 'COOKIE', 'DEVICE_ID', 'STAFF_LOGIN', 'INTERNAL_TOKEN', 'IP', 'WIFI');

ALTER TABLE "WebsiteLeadSubmission"
  ADD COLUMN "landingPageId" TEXT,
  ADD COLUMN "landingVariantId" TEXT,
  ADD COLUMN "growthExperimentId" TEXT;

CREATE TABLE "AiModelRoute" (
  "id" TEXT NOT NULL,
  "scope" "AiModelScope" NOT NULL,
  "provider" TEXT NOT NULL,
  "protocol" TEXT NOT NULL DEFAULT 'OPENAI_RESPONSES',
  "model" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL DEFAULT 'https://api.openai.com/v1',
  "apiKeyEnvVar" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "maxOutputTokens" INTEGER NOT NULL DEFAULT 1200,
  "monthlyCallLimit" INTEGER NOT NULL DEFAULT 40,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiModelRoute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrowthDataSnapshot" (
  "id" TEXT NOT NULL,
  "source" "GrowthDataSource" NOT NULL,
  "dataset" TEXT NOT NULL,
  "deduplicationKey" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3),
  "periodEnd" TIMESTAMP(3),
  "dimensions" JSONB,
  "metrics" JSONB NOT NULL,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GrowthDataSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrowthAnalysisRun" (
  "id" TEXT NOT NULL,
  "scope" "AiModelScope" NOT NULL,
  "status" TEXT NOT NULL,
  "question" TEXT,
  "evidence" JSONB NOT NULL,
  "answer" TEXT,
  "provider" TEXT,
  "model" TEXT,
  "insufficientData" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "GrowthAnalysisRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LandingPage" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "pageType" TEXT NOT NULL,
  "status" "LandingPageStatus" NOT NULL DEFAULT 'DRAFT',
  "seoTitle" TEXT NOT NULL,
  "metaDescription" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdById" TEXT,
  "updatedById" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LandingPageVariant" (
  "id" TEXT NOT NULL,
  "landingPageId" TEXT NOT NULL,
  "variantKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "allocation" INTEGER NOT NULL DEFAULT 100,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LandingPageVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LandingPageVersion" (
  "id" TEXT NOT NULL,
  "landingPageId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "status" "GrowthVersionStatus" NOT NULL DEFAULT 'DRAFT',
  "snapshot" JSONB NOT NULL,
  "reason" TEXT NOT NULL,
  "expectedImpact" TEXT NOT NULL,
  "approval" TEXT,
  "filesChanged" JSONB NOT NULL,
  "createdById" TEXT,
  "approvedById" TEXT,
  "appliedAt" TIMESTAMP(3),
  "rolledBackAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LandingPageVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrowthExperiment" (
  "id" TEXT NOT NULL,
  "landingPageId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "GrowthExperimentStatus" NOT NULL DEFAULT 'DRAFT',
  "primaryMetric" TEXT NOT NULL DEFAULT 'ADMISSION',
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "winnerVariantId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GrowthExperiment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrowthExperimentVariant" (
  "id" TEXT NOT NULL,
  "experimentId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "allocation" INTEGER NOT NULL DEFAULT 50,
  CONSTRAINT "GrowthExperimentVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalTrafficIdentity" (
  "id" TEXT NOT NULL,
  "type" "InternalIdentityType" NOT NULL,
  "label" TEXT NOT NULL,
  "identifierHash" TEXT NOT NULL,
  "metadata" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "addedById" TEXT,
  "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InternalTrafficIdentity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiModelRoute_scope_key" ON "AiModelRoute"("scope");
CREATE INDEX "AiModelRoute_enabled_idx" ON "AiModelRoute"("enabled");
CREATE INDEX "AiModelRoute_provider_model_idx" ON "AiModelRoute"("provider", "model");
CREATE UNIQUE INDEX "GrowthDataSnapshot_deduplicationKey_key" ON "GrowthDataSnapshot"("deduplicationKey");
CREATE INDEX "GrowthDataSnapshot_source_dataset_collectedAt_idx" ON "GrowthDataSnapshot"("source", "dataset", "collectedAt");
CREATE INDEX "GrowthDataSnapshot_periodStart_periodEnd_idx" ON "GrowthDataSnapshot"("periodStart", "periodEnd");
CREATE INDEX "GrowthAnalysisRun_scope_createdAt_idx" ON "GrowthAnalysisRun"("scope", "createdAt");
CREATE INDEX "GrowthAnalysisRun_status_createdAt_idx" ON "GrowthAnalysisRun"("status", "createdAt");
CREATE UNIQUE INDEX "LandingPage_slug_key" ON "LandingPage"("slug");
CREATE INDEX "LandingPage_status_displayOrder_idx" ON "LandingPage"("status", "displayOrder");
CREATE INDEX "LandingPage_pageType_status_idx" ON "LandingPage"("pageType", "status");
CREATE UNIQUE INDEX "LandingPageVariant_landingPageId_variantKey_key" ON "LandingPageVariant"("landingPageId", "variantKey");
CREATE INDEX "LandingPageVariant_landingPageId_active_idx" ON "LandingPageVariant"("landingPageId", "active");
CREATE UNIQUE INDEX "LandingPageVersion_landingPageId_versionNumber_key" ON "LandingPageVersion"("landingPageId", "versionNumber");
CREATE INDEX "LandingPageVersion_landingPageId_status_createdAt_idx" ON "LandingPageVersion"("landingPageId", "status", "createdAt");
CREATE INDEX "GrowthExperiment_landingPageId_status_idx" ON "GrowthExperiment"("landingPageId", "status");
CREATE INDEX "GrowthExperiment_status_startedAt_idx" ON "GrowthExperiment"("status", "startedAt");
CREATE UNIQUE INDEX "GrowthExperimentVariant_experimentId_variantId_key" ON "GrowthExperimentVariant"("experimentId", "variantId");
CREATE INDEX "GrowthExperimentVariant_variantId_idx" ON "GrowthExperimentVariant"("variantId");
CREATE UNIQUE INDEX "InternalTrafficIdentity_identifierHash_key" ON "InternalTrafficIdentity"("identifierHash");
CREATE INDEX "InternalTrafficIdentity_type_active_idx" ON "InternalTrafficIdentity"("type", "active");
CREATE INDEX "InternalTrafficIdentity_lastSeenAt_idx" ON "InternalTrafficIdentity"("lastSeenAt");
CREATE INDEX "WebsiteLeadSubmission_landingPageId_landingVariantId_receivedAt_idx" ON "WebsiteLeadSubmission"("landingPageId", "landingVariantId", "receivedAt");
CREATE INDEX "WebsiteLeadSubmission_growthExperimentId_receivedAt_idx" ON "WebsiteLeadSubmission"("growthExperimentId", "receivedAt");

ALTER TABLE "LandingPageVariant" ADD CONSTRAINT "LandingPageVariant_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LandingPageVersion" ADD CONSTRAINT "LandingPageVersion_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthExperiment" ADD CONSTRAINT "GrowthExperiment_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthExperimentVariant" ADD CONSTRAINT "GrowthExperimentVariant_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "GrowthExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthExperimentVariant" ADD CONSTRAINT "GrowthExperimentVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "LandingPageVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiModelRoute" ADD CONSTRAINT "AiModelRoute_limits_check" CHECK ("maxOutputTokens" BETWEEN 64 AND 16000 AND "monthlyCallLimit" >= 0) NOT VALID;
ALTER TABLE "LandingPageVariant" ADD CONSTRAINT "LandingPageVariant_allocation_check" CHECK ("allocation" BETWEEN 0 AND 100) NOT VALID;
ALTER TABLE "GrowthExperimentVariant" ADD CONSTRAINT "GrowthExperimentVariant_allocation_check" CHECK ("allocation" BETWEEN 1 AND 100) NOT VALID;

INSERT INTO "AiModelRoute" ("id", "scope", "provider", "protocol", "model", "baseUrl", "apiKeyEnvVar", "enabled", "maxOutputTokens", "monthlyCallLimit") VALUES
  ('ai-route-website', 'WEBSITE', 'OpenAI', 'OPENAI_RESPONSES', 'configure-in-centreos', 'https://api.openai.com/v1', 'OPENAI_API_KEY', false, 1200, 40),
  ('ai-route-ads', 'ADS', 'OpenAI', 'OPENAI_RESPONSES', 'configure-in-centreos', 'https://api.openai.com/v1', 'OPENAI_API_KEY', false, 1200, 40),
  ('ai-route-chat', 'CHAT', 'OpenAI', 'OPENAI_RESPONSES', 'configure-in-centreos', 'https://api.openai.com/v1', 'OPENAI_API_KEY', false, 1200, 80),
  ('ai-route-mira', 'MIRA', 'OpenAI', 'OPENAI_RESPONSES', 'configure-in-centreos', 'https://api.openai.com/v1', 'OPENAI_API_KEY', false, 300, 300),
  ('ai-route-terra', 'TERRA', 'OpenAI', 'OPENAI_RESPONSES', 'configure-in-centreos', 'https://api.openai.com/v1', 'OPENAI_API_KEY', false, 1200, 40),
  ('ai-route-luna', 'LUNA', 'OpenAI', 'OPENAI_RESPONSES', 'configure-in-centreos', 'https://api.openai.com/v1', 'OPENAI_API_KEY', false, 1200, 40)
ON CONFLICT ("scope") DO NOTHING;
