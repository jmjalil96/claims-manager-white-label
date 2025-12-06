/**
 * Route handler for getting available insurers
 * GET /api/policies/insurers
 */

import { Router } from 'express'
import { requireInternalRole } from '../../../../middleware/auth.js'
import { getAvailableInsurers } from './getAvailableInsurers.service.js'
import type { GetAvailableInsurersResponse } from './getAvailableInsurers.dto.js'

const router = Router()

/**
 * @route GET /api/policies/insurers
 * @description Get insurers available for policy creation
 * @access Internal roles only (broker employees)
 */
router.get('/insurers', requireInternalRole, async (_req, res) => {
  const insurers = await getAvailableInsurers()

  const response: GetAvailableInsurersResponse = { insurers }
  res.json(response)
})

export { router as getAvailableInsurersRouter }
