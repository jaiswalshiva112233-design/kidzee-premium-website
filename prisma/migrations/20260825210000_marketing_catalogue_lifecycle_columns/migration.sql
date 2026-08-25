ALTER TABLE "DaycarePlanDefinition"
  ADD COLUMN IF NOT EXISTS "status" "CatalogueStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "DaycarePlanDefinition"
SET "status" = CASE WHEN "active" THEN 'ACTIVE'::"CatalogueStatus" ELSE 'INACTIVE'::"CatalogueStatus" END;

ALTER TABLE "ChargeDefinition"
  ADD COLUMN IF NOT EXISTS "status" "CatalogueStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "ChargeDefinition"
SET "status" = CASE WHEN "active" THEN 'ACTIVE'::"CatalogueStatus" ELSE 'INACTIVE'::"CatalogueStatus" END;

ALTER TABLE "StudentDaycarePlan"
  ADD COLUMN IF NOT EXISTS "lifecycleStatus" "CatalogueStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "StudentDaycarePlan"
SET "lifecycleStatus" = CASE WHEN "active" THEN 'ACTIVE'::"CatalogueStatus" ELSE 'INACTIVE'::"CatalogueStatus" END;

CREATE INDEX IF NOT EXISTS "DaycarePlanDefinition_status_displayOrder_idx"
  ON "DaycarePlanDefinition" ("status", "displayOrder");

CREATE INDEX IF NOT EXISTS "ChargeDefinition_status_displayOrder_idx"
  ON "ChargeDefinition" ("status", "displayOrder");

CREATE INDEX IF NOT EXISTS "StudentDaycarePlan_lifecycleStatus_active_idx"
  ON "StudentDaycarePlan" ("lifecycleStatus", "active");
