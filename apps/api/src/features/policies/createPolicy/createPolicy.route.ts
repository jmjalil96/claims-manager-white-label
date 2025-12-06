/**
 * Route handler for creating policies
 * POST /api/policies
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireInternalRole } from '../../../middleware/auth.js'
import { createPolicySchema, type CreatePolicyInput } from './createPolicy.schema.js'
import { createPolicy } from './createPolicy.service.js'
import type { CreatePolicyResponse } from './createPolicy.dto.js'

const router = Router()

/**
 * @route POST /api/policies
 * @description Create a new policy
 * @access Internal roles only (broker employees)
 */
router.post('/', validate(createPolicySchema), requireInternalRole, async (req, res) => {
  const input = (req.validated as { body: CreatePolicyInput }).body
  const user = req.user!

  const policy = await createPolicy(input, user)

  const response: CreatePolicyResponse = { policy }
  res.status(201).json(response)
})

export { router as createPolicyRouter }
