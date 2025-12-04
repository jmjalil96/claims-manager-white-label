/**
 * Kanban Claims tests
 * Focus: Response structure, counts, limitPerColumn
 * Authorization is tested in listClaims (identical logic)
 */

import { describe, it, expect } from 'vitest'
import { getKanbanClaims } from './kanbanClaims.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createClaim,
  authUser,
} from '../../../test/factories.js'

const defaultKanbanInput = {
  limitPerColumn: 10,
}

// =============================================================================
// RESPONSE STRUCTURE
// =============================================================================

describe('Kanban Claims', () => {
  describe('response structure', () => {
    it('returns all 7 status columns', async () => {
      const admin = await createUser('claims_admin')
      const result = await getKanbanClaims(defaultKanbanInput, authUser(admin))

      expect(Object.keys(result.columns)).toHaveLength(7)
      expect(result.columns.DRAFT).toBeDefined()
      expect(result.columns.VALIDATION).toBeDefined()
      expect(result.columns.SUBMITTED).toBeDefined()
      expect(result.columns.PENDING_INFO).toBeDefined()
      expect(result.columns.RETURNED).toBeDefined()
      expect(result.columns.SETTLED).toBeDefined()
      expect(result.columns.CANCELLED).toBeDefined()
    })

    it('each column has status, count, claims, and hasMore', async () => {
      const admin = await createUser('claims_admin')
      const result = await getKanbanClaims(defaultKanbanInput, authUser(admin))

      for (const column of Object.values(result.columns)) {
        expect(column).toHaveProperty('status')
        expect(column).toHaveProperty('count')
        expect(column).toHaveProperty('claims')
        expect(column).toHaveProperty('hasMore')
        expect(Array.isArray(column.claims)).toBe(true)
        expect(typeof column.hasMore).toBe('boolean')
      }
    })
  })

  // =============================================================================
  // COUNTS
  // =============================================================================

  describe('counts', () => {
    it('counts match claims per status', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)

      // Create claims with specific statuses
      await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
        status: 'DRAFT',
      })
      await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
        status: 'DRAFT',
      })
      await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
        status: 'SUBMITTED',
      })

      const result = await getKanbanClaims(
        { ...defaultKanbanInput, clientId: client.id },
        authUser(admin)
      )

      expect(result.columns.DRAFT.count).toBe(2)
      expect(result.columns.DRAFT.claims).toHaveLength(2)
      expect(result.columns.SUBMITTED.count).toBe(1)
      expect(result.columns.SUBMITTED.claims).toHaveLength(1)
    })

    it('empty statuses have count 0 and empty claims', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)
      await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
        status: 'DRAFT',
      })

      const result = await getKanbanClaims(
        { ...defaultKanbanInput, clientId: client.id },
        authUser(admin)
      )

      expect(result.columns.CANCELLED.count).toBe(0)
      expect(result.columns.CANCELLED.claims).toHaveLength(0)
    })
  })

  // =============================================================================
  // LIMIT PER COLUMN
  // =============================================================================

  describe('limitPerColumn', () => {
    it('limits claims per column while showing total count', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)

      // Create 5 DRAFT claims
      for (let i = 0; i < 5; i++) {
        await createClaim(client.id, affiliate.id, {
          createdById: admin.id,
          status: 'DRAFT',
        })
      }

      const result = await getKanbanClaims(
        { limitPerColumn: 2, clientId: client.id },
        authUser(admin)
      )

      expect(result.columns.DRAFT.count).toBe(5) // Count is total
      expect(result.columns.DRAFT.claims).toHaveLength(2) // Claims limited
    })
  })

  // =============================================================================
  // SINGLE-COLUMN EXPANSION
  // =============================================================================

  describe('single-column expansion', () => {
    it('expands only the specified status column', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)

      // Create 5 DRAFT and 5 SUBMITTED claims
      for (let i = 0; i < 5; i++) {
        await createClaim(client.id, affiliate.id, {
          createdById: admin.id,
          status: 'DRAFT',
        })
        await createClaim(client.id, affiliate.id, {
          createdById: admin.id,
          status: 'SUBMITTED',
        })
      }

      const result = await getKanbanClaims(
        {
          limitPerColumn: 2,
          expandStatus: 'DRAFT',
          expandLimit: 4,
          clientId: client.id,
        },
        authUser(admin)
      )

      expect(result.columns.DRAFT.claims).toHaveLength(4) // Expanded
      expect(result.columns.SUBMITTED.claims).toHaveLength(2) // Default
    })

    it('hasMore is true when count exceeds claims length', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)

      for (let i = 0; i < 5; i++) {
        await createClaim(client.id, affiliate.id, {
          createdById: admin.id,
          status: 'DRAFT',
        })
      }

      const result = await getKanbanClaims(
        { limitPerColumn: 2, clientId: client.id },
        authUser(admin)
      )

      expect(result.columns.DRAFT.count).toBe(5)
      expect(result.columns.DRAFT.claims).toHaveLength(2)
      expect(result.columns.DRAFT.hasMore).toBe(true)
      expect(result.columns.VALIDATION.hasMore).toBe(false)
    })

    it('hasMore is false when all claims are loaded', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)

      // Create 3 DRAFT claims
      for (let i = 0; i < 3; i++) {
        await createClaim(client.id, affiliate.id, {
          createdById: admin.id,
          status: 'DRAFT',
        })
      }

      const result = await getKanbanClaims(
        { limitPerColumn: 5, clientId: client.id },
        authUser(admin)
      )

      expect(result.columns.DRAFT.count).toBe(3)
      expect(result.columns.DRAFT.claims).toHaveLength(3)
      expect(result.columns.DRAFT.hasMore).toBe(false)
    })
  })
})
