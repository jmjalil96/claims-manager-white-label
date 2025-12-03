/**
 * Route handler for deleting an invoice
 * DELETE /api/claims/:claimId/invoices/:invoiceId
 */

import { Router } from 'express'
import { validate } from '../../../../lib/validate.js'
import { requireInternalRole } from '../../../../middleware/auth.js'
import { deleteInvoiceSchema, type DeleteInvoiceParams } from './deleteInvoice.schema.js'
import { deleteInvoice } from './deleteInvoice.service.js'
import type { DeleteInvoiceResponse } from './deleteInvoice.dto.js'

const router = Router({ mergeParams: true })

/**
 * @route DELETE /api/claims/:claimId/invoices/:invoiceId
 * @description Delete an invoice
 * @access Internal roles only
 */
router.delete(
  '/:invoiceId',
  validate(deleteInvoiceSchema),
  requireInternalRole,
  async (req, res) => {
    const { claimId, invoiceId } = (req.validated as { params: DeleteInvoiceParams }).params
    const user = req.user!

    const result = await deleteInvoice(claimId, invoiceId, user)

    const response: DeleteInvoiceResponse = { deleted: result }
    res.status(200).json(response)
  }
)

export { router as deleteInvoiceRouter }
