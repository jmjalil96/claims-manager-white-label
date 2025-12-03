/**
 * Route handler for getting available clients
 * GET /api/claims/clients
 */

import { Router } from 'express'
import { requireAuth } from '../../../../middleware/auth.js'
import { getAvailableClients } from './getAvailableClients.service.js'
import type { GetAvailableClientsResponse } from './getAvailableClients.dto.js'

const router = Router()

/**
 * @route GET /api/claims/clients
 * @description Get clients available for claim creation
 * @access All authenticated users (results scoped by role)
 */
router.get('/clients', requireAuth, async (req, res) => {
  const user = req.user!

  const clients = await getAvailableClients(user)

  const response: GetAvailableClientsResponse = { clients }
  res.json(response)
})

export { router as getAvailableClientsRouter }
