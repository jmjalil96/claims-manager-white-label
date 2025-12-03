/**
 * Route handler for listing claim files
 * GET /api/claims/:claimId/files
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireAuth } from '../../../../middleware/auth.js'
import { listFilesSchema, type ListFilesParams } from './listFiles.schema.js'
import { listFiles } from './listFiles.service.js'
import type { ListClaimFilesResponse } from './listFiles.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route GET /api/claims/:claimId/files
 * @description List all files for a claim
 * @access Internal roles + affiliates with claim access
 */
router.get('/', validate(listFilesSchema), requireAuth, async (req, res) => {
  const { claimId } = (req.validated as { params: ListFilesParams }).params
  const user = req.user!

  const result = await listFiles(claimId, user)

  const response: ListClaimFilesResponse = result
  res.status(200).json(response)
})

export { router as listFilesRouter }
