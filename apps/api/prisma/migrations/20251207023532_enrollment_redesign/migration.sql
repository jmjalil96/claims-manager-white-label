/*
  Warnings:

  - The values [MEDICAL_RECORD,MARRIAGE_CERTIFICATE] on the enum `AffiliateFileCategory` will be removed. If these variants are still used in the database, this will fail.
  - The values [POLICY_AFFILIATE] on the enum `FileEntityType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `affiliateType` on the `Affiliate` table. All the data in the column will be lost.
  - You are about to drop the column `coverageType` on the `Affiliate` table. All the data in the column will be lost.
  - You are about to drop the column `familyId` on the `Affiliate` table. All the data in the column will be lost.
  - You are about to drop the `Family` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PolicyAffiliate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PolicyAffiliateFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EnrollmentFileCategory" AS ENUM ('ENROLLMENT_FORM', 'PROOF_OF_RELATIONSHIP', 'MARRIAGE_CERTIFICATE', 'BIRTH_CERTIFICATE', 'ADOPTION_PAPERS', 'OTHER');

-- CreateEnum
CREATE TYPE "EnrollmentStartReason" AS ENUM ('INITIAL_ENROLLMENT', 'ADDED_AS_DEPENDENT', 'REHIRED', 'POLICY_RENEWAL', 'TRANSFER', 'CHANGE_OF_COVERAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "EnrollmentEndReason" AS ENUM ('LEFT_COMPANY', 'TERMINATED', 'REMOVED_BY_OWNER', 'DEPENDENT_AGED_OUT', 'POLICY_CANCELLED', 'POLICY_EXPIRED', 'DEATH', 'VOLUNTARY_WITHDRAWAL', 'CHANGE_OF_COVERAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "DependentRelationship" AS ENUM ('SPOUSE', 'CHILD', 'PARENT', 'DOMESTIC_PARTNER', 'SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'DOMESTIC_PARTNER');

-- AlterEnum
BEGIN;
CREATE TYPE "AffiliateFileCategory_new" AS ENUM ('ID_DOCUMENT', 'BIRTH_CERTIFICATE', 'PHOTO', 'OTHER');
ALTER TABLE "AffiliateFile" ALTER COLUMN "category" TYPE "AffiliateFileCategory_new" USING ("category"::text::"AffiliateFileCategory_new");
ALTER TYPE "AffiliateFileCategory" RENAME TO "AffiliateFileCategory_old";
ALTER TYPE "AffiliateFileCategory_new" RENAME TO "AffiliateFileCategory";
DROP TYPE "public"."AffiliateFileCategory_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "FileEntityType_new" AS ENUM ('CLAIM', 'INVOICE', 'TICKET', 'POLICY', 'INSURER', 'CLIENT', 'DOCUMENT', 'AFFILIATE', 'ENROLLMENT');
ALTER TABLE "File" ALTER COLUMN "entityType" TYPE "FileEntityType_new" USING ("entityType"::text::"FileEntityType_new");
ALTER TYPE "FileEntityType" RENAME TO "FileEntityType_old";
ALTER TYPE "FileEntityType_new" RENAME TO "FileEntityType";
DROP TYPE "public"."FileEntityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Affiliate" DROP CONSTRAINT "Affiliate_familyId_fkey";

-- DropForeignKey
ALTER TABLE "Family" DROP CONSTRAINT "Family_clientId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyAffiliate" DROP CONSTRAINT "PolicyAffiliate_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyAffiliate" DROP CONSTRAINT "PolicyAffiliate_policyId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyAffiliateFile" DROP CONSTRAINT "PolicyAffiliateFile_fileId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyAffiliateFile" DROP CONSTRAINT "PolicyAffiliateFile_policyId_affiliateId_fkey";

-- DropIndex
DROP INDEX "Affiliate_affiliateType_idx";

-- DropIndex
DROP INDEX "Affiliate_familyId_idx";

-- AlterTable
ALTER TABLE "Affiliate" DROP COLUMN "affiliateType",
DROP COLUMN "coverageType",
DROP COLUMN "familyId",
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "maritalStatus" "MaritalStatus",
ADD COLUMN     "relationship" "DependentRelationship";

-- AlterTable
ALTER TABLE "Policy" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropTable
DROP TABLE "Family";

-- DropTable
DROP TABLE "PolicyAffiliate";

-- DropTable
DROP TABLE "PolicyAffiliateFile";

-- DropEnum
DROP TYPE "AffiliateType";

-- DropEnum
DROP TYPE "PolicyAffiliateFileCategory";

-- CreateTable
CREATE TABLE "PolicyEnrollment" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "coverageType" "CoverageType",
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "startReason" "EnrollmentStartReason",
    "endReason" "EnrollmentEndReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentFile" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "category" "EnrollmentFileCategory",
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PolicyEnrollment_policyId_idx" ON "PolicyEnrollment"("policyId");

-- CreateIndex
CREATE INDEX "PolicyEnrollment_affiliateId_idx" ON "PolicyEnrollment"("affiliateId");

-- CreateIndex
CREATE INDEX "PolicyEnrollment_coverageType_idx" ON "PolicyEnrollment"("coverageType");

-- CreateIndex
CREATE INDEX "PolicyEnrollment_startDate_idx" ON "PolicyEnrollment"("startDate");

-- CreateIndex
CREATE INDEX "PolicyEnrollment_endDate_idx" ON "PolicyEnrollment"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyEnrollment_policyId_affiliateId_startDate_key" ON "PolicyEnrollment"("policyId", "affiliateId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentFile_fileId_key" ON "EnrollmentFile"("fileId");

-- CreateIndex
CREATE INDEX "EnrollmentFile_enrollmentId_idx" ON "EnrollmentFile"("enrollmentId");

-- CreateIndex
CREATE INDEX "EnrollmentFile_category_idx" ON "EnrollmentFile"("category");

-- AddForeignKey
ALTER TABLE "PolicyEnrollment" ADD CONSTRAINT "PolicyEnrollment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyEnrollment" ADD CONSTRAINT "PolicyEnrollment_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentFile" ADD CONSTRAINT "EnrollmentFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentFile" ADD CONSTRAINT "EnrollmentFile_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "PolicyEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
