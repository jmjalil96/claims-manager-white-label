import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { ClaimInvoicesTab } from './claim-invoices-tab'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/server'
import { http, HttpResponse } from 'msw'

describe('ClaimInvoicesTab', () => {
  const claimId = 'cltest00000000000000001'

  describe('rendering', () => {
    it('shows loading state initially', () => {
      renderWithProviders(<ClaimInvoicesTab claimId={claimId} />)

      // Should show the loading card
      expect(screen.getByText('Facturas')).toBeInTheDocument()
    })

    it('shows empty state when no invoices', async () => {
      renderWithProviders(<ClaimInvoicesTab claimId={claimId} />)

      await waitFor(() => {
        expect(screen.getByText('No hay facturas registradas')).toBeInTheDocument()
      })
    })

    it('shows add button in empty state', async () => {
      renderWithProviders(<ClaimInvoicesTab claimId={claimId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Agregar primera factura/i })).toBeInTheDocument()
      })
    })
  })

  describe('with invoices', () => {
    beforeEach(() => {
      server.use(
        http.get('*/api/claims/:id/invoices', () => {
          return HttpResponse.json({
            invoices: [
              {
                id: 'clinv001',
                claimId,
                invoiceNumber: 'INV-001',
                providerName: 'Hospital General',
                amountSubmitted: 500,
                createdAt: '2024-01-15T10:00:00Z',
              },
              {
                id: 'clinv002',
                claimId,
                invoiceNumber: 'INV-002',
                providerName: 'Farmacia Central',
                amountSubmitted: 250,
                createdAt: '2024-01-16T10:00:00Z',
              },
            ],
          })
        })
      )
    })

    it('displays invoice table with data', async () => {
      renderWithProviders(<ClaimInvoicesTab claimId={claimId} />)

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument()
        expect(screen.getByText('Hospital General')).toBeInTheDocument()
        expect(screen.getByText('INV-002')).toBeInTheDocument()
        expect(screen.getByText('Farmacia Central')).toBeInTheDocument()
      })
    })

    it('displays total amount summary', async () => {
      renderWithProviders(<ClaimInvoicesTab claimId={claimId} />)

      await waitFor(() => {
        // Total should be 500 + 250 = 750
        expect(screen.getByText('$750.00')).toBeInTheDocument()
      })
    })

    it('displays invoice count', async () => {
      renderWithProviders(<ClaimInvoicesTab claimId={claimId} />)

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('shows Nueva factura button', async () => {
      renderWithProviders(<ClaimInvoicesTab claimId={claimId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nueva factura/i })).toBeInTheDocument()
      })
    })
  })

  describe('consistency check', () => {
    beforeEach(() => {
      server.use(
        http.get('*/api/claims/:id/invoices', () => {
          return HttpResponse.json({
            invoices: [
              {
                id: 'clinv001',
                claimId,
                invoiceNumber: 'INV-001',
                providerName: 'Hospital General',
                amountSubmitted: 1000,
                createdAt: '2024-01-15T10:00:00Z',
              },
            ],
          })
        })
      )
    })

    it('shows match indicator when amounts are equal', async () => {
      renderWithProviders(
        <ClaimInvoicesTab claimId={claimId} claimAmountSubmitted={1000} />
      )

      await waitFor(() => {
        expect(screen.getByText('Coincide')).toBeInTheDocument()
      })
    })

    it('shows mismatch indicator when difference exceeds 5%', async () => {
      renderWithProviders(
        <ClaimInvoicesTab claimId={claimId} claimAmountSubmitted={2000} />
      )

      await waitFor(() => {
        expect(screen.getByText('No coincide')).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('shows error message on API failure', async () => {
      server.use(
        http.get('*/api/claims/:id/invoices', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      renderWithProviders(<ClaimInvoicesTab claimId={claimId} />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})
