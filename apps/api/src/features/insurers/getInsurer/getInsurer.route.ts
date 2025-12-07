/**
 * Route handler for getting a single insurer
 * GET /api/insurers/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireSuperAdmin } from '../../../middleware/auth.js'
import { getInsurerSchema, type GetInsurerInput } from './getInsurer.schema.js'
import { getInsurer } from './getInsurer.service.js'
import type { GetInsurerResponse } from '@claims/shared'

const router = Router()

/**
 * @route GET /api/insurers/:id
 * @description Get a single insurer by ID
 * @access Superadmin only
 */
router.get('/:id', validate(getInsurerSchema), requireSuperAdmin, async (req, res) => {
  const { id } = (req.validated as { params: GetInsurerInput }).params
  const user = req.user!

  const result = await getInsurer(id, user)

  const response: GetInsurerResponse = result
  res.status(200).json(response)
})

export { router as getInsurerRouter }
