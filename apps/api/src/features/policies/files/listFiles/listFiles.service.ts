/**
 * Service layer for listing policy files
 * Accessible by internal roles and affiliates with policy access
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { isInternalRole } from '../../../../lib/constants.js'
import { getSignedDownloadUrl } from '../../../../lib/storage.js'
import type { AuthUser } from '../../../../middleware/auth.js'
import type { ListPolicyFilesResponse, PolicyFileDto } from './listFiles.dto.js'

const logger = createLogger('policies:files:listFiles')

/**
 * List all files for a policy
 *
 * @param policyId - ID of the policy
 * @param user - Authenticated user
 * @returns List of files with download URLs
 */
export async function listFiles(policyId: string, user: AuthUser): Promise<ListPolicyFilesResponse> {
  logger.info({ policyId, userId: user.id }, 'Listing policy files')

  // 1. Fetch policy with files
  const policy = await db.policy.findUnique({
    where: { id: policyId },
    select: {
      id: true,
      clientId: true,
      files: {
        include: {
          file: true,
        },
        where: {
          file: {
            deletedAt: null,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!policy) {
    logger.warn({ policyId }, 'Policy not found')
    throw AppError.notFound('Póliza')
  }

  // 2. Check access for non-internal roles
  if (!isInternalRole(user.role)) {
    const hasAccess = await db.userClient.findFirst({
      where: {
        userId: user.id,
        clientId: policy.clientId,
        isActive: true,
      },
    })

    if (!hasAccess) {
      logger.warn({ userId: user.id, policyId }, 'User does not have access to policy')
      throw AppError.forbidden('Sin acceso a la póliza')
    }
  }

  // 3. Generate download URLs and build DTOs
  const files: PolicyFileDto[] = await Promise.all(
    policy.files.map(async (policyFile) => {
      const downloadUrl = await getSignedDownloadUrl({
        key: policyFile.file.storageKey,
        responseContentDisposition: `attachment; filename="${policyFile.file.originalName}"`,
      })

      return {
        id: policyFile.id,
        fileId: policyFile.file.id,
        policyId: policyFile.policyId,
        originalName: policyFile.file.originalName,
        mimeType: policyFile.file.mimeType,
        fileSize: Number(policyFile.file.fileSize),
        category: policyFile.category,
        description: policyFile.description,
        uploadedById: policyFile.file.uploadedById,
        uploadedAt: policyFile.file.uploadedAt.toISOString(),
        downloadUrl,
      }
    })
  )

  logger.info({ policyId, fileCount: files.length }, 'Policy files listed successfully')

  return { files }
}
