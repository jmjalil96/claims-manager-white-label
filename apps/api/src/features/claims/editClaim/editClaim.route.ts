/**
 * Route handler for editing claims
 * PATCH /api/claims/:id
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireInternalRole } from '../../../middleware/auth.js'
import { editClaimSchema, type EditClaimInput, type EditClaimParams } from './editClaim.schema.js'
import { editClaim } from './editClaim.service.js'
import type { UpdateClaimResponse } from './editClaim.dto.js'

const router = Router()

/**
 * @route PATCH /api/claims/:id
 * @description Edit an existing claim (field updates and/or status transitions)
 * @access Internal roles only (superadmin, claims_admin, claims_employee, operations_employee)
 */
router.patch('/:id', validate(editClaimSchema), requireInternalRole, async (req, res) => {
  const { id } = (req.validated as { params: EditClaimParams }).params
  const input = (req.validated as { body: EditClaimInput }).body
  const user = req.user!

  const claim = await editClaim(id, input, user)

  const response: UpdateClaimResponse = { claim }
  res.status(200).json(response)
})

export { router as editClaimRouter }
