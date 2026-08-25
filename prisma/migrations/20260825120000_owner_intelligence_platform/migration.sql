CREATE TYPE "SystemHealthStatus" AS ENUM ('HEALTHY', 'WARNING', 'CRITICAL', 'UNKNOWN');

CREATE TABLE "BusinessIntelligenceSnapshot" (
  "id" TEXT NOT NULL,
  "snapshotKey" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "metrics" JSONB NOT NULL,
  "forecasts" JSONB NOT NULL,
  "insights" JSONB NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessIntelligenceSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessIntelligenceSnapshot_snapshotKey_key" ON "BusinessIntelligenceSnapshot"("snapshotKey");
CREATE INDEX "BusinessIntelligenceSnapshot_generatedAt_idx" ON "BusinessIntelligenceSnapshot"("generatedAt");
CREATE INDEX "BusinessIntelligenceSnapshot_periodStart_periodEnd_idx" ON "BusinessIntelligenceSnapshot"("periodStart", "periodEnd");

CREATE TABLE "SystemHealthCheck" (
  "id" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "status" "SystemHealthStatus" NOT NULL,
  "summary" TEXT NOT NULL,
  "details" JSONB,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemHealthCheck_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SystemHealthCheck_service_checkedAt_idx" ON "SystemHealthCheck"("service", "checkedAt");
CREATE INDEX "SystemHealthCheck_status_checkedAt_idx" ON "SystemHealthCheck"("status", "checkedAt");

CREATE TABLE "ScheduledJobHeartbeat" (
  "id" TEXT NOT NULL,
  "jobName" TEXT NOT NULL,
  "status" "SystemHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
  "lastStartedAt" TIMESTAMP(3),
  "lastSucceededAt" TIMESTAMP(3),
  "lastFailedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "durationMs" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduledJobHeartbeat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ScheduledJobHeartbeat_jobName_key" ON "ScheduledJobHeartbeat"("jobName");
CREATE INDEX "ScheduledJobHeartbeat_status_updatedAt_idx" ON "ScheduledJobHeartbeat"("status", "updatedAt");
CREATE INDEX "ScheduledJobHeartbeat_lastSucceededAt_idx" ON "ScheduledJobHeartbeat"("lastSucceededAt");

ALTER TABLE "BusinessIntelligenceSnapshot" ADD CONSTRAINT "BusinessIntelligenceSnapshot_period_check" CHECK ("periodEnd" >= "periodStart") NOT VALID;
ALTER TABLE "ScheduledJobHeartbeat" ADD CONSTRAINT "ScheduledJobHeartbeat_duration_check" CHECK ("durationMs" IS NULL OR "durationMs" >= 0) NOT VALID;
