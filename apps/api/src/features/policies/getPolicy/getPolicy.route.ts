/**
 * Route handler for getting policy details
 * GET /api/policies/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { getPolicySchema, type GetPolicyParams } from './getPolicy.schema.js'
import { getPolicy } from './getPolicy.service.js'
import type { GetPolicyResponse } from './getPolicy.dto.js'

const router = Router()

/**
 * @route GET /api/policies/:id
 * @description Get policy details by ID
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles (broker employees): Full access
 *   - Client admins/agents: Scoped to accessible clients
 *   - Affiliates: No access
 */
router.get('/:id', validate(getPolicySchema), requireAuth, async (req, res) => {
  const { id } = (req.validated as { params: GetPolicyParams }).params
  const user = req.user!

  const policy = await getPolicy(id, user)

  const response: GetPolicyResponse = { policy }
  res.status(200).json(response)
})

export { router as getPolicyRouter }
