/**
 * Route handler for getting available affiliates
 * GET /api/claims/clients/:clientId/affiliates
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireAuth } from '../../../../middleware/auth.js'
import {
  getAvailableAffiliatesSchema,
  type GetAvailableAffiliatesInput,
} from './getAvailableAffiliates.schema.js'
import { getAvailableAffiliates } from './getAvailableAffiliates.service.js'
import type { GetAvailableAffiliatesResponse } from './getAvailableAffiliates.dto.js'

const router = Router()

/**
 * @route GET /api/claims/clients/:clientId/affiliates
 * @description Get affiliates available for claim creation in a client
 * @access All authenticated users with client access (results scoped by role)
 */
router.get(
  '/clients/:clientId/affiliates',
  validate(getAvailableAffiliatesSchema),
  requireAuth,
  async (req, res) => {
    const { clientId } = (req.validated as { params: GetAvailableAffiliatesInput }).params
    const user = req.user!

    const affiliates = await getAvailableAffiliates(clientId, user)

    const response: GetAvailableAffiliatesResponse = { affiliates }
    res.json(response)
  }
)

export { router as getAvailableAffiliatesRouter }
