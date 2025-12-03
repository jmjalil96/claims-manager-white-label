/**
 * Route handler for getting claim audit trail
 * GET /api/claims/:id/audit
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import {
  getClaimAuditSchema,
  type GetClaimAuditParams,
  type GetClaimAuditQuery,
} from './getClaimAudit.schema.js'
import { getClaimAudit } from './getClaimAudit.service.js'
import type { GetClaimAuditResponse } from './getClaimAudit.dto.js'

const router = Router()

/**
 * @route GET /api/claims/:id/audit
 * @description Get audit trail for a claim by ID
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Full access to all claims' audit logs
 *   - Client admins/agents: Scoped to accessible clients
 *   - Affiliates: Only claims where they are the affiliate
 */
router.get('/:id/audit', validate(getClaimAuditSchema), requireAuth, async (req, res) => {
  const { id } = (req.validated as { params: GetClaimAuditParams }).params
  const query = (req.validated as { query: GetClaimAuditQuery }).query
  const user = req.user!

  const result = await getClaimAudit(id, query, user)

  const response: GetClaimAuditResponse = result
  res.status(200).json(response)
})

export { router as getClaimAuditRouter }
