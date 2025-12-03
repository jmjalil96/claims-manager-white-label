/**
 * Test setup - runs before/after tests
 * Uses dedicated test database with TRUNCATE for clean slate
 */

import { beforeAll, afterAll, afterEach } from 'vitest'
import { db } from '../lib/db.js'

beforeAll(async () => {
  // Verify we're connected to the test database
  const result = await db.$queryRaw<[{ current_database: string }]>`SELECT current_database()`
  const dbName = result[0].current_database

  if (!dbName.includes('test')) {
    throw new Error(
      `Safety check failed: Connected to "${dbName}" but expected a test database. ` +
        `Ensure DATABASE_URL in .env.test points to claims_test.`
    )
  }
})

afterEach(async () => {
  // Clean all test data - TRUNCATE is fast with CASCADE
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog",
      "ClaimReprocess",
      "ClaimInvoice",
      "ClaimFile",
      "Claim",
      "PolicyAffiliate",
      "Affiliate",
      "Policy",
      "Family",
      "UserClient",
      "Session",
      "Account",
      "Verification",
      "Client",
      "Insurer",
      "User"
    RESTART IDENTITY CASCADE
  `)
})

afterAll(async () => {
  await db.$disconnect()
})
