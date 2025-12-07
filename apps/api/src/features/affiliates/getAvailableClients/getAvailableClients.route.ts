/**
 * Route handler for getting available clients
 * GET /api/affiliates/clients
 */

import { Router } from 'express'
import { requireInternalRole } from '../../../middleware/auth.js'
import { getAvailableClients } from './getAvailableClients.service.js'
import type { GetAvailableClientsResponse } from './getAvailableClients.dto.js'

const router = Router()

/**
 * @route GET /api/affiliates/clients
 * @description Get clients available for affiliate creation
 * @access Internal roles only (broker employees)
 */
router.get('/clients', requireInternalRole, async (_req, res) => {
  const clients = await getAvailableClients()

  const response: GetAvailableClientsResponse = { clients }
  res.json(response)
})

export { router as getAvailableClientsRouter }
