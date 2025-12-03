/**
 * Route handler for deleting claims
 * DELETE /api/claims/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireSuperAdmin } from '../../../middleware/auth.js'
import { deleteClaimSchema, type DeleteClaimParams } from './deleteClaim.schema.js'
import { deleteClaim } from './deleteClaim.service.js'
import type { DeleteClaimResponse } from './deleteClaim.dto.js'

const router = Router()

/**
 * @route DELETE /api/claims/:id
 * @description Delete a claim (hard delete)
 * @access Superadmin only
 */
router.delete('/:id', validate(deleteClaimSchema), requireSuperAdmin, async (req, res) => {
  const { id } = (req.validated as { params: DeleteClaimParams }).params
  const user = req.user!

  const result = await deleteClaim(id, user)

  const response: DeleteClaimResponse = { deleted: result }
  res.status(200).json(response)
})

export { router as deleteClaimRouter }
