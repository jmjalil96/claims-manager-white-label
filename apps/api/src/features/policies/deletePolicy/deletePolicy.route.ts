/**
 * Route handler for deleting policies
 * DELETE /api/policies/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireSuperAdmin } from '../../../middleware/auth.js'
import { deletePolicySchema, type DeletePolicyParams } from './deletePolicy.schema.js'
import { deletePolicy } from './deletePolicy.service.js'
import type { DeletePolicyResponse } from './deletePolicy.dto.js'

const router = Router()

/**
 * @route DELETE /api/policies/:id
 * @description Delete a policy (hard delete)
 * @access Superadmin only
 */
router.delete('/:id', validate(deletePolicySchema), requireSuperAdmin, async (req, res) => {
  const { id } = (req.validated as { params: DeletePolicyParams }).params
  const user = req.user!

  const result = await deletePolicy(id, user)

  const response: DeletePolicyResponse = { deleted: result }
  res.status(200).json(response)
})

export { router as deletePolicyRouter }
