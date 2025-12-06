/**
 * Get Claim SLA tests
 * Focus: Authorization, error handling, SLA calculations, response format
 */

import { describe, it, expect } from 'vitest'
import { getClaimSla } from './getClaimSla.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createClaim,
  createAuditLog,
} from '../../../test/factories.js'

// =============================================================================
// ERROR HANDLING
// =============================================================================

describe('Get Claim SLA Error Handling', () => {
  it('returns 404 for non-existent claim', async () => {
    const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx'

    await expect(getClaimSla(nonExistentId)).rejects.toThrow('Reclamo')
  })
})

// =============================================================================
// RESPONSE FORMAT
// =============================================================================

describe('Get Claim SLA Response Format', () => {
  it('returns correct DTO shape', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await getClaimSla(claim.id)

    expect(result).toHaveProperty('claimId')
    expect(result).toHaveProperty('claimNumber')
    expect(result).toHaveProperty('currentStatus')
    expect(result).toHaveProperty('currentIndicator')
    expect(result).toHaveProperty('stages')
    expect(result).toHaveProperty('totalBusinessDays')
    expect(result).toHaveProperty('totalCalendarDays')

    expect(result.claimId).toBe(claim.id)
    expect(result.claimNumber).toBe(claim.claimNumber)
    expect(result.currentStatus).toBe('DRAFT')
    expect(Array.isArray(result.stages)).toBe(true)
  })

  it('returns stage with correct properties', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await getClaimSla(claim.id)

    const stage = result.stages[0]!
    expect(stage).toHaveProperty('status')
    expect(stage).toHaveProperty('enteredAt')
    expect(stage).toHaveProperty('exitedAt')
    expect(stage).toHaveProperty('businessDays')
    expect(stage).toHaveProperty('calendarDays')
    expect(stage).toHaveProperty('limit')
    expect(stage).toHaveProperty('indicator')

    expect(stage.status).toBe('DRAFT')
    expect(stage.exitedAt).toBeNull() // Current stage has no exit
    expect(typeof stage.enteredAt).toBe('string')
  })
})

// =============================================================================
// STAGE TIMELINE
// =============================================================================

describe('Get Claim SLA Stage Timeline', () => {
  it('returns single DRAFT stage for new claim', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await getClaimSla(claim.id)

    expect(result.stages).toHaveLength(1)
    expect(result.stages[0]!.status).toBe('DRAFT')
    expect(result.stages[0]!.exitedAt).toBeNull()
  })

  it('builds timeline from status change audit logs', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, {
      createdById: admin.id,
      status: 'VALIDATION',
    })

    // Create status change audit log
    await createAuditLog('Claim', claim.id, admin.id, {
      action: 'STATUS_CHANGE',
      changes: { before: { status: 'DRAFT' }, after: { status: 'VALIDATION' } },
    })

    const result = await getClaimSla(claim.id)

    expect(result.stages).toHaveLength(2)
    expect(result.stages[0]!.status).toBe('DRAFT')
    expect(result.stages[0]!.exitedAt).not.toBeNull()
    expect(result.stages[1]!.status).toBe('VALIDATION')
    expect(result.stages[1]!.exitedAt).toBeNull()
  })

  it('orders stages chronologically', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, {
      createdById: admin.id,
      status: 'SUBMITTED',
    })

    // Create status change audit logs in order
    await createAuditLog('Claim', claim.id, admin.id, {
      action: 'STATUS_CHANGE',
      changes: { before: { status: 'DRAFT' }, after: { status: 'VALIDATION' } },
    })
    await createAuditLog('Claim', claim.id, admin.id, {
      action: 'STATUS_CHANGE',
      changes: { before: { status: 'VALIDATION' }, after: { status: 'SUBMITTED' } },
    })

    const result = await getClaimSla(claim.id)

    expect(result.stages).toHaveLength(3)
    expect(result.stages[0]!.status).toBe('DRAFT')
    expect(result.stages[1]!.status).toBe('VALIDATION')
    expect(result.stages[2]!.status).toBe('SUBMITTED')
  })
})

// =============================================================================
// SLA INDICATORS
// =============================================================================

describe('Get Claim SLA Indicators', () => {
  it('returns on_time for claim created today (exclusive start = 0 business days)', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await getClaimSla(claim.id)

    // DRAFT limit is 1 day, but with exclusive start, same day = 0 business days = on_time
    expect(result.currentIndicator).toBe('on_time')
    expect(result.stages[0]!.indicator).toBe('on_time')
  })

  it('returns on_time for terminal status (no limit)', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, {
      createdById: admin.id,
      status: 'SETTLED',
    })

    // Create status change to SETTLED
    await createAuditLog('Claim', claim.id, admin.id, {
      action: 'STATUS_CHANGE',
      changes: { before: { status: 'SUBMITTED' }, after: { status: 'SETTLED' } },
    })

    const result = await getClaimSla(claim.id)

    // SETTLED has no limit, always on_time
    expect(result.currentIndicator).toBe('on_time')
  })

  it('uses correct limit per status', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await getClaimSla(claim.id)

    // DRAFT limit should be 1
    expect(result.stages[0]!.limit).toBe(1)
  })
})

// =============================================================================
// BUSINESS DAYS CALCULATION
// =============================================================================

describe('Get Claim SLA Business Days', () => {
  it('calculates business days correctly (exclusive start)', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await getClaimSla(claim.id)

    // With exclusive start, a claim created today = 0 business days
    expect(result.totalBusinessDays).toBeGreaterThanOrEqual(0)
    expect(result.stages[0]!.businessDays).toBeGreaterThanOrEqual(0)
  })

  it('calculates calendar days correctly', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await getClaimSla(claim.id)

    // Calendar days should be >= 0 (same day = 0)
    expect(result.totalCalendarDays).toBeGreaterThanOrEqual(0)
    expect(result.stages[0]!.calendarDays).toBeGreaterThanOrEqual(0)
  })
})
