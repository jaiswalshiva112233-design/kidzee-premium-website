-- CreateTable
CREATE TABLE "ProgrammeFeeSetting" (
    "id" TEXT NOT NULL,
    "programme" "Programme" NOT NULL,
    "category" "FeeCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
    "gstRate" DECIMAL(5,2),
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammeFeeSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LateFeeSetting" (
    "id" TEXT NOT NULL,
    "dueDay" INTEGER NOT NULL DEFAULT 5,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "calculationType" TEXT NOT NULL DEFAULT 'PER_DAY',
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "maximumAmount" DECIMAL(12,2),
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LateFeeSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgrammeFeeSetting_programme_idx" ON "ProgrammeFeeSetting"("programme");

-- CreateIndex
CREATE INDEX "ProgrammeFeeSetting_category_idx" ON "ProgrammeFeeSetting"("category");

-- CreateIndex
CREATE INDEX "ProgrammeFeeSetting_effectiveFrom_idx" ON "ProgrammeFeeSetting"("effectiveFrom");

-- CreateIndex
CREATE INDEX "ProgrammeFeeSetting_active_idx" ON "ProgrammeFeeSetting"("active");

-- CreateIndex
CREATE INDEX "LateFeeSetting_effectiveFrom_idx" ON "LateFeeSetting"("effectiveFrom");

-- CreateIndex
CREATE INDEX "LateFeeSetting_active_idx" ON "LateFeeSetting"("active");
