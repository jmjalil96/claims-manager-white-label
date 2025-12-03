/**
 * Service layer for generating presigned upload URLs for existing claims
 * Internal roles only
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { generateStorageKey, getSignedUploadUrl } from '../../../../lib/storage.js'
import type { GetFilesUploadUrlInput } from './getFilesUploadUrl.schema.js'
import type { GetUploadUrlResponse } from './getFilesUploadUrl.dto.js'

const logger = createLogger('claims:files:getFilesUploadUrl')

/** Presigned URL expiration in milliseconds (15 minutes) */
const PRESIGNED_URL_EXPIRY_MS = 15 * 60 * 1000

/**
 * Generate a presigned upload URL for a file on an existing claim
 *
 * @param claimId - ID of the claim
 * @param input - File metadata (filename, mimeType, fileSize)
 * @returns Presigned URL and storage key
 */
export async function getFilesUploadUrl(
  claimId: string,
  input: GetFilesUploadUrlInput
): Promise<GetUploadUrlResponse> {
  logger.info(
    { claimId, filename: input.filename, mimeType: input.mimeType },
    'Generating presigned upload URL for existing claim file'
  )

  // Verify claim exists
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: { id: true },
  })

  if (!claim) {
    logger.warn({ claimId }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // Generate permanent storage key (directly in claim folder)
  const storageKey = generateStorageKey('claims', claimId, input.filename)

  // Generate presigned URL
  const uploadUrl = await getSignedUploadUrl({
    key: storageKey,
    contentType: input.mimeType,
  })

  const expiresAt = new Date(Date.now() + PRESIGNED_URL_EXPIRY_MS).toISOString()

  logger.info({ claimId, storageKey }, 'Presigned upload URL generated successfully')

  return {
    storageKey,
    uploadUrl,
    expiresAt,
  }
}
