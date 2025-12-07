/**
 * Route handler for editing an affiliate
 * PATCH /api/affiliates/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireInternalRole } from '../../../middleware/auth.js'
import {
  editAffiliateSchema,
  type EditAffiliateParams,
  type EditAffiliateBody,
} from './editAffiliate.schema.js'
import { editAffiliate } from './editAffiliate.service.js'
import type { UpdateAffiliateResponse } from '@claims/shared'

const router = Router()

/**
 * @route PATCH /api/affiliates/:id
 * @description Update an existing affiliate
 * @access Internal roles only (broker employees)
 * @note Cannot change clientId or primaryAffiliateId (conversion blocked)
 */
router.patch('/:id', validate(editAffiliateSchema), requireInternalRole, async (req, res) => {
  const { id } = (req.validated as { params: EditAffiliateParams }).params
  const body = (req.validated as { body: EditAffiliateBody }).body
  const user = req.user!

  const result = await editAffiliate(id, body, user)

  const response: UpdateAffiliateResponse = result
  res.status(200).json(response)
})

export { router as editAffiliateRouter }
