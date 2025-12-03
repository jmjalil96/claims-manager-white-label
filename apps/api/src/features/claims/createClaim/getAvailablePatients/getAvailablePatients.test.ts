/**
 * Get Available Patients tests
 * Focus: Returns affiliate and dependents based on role authorization
 */

import { describe, it, expect } from 'vitest'
import { getAvailablePatients } from './getAvailablePatients.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createUserClient,
  authUser,
} from '../../../../test/factories.js'

describe('Get Available Patients', () => {
  it('returns affiliate and their dependents', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const affiliate = await createAffiliate(client.id)
    await createAffiliate(client.id, { type: 'DEPENDENT', primaryAffiliateId: affiliate.id })
    await createAffiliate(client.id, { type: 'DEPENDENT', primaryAffiliateId: affiliate.id })

    const patients = await getAvailablePatients(affiliate.id, authUser(admin))

    expect(patients).toHaveLength(3) // affiliate + 2 dependents
    expect(patients[0]!.isDependent).toBe(false) // Affiliate first
    expect(patients.slice(1).every((p) => p.isDependent)).toBe(true)
  })

  it('excludes inactive dependents', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const affiliate = await createAffiliate(client.id)
    await createAffiliate(client.id, {
      type: 'DEPENDENT',
      primaryAffiliateId: affiliate.id,
      isActive: true,
    })
    await createAffiliate(client.id, {
      type: 'DEPENDENT',
      primaryAffiliateId: affiliate.id,
      isActive: false,
    })

    const patients = await getAvailablePatients(affiliate.id, authUser(admin))

    expect(patients).toHaveLength(2) // affiliate + 1 active dependent
  })
})

describe('Get Available Patients Authorization', () => {
  describe('affiliate role', () => {
    it('can view patients for themselves', async () => {
      const user = await createUser('client_affiliate')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id, { userId: user.id })
      const dep = await createAffiliate(client.id, {
        type: 'DEPENDENT',
        primaryAffiliateId: affiliate.id,
      })
      await createUserClient(user.id, client.id)

      const patients = await getAvailablePatients(affiliate.id, authUser(user))

      expect(patients).toHaveLength(2)
      expect(patients.map((p) => p.id)).toContain(affiliate.id)
      expect(patients.map((p) => p.id)).toContain(dep.id)
    })

    it('cannot view patients for another affiliate', async () => {
      const user = await createUser('client_affiliate')
      const client = await createClient()
      await createAffiliate(client.id, { userId: user.id })
      const otherAffiliate = await createAffiliate(client.id)
      await createUserClient(user.id, client.id)

      await expect(getAvailablePatients(otherAffiliate.id, authUser(user))).rejects.toThrow(
        'Solo puede ver pacientes para su propia cuenta'
      )
    })
  })

  describe('external roles', () => {
    it('with client access can view patients', async () => {
      const user = await createUser('client_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)
      const dep = await createAffiliate(client.id, {
        type: 'DEPENDENT',
        primaryAffiliateId: affiliate.id,
      })
      await createUserClient(user.id, client.id)

      const patients = await getAvailablePatients(affiliate.id, authUser(user))

      expect(patients).toHaveLength(2)
      expect(patients.map((p) => p.id)).toContain(affiliate.id)
      expect(patients.map((p) => p.id)).toContain(dep.id)
    })

    it('without client access cannot view patients', async () => {
      const user = await createUser('client_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)
      // No UserClient access

      await expect(getAvailablePatients(affiliate.id, authUser(user))).rejects.toThrow(
        'Sin acceso a este cliente'
      )
    })
  })
})
