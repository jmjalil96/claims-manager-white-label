/*
  Warnings:

  - You are about to drop the column `previousCoverageType` on the `Affiliate` table. All the data in the column will be lost.
  - You are about to drop the column `tierChangedAt` on the `Affiliate` table. All the data in the column will be lost.
  - You are about to drop the column `billingCutoffDay` on the `Insurer` table. All the data in the column will be lost.
  - You are about to drop the column `additionalCosts` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `Policy` table. All the data in the column will be lost.
  - The `type` column on the `Policy` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isActive` on the `PolicyAffiliate` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('HEALTH', 'LIFE', 'DENTAL', 'VISION', 'DISABILITY');

-- CreateEnum
CREATE TYPE "PolicyFileCategory" AS ENUM ('CONTRACT', 'AMENDMENT', 'CERTIFICATE', 'TERMS_CONDITIONS', 'OTHER');

-- CreateEnum
CREATE TYPE "AffiliateFileCategory" AS ENUM ('ID_DOCUMENT', 'MEDICAL_RECORD', 'BIRTH_CERTIFICATE', 'MARRIAGE_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "InsurerFileCategory" AS ENUM ('CONTRACT', 'RATE_SHEET', 'LOGO', 'OTHER');

-- CreateEnum
CREATE TYPE "ClientFileCategory" AS ENUM ('CONTRACT', 'TAX_DOCUMENT', 'LOGO', 'OTHER');

-- CreateEnum
CREATE TYPE "PolicyAffiliateFileCategory" AS ENUM ('ENROLLMENT_FORM', 'TERMINATION_FORM', 'ELIGIBILITY_PROOF', 'LIFE_EVENT_DOC', 'COVERAGE_CHANGE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FileEntityType" ADD VALUE 'POLICY';
ALTER TYPE "FileEntityType" ADD VALUE 'AFFILIATE';
ALTER TYPE "FileEntityType" ADD VALUE 'INSURER';
ALTER TYPE "FileEntityType" ADD VALUE 'CLIENT';
ALTER TYPE "FileEntityType" ADD VALUE 'POLICY_AFFILIATE';

-- DropIndex
DROP INDEX "PolicyAffiliate_isActive_idx";

-- AlterTable
ALTER TABLE "Affiliate" DROP COLUMN "previousCoverageType",
DROP COLUMN "tierChangedAt";

-- AlterTable
ALTER TABLE "Insurer" DROP COLUMN "billingCutoffDay",
ADD COLUMN     "taxRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "additionalCosts",
DROP COLUMN "taxRate",
ADD COLUMN     "benefitsCost" DOUBLE PRECISION,
DROP COLUMN "type",
ADD COLUMN     "type" "PolicyType";

-- AlterTable
ALTER TABLE "PolicyAffiliate" DROP COLUMN "isActive";

-- CreateTable
CREATE TABLE "PolicyFile" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "category" "PolicyFileCategory",
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateFile" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "category" "AffiliateFileCategory",
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurerFile" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "insurerId" TEXT NOT NULL,
    "category" "InsurerFileCategory",
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsurerFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientFile" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "category" "ClientFileCategory",
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAffiliateFile" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "category" "PolicyAffiliateFileCategory",
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyAffiliateFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PolicyFile_fileId_key" ON "PolicyFile"("fileId");

-- CreateIndex
CREATE INDEX "PolicyFile_policyId_idx" ON "PolicyFile"("policyId");

-- CreateIndex
CREATE INDEX "PolicyFile_category_idx" ON "PolicyFile"("category");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateFile_fileId_key" ON "AffiliateFile"("fileId");

-- CreateIndex
CREATE INDEX "AffiliateFile_affiliateId_idx" ON "AffiliateFile"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateFile_category_idx" ON "AffiliateFile"("category");

-- CreateIndex
CREATE UNIQUE INDEX "InsurerFile_fileId_key" ON "InsurerFile"("fileId");

-- CreateIndex
CREATE INDEX "InsurerFile_insurerId_idx" ON "InsurerFile"("insurerId");

-- CreateIndex
CREATE INDEX "InsurerFile_category_idx" ON "InsurerFile"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ClientFile_fileId_key" ON "ClientFile"("fileId");

-- CreateIndex
CREATE INDEX "ClientFile_clientId_idx" ON "ClientFile"("clientId");

-- CreateIndex
CREATE INDEX "ClientFile_category_idx" ON "ClientFile"("category");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyAffiliateFile_fileId_key" ON "PolicyAffiliateFile"("fileId");

-- CreateIndex
CREATE INDEX "PolicyAffiliateFile_policyId_affiliateId_idx" ON "PolicyAffiliateFile"("policyId", "affiliateId");

-- CreateIndex
CREATE INDEX "PolicyAffiliateFile_category_idx" ON "PolicyAffiliateFile"("category");

-- AddForeignKey
ALTER TABLE "PolicyFile" ADD CONSTRAINT "PolicyFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyFile" ADD CONSTRAINT "PolicyFile_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateFile" ADD CONSTRAINT "AffiliateFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateFile" ADD CONSTRAINT "AffiliateFile_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurerFile" ADD CONSTRAINT "InsurerFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurerFile" ADD CONSTRAINT "InsurerFile_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "Insurer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientFile" ADD CONSTRAINT "ClientFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientFile" ADD CONSTRAINT "ClientFile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAffiliateFile" ADD CONSTRAINT "PolicyAffiliateFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAffiliateFile" ADD CONSTRAINT "PolicyAffiliateFile_policyId_affiliateId_fkey" FOREIGN KEY ("policyId", "affiliateId") REFERENCES "PolicyAffiliate"("policyId", "affiliateId") ON DELETE CASCADE ON UPDATE CASCADE;
