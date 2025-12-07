/**
 * Get Available Affiliates tests
 * Focus: Returns OWNER affiliates based on role authorization
 */

import { describe, it, expect } from 'vitest'
import { getAvailableAffiliates } from './getAvailableAffiliates.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createUserClient,
  authUser,
} from '../../../../test/factories.js'

describe('Get Available Affiliates', () => {
  describe('internal roles', () => {
    it('sees all OWNER affiliates (not dependents) for a client', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const owner1 = await createAffiliate(client.id) // No primaryAffiliateId = owner
      const owner2 = await createAffiliate(client.id) // No primaryAffiliateId = owner
      await createAffiliate(client.id, { primaryAffiliateId: owner1.id }) // Has primaryAffiliateId = dependent

      const affiliates = await getAvailableAffiliates(client.id, authUser(admin))

      expect(affiliates).toHaveLength(2)
      expect(affiliates.map((a) => a.id)).toContain(owner1.id)
      expect(affiliates.map((a) => a.id)).toContain(owner2.id)
    })
  })

  describe('affiliate role', () => {
    it('only sees themselves in affiliate list', async () => {
      const user = await createUser('client_affiliate')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id, { userId: user.id })
      await createAffiliate(client.id) // Another affiliate they shouldn't see
      await createUserClient(user.id, client.id)

      const affiliates = await getAvailableAffiliates(client.id, authUser(user))

      expect(affiliates).toHaveLength(1)
      expect(affiliates[0]!.id).toBe(affiliate.id)
    })

    it('cannot access affiliates for a client they are not affiliated with', async () => {
      const user = await createUser('client_affiliate')
      const clientA = await createClient()
      const clientB = await createClient()
      await createAffiliate(clientA.id, { userId: user.id })
      await createUserClient(user.id, clientA.id)
      await createUserClient(user.id, clientB.id) // Has UserClient access but no affiliate

      await expect(getAvailableAffiliates(clientB.id, authUser(user))).rejects.toThrow(
        'No es afiliado de este cliente'
      )
    })
  })
})
