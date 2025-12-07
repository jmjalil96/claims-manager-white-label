/**
 * Route handler for deleting a client
 * DELETE /api/clients/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireSuperAdmin } from '../../../middleware/auth.js'
import { deleteClientSchema, type DeleteClientParams } from './deleteClient.schema.js'
import { deleteClient } from './deleteClient.service.js'
import type { DeleteClientResponse } from '@claims/shared'

const router = Router()

/**
 * @route DELETE /api/clients/:id
 * @description Delete a client (hard delete)
 * @access Superadmin only
 *         Will fail with 409 Conflict if client has related records
 */
router.delete('/:id', validate(deleteClientSchema), requireSuperAdmin, async (req, res) => {
  const { id } = (req.validated as { params: DeleteClientParams }).params
  const user = req.user!

  const result = await deleteClient(id, user)

  const response: DeleteClientResponse = result
  res.status(200).json(response)
})

export { router as deleteClientRouter }
