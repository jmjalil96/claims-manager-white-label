/**
 * Service layer for generating presigned upload URLs for existing policies
 * Internal roles only
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { generateStorageKey, getSignedUploadUrl } from '../../../../lib/storage.js'
import type { GetFilesUploadUrlInput } from './getFilesUploadUrl.schema.js'
import type { GetUploadUrlResponse } from './getFilesUploadUrl.dto.js'

const logger = createLogger('policies:files:getFilesUploadUrl')

/** Presigned URL expiration in milliseconds (15 minutes) */
const PRESIGNED_URL_EXPIRY_MS = 15 * 60 * 1000

/**
 * Generate a presigned upload URL for a file on an existing policy
 *
 * @param policyId - ID of the policy
 * @param input - File metadata (filename, mimeType, fileSize)
 * @returns Presigned URL and storage key
 */
export async function getFilesUploadUrl(
  policyId: string,
  input: GetFilesUploadUrlInput
): Promise<GetUploadUrlResponse> {
  logger.info(
    { policyId, filename: input.filename, mimeType: input.mimeType },
    'Generating presigned upload URL for existing policy file'
  )

  // Verify policy exists
  const policy = await db.policy.findUnique({
    where: { id: policyId },
    select: { id: true },
  })

  if (!policy) {
    logger.warn({ policyId }, 'Policy not found')
    throw AppError.notFound('Póliza')
  }

  // Generate permanent storage key (directly in policy folder)
  const storageKey = generateStorageKey('policies', policyId, input.filename)

  // Generate presigned URL
  const uploadUrl = await getSignedUploadUrl({
    key: storageKey,
    contentType: input.mimeType,
  })

  const expiresAt = new Date(Date.now() + PRESIGNED_URL_EXPIRY_MS).toISOString()

  logger.info({ policyId, storageKey }, 'Presigned upload URL generated successfully')

  return {
    storageKey,
    uploadUrl,
    expiresAt,
  }
}
