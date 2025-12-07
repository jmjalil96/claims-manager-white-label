/**
 * Route handler for listing clients
 * GET /api/clients
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { listClientsSchema, type ListClientsInput } from './listClients.schema.js'
import { listClients } from './listClients.service.js'
import type { ListClientsResponse } from '@claims/shared'

const router = Router()

/**
 * @route GET /api/clients
 * @description List clients with filtering, sorting, and pagination
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Full access to all clients
 *   - External roles: Scoped to accessible clients via UserClient
 */
router.get('/', validate(listClientsSchema), requireAuth, async (req, res) => {
  const input = (req.validated as { query: ListClientsInput }).query
  const user = req.user!

  const result = await listClients(input, user)

  const response: ListClientsResponse = result
  res.status(200).json(response)
})

export { router as listClientsRouter }
