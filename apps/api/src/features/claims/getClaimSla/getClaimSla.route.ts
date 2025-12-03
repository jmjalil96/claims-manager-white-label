/**
 * Route handler for getting claim SLA metrics
 * GET /api/claims/:id/sla
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth, requireInternalRole } from '../../../middleware/auth.js'
import { getClaimSlaSchema, type GetClaimSlaParams } from './getClaimSla.schema.js'
import { getClaimSla } from './getClaimSla.service.js'
import type { GetClaimSlaResponse } from './getClaimSla.dto.js'

const router = Router()

/**
 * @route GET /api/claims/:id/sla
 * @description Get SLA metrics for a claim by ID
 * @access Internal roles only (claims_admin, claims_employee, etc.)
 */
router.get(
  '/:id/sla',
  validate(getClaimSlaSchema),
  requireAuth,
  requireInternalRole,
  async (req, res) => {
    const { id } = (req.validated as { params: GetClaimSlaParams }).params

    const result = await getClaimSla(id)

    const response: GetClaimSlaResponse = result
    res.status(200).json(response)
  }
)

export { router as getClaimSlaRouter }
