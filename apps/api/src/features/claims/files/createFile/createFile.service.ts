/**
 * Service layer for creating file records on existing claims
 * Internal roles only
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { audit } from '../../../../lib/audit.js'
import { fileExists, getSignedDownloadUrl } from '../../../../lib/storage.js'
import type { CreateFileInput } from './createFile.schema.js'
import type { CreateClaimFileResponse, ClaimFileDto } from './createFile.dto.js'

const logger = createLogger('claims:files:createFile')

/**
 * Create a file record for an existing claim
 *
 * @param claimId - ID of the claim
 * @param input - File metadata
 * @param userId - ID of the user creating the file
 * @returns Created file data
 */
export async function createFile(
  claimId: string,
  input: CreateFileInput,
  userId: string
): Promise<CreateClaimFileResponse> {
  logger.info({ claimId, storageKey: input.storageKey, userId }, 'Creating file record for claim')

  // 1. Verify claim exists
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: { id: true, clientId: true },
  })

  if (!claim) {
    logger.warn({ claimId }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Verify file exists in R2
  const exists = await fileExists(input.storageKey)
  if (!exists) {
    logger.warn({ storageKey: input.storageKey }, 'File not found in storage')
    throw AppError.badRequest('Archivo no encontrado en almacenamiento')
  }

  // 3. Verify storage key pattern matches claim
  const expectedPrefix = `claims/${claimId}/`
  if (!input.storageKey.startsWith(expectedPrefix)) {
    logger.warn({ storageKey: input.storageKey, expectedPrefix }, 'Invalid storage key pattern')
    throw AppError.forbidden('Carga no válida')
  }

  // 4. Create records in transaction
  const [fileRecord, claimFile] = await db.$transaction(async (tx) => {
    const file = await tx.file.create({
      data: {
        storageKey: input.storageKey,
        storageBucket: 'claims-manager',
        originalName: input.originalName,
        fileSize: BigInt(input.fileSize),
        mimeType: input.mimeType,
        entityType: 'CLAIM',
        entityId: claimId,
        clientId: claim.clientId,
        uploadedById: userId,
      },
    })

    const claimFileRecord = await tx.claimFile.create({
      data: {
        fileId: file.id,
        claimId,
        category: input.category,
        description: input.description,
      },
    })

    return [file, claimFileRecord]
  })

  logger.info(
    { claimId, fileId: fileRecord.id, claimFileId: claimFile.id },
    'File record created successfully'
  )

  // 5. Audit log
  audit({
    action: 'CREATE',
    resourceType: 'ClaimFile',
    resourceId: claimFile.id,
    userId,
    clientId: claim.clientId,
    metadata: { claimId, originalName: input.originalName },
  })

  // 6. Generate download URL and return DTO
  const downloadUrl = await getSignedDownloadUrl({
    key: fileRecord.storageKey,
    responseContentDisposition: `attachment; filename="${fileRecord.originalName}"`,
  })

  const fileDto: ClaimFileDto = {
    id: claimFile.id,
    fileId: fileRecord.id,
    claimId,
    originalName: fileRecord.originalName,
    mimeType: fileRecord.mimeType,
    fileSize: Number(fileRecord.fileSize),
    category: claimFile.category,
    description: claimFile.description,
    uploadedById: fileRecord.uploadedById,
    uploadedAt: fileRecord.uploadedAt.toISOString(),
    downloadUrl,
  }

  return { file: fileDto }
}
