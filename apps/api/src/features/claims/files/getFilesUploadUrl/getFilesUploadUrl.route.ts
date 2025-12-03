/**
 * Route handler for getting presigned upload URLs for existing claims
 * POST /api/claims/:claimId/files/upload-url
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireAuth, requireInternalRole } from '../../../../middleware/auth.js'
import {
  getFilesUploadUrlSchema,
  type GetFilesUploadUrlParams,
  type GetFilesUploadUrlInput,
} from './getFilesUploadUrl.schema.js'
import { getFilesUploadUrl } from './getFilesUploadUrl.service.js'
import type { GetUploadUrlResponse } from './getFilesUploadUrl.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route POST /api/claims/:claimId/files/upload-url
 * @description Get a presigned URL for uploading a file to an existing claim
 * @access Internal roles only
 */
router.post(
  '/upload-url',
  validate(getFilesUploadUrlSchema),
  requireAuth,
  requireInternalRole,
  async (req, res) => {
    const { claimId } = (req.validated as { params: GetFilesUploadUrlParams }).params
    const input = (req.validated as { body: GetFilesUploadUrlInput }).body

    const result = await getFilesUploadUrl(claimId, input)

    const response: GetUploadUrlResponse = result
    res.status(200).json(response)
  }
)

export { router as getFilesUploadUrlRouter }
