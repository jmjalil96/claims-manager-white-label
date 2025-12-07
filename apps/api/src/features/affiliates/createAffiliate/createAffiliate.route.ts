/**
 * Route handler for creating an affiliate
 * POST /api/affiliates
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireInternalRole } from '../../../middleware/auth.js'
import { createAffiliateSchema, type CreateAffiliateInput } from './createAffiliate.schema.js'
import { createAffiliate } from './createAffiliate.service.js'
import type { CreateAffiliateResponse } from '@claims/shared'

const router = Router()

/**
 * @route POST /api/affiliates
 * @description Create a new affiliate (owner or dependent)
 * @access Internal roles only (broker employees)
 */
router.post('/', validate(createAffiliateSchema), requireInternalRole, async (req, res) => {
  const input = (req.validated as { body: CreateAffiliateInput }).body
  const user = req.user!

  const result = await createAffiliate(input, user)

  const response: CreateAffiliateResponse = result
  res.status(201).json(response)
})

export { router as createAffiliateRouter }
