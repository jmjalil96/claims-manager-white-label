/**
 * Route handler for listing policies
 * GET /api/policies
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { listPoliciesSchema, type ListPoliciesInput } from './listPolicies.schema.js'
import { listPolicies } from './listPolicies.service.js'
import type { ListPoliciesResponse } from './listPolicies.dto.js'

const router = Router()

/**
 * @route GET /api/policies
 * @description List policies with filtering, sorting, and pagination
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Full access to all policies
 *   - Client admins/agents: Scoped to accessible clients
 *   - Affiliates: Only policies for their client
 */
router.get('/', validate(listPoliciesSchema), requireAuth, async (req, res) => {
  const input = (req.validated as { query: ListPoliciesInput }).query
  const user = req.user!

  const result = await listPolicies(input, user)

  const response: ListPoliciesResponse = result
  res.status(200).json(response)
})

export { router as listPoliciesRouter }
