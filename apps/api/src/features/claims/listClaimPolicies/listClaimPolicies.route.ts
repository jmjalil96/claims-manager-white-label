/**
 * Route handler for listing claim policies
 * GET /api/claims/:claimId/policies
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireInternalRole } from '../../../middleware/auth.js'
import { listClaimPoliciesSchema, type ListClaimPoliciesParams } from './listClaimPolicies.schema.js'
import { listClaimPolicies } from './listClaimPolicies.service.js'
import type { ListClaimPoliciesResponse } from './listClaimPolicies.dto.js'

const router = Router()

/**
 * @route GET /api/claims/:claimId/policies
 * @description List all policies for a claim's client
 * @access Internal roles only (superadmin, claims_admin, claims_employee, operations_employee)
 */
router.get('/:claimId/policies', validate(listClaimPoliciesSchema), requireInternalRole, async (req, res) => {
  const { claimId } = (req.validated as { params: ListClaimPoliciesParams }).params

  const result = await listClaimPolicies(claimId)

  const response: ListClaimPoliciesResponse = result
  res.status(200).json(response)
})

export { router as listClaimPoliciesRouter }
