/**
 * Route handler for listing policy files
 * GET /api/policies/:policyId/files
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireAuth } from '../../../../middleware/auth.js'
import { listFilesSchema, type ListFilesParams } from './listFiles.schema.js'
import { listFiles } from './listFiles.service.js'
import type { ListPolicyFilesResponse } from './listFiles.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route GET /api/policies/:policyId/files
 * @description List all files for a policy
 * @access Internal roles + affiliates with policy access
 */
router.get('/', validate(listFilesSchema), requireAuth, async (req, res) => {
  const { policyId } = (req.validated as { params: ListFilesParams }).params
  const user = req.user!

  const result = await listFiles(policyId, user)

  const response: ListPolicyFilesResponse = result
  res.status(200).json(response)
})

export { router as listFilesRouter }
