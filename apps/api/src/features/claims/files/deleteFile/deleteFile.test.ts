/**
 * Delete claim file tests
 * Focus: Soft delete behavior, authorization, edge cases
 */

import { describe, it, expect } from 'vitest'
import { deleteFile } from './deleteFile.service.js'
import { db } from '../../../../lib/db.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createClaim,
  createClaimFile,
} from '../../../../test/factories.js'

// =============================================================================
// SOFT DELETE BEHAVIOR
// =============================================================================

describe('Delete Claim File', () => {
  describe('soft delete behavior', () => {
    it('sets deletedAt on the file record', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)
      const claim = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
        status: 'DRAFT',
      })
      const { file, claimFile } = await createClaimFile(claim.id, client.id, admin.id)

      const result = await deleteFile(claim.id, claimFile.id, admin.id)

      expect(result.deleted.id).toBe(claimFile.id)

      // Verify file has deletedAt set
      const updatedFile = await db.file.findUnique({
        where: { id: file.id },
      })
      expect(updatedFile?.deletedAt).not.toBeNull()
    })

    it('does not physically delete the file or claimFile records', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)
      const claim = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
        status: 'DRAFT',
      })
      const { file, claimFile } = await createClaimFile(claim.id, client.id, admin.id)

      await deleteFile(claim.id, claimFile.id, admin.id)

      // Both records should still exist
      const fileRecord = await db.file.findUnique({ where: { id: file.id } })
      const claimFileRecord = await db.claimFile.findUnique({
        where: { id: claimFile.id },
      })

      expect(fileRecord).not.toBeNull()
      expect(claimFileRecord).not.toBeNull()
    })
  })

  // =============================================================================
  // NOT FOUND CASES
  // =============================================================================

  describe('not found cases', () => {
    it('throws 404 for non-existent file', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)
      const claim = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
        status: 'DRAFT',
      })

      await expect(deleteFile(claim.id, 'non-existent-file-id', admin.id)).rejects.toThrow(
        'Archivo'
      )
    })

    it('throws 404 for file belonging to different claim', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)
      const claim1 = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
        status: 'DRAFT',
      })
      const claim2 = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
        status: 'DRAFT',
      })
      const { claimFile } = await createClaimFile(claim1.id, client.id, admin.id)

      // Try to delete file from claim1 using claim2's ID
      await expect(deleteFile(claim2.id, claimFile.id, admin.id)).rejects.toThrow('Archivo')
    })

    it('throws 404 for already deleted file', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()
      const affiliate = await createAffiliate(client.id)
      const claim = await createClaim(client.id, affiliate.id, {
        createdById: admin.id,
        status: 'DRAFT',
      })
      const { claimFile } = await createClaimFile(
        claim.id,
        client.id,
        admin.id,
        { deletedAt: new Date() } // Already deleted
      )

      await expect(deleteFile(claim.id, claimFile.id, admin.id)).rejects.toThrow('Archivo')
    })
  })
})
