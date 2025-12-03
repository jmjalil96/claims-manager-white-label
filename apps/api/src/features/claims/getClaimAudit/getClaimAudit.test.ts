/**
 * Get Claim Audit tests
 * Focus: Authorization, error handling, pagination, response format
 */

import { describe, it, expect } from 'vitest'
import { getClaimAudit } from './getClaimAudit.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createUserClient,
  createClaim,
  createAuditLog,
  authUser,
} from '../../../test/factories.js'

/** Default query params */
const defaultQuery = { page: 1, limit: 20 }

// =============================================================================
// AUTHORIZATION
// =============================================================================

describe('Get Claim Audit Authorization', () => {
  describe('internal roles', () => {
    it('can access audit trail for any claim', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const aff = await createAffiliate(client.id)
      const claim = await createClaim(client.id, aff.id, { createdById: admin.id })
      await createAuditLog('Claim', claim.id, admin.id, { action: 'CREATE' })

      const result = await getClaimAudit(claim.id, defaultQuery, authUser(admin))

      expect(result.auditLogs).toHaveLength(1)
      expect(result.auditLogs[0]!.resourceId).toBe(claim.id)
    })
  })

  describe('external roles (client_admin, client_agent)', () => {
    it('can access audit for claims of accessible clients', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_admin')
      const client = await createClient()
      const aff = await createAffiliate(client.id)
      await createUserClient(user.id, client.id)
      const claim = await createClaim(client.id, aff.id, { createdById: admin.id })
      await createAuditLog('Claim', claim.id, admin.id, { action: 'CREATE' })

      const result = await getClaimAudit(claim.id, defaultQuery, authUser(user))

      expect(result.auditLogs).toHaveLength(1)
    })

    it('cannot access audit for claims of inaccessible clients', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_admin')
      const accessibleClient = await createClient()
      const inaccessibleClient = await createClient()
      const aff = await createAffiliate(inaccessibleClient.id)
      await createUserClient(user.id, accessibleClient.id)
      const claim = await createClaim(inaccessibleClient.id, aff.id, { createdById: admin.id })

      await expect(getClaimAudit(claim.id, defaultQuery, authUser(user))).rejects.toThrow(
        'Sin acceso a este reclamo'
      )
    })

    it('cannot access when no client access at all', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_admin')
      const client = await createClient()
      const aff = await createAffiliate(client.id)
      // No UserClient record
      const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

      await expect(getClaimAudit(claim.id, defaultQuery, authUser(user))).rejects.toThrow(
        'Sin acceso a este reclamo'
      )
    })
  })

  describe('affiliate role (client_affiliate)', () => {
    it('can access audit for claims where they are the affiliate', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_affiliate')
      const client = await createClient()
      const myAffiliate = await createAffiliate(client.id, { userId: user.id })
      await createUserClient(user.id, client.id)
      const claim = await createClaim(client.id, myAffiliate.id, { createdById: admin.id })
      await createAuditLog('Claim', claim.id, admin.id, { action: 'CREATE' })

      const result = await getClaimAudit(claim.id, defaultQuery, authUser(user))

      expect(result.auditLogs).toHaveLength(1)
    })

    it('cannot access audit for claims where they are not the affiliate', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_affiliate')
      const client = await createClient()
      await createAffiliate(client.id, { userId: user.id })
      const otherAffiliate = await createAffiliate(client.id)
      await createUserClient(user.id, client.id)
      const claim = await createClaim(client.id, otherAffiliate.id, { createdById: admin.id })

      await expect(getClaimAudit(claim.id, defaultQuery, authUser(user))).rejects.toThrow(
        'Sin acceso a este reclamo'
      )
    })

    it('throws when user has no affiliate record', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_affiliate')
      const client = await createClient()
      const aff = await createAffiliate(client.id) // Not linked to user
      const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

      await expect(getClaimAudit(claim.id, defaultQuery, authUser(user))).rejects.toThrow(
        'Sin acceso a este reclamo'
      )
    })
  })
})

// =============================================================================
// ERROR HANDLING
// =============================================================================

describe('Get Claim Audit Error Handling', () => {
  it('returns 404 for non-existent claim', async () => {
    const admin = await createUser('claims_admin')
    const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx' // Valid CUID format

    await expect(getClaimAudit(nonExistentId, defaultQuery, authUser(admin))).rejects.toThrow(
      'Reclamo'
    )
  })
})

// =============================================================================
// PAGINATION
// =============================================================================

describe('Get Claim Audit Pagination', () => {
  it('returns correct pagination metadata', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    // Create 5 audit logs
    for (let i = 0; i < 5; i++) {
      await createAuditLog('Claim', claim.id, admin.id, { action: 'UPDATE' })
    }

    const result = await getClaimAudit(claim.id, { page: 1, limit: 2 }, authUser(admin))

    expect(result.auditLogs).toHaveLength(2)
    expect(result.meta.totalCount).toBe(5)
    expect(result.meta.totalPages).toBe(3)
    expect(result.meta.hasNextPage).toBe(true)
    expect(result.meta.hasPrevPage).toBe(false)
  })

  it('returns second page correctly', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    // Create 5 audit logs
    for (let i = 0; i < 5; i++) {
      await createAuditLog('Claim', claim.id, admin.id, { action: 'UPDATE' })
    }

    const result = await getClaimAudit(claim.id, { page: 2, limit: 2 }, authUser(admin))

    expect(result.auditLogs).toHaveLength(2)
    expect(result.meta.page).toBe(2)
    expect(result.meta.hasNextPage).toBe(true)
    expect(result.meta.hasPrevPage).toBe(true)
  })

  it('returns empty when no audit logs exist', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await getClaimAudit(claim.id, defaultQuery, authUser(admin))

    expect(result.auditLogs).toHaveLength(0)
    expect(result.meta.totalCount).toBe(0)
  })
})

// =============================================================================
// RESPONSE FORMAT
// =============================================================================

describe('Get Claim Audit Response Format', () => {
  it('returns correct DTO shape with user details', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })
    await createAuditLog('Claim', claim.id, admin.id, {
      action: 'STATUS_CHANGE',
      changes: { before: { status: 'DRAFT' }, after: { status: 'VALIDATION' } },
      metadata: { claimNumber: claim.claimNumber },
    })

    const result = await getClaimAudit(claim.id, defaultQuery, authUser(admin))

    const log = result.auditLogs[0]!
    expect(log).toHaveProperty('id')
    expect(log).toHaveProperty('action')
    expect(log).toHaveProperty('resourceType')
    expect(log).toHaveProperty('resourceId')
    expect(log).toHaveProperty('userId')
    expect(log).toHaveProperty('userName')
    expect(log).toHaveProperty('userEmail')
    expect(log).toHaveProperty('changes')
    expect(log).toHaveProperty('metadata')
    expect(log).toHaveProperty('createdAt')

    expect(log.action).toBe('STATUS_CHANGE')
    expect(log.resourceType).toBe('Claim')
    expect(log.resourceId).toBe(claim.id)
    expect(log.userName).toBe(admin.name)
    expect(log.userEmail).toBe(admin.email)
    expect(typeof log.createdAt).toBe('string') // ISO string
  })

  it('sorts by createdAt descending (most recent first)', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    await createAuditLog('Claim', claim.id, admin.id, { action: 'CREATE' })
    await createAuditLog('Claim', claim.id, admin.id, { action: 'UPDATE' })
    await createAuditLog('Claim', claim.id, admin.id, { action: 'STATUS_CHANGE' })

    const result = await getClaimAudit(claim.id, defaultQuery, authUser(admin))

    // Most recent should be first (STATUS_CHANGE was created last)
    expect(result.auditLogs[0]!.action).toBe('STATUS_CHANGE')
    expect(result.auditLogs[2]!.action).toBe('CREATE')
  })
})
