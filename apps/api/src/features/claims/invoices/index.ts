/**
 * Invoices feature router
 * Aggregates all invoice-related routes under /api/claims/:claimId/invoices
 */

import { Router } from 'express'
import { listInvoicesRouter } from './listInvoices/listInvoices.route.js'
import { createInvoiceRouter } from './createInvoice/createInvoice.route.js'
import { createInvoicesBulkRouter } from './createInvoicesBulk/createInvoicesBulk.route.js'
import { editInvoiceRouter } from './editInvoice/editInvoice.route.js'
import { deleteInvoiceRouter } from './deleteInvoice/deleteInvoice.route.js'

const router = Router({ mergeParams: true })

// Mount invoice routes
router.use(listInvoicesRouter)
router.use(createInvoiceRouter)
router.use(createInvoicesBulkRouter)
router.use(editInvoiceRouter)
router.use(deleteInvoiceRouter)

export { router as invoicesRouter }
