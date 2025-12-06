-- AlterTable
ALTER TABLE "Policy" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PolicyExpiration" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "expirationReason" TEXT NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyExpiration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PolicyExpiration_policyId_idx" ON "PolicyExpiration"("policyId");

-- CreateIndex
CREATE INDEX "PolicyExpiration_createdById_idx" ON "PolicyExpiration"("createdById");

-- AddForeignKey
ALTER TABLE "PolicyExpiration" ADD CONSTRAINT "PolicyExpiration_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyExpiration" ADD CONSTRAINT "PolicyExpiration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
