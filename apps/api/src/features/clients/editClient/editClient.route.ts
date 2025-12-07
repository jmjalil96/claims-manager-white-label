/**
 * Route handler for editing a client
 * PATCH /api/clients/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { editClientSchema, type EditClientParams, type EditClientBody } from './editClient.schema.js'
import { editClient } from './editClient.service.js'
import type { UpdateClientResponse } from '@claims/shared'

const router = Router()

/**
 * @route PATCH /api/clients/:id
 * @description Edit an existing client
 * @access Internal roles: full edit
 *         client_admin: only their accessible clients, cannot change isActive
 *         Other external roles: 403
 */
router.patch('/:id', validate(editClientSchema), requireAuth, async (req, res) => {
  const { id } = (req.validated as { params: EditClientParams }).params
  const input = (req.validated as { body: EditClientBody }).body
  const user = req.user!

  const result = await editClient(id, input, user)

  const response: UpdateClientResponse = result
  res.status(200).json(response)
})

export { router as editClientRouter }
