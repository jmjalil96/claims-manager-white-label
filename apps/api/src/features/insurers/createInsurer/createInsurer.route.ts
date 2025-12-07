/**
 * Route handler for creating an insurer
 * POST /api/insurers
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireSuperAdmin } from '../../../middleware/auth.js'
import { createInsurerSchema, type CreateInsurerInput } from './createInsurer.schema.js'
import { createInsurer } from './createInsurer.service.js'
import type { CreateInsurerResponse } from '@claims/shared'

const router = Router()

/**
 * @route POST /api/insurers
 * @description Create a new insurer
 * @access Superadmin only
 */
router.post('/', validate(createInsurerSchema), requireSuperAdmin, async (req, res) => {
  const input = (req.validated as { body: CreateInsurerInput }).body
  const user = req.user!

  const result = await createInsurer(input, user)

  const response: CreateInsurerResponse = result
  res.status(201).json(response)
})

export { router as createInsurerRouter }
