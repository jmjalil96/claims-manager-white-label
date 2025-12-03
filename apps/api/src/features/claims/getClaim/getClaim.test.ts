/**
 * Get Claim tests
 * Focus: Authorization, error handling, response format
 */

import { describe, it, expect } from 'vitest'
import { getClaim } from './getClaim.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createUserClient,
  createClaim,
  authUser,
} from '../../../test/factories.js'

// =============================================================================
// AUTHORIZATION
// =============================================================================

describe('Get Claim Authorization', () => {
  describe('internal roles', () => {
    it('can access any claim', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const aff = await createAffiliate(client.id)
      const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

      const result = await getClaim(claim.id, authUser(admin))

      expect(result.id).toBe(claim.id)
      expect(result.claimNumber).toBe(claim.claimNumber)
    })
  })

  describe('external roles (client_admin, client_agent)', () => {
    it('can access claims for accessible clients', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_admin')
      const client = await createClient()
      const aff = await createAffiliate(client.id)
      await createUserClient(user.id, client.id)
      const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

      const result = await getClaim(claim.id, authUser(user))

      expect(result.id).toBe(claim.id)
    })

    it('cannot access claims for inaccessible clients', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_admin')
      const accessibleClient = await createClient()
      const inaccessibleClient = await createClient()
      const aff = await createAffiliate(inaccessibleClient.id)
      await createUserClient(user.id, accessibleClient.id)
      const claim = await createClaim(inaccessibleClient.id, aff.id, { createdById: admin.id })

      await expect(getClaim(claim.id, authUser(user))).rejects.toThrow('Sin acceso a este reclamo')
    })

    it('cannot access when no client access at all', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_admin')
      const client = await createClient()
      const aff = await createAffiliate(client.id)
      // No UserClient record
      const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

      await expect(getClaim(claim.id, authUser(user))).rejects.toThrow('Sin acceso a este reclamo')
    })
  })

  describe('affiliate role (client_affiliate)', () => {
    it('can access claims where they are the affiliate', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_affiliate')
      const client = await createClient()
      const myAffiliate = await createAffiliate(client.id, { userId: user.id })
      await createUserClient(user.id, client.id)
      const claim = await createClaim(client.id, myAffiliate.id, { createdById: admin.id })

      const result = await getClaim(claim.id, authUser(user))

      expect(result.id).toBe(claim.id)
    })

    it('cannot access claims where they are not the affiliate', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_affiliate')
      const client = await createClient()
      await createAffiliate(client.id, { userId: user.id })
      const otherAffiliate = await createAffiliate(client.id)
      await createUserClient(user.id, client.id)
      const claim = await createClaim(client.id, otherAffiliate.id, { createdById: admin.id })

      await expect(getClaim(claim.id, authUser(user))).rejects.toThrow('Sin acceso a este reclamo')
    })

    it('throws when user has no affiliate record', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_affiliate')
      const client = await createClient()
      const aff = await createAffiliate(client.id) // Not linked to user
      const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

      await expect(getClaim(claim.id, authUser(user))).rejects.toThrow('Sin acceso a este reclamo')
    })
  })
})

// =============================================================================
// ERROR HANDLING
// =============================================================================

describe('Get Claim Error Handling', () => {
  it('returns 404 for non-existent claim', async () => {
    const admin = await createUser('claims_admin')
    const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx' // Valid CUID format

    await expect(getClaim(nonExistentId, authUser(admin))).rejects.toThrow('Reclamo')
  })
})

// =============================================================================
// RESPONSE FORMAT
// =============================================================================

describe('Get Claim Response Format', () => {
  it('returns correct DTO shape', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, {
      createdById: admin.id,
      incidentDate: new Date('2024-01-15'),
    })

    const result = await getClaim(claim.id, authUser(admin))

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('claimNumber')
    expect(result).toHaveProperty('claimSequence')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('clientId')
    expect(result).toHaveProperty('affiliateId')
    expect(result).toHaveProperty('patientId')
    expect(result).toHaveProperty('createdAt')
    expect(result).toHaveProperty('updatedAt')
    expect(typeof result.createdAt).toBe('string') // ISO string
    expect(typeof result.updatedAt).toBe('string') // ISO string
  })
})
