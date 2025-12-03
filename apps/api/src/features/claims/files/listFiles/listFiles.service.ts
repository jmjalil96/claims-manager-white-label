/**
 * Service layer for listing claim files
 * Accessible by internal roles and affiliates with claim access
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { isInternalRole } from '../../../../lib/constants.js'
import { getSignedDownloadUrl } from '../../../../lib/storage.js'
import type { AuthUser } from '../../../../middleware/auth.js'
import type { ListClaimFilesResponse, ClaimFileDto } from './listFiles.dto.js'

const logger = createLogger('claims:files:listFiles')

/**
 * List all files for a claim
 *
 * @param claimId - ID of the claim
 * @param user - Authenticated user
 * @returns List of files with download URLs
 */
export async function listFiles(claimId: string, user: AuthUser): Promise<ListClaimFilesResponse> {
  logger.info({ claimId, userId: user.id }, 'Listing claim files')

  // 1. Fetch claim with files
  const claim = await db.claim.findUnique({
    where: { id: claimId },
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

  if (!claim) {
    logger.warn({ claimId }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Check access for non-internal roles
  if (!isInternalRole(user.role)) {
    const hasAccess = await db.userClient.findFirst({
      where: {
        userId: user.id,
        clientId: claim.clientId,
        isActive: true,
      },
    })

    if (!hasAccess) {
      logger.warn({ userId: user.id, claimId }, 'User does not have access to claim')
      throw AppError.forbidden('Sin acceso al reclamo')
    }
  }

  // 3. Generate download URLs and build DTOs
  const files: ClaimFileDto[] = await Promise.all(
    claim.files.map(async (claimFile) => {
      const downloadUrl = await getSignedDownloadUrl({
        key: claimFile.file.storageKey,
        responseContentDisposition: `attachment; filename="${claimFile.file.originalName}"`,
      })

      return {
        id: claimFile.id,
        fileId: claimFile.file.id,
        claimId: claimFile.claimId,
        originalName: claimFile.file.originalName,
        mimeType: claimFile.file.mimeType,
        fileSize: Number(claimFile.file.fileSize),
        category: claimFile.category,
        description: claimFile.description,
        uploadedById: claimFile.file.uploadedById,
        uploadedAt: claimFile.file.uploadedAt.toISOString(),
        downloadUrl,
      }
    })
  )

  logger.info({ claimId, fileCount: files.length }, 'Claim files listed successfully')

  return { files }
}
