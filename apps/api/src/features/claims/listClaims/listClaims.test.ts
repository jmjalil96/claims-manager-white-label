/**
 * List Claims tests
 * Focus: Authorization, filtering, pagination, sorting, and search
 */

import { describe, it, expect } from 'vitest'
import { listClaims } from './listClaims.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createUserClient,
  createClaim,
  authUser,
} from '../../../test/factories.js'

/** Default input for listClaims - matches what middleware provides after validation */
const defaultListInput = {
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const,
  page: 1,
  limit: 20,
}

// =============================================================================
// AUTHORIZATION
// =============================================================================

describe('List Claims Authorization', () => {
  describe('internal roles', () => {
    it('can see all claims regardless of client', async () => {
      const admin = await createUser('claims_admin')
      const client1 = await createClient()
      const client2 = await createClient()
      const aff1 = await createAffiliate(client1.id)
      const aff2 = await createAffiliate(client2.id)
      await createClaim(client1.id, aff1.id, { createdById: admin.id })
      await createClaim(client2.id, aff2.id, { createdById: admin.id })

      const result = await listClaims({ ...defaultListInput }, authUser(admin))

      expect(result.claims.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('external roles (client_admin, client_agent)', () => {
    it('can only see claims for accessible clients', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_admin')
      const accessibleClient = await createClient()
      const inaccessibleClient = await createClient()
      const aff1 = await createAffiliate(accessibleClient.id)
      const aff2 = await createAffiliate(inaccessibleClient.id)
      await createUserClient(user.id, accessibleClient.id)

      const claim1 = await createClaim(accessibleClient.id, aff1.id, { createdById: admin.id })
      const claim2 = await createClaim(inaccessibleClient.id, aff2.id, {
        createdById: admin.id,
      })

      const result = await listClaims({ ...defaultListInput }, authUser(user))

      expect(result.claims.some((c) => c.id === claim1.id)).toBe(true)
      expect(result.claims.some((c) => c.id === claim2.id)).toBe(false)
    })

    it('returns empty when no client access', async () => {
      const user = await createUser('client_admin')
      // No UserClient records

      const result = await listClaims({ ...defaultListInput }, authUser(user))

      expect(result.claims).toHaveLength(0)
    })

    it('cannot filter to inaccessible client', async () => {
      const user = await createUser('client_admin')
      const accessibleClient = await createClient()
      const inaccessibleClient = await createClient()
      await createUserClient(user.id, accessibleClient.id)

      await expect(
        listClaims({ ...defaultListInput, clientId: inaccessibleClient.id }, authUser(user))
      ).rejects.toThrow('Sin acceso a este cliente')
    })
  })

  describe('affiliate role (client_affiliate)', () => {
    it('can only see claims where they are the affiliate', async () => {
      const admin = await createUser('claims_admin')
      const user = await createUser('client_affiliate')
      const client = await createClient()
      const myAffiliate = await createAffiliate(client.id, { userId: user.id })
      const otherAffiliate = await createAffiliate(client.id)
      await createUserClient(user.id, client.id)

      const myClaim = await createClaim(client.id, myAffiliate.id, { createdById: admin.id })
      const otherClaim = await createClaim(client.id, otherAffiliate.id, {
        createdById: admin.id,
      })

      const result = await listClaims({ ...defaultListInput }, authUser(user))

      expect(result.claims.some((c) => c.id === myClaim.id)).toBe(true)
      expect(result.claims.some((c) => c.id === otherClaim.id)).toBe(false)
    })

    it('throws when user has no affiliate record', async () => {
      const user = await createUser('client_affiliate')
      // No affiliate record linked to user

      await expect(listClaims({ ...defaultListInput }, authUser(user))).rejects.toThrow(
        'Usuario no tiene afiliado asociado'
      )
    })
  })
})

// =============================================================================
// FILTERING
// =============================================================================

describe('List Claims Filtering', () => {
  it('filters by status', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    await createClaim(client.id, aff.id, { status: 'DRAFT', createdById: admin.id })
    await createClaim(client.id, aff.id, { status: 'SUBMITTED', createdById: admin.id })

    const result = await listClaims(
      { ...defaultListInput, status: ['DRAFT'], clientId: client.id },
      authUser(admin)
    )

    expect(result.claims.every((c) => c.status === 'DRAFT')).toBe(true)
  })

  it('filters by clientId', async () => {
    const admin = await createUser('claims_admin')
    const client1 = await createClient()
    const client2 = await createClient()
    const aff1 = await createAffiliate(client1.id)
    const aff2 = await createAffiliate(client2.id)
    const claim1 = await createClaim(client1.id, aff1.id, { createdById: admin.id })
    await createClaim(client2.id, aff2.id, { createdById: admin.id })

    const result = await listClaims({ ...defaultListInput, clientId: client1.id }, authUser(admin))

    expect(result.claims.every((c) => c.clientId === client1.id)).toBe(true)
    expect(result.claims.some((c) => c.id === claim1.id)).toBe(true)
  })
})

// =============================================================================
// PAGINATION
// =============================================================================

describe('List Claims Pagination', () => {
  it('returns correct pagination metadata', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)

    // Create 5 claims
    for (let i = 0; i < 5; i++) {
      await createClaim(client.id, aff.id, { createdById: admin.id })
    }

    const result = await listClaims(
      { ...defaultListInput, limit: 2, page: 1, clientId: client.id },
      authUser(admin)
    )

    expect(result.claims).toHaveLength(2)
    expect(result.meta.totalCount).toBeGreaterThanOrEqual(5)
    expect(result.meta.hasNextPage).toBe(true)
    expect(result.meta.hasPrevPage).toBe(false)
  })
})

// =============================================================================
// RESPONSE FORMAT
// =============================================================================

describe('List Claims Response Format', () => {
  it('returns denormalized names', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await listClaims({ ...defaultListInput, clientId: client.id }, authUser(admin))

    expect(result.claims[0]).toHaveProperty('clientName')
    expect(result.claims[0]).toHaveProperty('affiliateName')
    expect(result.claims[0]).toHaveProperty('patientName')
    expect(typeof result.claims[0]!.clientName).toBe('string')
  })
})

// =============================================================================
// SORTING
// =============================================================================

describe('List Claims Sorting', () => {
  it('sorts by claimNumber ascending', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim1 = await createClaim(client.id, aff.id, { createdById: admin.id })
    const claim2 = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await listClaims(
      { ...defaultListInput, clientId: client.id, sortBy: 'claimNumber', sortOrder: 'asc' },
      authUser(admin)
    )

    // claim1 was created first so has lower sequence number
    expect(result.claims[0]!.id).toBe(claim1.id)
    expect(result.claims[1]!.id).toBe(claim2.id)
  })

  it('sorts by claimNumber descending', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim1 = await createClaim(client.id, aff.id, { createdById: admin.id })
    const claim2 = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await listClaims(
      { ...defaultListInput, clientId: client.id, sortBy: 'claimNumber', sortOrder: 'desc' },
      authUser(admin)
    )

    // claim2 was created second so has higher sequence number
    expect(result.claims[0]!.id).toBe(claim2.id)
    expect(result.claims[1]!.id).toBe(claim1.id)
  })
})

// =============================================================================
// SEARCH
// =============================================================================

describe('List Claims Search', () => {
  it('finds claims by claimNumber', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })
    await createClaim(client.id, aff.id, { createdById: admin.id }) // Another claim

    const result = await listClaims(
      { ...defaultListInput, clientId: client.id, search: claim.claimNumber },
      authUser(admin)
    )

    expect(result.claims).toHaveLength(1)
    expect(result.claims[0]!.id).toBe(claim.id)
  })

  it('finds claims by patient name', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    await createClaim(client.id, aff.id, { createdById: admin.id })

    // Search by affiliate's first name (patient is affiliate in this test)
    const result = await listClaims(
      { ...defaultListInput, clientId: client.id, search: aff.firstName },
      authUser(admin)
    )

    expect(result.claims.length).toBeGreaterThanOrEqual(1)
    expect(result.claims.some((c) => c.affiliateId === aff.id)).toBe(true)
  })

  it('search is case insensitive', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    // Search with different case
    const result = await listClaims(
      { ...defaultListInput, clientId: client.id, search: claim.claimNumber.toLowerCase() },
      authUser(admin)
    )

    expect(result.claims.some((c) => c.id === claim.id)).toBe(true)
  })
})

// =============================================================================
// DATE FILTERS
// =============================================================================

describe('List Claims Date Filters', () => {
  it('filters by incidentDate range', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)

    // Claim with incident date in January 2024
    const janClaim = await createClaim(client.id, aff.id, {
      createdById: admin.id,
      incidentDate: new Date('2024-01-15'),
    })
    // Claim with incident date in March 2024
    await createClaim(client.id, aff.id, {
      createdById: admin.id,
      incidentDate: new Date('2024-03-15'),
    })

    const result = await listClaims(
      {
        ...defaultListInput,
        clientId: client.id,
        incidentDateFrom: '2024-01-01',
        incidentDateTo: '2024-01-31',
      },
      authUser(admin)
    )

    expect(result.claims).toHaveLength(1)
    expect(result.claims[0]!.id).toBe(janClaim.id)
  })
})
