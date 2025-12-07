/**
 * Route handler for getting available owners
 * GET /api/affiliates/clients/:clientId/owners
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireInternalRole } from '../../../middleware/auth.js'
import {
  getAvailableOwnersSchema,
  type GetAvailableOwnersInput,
} from './getAvailableOwners.schema.js'
import { getAvailableOwners } from './getAvailableOwners.service.js'
import type { GetAvailableOwnersResponse } from './getAvailableOwners.dto.js'

const router = Router()

/**
 * @route GET /api/affiliates/clients/:clientId/owners
 * @description Get owner affiliates available for dependent creation in a client
 * @access Internal roles only (broker employees)
 */
router.get(
  '/clients/:clientId/owners',
  validate(getAvailableOwnersSchema),
  requireInternalRole,
  async (req, res) => {
    const { clientId } = (req.validated as { params: GetAvailableOwnersInput }).params

    const owners = await getAvailableOwners(clientId)

    const response: GetAvailableOwnersResponse = { owners }
    res.json(response)
  }
)

export { router as getAvailableOwnersRouter }
