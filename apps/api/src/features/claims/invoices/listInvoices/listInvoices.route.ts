/**
 * Route handler for listing invoices
 * GET /api/claims/:claimId/invoices
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireInternalRole } from '../../../../middleware/auth.js'
import { listInvoicesSchema, type ListInvoicesParams } from './listInvoices.schema.js'
import { listInvoices } from './listInvoices.service.js'
import type { ListInvoicesResponse } from './listInvoices.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route GET /api/claims/:claimId/invoices
 * @description List all invoices for a claim
 * @access Internal roles only
 */
router.get('/', validate(listInvoicesSchema), requireInternalRole, async (req, res) => {
  const { claimId } = (req.validated as { params: ListInvoicesParams }).params

  const result = await listInvoices(claimId)

  const response: ListInvoicesResponse = result
  res.status(200).json(response)
})

export { router as listInvoicesRouter }
