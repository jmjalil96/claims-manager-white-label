/**
 * Route handler for deleting an affiliate
 * DELETE /api/affiliates/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireSuperAdmin } from '../../../middleware/auth.js'
import { deleteAffiliateSchema, type DeleteAffiliateParams } from './deleteAffiliate.schema.js'
import { deleteAffiliate } from './deleteAffiliate.service.js'
import type { DeleteAffiliateResponse } from '@claims/shared'

const router = Router()

/**
 * @route DELETE /api/affiliates/:id
 * @description Delete an affiliate (hard delete)
 * @access Superadmin only
 * @note Will fail if affiliate has related records (claims, enrollments, dependents)
 */
router.delete('/:id', validate(deleteAffiliateSchema), requireSuperAdmin, async (req, res) => {
  const { id } = (req.validated as { params: DeleteAffiliateParams }).params
  const user = req.user!

  const result = await deleteAffiliate(id, user)

  const response: DeleteAffiliateResponse = result
  res.status(200).json(response)
})

export { router as deleteAffiliateRouter }
