/**
 * Route handler for creating a client
 * POST /api/clients
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireInternalRole } from '../../../middleware/auth.js'
import { createClientSchema, type CreateClientInput } from './createClient.schema.js'
import { createClient } from './createClient.service.js'
import type { CreateClientResponse } from '@claims/shared'

const router = Router()

/**
 * @route POST /api/clients
 * @description Create a new client
 * @access Internal roles only (broker employees)
 */
router.post('/', validate(createClientSchema), requireInternalRole, async (req, res) => {
  const input = (req.validated as { body: CreateClientInput }).body
  const user = req.user!

  const result = await createClient(input, user)

  const response: CreateClientResponse = result
  res.status(201).json(response)
})

export { router as createClientRouter }
