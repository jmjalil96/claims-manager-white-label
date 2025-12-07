-- CreateTable
CREATE TABLE "EnrollmentDependent" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "dependentId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentDependent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnrollmentDependent_enrollmentId_idx" ON "EnrollmentDependent"("enrollmentId");

-- CreateIndex
CREATE INDEX "EnrollmentDependent_dependentId_idx" ON "EnrollmentDependent"("dependentId");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentDependent_enrollmentId_dependentId_addedAt_key" ON "EnrollmentDependent"("enrollmentId", "dependentId", "addedAt");

-- AddForeignKey
ALTER TABLE "EnrollmentDependent" ADD CONSTRAINT "EnrollmentDependent_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "PolicyEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentDependent" ADD CONSTRAINT "EnrollmentDependent_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
