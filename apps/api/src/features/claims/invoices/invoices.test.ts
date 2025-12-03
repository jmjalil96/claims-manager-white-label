/**
 * Invoice CRUD tests
 * Focus: CRUD operations, validation, error handling
 */

import { describe, it, expect } from 'vitest'
import { listInvoices } from './listInvoices/listInvoices.service.js'
import { createInvoice } from './createInvoice/createInvoice.service.js'
import { createInvoicesBulk } from './createInvoicesBulk/createInvoicesBulk.service.js'
import { editInvoice } from './editInvoice/editInvoice.service.js'
import { deleteInvoice } from './deleteInvoice/deleteInvoice.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createClaim,
  createInvoice as createInvoiceFactory,
  authUser,
} from '../../../test/factories.js'

// =============================================================================
// LIST INVOICES
// =============================================================================

describe('List Invoices', () => {
  it('returns invoices for a claim', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })
    await createInvoiceFactory(claim.id, admin.id)
    await createInvoiceFactory(claim.id, admin.id)

    const result = await listInvoices(claim.id)

    expect(result.invoices).toHaveLength(2)
    expect(result.invoices[0]).toHaveProperty('id')
    expect(result.invoices[0]).toHaveProperty('invoiceNumber')
    expect(result.invoices[0]).toHaveProperty('providerName')
    expect(result.invoices[0]).toHaveProperty('amountSubmitted')
  })

  it('returns empty array when no invoices', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await listInvoices(claim.id)

    expect(result.invoices).toHaveLength(0)
  })

  it('returns 404 for non-existent claim', async () => {
    const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx'

    await expect(listInvoices(nonExistentId)).rejects.toThrow('Reclamo')
  })
})

// =============================================================================
// CREATE INVOICE
// =============================================================================

describe('Create Invoice', () => {
  it('creates invoice successfully', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await createInvoice(
      claim.id,
      { invoiceNumber: 'INV-001', providerName: 'Test Provider', amountSubmitted: 1500 },
      authUser(admin)
    )

    expect(result.invoiceNumber).toBe('INV-001')
    expect(result.providerName).toBe('Test Provider')
    expect(result.amountSubmitted).toBe(1500)
    expect(result.claimId).toBe(claim.id)
    expect(result.createdById).toBe(admin.id)
  })

  it('returns 404 for non-existent claim', async () => {
    const admin = await createUser('claims_admin')
    const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx'

    await expect(
      createInvoice(
        nonExistentId,
        { invoiceNumber: 'INV-001', providerName: 'Test', amountSubmitted: 100 },
        authUser(admin)
      )
    ).rejects.toThrow('Reclamo')
  })
})

// =============================================================================
// CREATE INVOICES BULK
// =============================================================================

describe('Create Invoices Bulk', () => {
  it('creates multiple invoices', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    const result = await createInvoicesBulk(
      claim.id,
      {
        invoices: [
          { invoiceNumber: 'INV-001', providerName: 'Provider A', amountSubmitted: 100 },
          { invoiceNumber: 'INV-002', providerName: 'Provider B', amountSubmitted: 200 },
          { invoiceNumber: 'INV-003', providerName: 'Provider C', amountSubmitted: 300 },
        ],
      },
      authUser(admin)
    )

    expect(result.invoices).toHaveLength(3)
    expect(result.created).toBe(3)
  })

  it('appends to existing invoices', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })

    // Create initial invoice
    await createInvoiceFactory(claim.id, admin.id)

    // Bulk add more
    await createInvoicesBulk(
      claim.id,
      {
        invoices: [
          { invoiceNumber: 'INV-NEW-1', providerName: 'New Provider', amountSubmitted: 500 },
        ],
      },
      authUser(admin)
    )

    // Verify total
    const list = await listInvoices(claim.id)
    expect(list.invoices).toHaveLength(2)
  })

  it('returns 404 for non-existent claim', async () => {
    const admin = await createUser('claims_admin')
    const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx'

    await expect(
      createInvoicesBulk(
        nonExistentId,
        {
          invoices: [{ invoiceNumber: 'INV-001', providerName: 'Test', amountSubmitted: 100 }],
        },
        authUser(admin)
      )
    ).rejects.toThrow('Reclamo')
  })
})

// =============================================================================
// EDIT INVOICE
// =============================================================================

describe('Edit Invoice', () => {
  it('updates invoice fields', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })
    const invoice = await createInvoiceFactory(claim.id, admin.id, {
      invoiceNumber: 'OLD-001',
      providerName: 'Old Provider',
      amountSubmitted: 100,
    })

    const result = await editInvoice(
      claim.id,
      invoice.id,
      { invoiceNumber: 'NEW-001', providerName: 'New Provider', amountSubmitted: 999 },
      authUser(admin)
    )

    expect(result.invoiceNumber).toBe('NEW-001')
    expect(result.providerName).toBe('New Provider')
    expect(result.amountSubmitted).toBe(999)
  })

  it('returns 404 for non-existent claim', async () => {
    const admin = await createUser('claims_admin')
    const nonExistentClaimId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx'

    await expect(
      editInvoice(
        nonExistentClaimId,
        'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        { invoiceNumber: 'NEW' },
        authUser(admin)
      )
    ).rejects.toThrow('Reclamo')
  })

  it('returns 404 for non-existent invoice', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })
    const nonExistentInvoiceId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx'

    await expect(
      editInvoice(claim.id, nonExistentInvoiceId, { invoiceNumber: 'NEW' }, authUser(admin))
    ).rejects.toThrow('Factura')
  })

  it('rejects invoice from different claim', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim1 = await createClaim(client.id, aff.id, { createdById: admin.id })
    const claim2 = await createClaim(client.id, aff.id, { createdById: admin.id })
    const invoice = await createInvoiceFactory(claim1.id, admin.id)

    await expect(
      editInvoice(claim2.id, invoice.id, { invoiceNumber: 'NEW' }, authUser(admin))
    ).rejects.toThrow('La factura no pertenece a este reclamo')
  })
})

// =============================================================================
// DELETE INVOICE
// =============================================================================

describe('Delete Invoice', () => {
  it('deletes invoice successfully', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })
    const invoice = await createInvoiceFactory(claim.id, admin.id)

    const result = await deleteInvoice(claim.id, invoice.id, authUser(admin))

    expect(result.id).toBe(invoice.id)

    // Verify deleted
    const list = await listInvoices(claim.id)
    expect(list.invoices).toHaveLength(0)
  })

  it('returns 404 for non-existent claim', async () => {
    const admin = await createUser('claims_admin')
    const nonExistentClaimId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx'

    await expect(
      deleteInvoice(nonExistentClaimId, 'clxxxxxxxxxxxxxxxxxxxxxxxxx', authUser(admin))
    ).rejects.toThrow('Reclamo')
  })

  it('returns 404 for non-existent invoice', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim = await createClaim(client.id, aff.id, { createdById: admin.id })
    const nonExistentInvoiceId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx'

    await expect(deleteInvoice(claim.id, nonExistentInvoiceId, authUser(admin))).rejects.toThrow(
      'Factura'
    )
  })

  it('rejects invoice from different claim', async () => {
    const admin = await createUser('claims_admin')
    const client = await createClient()
    const aff = await createAffiliate(client.id)
    const claim1 = await createClaim(client.id, aff.id, { createdById: admin.id })
    const claim2 = await createClaim(client.id, aff.id, { createdById: admin.id })
    const invoice = await createInvoiceFactory(claim1.id, admin.id)

    await expect(deleteInvoice(claim2.id, invoice.id, authUser(admin))).rejects.toThrow(
      'La factura no pertenece a este reclamo'
    )
  })
})
