/**
 * Route handler for getting a single client
 * GET /api/clients/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { getClientSchema, type GetClientInput } from './getClient.schema.js'
import { getClient } from './getClient.service.js'
import type { GetClientResponse } from '@claims/shared'

const router = Router()

/**
 * @route GET /api/clients/:id
 * @description Get a single client by ID
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Can access any client
 *   - External roles: Must have UserClient access
 */
router.get('/:id', validate(getClientSchema), requireAuth, async (req, res) => {
  const { id } = (req.validated as { params: GetClientInput }).params
  const user = req.user!

  const result = await getClient(id, user)

  const response: GetClientResponse = result
  res.status(200).json(response)
})

export { router as getClientRouter }
