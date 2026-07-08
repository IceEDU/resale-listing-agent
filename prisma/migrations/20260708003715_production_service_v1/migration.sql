-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "AuditArea" AS ENUM ('ITEM', 'LISTING', 'RECOMMENDATION', 'CONNECTOR', 'PRICE', 'PRIVACY', 'JOB');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RecommendationType" ADD VALUE 'REFRESH_LISTING';
ALTER TYPE "RecommendationType" ADD VALUE 'REPOST_ASSISTED';
ALTER TYPE "RecommendationType" ADD VALUE 'CHECK_MESSAGES';
ALTER TYPE "RecommendationType" ADD VALUE 'UPDATE_MANUAL_STATS';

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "lastRefreshedAt" TIMESTAMP(3),
ADD COLUMN     "manualStatusNote" TEXT,
ADD COLUMN     "nextReviewAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "fingerprint" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "summary" TEXT NOT NULL DEFAULT '',
    "error" TEXT,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "createdRecommendations" INTEGER NOT NULL DEFAULT 0,
    "updatedRecommendations" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfAuditResult" (
    "id" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL,
    "area" "AuditArea" NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SelfAuditResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recommendation_itemId_fingerprint_idx" ON "Recommendation"("itemId", "fingerprint");
