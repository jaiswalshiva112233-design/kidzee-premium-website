-- CreateTable
CREATE TABLE "NumberSequence" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "minimumWidth" INTEGER NOT NULL DEFAULT 2,
    "resetPolicy" TEXT NOT NULL DEFAULT 'NEVER',
    "lastResetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_key_key" ON "NumberSequence"("key");

-- CreateIndex
CREATE INDEX "NumberSequence_key_idx" ON "NumberSequence"("key");
