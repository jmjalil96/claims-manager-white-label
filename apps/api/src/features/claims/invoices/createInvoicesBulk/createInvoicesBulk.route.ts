/**
 * Route handler for bulk creating invoices
 * POST /api/claims/:claimId/invoices/bulk
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireInternalRole } from '../../../../middleware/auth.js'
import {
  createInvoicesBulkSchema,
  type CreateInvoicesBulkParams,
  type CreateInvoicesBulkInput,
} from './createInvoicesBulk.schema.js'
import { createInvoicesBulk } from './createInvoicesBulk.service.js'
import type { CreateInvoicesBulkResponse } from './createInvoicesBulk.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route POST /api/claims/:claimId/invoices/bulk
 * @description Create multiple invoices for a claim (append)
 * @access Internal roles only
 */
router.post('/bulk', validate(createInvoicesBulkSchema), requireInternalRole, async (req, res) => {
  const { claimId } = (req.validated as { params: CreateInvoicesBulkParams }).params
  const input = (req.validated as { body: CreateInvoicesBulkInput }).body
  const user = req.user!

  const result = await createInvoicesBulk(claimId, input, user)

  const response: CreateInvoicesBulkResponse = result
  res.status(201).json(response)
})

export { router as createInvoicesBulkRouter }
