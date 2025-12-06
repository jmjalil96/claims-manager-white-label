/**
 * Route handler for getting policy audit trail
 * GET /api/policies/:id/audit
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import {
  getPolicyAuditSchema,
  type GetPolicyAuditParams,
  type GetPolicyAuditQuery,
} from './getPolicyAudit.schema.js'
import { getPolicyAudit } from './getPolicyAudit.service.js'
import type { GetPolicyAuditResponse } from './getPolicyAudit.dto.js'

const router = Router()

/**
 * @route GET /api/policies/:id/audit
 * @description Get audit trail for a policy by ID
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Full access to all policies' audit logs
 *   - Client admins/agents: Scoped to accessible clients
 */
router.get('/:id/audit', validate(getPolicyAuditSchema), requireAuth, async (req, res) => {
  const { id } = (req.validated as { params: GetPolicyAuditParams }).params
  const query = (req.validated as { query: GetPolicyAuditQuery }).query
  const user = req.user!

  const result = await getPolicyAudit(id, query, user)

  const response: GetPolicyAuditResponse = result
  res.status(200).json(response)
})

export { router as getPolicyAuditRouter }
