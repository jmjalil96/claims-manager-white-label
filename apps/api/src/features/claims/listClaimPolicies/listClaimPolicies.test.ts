/**
 * List Claim Policies tests
 * Note: Authorization is handled by requireInternalRole middleware at route level
 */

import { describe, it, expect } from 'vitest'
import { listClaimPolicies } from './listClaimPolicies.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createInsurer,
  createPolicy,
  createClaim,
} from '../../../test/factories.js'

describe('listClaimPolicies', () => {
  describe('claim validation', () => {
    it('throws 404 for non-existent claim', async () => {
      const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx'

      await expect(listClaimPolicies(nonExistentId)).rejects.toThrow('Reclamo')
    })
  })

  describe('policy retrieval', () => {
    it('returns all policies for the claim client', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const insurer = await createInsurer()
      const affiliate = await createAffiliate(client.id)

      // Create multiple policies for the client
      const policy1 = await createPolicy(client.id, insurer.id)
      const policy2 = await createPolicy(client.id, insurer.id)

      // Create claim
      const claim = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
      })

      const result = await listClaimPolicies(claim.id)

      expect(result.policies).toHaveLength(2)
      expect(result.policies.map((p) => p.id)).toContain(policy1.id)
      expect(result.policies.map((p) => p.id)).toContain(policy2.id)
    })

    it('returns empty array when client has no policies', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)

      const claim = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
      })

      const result = await listClaimPolicies(claim.id)

      expect(result.policies).toHaveLength(0)
    })

    it('does not return policies from other clients', async () => {
      const admin = await createUser('claims_admin')
      const client1 = await createClient()
      const client2 = await createClient()
      const insurer = await createInsurer()
      const affiliate1 = await createAffiliate(client1.id)

      // Policy for client1
      const policy1 = await createPolicy(client1.id, insurer.id)
      // Policy for client2 (should not be returned)
      await createPolicy(client2.id, insurer.id)

      const claim = await createClaim(client1.id, affiliate1.id, {
        createdById: admin.id,
      })

      const result = await listClaimPolicies(claim.id)

      expect(result.policies).toHaveLength(1)
      expect(result.policies[0]!.id).toBe(policy1.id)
    })
  })

  describe('response format', () => {
    it('returns correct DTO shape with insurer info', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const insurer = await createInsurer()
      const affiliate = await createAffiliate(client.id)
      await createPolicy(client.id, insurer.id)

      const claim = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
      })

      const result = await listClaimPolicies(claim.id)

      expect(result.policies[0]).toHaveProperty('id')
      expect(result.policies[0]).toHaveProperty('policyNumber')
      expect(result.policies[0]).toHaveProperty('type')
      expect(result.policies[0]).toHaveProperty('status')
      expect(result.policies[0]).toHaveProperty('startDate')
      expect(result.policies[0]).toHaveProperty('endDate')
      expect(result.policies[0]).toHaveProperty('insurer')
      expect(result.policies[0]!.insurer).toHaveProperty('id')
      expect(result.policies[0]!.insurer).toHaveProperty('name')
    })

    it('returns dates as ISO strings', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const insurer = await createInsurer()
      const affiliate = await createAffiliate(client.id)
      await createPolicy(client.id, insurer.id)

      const claim = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
      })

      const result = await listClaimPolicies(claim.id)

      expect(typeof result.policies[0]!.startDate).toBe('string')
      expect(typeof result.policies[0]!.endDate).toBe('string')
      // ISO string format check
      expect(result.policies[0]!.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  describe('ordering', () => {
    it('orders policies by policyNumber ascending', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const insurer = await createInsurer()
      const affiliate = await createAffiliate(client.id)

      // Create policies (factory generates sequential numbers)
      await createPolicy(client.id, insurer.id)
      await createPolicy(client.id, insurer.id)
      await createPolicy(client.id, insurer.id)

      const claim = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
      })

      const result = await listClaimPolicies(claim.id)

      const policyNumbers = result.policies.map((p) => p.policyNumber)
      const sorted = [...policyNumbers].sort()
      expect(policyNumbers).toEqual(sorted)
    })
  })
})
