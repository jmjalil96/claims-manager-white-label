/**
 * Service layer for deleting policy files
 * Internal roles only
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { audit } from '../../../../lib/audit.js'
import type { DeletePolicyFileResponse } from './deleteFile.dto.js'

const logger = createLogger('policies:files:deleteFile')

/**
 * Delete a file from a policy (soft delete)
 *
 * @param policyId - ID of the policy
 * @param fileId - ID of the policy file (junction table ID)
 * @param userId - ID of the user deleting the file
 * @returns Deleted file ID
 */
export async function deleteFile(
  policyId: string,
  fileId: string,
  userId: string
): Promise<DeletePolicyFileResponse> {
  logger.info({ policyId, fileId, userId }, 'Deleting policy file')

  // 1. Find the policy file and verify it belongs to the policy
  const policyFile = await db.policyFile.findFirst({
    where: {
      id: fileId,
      policyId,
    },
    include: {
      file: true,
      policy: {
        select: {
          clientId: true,
        },
      },
    },
  })

  if (!policyFile) {
    logger.warn({ policyId, fileId }, 'Policy file not found')
    throw AppError.notFound('Archivo')
  }

  // 2. Check if already deleted
  if (policyFile.file.deletedAt) {
    logger.warn({ policyId, fileId }, 'File already deleted')
    throw AppError.notFound('Archivo')
  }

  // 3. Soft delete the file (set deletedAt)
  await db.file.update({
    where: { id: policyFile.fileId },
    data: { deletedAt: new Date() },
  })

  logger.info(
    { policyId, fileId, fileRecordId: policyFile.fileId },
    'Policy file deleted successfully'
  )

  // 4. Audit log
  audit({
    action: 'DELETE',
    resourceType: 'PolicyFile',
    resourceId: fileId,
    userId,
    clientId: policyFile.policy.clientId,
    metadata: { policyId, originalName: policyFile.file.originalName },
  })

  return { deleted: { id: fileId } }
}
