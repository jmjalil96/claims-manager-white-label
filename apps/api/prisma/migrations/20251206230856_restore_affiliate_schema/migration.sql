/*
  Warnings:

  - The values [AFFILIATE,POLICY_AFFILIATE] on the enum `FileEntityType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `AffiliateFile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PolicyAffiliateFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EnrollmentRole" AS ENUM ('OWNER', 'DEPENDENT');

-- CreateEnum
CREATE TYPE "EnrollmentStartReason" AS ENUM ('INITIAL_ENROLLMENT', 'ADDED_AS_DEPENDENT', 'REHIRED', 'POLICY_RENEWAL', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "EnrollmentEndReason" AS ENUM ('LEFT_COMPANY', 'TERMINATED', 'REMOVED_BY_OWNER', 'DEPENDENT_AGED_OUT', 'POLICY_CANCELLED', 'POLICY_EXPIRED', 'DEATH', 'VOLUNTARY_WITHDRAWAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DependentRelationship" AS ENUM ('SPOUSE', 'CHILD', 'PARENT', 'DOMESTIC_PARTNER', 'SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "EnrollmentFileCategory" AS ENUM ('ENROLLMENT_FORM', 'HEALTH_DECLARATION', 'BENEFICIARY_DESIGNATION', 'COVERAGE_ELECTION', 'WAIVER', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "FileEntityType_new" AS ENUM ('CLAIM', 'INVOICE', 'TICKET', 'POLICY', 'INSURER', 'CLIENT', 'ENROLLMENT', 'DOCUMENT');
ALTER TABLE "File" ALTER COLUMN "entityType" TYPE "FileEntityType_new" USING ("entityType"::text::"FileEntityType_new");
ALTER TYPE "FileEntityType" RENAME TO "FileEntityType_old";
ALTER TYPE "FileEntityType_new" RENAME TO "FileEntityType";
DROP TYPE "public"."FileEntityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AffiliateFile" DROP CONSTRAINT "AffiliateFile_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateFile" DROP CONSTRAINT "AffiliateFile_fileId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyAffiliateFile" DROP CONSTRAINT "PolicyAffiliateFile_fileId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyAffiliateFile" DROP CONSTRAINT "PolicyAffiliateFile_policyId_affiliateId_fkey";

-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN     "previousCoverageType" "CoverageType",
ADD COLUMN     "tierChangedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Policy" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "PolicyAffiliate" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "AffiliateFile";

-- DropTable
DROP TABLE "PolicyAffiliateFile";

-- DropEnum
DROP TYPE "AffiliateFileCategory";

-- DropEnum
DROP TYPE "PolicyAffiliateFileCategory";

-- CreateTable
CREATE TABLE "PolicyEnrollment" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "startReason" "EnrollmentStartReason" NOT NULL,
    "startNote" TEXT,
    "startedById" TEXT,
    "endReason" "EnrollmentEndReason",
    "endNote" TEXT,
    "endedById" TEXT,
    "role" "EnrollmentRole" NOT NULL,
    "coverageType" "CoverageType",
    "relationshipToOwner" "DependentRelationship",
    "certificateNumber" TEXT,
    "ownerEnrollmentId" TEXT,
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
CREATE INDEX "PolicyEnrollment_ownerEnrollmentId_idx" ON "PolicyEnrollment"("ownerEnrollmentId");

-- CreateIndex
CREATE INDEX "PolicyEnrollment_policyId_endDate_idx" ON "PolicyEnrollment"("policyId", "endDate");

-- CreateIndex
CREATE INDEX "PolicyEnrollment_policyId_role_endDate_idx" ON "PolicyEnrollment"("policyId", "role", "endDate");

-- CreateIndex
CREATE INDEX "PolicyEnrollment_affiliateId_policyId_endDate_idx" ON "PolicyEnrollment"("affiliateId", "policyId", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentFile_fileId_key" ON "EnrollmentFile"("fileId");

-- CreateIndex
CREATE INDEX "EnrollmentFile_enrollmentId_idx" ON "EnrollmentFile"("enrollmentId");

-- CreateIndex
CREATE INDEX "EnrollmentFile_category_idx" ON "EnrollmentFile"("category");

-- CreateIndex
CREATE INDEX "PolicyAffiliate_isActive_idx" ON "PolicyAffiliate"("isActive");

-- AddForeignKey
ALTER TABLE "PolicyEnrollment" ADD CONSTRAINT "PolicyEnrollment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyEnrollment" ADD CONSTRAINT "PolicyEnrollment_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyEnrollment" ADD CONSTRAINT "PolicyEnrollment_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyEnrollment" ADD CONSTRAINT "PolicyEnrollment_endedById_fkey" FOREIGN KEY ("endedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyEnrollment" ADD CONSTRAINT "PolicyEnrollment_ownerEnrollmentId_fkey" FOREIGN KEY ("ownerEnrollmentId") REFERENCES "PolicyEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentFile" ADD CONSTRAINT "EnrollmentFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentFile" ADD CONSTRAINT "EnrollmentFile_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "PolicyEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
