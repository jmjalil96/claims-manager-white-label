/**
 * Route handler for listing claims
 * GET /api/claims
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { listClaimsSchema, type ListClaimsInput } from './listClaims.schema.js'
import { listClaims } from './listClaims.service.js'
import type { ListClaimsResponse } from './listClaims.dto.js'

const router = Router()

/**
 * @route GET /api/claims
 * @description List claims with filtering, sorting, and pagination
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Full access to all claims
 *   - Client admins/agents: Scoped to accessible clients
 *   - Affiliates: Only claims where they are the affiliate
 */
router.get('/', validate(listClaimsSchema), requireAuth, async (req, res) => {
  const input = (req.validated as { query: ListClaimsInput }).query
  const user = req.user!

  const result = await listClaims(input, user)

  const response: ListClaimsResponse = result
  res.status(200).json(response)
})

export { router as listClaimsRouter }
