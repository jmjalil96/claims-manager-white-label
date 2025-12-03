/**
 * Route handler for creating claims
 * POST /api/claims
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { createClaimSchema, type CreateClaimInput } from './createClaim.schema.js'
import { createClaim } from './createClaim.service.js'
import type { CreateClaimResponse } from './createClaim.dto.js'

const router = Router()

/**
 * @route POST /api/claims
 * @description Create a new claim
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Full access to any client
 *   - Client admins/agents: Scoped to accessible clients
 *   - Affiliates: Self + dependents only as patient
 */
router.post('/', validate(createClaimSchema), requireAuth, async (req, res) => {
  const input = (req.validated as { body: CreateClaimInput }).body
  const user = req.user!

  const claim = await createClaim(input, user)

  const response: CreateClaimResponse = { claim }
  res.status(201).json(response)
})

export { router as createClaimRouter }
