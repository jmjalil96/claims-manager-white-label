/**
 * Route handler for creating an invoice
 * POST /api/claims/:claimId/invoices
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireInternalRole } from '../../../../middleware/auth.js'
import {
  createInvoiceSchema,
  type CreateInvoiceParams,
  type CreateInvoiceInput,
} from './createInvoice.schema.js'
import { createInvoice } from './createInvoice.service.js'
import type { CreateInvoiceResponse } from './createInvoice.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route POST /api/claims/:claimId/invoices
 * @description Create a new invoice for a claim
 * @access Internal roles only
 */
router.post('/', validate(createInvoiceSchema), requireInternalRole, async (req, res) => {
  const { claimId } = (req.validated as { params: CreateInvoiceParams }).params
  const input = (req.validated as { body: CreateInvoiceInput }).body
  const user = req.user!

  const invoice = await createInvoice(claimId, input, user)

  const response: CreateInvoiceResponse = { invoice }
  res.status(201).json(response)
})

export { router as createInvoiceRouter }
