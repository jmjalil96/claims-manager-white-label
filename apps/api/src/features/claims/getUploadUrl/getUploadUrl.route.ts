/**
 * Route handler for getting presigned upload URLs
 * POST /api/claims/upload-url
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { getUploadUrlSchema, type GetUploadUrlInput } from './getUploadUrl.schema.js'
import { getUploadUrl } from './getUploadUrl.service.js'
import type { GetUploadUrlResponse } from './getUploadUrl.dto.js'

const router = Router()

/**
 * @route POST /api/claims/upload-url
 * @description Get a presigned URL for uploading a file during claim creation
 * @access All authenticated users (anyone who can create claims)
 */
router.post('/upload-url', validate(getUploadUrlSchema), requireAuth, async (req, res) => {
  const input = (req.validated as { body: GetUploadUrlInput }).body
  const userId = req.user!.id

  const result = await getUploadUrl(input, userId)

  const response: GetUploadUrlResponse = result
  res.status(200).json(response)
})

export { router as getUploadUrlRouter }
