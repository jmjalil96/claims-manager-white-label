/**
 * Service layer for deleting claim files
 * Internal roles only
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { audit } from '../../../../lib/audit.js'
import type { DeleteClaimFileResponse } from './deleteFile.dto.js'

const logger = createLogger('claims:files:deleteFile')

/**
 * Delete a file from a claim (soft delete)
 *
 * @param claimId - ID of the claim
 * @param fileId - ID of the claim file (junction table ID)
 * @param userId - ID of the user deleting the file
 * @returns Deleted file ID
 */
export async function deleteFile(
  claimId: string,
  fileId: string,
  userId: string
): Promise<DeleteClaimFileResponse> {
  logger.info({ claimId, fileId, userId }, 'Deleting claim file')

  // 1. Find the claim file and verify it belongs to the claim
  const claimFile = await db.claimFile.findFirst({
    where: {
      id: fileId,
      claimId,
    },
    include: {
      file: true,
      claim: {
        select: {
          clientId: true,
        },
      },
    },
  })

  if (!claimFile) {
    logger.warn({ claimId, fileId }, 'Claim file not found')
    throw AppError.notFound('Archivo')
  }

  // 2. Check if already deleted
  if (claimFile.file.deletedAt) {
    logger.warn({ claimId, fileId }, 'File already deleted')
    throw AppError.notFound('Archivo')
  }

  // 3. Soft delete the file (set deletedAt)
  await db.file.update({
    where: { id: claimFile.fileId },
    data: { deletedAt: new Date() },
  })

  logger.info(
    { claimId, fileId, fileRecordId: claimFile.fileId },
    'Claim file deleted successfully'
  )

  // 4. Audit log
  audit({
    action: 'DELETE',
    resourceType: 'ClaimFile',
    resourceId: fileId,
    userId,
    clientId: claimFile.claim.clientId,
    metadata: { claimId, originalName: claimFile.file.originalName },
  })

  return { deleted: { id: fileId } }
}
