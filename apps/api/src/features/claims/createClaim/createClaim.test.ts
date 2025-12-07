/**
 * Create Claim tests
 * Focus: Authorization boundaries, entity validation, and claim creation
 */

import { describe, it, expect } from 'vitest'
import { createClaim } from './createClaim.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createUserClient,
  authUser,
} from '../../../test/factories.js'

// =============================================================================
// AUTHORIZATION
// =============================================================================

describe('Create Claim Authorization', () => {
  describe('internal roles (claims_admin, superadmin, etc)', () => {
    it('can create claim for any client without UserClient access', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)

      const claim = await createClaim(
        {
          clientId: client.id,
          affiliateId: affiliate.id,
          patientId: affiliate.id,
          description: 'Test',
        },
        authUser(admin)
      )

      expect(claim.status).toBe('DRAFT')
    })
  })

  describe('external roles (client_admin, client_agent)', () => {
    it('cannot create claim for client without access', async () => {
      const user = await createUser('client_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)
      // Note: NO UserClient access granted

      await expect(
        createClaim(
          {
            clientId: client.id,
            affiliateId: affiliate.id,
            patientId: affiliate.id,
            description: 'Test',
          },
          authUser(user)
        )
      ).rejects.toThrow('Sin acceso a este cliente')
    })

    it('can create claim for client with access', async () => {
      const user = await createUser('client_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)
      await createUserClient(user.id, client.id)

      const claim = await createClaim(
        {
          clientId: client.id,
          affiliateId: affiliate.id,
          patientId: affiliate.id,
          description: 'Test',
        },
        authUser(user)
      )

      expect(claim.id).toBeDefined()
    })
  })

  describe('affiliate role (client_affiliate)', () => {
    it('can create claim for themselves', async () => {
      const user = await createUser('client_affiliate')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id, { userId: user.id })
      await createUserClient(user.id, client.id)

      const claim = await createClaim(
        {
          clientId: client.id,
          affiliateId: affiliate.id,
          patientId: affiliate.id, // Self as patient
          description: 'Test',
        },
        authUser(user)
      )

      expect(claim.patientId).toBe(affiliate.id)
    })

    it('can create claim for their dependent', async () => {
      const user = await createUser('client_affiliate')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id, { userId: user.id })
      const dependent = await createAffiliate(client.id, {
        primaryAffiliateId: affiliate.id,
      })
      await createUserClient(user.id, client.id)

      const claim = await createClaim(
        {
          clientId: client.id,
          affiliateId: affiliate.id,
          patientId: dependent.id, // Dependent as patient
          description: 'Test',
        },
        authUser(user)
      )

      expect(claim.patientId).toBe(dependent.id)
    })

    it('CANNOT create claim for unrelated person', async () => {
      const user = await createUser('client_affiliate')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id, { userId: user.id })
      const stranger = await createAffiliate(client.id) // Not a dependent
      await createUserClient(user.id, client.id)

      await expect(
        createClaim(
          {
            clientId: client.id,
            affiliateId: affiliate.id,
            patientId: stranger.id, // NOT their dependent
            description: 'Test',
          },
          authUser(user)
        )
      ).rejects.toThrow('Solo puede crear reclamos para usted o sus dependientes')
    })

    it('CANNOT impersonate another affiliate', async () => {
      const user = await createUser('client_affiliate')
      const client = await createClient()
      await createAffiliate(client.id, { userId: user.id }) // User's actual affiliate
      const otherAffiliate = await createAffiliate(client.id) // Someone else
      await createUserClient(user.id, client.id)

      await expect(
        createClaim(
          {
            clientId: client.id,
            affiliateId: otherAffiliate.id, // Trying to act as someone else
            patientId: otherAffiliate.id,
            description: 'Test',
          },
          authUser(user)
        )
      ).rejects.toThrow('No puede crear reclamos como otro afiliado')
    })
  })
})

// =============================================================================
// ENTITY VALIDATION
// =============================================================================

describe('Create Claim Entity Validation', () => {
  it('rejects inactive client', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient(false) // inactive
    const affiliate = await createAffiliate(client.id)

    await expect(
      createClaim(
        {
          clientId: client.id,
          affiliateId: affiliate.id,
          patientId: affiliate.id,
          description: 'Test',
        },
        authUser(admin)
      )
    ).rejects.toThrow('El cliente no está activo')
  })

  it('rejects inactive affiliate', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const affiliate = await createAffiliate(client.id, { isActive: false })

    await expect(
      createClaim(
        {
          clientId: client.id,
          affiliateId: affiliate.id,
          patientId: affiliate.id,
          description: 'Test',
        },
        authUser(admin)
      )
    ).rejects.toThrow('El afiliado no está activo')
  })

  it('rejects affiliate from wrong client', async () => {
    const admin = await createUser('claims_admin')
    const client1 = await createClient()
    const client2 = await createClient()
    const affiliateFromClient2 = await createAffiliate(client2.id)

    await expect(
      createClaim(
        {
          clientId: client1.id,
          affiliateId: affiliateFromClient2.id, // Wrong client!
          patientId: affiliateFromClient2.id,
          description: 'Test',
        },
        authUser(admin)
      )
    ).rejects.toThrow('El afiliado no pertenece a este cliente')
  })

  it('rejects patient from wrong client', async () => {
    const admin = await createUser('claims_admin')
    const client1 = await createClient()
    const client2 = await createClient()
    const affiliate = await createAffiliate(client1.id)
    const patientFromClient2 = await createAffiliate(client2.id)

    await expect(
      createClaim(
        {
          clientId: client1.id,
          affiliateId: affiliate.id,
          patientId: patientFromClient2.id, // Wrong client!
          description: 'Test',
        },
        authUser(admin)
      )
    ).rejects.toThrow('El paciente no pertenece a este cliente')
  })
})

// =============================================================================
// CREATION
// =============================================================================

describe('Create Claim', () => {
  it('creates claim with DRAFT status and unique claim number', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const affiliate = await createAffiliate(client.id)

    const claim = await createClaim(
      {
        clientId: client.id,
        affiliateId: affiliate.id,
        patientId: affiliate.id,
        description: 'Acute bronchitis',
      },
      authUser(admin)
    )

    expect(claim.status).toBe('DRAFT')
    expect(claim.claimNumber).toMatch(/^RECL_/)
    expect(claim.description).toBe('Acute bronchitis')
  })
})
