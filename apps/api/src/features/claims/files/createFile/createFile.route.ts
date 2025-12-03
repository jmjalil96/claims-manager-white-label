/**
 * Route handler for creating file records on existing claims
 * POST /api/claims/:claimId/files
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireAuth, requireInternalRole } from '../../../../middleware/auth.js'
import {
  createFileSchema,
  type CreateFileParams,
  type CreateFileInput,
} from './createFile.schema.js'
import { createFile } from './createFile.service.js'
import type { CreateClaimFileResponse } from './createFile.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route POST /api/claims/:claimId/files
 * @description Create a file record for an existing claim (confirm upload)
 * @access Internal roles only
 */
router.post('/', validate(createFileSchema), requireAuth, requireInternalRole, async (req, res) => {
  const { claimId } = (req.validated as { params: CreateFileParams }).params
  const input = (req.validated as { body: CreateFileInput }).body
  const userId = req.user!.id

  const result = await createFile(claimId, input, userId)

  const response: CreateClaimFileResponse = result
  res.status(201).json(response)
})

export { router as createFileRouter }
