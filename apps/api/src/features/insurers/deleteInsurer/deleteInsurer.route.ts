/**
 * Route handler for deleting an insurer
 * DELETE /api/insurers/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireSuperAdmin } from '../../../middleware/auth.js'
import { deleteInsurerSchema, type DeleteInsurerParams } from './deleteInsurer.schema.js'
import { deleteInsurer } from './deleteInsurer.service.js'
import type { DeleteInsurerResponse } from '@claims/shared'

const router = Router()

/**
 * @route DELETE /api/insurers/:id
 * @description Delete an insurer (hard delete)
 * @access Superadmin only
 *         Will fail with 409 Conflict if insurer has related records
 */
router.delete('/:id', validate(deleteInsurerSchema), requireSuperAdmin, async (req, res) => {
  const { id } = (req.validated as { params: DeleteInsurerParams }).params
  const user = req.user!

  const result = await deleteInsurer(id, user)

  const response: DeleteInsurerResponse = result
  res.status(200).json(response)
})

export { router as deleteInsurerRouter }
