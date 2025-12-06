/**
 * Service layer for creating file records on existing policies
 * Internal roles only
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { audit } from '../../../../lib/audit.js'
import { fileExists, getSignedDownloadUrl } from '../../../../lib/storage.js'
import type { CreateFileInput } from './createFile.schema.js'
import type { CreatePolicyFileResponse, PolicyFileDto } from './createFile.dto.js'

const logger = createLogger('policies:files:createFile')

/**
 * Create a file record for an existing policy
 *
 * @param policyId - ID of the policy
 * @param input - File metadata
 * @param userId - ID of the user creating the file
 * @returns Created file data
 */
export async function createFile(
  policyId: string,
  input: CreateFileInput,
  userId: string
): Promise<CreatePolicyFileResponse> {
  logger.info({ policyId, storageKey: input.storageKey, userId }, 'Creating file record for policy')

  // 1. Verify policy exists
  const policy = await db.policy.findUnique({
    where: { id: policyId },
    select: { id: true, clientId: true },
  })

  if (!policy) {
    logger.warn({ policyId }, 'Policy not found')
    throw AppError.notFound('Póliza')
  }

  // 2. Verify file exists in R2
  const exists = await fileExists(input.storageKey)
  if (!exists) {
    logger.warn({ storageKey: input.storageKey }, 'File not found in storage')
    throw AppError.badRequest('Archivo no encontrado en almacenamiento')
  }

  // 3. Verify storage key pattern matches policy
  const expectedPrefix = `policies/${policyId}/`
  if (!input.storageKey.startsWith(expectedPrefix)) {
    logger.warn({ storageKey: input.storageKey, expectedPrefix }, 'Invalid storage key pattern')
    throw AppError.forbidden('Carga no válida')
  }

  // 4. Create records in transaction
  const [fileRecord, policyFile] = await db.$transaction(async (tx) => {
    const file = await tx.file.create({
      data: {
        storageKey: input.storageKey,
        storageBucket: 'claims-manager',
        originalName: input.originalName,
        fileSize: BigInt(input.fileSize),
        mimeType: input.mimeType,
        entityType: 'POLICY',
        entityId: policyId,
        clientId: policy.clientId,
        uploadedById: userId,
      },
    })

    const policyFileRecord = await tx.policyFile.create({
      data: {
        fileId: file.id,
        policyId,
        category: input.category,
        description: input.description,
      },
    })

    return [file, policyFileRecord]
  })

  logger.info(
    { policyId, fileId: fileRecord.id, policyFileId: policyFile.id },
    'File record created successfully'
  )

  // 5. Audit log
  audit({
    action: 'CREATE',
    resourceType: 'PolicyFile',
    resourceId: policyFile.id,
    userId,
    clientId: policy.clientId,
    metadata: { policyId, originalName: input.originalName },
  })

  // 6. Generate download URL and return DTO
  const downloadUrl = await getSignedDownloadUrl({
    key: fileRecord.storageKey,
    responseContentDisposition: `attachment; filename="${fileRecord.originalName}"`,
  })

  const fileDto: PolicyFileDto = {
    id: policyFile.id,
    fileId: fileRecord.id,
    policyId,
    originalName: fileRecord.originalName,
    mimeType: fileRecord.mimeType,
    fileSize: Number(fileRecord.fileSize),
    category: policyFile.category,
    description: policyFile.description,
    uploadedById: fileRecord.uploadedById,
    uploadedAt: fileRecord.uploadedAt.toISOString(),
    downloadUrl,
  }

  return { file: fileDto }
}
