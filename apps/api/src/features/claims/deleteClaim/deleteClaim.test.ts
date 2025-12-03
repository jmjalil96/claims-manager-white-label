/**
 * Delete Claim tests
 * Focus: Authorization, error handling
 */

import { describe, it, expect } from 'vitest'
import { deleteClaim } from './deleteClaim.service.js'
import { db } from '../../../lib/db.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createClaim,
  authUser,
} from '../../../test/factories.js'

// =============================================================================
// ERROR HANDLING
// =============================================================================

describe('Delete Claim Error Handling', () => {
  it('returns 404 for non-existent claim', async () => {
    const superadmin = await createUser('superadmin')
    const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx' // Valid CUID format

    await expect(deleteClaim(nonExistentId, authUser(superadmin))).rejects.toThrow('Reclamo')
  })
})

// =============================================================================
// SUCCESSFUL DELETION
// =============================================================================

describe('Delete Claim Success', () => {
  it('superadmin can delete a claim', async () => {
    const superadmin = await createUser('superadmin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: superadmin.id })

    const result = await deleteClaim(claim.id, authUser(superadmin))

    expect(result.id).toBe(claim.id)

    // Verify claim is actually deleted
    const deleted = await db.claim.findUnique({ where: { id: claim.id } })
    expect(deleted).toBeNull()
  })
})
