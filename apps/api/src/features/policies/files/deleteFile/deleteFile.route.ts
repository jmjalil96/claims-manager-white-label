/**
 * Route handler for deleting policy files
 * DELETE /api/policies/:policyId/files/:fileId
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireAuth, requireInternalRole } from '../../../../middleware/auth.js'
import { deleteFileSchema, type DeleteFileParams } from './deleteFile.schema.js'
import { deleteFile } from './deleteFile.service.js'
import type { DeletePolicyFileResponse } from './deleteFile.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route DELETE /api/policies/:policyId/files/:fileId
 * @description Delete a file from a policy (soft delete)
 * @access Internal roles only
 */
router.delete(
  '/:fileId',
  validate(deleteFileSchema),
  requireAuth,
  requireInternalRole,
  async (req, res) => {
    const { policyId, fileId } = (req.validated as { params: DeleteFileParams }).params
    const userId = req.user!.id

    const result = await deleteFile(policyId, fileId, userId)

    const response: DeletePolicyFileResponse = result
    res.status(200).json(response)
  }
)

export { router as deleteFileRouter }
