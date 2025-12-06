/*
  Warnings:

  - A unique constraint covering the columns `[policyNumber,insurerId]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Policy_policyNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Policy_policyNumber_insurerId_key" ON "Policy"("policyNumber", "insurerId");
