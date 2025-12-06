/**
 * Route handler for editing a policy
 * PATCH /api/policies/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireInternalRole } from '../../../middleware/auth.js'
import { editPolicySchema, type EditPolicyInput } from './editPolicy.schema.js'
import { editPolicy } from './editPolicy.service.js'
import type { UpdatePolicyResponse } from './editPolicy.dto.js'

const router = Router()

router.patch('/:id', validate(editPolicySchema), requireInternalRole, async (req, res) => {
  const { id } = (req.validated as { params: { id: string } }).params
  const input = (req.validated as { body: EditPolicyInput }).body
  const policy = await editPolicy(id, input, req.user!)
  const response: UpdatePolicyResponse = { policy }
  res.json(response)
})

export { router as editPolicyRouter }
