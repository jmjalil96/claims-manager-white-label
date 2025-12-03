/**
 * Route handler for getting available patients
 * GET /api/claims/affiliates/:affiliateId/patients
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireAuth } from '../../../../middleware/auth.js'
import {
  getAvailablePatientsSchema,
  type GetAvailablePatientsInput,
} from './getAvailablePatients.schema.js'
import { getAvailablePatients } from './getAvailablePatients.service.js'
import type { GetAvailablePatientsResponse } from './getAvailablePatients.dto.js'

const router = Router()

/**
 * @route GET /api/claims/affiliates/:affiliateId/patients
 * @description Get patients available for claim creation (affiliate + dependents)
 * @access All authenticated users with appropriate access
 */
router.get(
  '/affiliates/:affiliateId/patients',
  validate(getAvailablePatientsSchema),
  requireAuth,
  async (req, res) => {
    const { affiliateId } = (req.validated as { params: GetAvailablePatientsInput }).params
    const user = req.user!

    const patients = await getAvailablePatients(affiliateId, user)

    const response: GetAvailablePatientsResponse = { patients }
    res.json(response)
  }
)

export { router as getAvailablePatientsRouter }
