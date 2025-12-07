/**
 * Route handler for listing insurers
 * GET /api/insurers
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireSuperAdmin } from '../../../middleware/auth.js'
import { listInsurersSchema, type ListInsurersInput } from './listInsurers.schema.js'
import { listInsurers } from './listInsurers.service.js'
import type { ListInsurersResponse } from '@claims/shared'

const router = Router()

/**
 * @route GET /api/insurers
 * @description List insurers with filtering, sorting, and pagination
 * @access Superadmin only
 */
router.get('/', validate(listInsurersSchema), requireSuperAdmin, async (req, res) => {
  const input = (req.validated as { query: ListInsurersInput }).query
  const user = req.user!

  const result = await listInsurers(input, user)

  const response: ListInsurersResponse = result
  res.status(200).json(response)
})

export { router as listInsurersRouter }
