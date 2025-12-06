-- AlterEnum
BEGIN;
CREATE TYPE "FileEntityType_new" AS ENUM ('CLAIM', 'INVOICE', 'TICKET', 'POLICY', 'INSURER', 'CLIENT', 'DOCUMENT');
ALTER TABLE "File" ALTER COLUMN "entityType" TYPE "FileEntityType_new" USING ("entityType"::text::"FileEntityType_new");
ALTER TYPE "FileEntityType" RENAME TO "FileEntityType_old";
ALTER TYPE "FileEntityType_new" RENAME TO "FileEntityType";
DROP TYPE "public"."FileEntityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "EnrollmentFile" DROP CONSTRAINT "EnrollmentFile_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "EnrollmentFile" DROP CONSTRAINT "EnrollmentFile_fileId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyEnrollment" DROP CONSTRAINT "PolicyEnrollment_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyEnrollment" DROP CONSTRAINT "PolicyEnrollment_endedById_fkey";

-- DropForeignKey
ALTER TABLE "PolicyEnrollment" DROP CONSTRAINT "PolicyEnrollment_ownerEnrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyEnrollment" DROP CONSTRAINT "PolicyEnrollment_policyId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyEnrollment" DROP CONSTRAINT "PolicyEnrollment_startedById_fkey";

-- DropTable
DROP TABLE "EnrollmentFile";

-- DropTable
DROP TABLE "PolicyEnrollment";

-- DropEnum
DROP TYPE "DependentRelationship";

-- DropEnum
DROP TYPE "EnrollmentEndReason";

-- DropEnum
DROP TYPE "EnrollmentFileCategory";

-- DropEnum
DROP TYPE "EnrollmentRole";

-- DropEnum
DROP TYPE "EnrollmentStartReason";
