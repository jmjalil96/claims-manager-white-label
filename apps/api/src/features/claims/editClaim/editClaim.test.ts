/**
 * Edit Claim tests
 * Focus: Error handling, field updates by status, transitions, validation
 * Note: Authorization is handled by requireInternalRole middleware at route level
 */

import { describe, it, expect } from 'vitest'
import { editClaim } from './editClaim.service.js'
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

describe('Edit Claim Error Handling', () => {
  it('returns 404 for non-existent claim', async () => {
    const admin = await createUser('claims_admin')
    const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx'

    await expect(
      editClaim(nonExistentId, { description: 'test' }, authUser(admin))
    ).rejects.toThrow('Reclamo')
  })
})

// =============================================================================
// FIELD UPDATES BY STATUS
// =============================================================================

describe('Edit Claim Field Updates', () => {
  describe('DRAFT status', () => {
    it('can update draft fields', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const aff = await createAffiliate(client.id)
      const claim = await createClaim(client.id, aff.id, {
        status: 'DRAFT',
        createdById: admin.id,
      })

      const result = await editClaim(
        claim.id,
        { description: 'Updated description' },
        authUser(admin)
      )

      expect(result.id).toBe(claim.id)
      const updated = await db.claim.findUnique({ where: { id: claim.id } })
      expect(updated?.description).toBe('Updated description')
    })

    it('cannot update settlement fields', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const aff = await createAffiliate(client.id)
      const claim = await createClaim(client.id, aff.id, {
        status: 'DRAFT',
        createdById: admin.id,
      })

      await expect(editClaim(claim.id, { amountApproved: 1000 }, authUser(admin))).rejects.toThrow(
        'No puedes editar estos campos en estado DRAFT'
      )
    })
  })

  describe('SUBMITTED status', () => {
    it('can update settlement fields', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const aff = await createAffiliate(client.id)
      const claim = await createClaim(client.id, aff.id, {
        status: 'SUBMITTED',
        createdById: admin.id,
      })

      const result = await editClaim(
        claim.id,
        { amountApproved: 500, amountDenied: 100 },
        authUser(admin)
      )

      expect(result.id).toBe(claim.id)
      const updated = await db.claim.findUnique({ where: { id: claim.id } })
      expect(updated?.amountApproved).toBe(500)
      expect(updated?.amountDenied).toBe(100)
    })

    it('cannot update draft-only fields', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const aff = await createAffiliate(client.id)
      const claim = await createClaim(client.id, aff.id, {
        status: 'SUBMITTED',
        createdById: admin.id,
      })

      await expect(
        editClaim(claim.id, { policyId: 'cl123456789012345678901234' }, authUser(admin))
      ).rejects.toThrow('No puedes editar estos campos en estado SUBMITTED')
    })
  })
})

// =============================================================================
// STATUS TRANSITIONS
// =============================================================================

describe('Edit Claim Status Transitions', () => {
  it('SUBMITTED -> PENDING_INFO requires pendingReason', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, {
      status: 'SUBMITTED',
      createdById: admin.id,
    })

    await expect(editClaim(claim.id, { status: 'PENDING_INFO' }, authUser(admin))).rejects.toThrow(
      'Faltan campos requeridos'
    )
  })

  it('SUBMITTED -> PENDING_INFO succeeds with pendingReason', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, {
      status: 'SUBMITTED',
      createdById: admin.id,
    })

    const result = await editClaim(
      claim.id,
      { status: 'PENDING_INFO', pendingReason: 'Missing documentation' },
      authUser(admin)
    )

    expect(result.status).toBe('PENDING_INFO')
  })

  it('any -> CANCELLED requires cancellationReason', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, {
      status: 'DRAFT',
      createdById: admin.id,
    })

    await expect(editClaim(claim.id, { status: 'CANCELLED' }, authUser(admin))).rejects.toThrow(
      'Faltan campos requeridos'
    )
  })

  it('DRAFT -> CANCELLED succeeds with cancellationReason', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, {
      status: 'DRAFT',
      createdById: admin.id,
    })

    const result = await editClaim(
      claim.id,
      { status: 'CANCELLED', cancellationReason: 'Duplicate claim' },
      authUser(admin)
    )

    expect(result.status).toBe('CANCELLED')
  })

  it('cannot transition from terminal state', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, {
      status: 'SETTLED',
      createdById: admin.id,
    })

    await expect(editClaim(claim.id, { status: 'SUBMITTED' }, authUser(admin))).rejects.toThrow(
      'No se puede cambiar de SETTLED a SUBMITTED'
    )
  })
})

// =============================================================================
// RESPONSE FORMAT
// =============================================================================

describe('Edit Claim Response Format', () => {
  it('returns correct DTO shape', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, {
      status: 'DRAFT',
      createdById: admin.id,
    })

    const result = await editClaim(claim.id, { description: 'test' }, authUser(admin))

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('claimNumber')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('updatedAt')
    expect(typeof result.updatedAt).toBe('string')
  })
})
