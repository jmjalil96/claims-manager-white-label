/**
 * Service layer for generating presigned upload URLs
 * Used for file uploads during claim creation
 */

import { createLogger } from '../../../lib/logger.js'
import { generateTempStorageKey, getSignedUploadUrl } from '../../../lib/storage.js'
import type { GetUploadUrlInput } from './getUploadUrl.schema.js'
import type { GetUploadUrlResponse } from './getUploadUrl.dto.js'

const logger = createLogger('claims:getUploadUrl')

/** Presigned URL expiration in milliseconds (15 minutes) */
const PRESIGNED_URL_EXPIRY_MS = 15 * 60 * 1000

/**
 * Generate a presigned upload URL for a claim file
 *
 * @param input - File metadata (filename, mimeType, fileSize)
 * @param userId - ID of the user requesting the upload
 * @returns Presigned URL and storage key
 */
export async function getUploadUrl(
  input: GetUploadUrlInput,
  userId: string
): Promise<GetUploadUrlResponse> {
  logger.info(
    { filename: input.filename, mimeType: input.mimeType, fileSize: input.fileSize, userId },
    'Generating presigned upload URL for claim file'
  )

  // Generate user-scoped temporary storage key
  const storageKey = generateTempStorageKey('claims', userId, input.filename)

  // Generate presigned URL
  const uploadUrl = await getSignedUploadUrl({
    key: storageKey,
    contentType: input.mimeType,
  })

  const expiresAt = new Date(Date.now() + PRESIGNED_URL_EXPIRY_MS).toISOString()

  logger.info({ storageKey, userId }, 'Presigned upload URL generated successfully')

  return {
    storageKey,
    uploadUrl,
    expiresAt,
  }
}
