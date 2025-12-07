/**
 * Route handler for getting a single affiliate
 * GET /api/affiliates/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { getAffiliateSchema, type GetAffiliateParams } from './getAffiliate.schema.js'
import { getAffiliate } from './getAffiliate.service.js'
import type { GetAffiliateResponse } from '@claims/shared'

const router = Router()

/**
 * @route GET /api/affiliates/:id
 * @description Get a single affiliate by ID with full details
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Full access
 *   - Client admin: Must have UserClient access to affiliate's client
 *   - Affiliate: Must be self or own dependent
 */
router.get('/:id', validate(getAffiliateSchema), requireAuth, async (req, res) => {
  const { id } = (req.validated as { params: GetAffiliateParams }).params
  const user = req.user!

  const result = await getAffiliate(id, user)

  const response: GetAffiliateResponse = result
  res.status(200).json(response)
})

export { router as getAffiliateRouter }
