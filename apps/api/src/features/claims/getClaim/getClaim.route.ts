/**
 * Route handler for getting claim details
 * GET /api/claims/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { getClaimSchema, type GetClaimParams } from './getClaim.schema.js'
import { getClaim } from './getClaim.service.js'
import type { GetClaimResponse } from './getClaim.dto.js'

const router = Router()

/**
 * @route GET /api/claims/:id
 * @description Get claim details by ID
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Full access to all claims
 *   - Client admins/agents: Scoped to accessible clients
 *   - Affiliates: Only claims where they are the affiliate
 */
router.get('/:id', validate(getClaimSchema), requireAuth, async (req, res) => {
  const { id } = (req.validated as { params: GetClaimParams }).params
  const user = req.user!

  const claim = await getClaim(id, user)

  const response: GetClaimResponse = { claim }
  res.status(200).json(response)
})

export { router as getClaimRouter }
