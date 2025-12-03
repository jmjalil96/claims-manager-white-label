/**
 * Route handler for editing an invoice
 * PATCH /api/claims/:claimId/invoices/:invoiceId
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireInternalRole } from '../../../../middleware/auth.js'
import {
  editInvoiceSchema,
  type EditInvoiceParams,
  type EditInvoiceInput,
} from './editInvoice.schema.js'
import { editInvoice } from './editInvoice.service.js'
import type { EditInvoiceResponse } from './editInvoice.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route PATCH /api/claims/:claimId/invoices/:invoiceId
 * @description Edit an existing invoice
 * @access Internal roles only
 */
router.patch('/:invoiceId', validate(editInvoiceSchema), requireInternalRole, async (req, res) => {
  const { claimId, invoiceId } = (req.validated as { params: EditInvoiceParams }).params
  const input = (req.validated as { body: EditInvoiceInput }).body
  const user = req.user!

  const invoice = await editInvoice(claimId, invoiceId, input, user)

  const response: EditInvoiceResponse = { invoice }
  res.status(200).json(response)
})

export { router as editInvoiceRouter }
