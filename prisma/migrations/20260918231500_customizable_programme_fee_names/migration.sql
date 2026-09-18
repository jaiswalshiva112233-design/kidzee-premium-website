-- AlterTable
ALTER TABLE "ProgrammeFeeVersion" ADD COLUMN IF NOT EXISTS "admissionFeeName" TEXT DEFAULT 'Admission fee';
ALTER TABLE "ProgrammeFeeVersion" ADD COLUMN IF NOT EXISTS "annualFeeName" TEXT DEFAULT 'Annual fee';
ALTER TABLE "ProgrammeFeeVersion" ADD COLUMN IF NOT EXISTS "kitFeeName" TEXT DEFAULT 'Kit fee';
ALTER TABLE "ProgrammeFeeVersion" ADD COLUMN IF NOT EXISTS "customFees" JSONB DEFAULT '[]'::jsonb;
