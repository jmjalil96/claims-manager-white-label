/**
 * Route handler for kanban policies
 * GET /api/policies/kanban
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { kanbanPoliciesSchema, type KanbanPoliciesInput } from './kanbanPolicies.schema.js'
import { getKanbanPolicies } from './kanbanPolicies.service.js'
import type { KanbanPoliciesResponse } from './kanbanPolicies.dto.js'

const router = Router()

/**
 * @route GET /api/policies/kanban
 * @description Get policies grouped by status for Kanban view
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles (broker employees): Full access
 *   - Client admins/agents: Scoped to accessible clients
 *   - Affiliates: No access
 */
router.get('/kanban', validate(kanbanPoliciesSchema), requireAuth, async (req, res) => {
  const input = (req.validated as { query: KanbanPoliciesInput }).query
  const user = req.user!

  const result = await getKanbanPolicies(input, user)

  const response: KanbanPoliciesResponse = result
  res.status(200).json(response)
})

export { router as kanbanPoliciesRouter }
