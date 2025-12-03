/**
 * R2 Storage module
 * Provides utilities for file upload/download with Cloudflare R2
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../config/env.js'
import { createLogger } from './logger.js'
import { randomUUID } from 'crypto'

const logger = createLogger('storage')

// =============================================================================
// S3 CLIENT CONFIGURATION
// =============================================================================

/**
 * S3 client configured for Cloudflare R2
 */
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = env.R2_BUCKET_NAME

// =============================================================================
// STORAGE KEY GENERATION
// =============================================================================

export type StorageFolder = 'claims' | 'invoices' | 'tickets' | 'documents'

/**
 * Generate a unique storage key for a file
 * Format: folder/entityId/uuid-filename
 */
export function generateStorageKey(
  folder: StorageFolder,
  entityId: string,
  originalName: string
): string {
  const uuid = randomUUID()
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${folder}/${entityId}/${uuid}-${sanitizedName}`
}

/**
 * Generate a user-scoped temporary storage key
 * Format: folder/temp/userId/uuid-filename
 * Used for uploads before the parent entity is created
 */
export function generateTempStorageKey(
  folder: StorageFolder,
  userId: string,
  originalName: string
): string {
  const uuid = randomUUID()
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${folder}/temp/${userId}/${uuid}-${sanitizedName}`
}

/**
 * Validate that a storage key belongs to a user's temp folder
 */
export function validateTempKeyOwnership(
  storageKey: string,
  folder: StorageFolder,
  userId: string
): boolean {
  return storageKey.startsWith(`${folder}/temp/${userId}/`)
}

// =============================================================================
// UPLOAD OPERATIONS
// =============================================================================

export interface UploadFileOptions {
  key: string
  body: Buffer | Uint8Array | string
  contentType: string
  metadata?: Record<string, string>
}

/**
 * Upload a file directly to R2
 */
export async function uploadFile(options: UploadFileOptions): Promise<void> {
  const { key, body, contentType, metadata } = options

  logger.info({ key, contentType }, 'Uploading file to R2')

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
      })
    )

    logger.info({ key }, 'File uploaded successfully')
  } catch (error) {
    logger.error({ key, error }, 'Failed to upload file')
    throw error
  }
}

export interface PresignedUploadOptions {
  key: string
  contentType: string
  expiresIn?: number
}

/**
 * Generate a presigned URL for client-side upload
 * Default expiration: 15 minutes
 */
export async function getSignedUploadUrl(options: PresignedUploadOptions): Promise<string> {
  const { key, contentType, expiresIn = 900 } = options

  logger.info({ key, contentType, expiresIn }, 'Generating signed upload URL')

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn })

  logger.info({ key }, 'Signed upload URL generated')
  return url
}

// =============================================================================
// DOWNLOAD OPERATIONS
// =============================================================================

export interface PresignedDownloadOptions {
  key: string
  expiresIn?: number
  responseContentDisposition?: string
}

/**
 * Generate a presigned URL for file download
 * Default expiration: 1 hour
 */
export async function getSignedDownloadUrl(options: PresignedDownloadOptions): Promise<string> {
  const { key, expiresIn = 3600, responseContentDisposition } = options

  logger.info({ key, expiresIn }, 'Generating signed download URL')

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: responseContentDisposition,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn })

  logger.info({ key }, 'Signed download URL generated')
  return url
}

/**
 * Get public URL for a file (if bucket has public access enabled)
 */
export function getPublicUrl(key: string): string {
  return `${env.R2_PUBLIC_URL}/${key}`
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  logger.info({ key }, 'Deleting file from R2')

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    )

    logger.info({ key }, 'File deleted successfully')
  } catch (error) {
    logger.error({ key, error }, 'Failed to delete file')
    throw error
  }
}

/**
 * Check if a file exists in R2
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}

// =============================================================================
// ALLOWED FILE TYPES
// =============================================================================

/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Spreadsheets
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Word documents
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

/**
 * Check if a MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)
}

/**
 * Maximum file size in bytes (10 MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024
