/**
 * Route handler for kanban claims view
 * GET /api/claims/kanban
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { kanbanClaimsSchema, type KanbanClaimsInput } from './kanbanClaims.schema.js'
import { getKanbanClaims } from './kanbanClaims.service.js'
import type { KanbanClaimsResponse } from './kanbanClaims.dto.js'

const router = Router()

/**
 * @route GET /api/claims/kanban
 * @description Get claims grouped by status for Kanban view
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Full access to all claims
 *   - Client admins/agents: Scoped to accessible clients
 *   - Affiliates: Only claims where they are the affiliate
 */
router.get('/kanban', validate(kanbanClaimsSchema), requireAuth, async (req, res) => {
  const input = (req.validated as { query: KanbanClaimsInput }).query
  const user = req.user!

  const result = await getKanbanClaims(input, user)

  const response: KanbanClaimsResponse = result
  res.status(200).json(response)
})

export { router as kanbanClaimsRouter }
