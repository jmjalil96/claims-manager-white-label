/**
 * Route handler for editing an insurer
 * PATCH /api/insurers/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireSuperAdmin } from '../../../middleware/auth.js'
import { editInsurerSchema, type EditInsurerParams, type EditInsurerBody } from './editInsurer.schema.js'
import { editInsurer } from './editInsurer.service.js'
import type { UpdateInsurerResponse } from '@claims/shared'

const router = Router()

/**
 * @route PATCH /api/insurers/:id
 * @description Edit an existing insurer
 * @access Superadmin only
 */
router.patch('/:id', validate(editInsurerSchema), requireSuperAdmin, async (req, res) => {
  const { id } = (req.validated as { params: EditInsurerParams }).params
  const input = (req.validated as { body: EditInsurerBody }).body
  const user = req.user!

  const result = await editInsurer(id, input, user)

  const response: UpdateInsurerResponse = result
  res.status(200).json(response)
})

export { router as editInsurerRouter }
