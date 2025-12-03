/**
 * Route handler for deleting claim files
 * DELETE /api/claims/:claimId/files/:fileId
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireAuth, requireInternalRole } from '../../../../middleware/auth.js'
import { deleteFileSchema, type DeleteFileParams } from './deleteFile.schema.js'
import { deleteFile } from './deleteFile.service.js'
import type { DeleteClaimFileResponse } from './deleteFile.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route DELETE /api/claims/:claimId/files/:fileId
 * @description Delete a file from a claim (soft delete)
 * @access Internal roles only
 */
router.delete(
  '/:fileId',
  validate(deleteFileSchema),
  requireAuth,
  requireInternalRole,
  async (req, res) => {
    const { claimId, fileId } = (req.validated as { params: DeleteFileParams }).params
    const userId = req.user!.id

    const result = await deleteFile(claimId, fileId, userId)

    const response: DeleteClaimFileResponse = result
    res.status(200).json(response)
  }
)

export { router as deleteFileRouter }
