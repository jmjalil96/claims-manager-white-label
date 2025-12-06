/**
 * Route handler for creating file records on existing policies
 * POST /api/policies/:policyId/files
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
import type { CreatePolicyFileResponse } from './createFile.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route POST /api/policies/:policyId/files
 * @description Create a file record for an existing policy (confirm upload)
 * @access Internal roles only
 */
router.post('/', validate(createFileSchema), requireAuth, requireInternalRole, async (req, res) => {
  const { policyId } = (req.validated as { params: CreateFileParams }).params
  const input = (req.validated as { body: CreateFileInput }).body
  const userId = req.user!.id

  const result = await createFile(policyId, input, userId)

  const response: CreatePolicyFileResponse = result
  res.status(201).json(response)
})

export { router as createFileRouter }
