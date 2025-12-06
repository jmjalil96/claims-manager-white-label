import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClaimStatus } from '@claims/shared'
import { ClaimWorkflowStepper } from './claim-workflow-stepper'

describe('ClaimWorkflowStepper', () => {
  describe('step rendering', () => {
    it('renders all primary steps', () => {
      render(<ClaimWorkflowStepper currentStatus={ClaimStatus.DRAFT} />)

      expect(screen.getByText('Borrador')).toBeInTheDocument()
      expect(screen.getByText('Validación')).toBeInTheDocument()
      expect(screen.getByText('Presentado')).toBeInTheDocument()
      expect(screen.getByText('Liquidado')).toBeInTheDocument()
    })

    it('shows PENDING_INFO label when in pending state', () => {
      render(<ClaimWorkflowStepper currentStatus={ClaimStatus.PENDING_INFO} />)

      expect(screen.getByText('Pend. Info')).toBeInTheDocument()
    })

    it('shows RETURNED label when in returned state', () => {
      render(<ClaimWorkflowStepper currentStatus={ClaimStatus.RETURNED} />)

      expect(screen.getByText('Devuelto')).toBeInTheDocument()
    })
  })

  describe('reason messages', () => {
    it('shows pending reason when provided', () => {
      render(
        <ClaimWorkflowStepper
          currentStatus={ClaimStatus.PENDING_INFO}
          pendingReason="Waiting for documents"
        />
      )

      expect(screen.getByText('Waiting for documents')).toBeInTheDocument()
    })

    it('shows return reason when provided', () => {
      render(
        <ClaimWorkflowStepper
          currentStatus={ClaimStatus.RETURNED}
          returnReason="Missing information"
        />
      )

      expect(screen.getByText('Missing information')).toBeInTheDocument()
    })

    it('shows cancellation reason when provided', () => {
      render(
        <ClaimWorkflowStepper
          currentStatus={ClaimStatus.CANCELLED}
          cancellationReason="Duplicate claim"
        />
      )

      expect(screen.getByText('Duplicate claim')).toBeInTheDocument()
    })

    it('shows success message when settled', () => {
      render(<ClaimWorkflowStepper currentStatus={ClaimStatus.SETTLED} />)

      expect(screen.getByText('Proceso finalizado correctamente')).toBeInTheDocument()
    })
  })

  describe('action buttons', () => {
    it('does not render action buttons when onTransition is not provided', () => {
      render(<ClaimWorkflowStepper currentStatus={ClaimStatus.DRAFT} />)

      expect(screen.queryByRole('button', { name: /Enviar a Validación/i })).not.toBeInTheDocument()
    })

    it('renders action button for DRAFT status when onTransition provided', () => {
      const onTransition = vi.fn()
      render(
        <ClaimWorkflowStepper
          currentStatus={ClaimStatus.DRAFT}
          onTransition={onTransition}
        />
      )

      expect(screen.getByRole('button', { name: /Enviar a Validación/i })).toBeInTheDocument()
    })

    it('renders multiple action buttons for VALIDATION status', () => {
      const onTransition = vi.fn()
      render(
        <ClaimWorkflowStepper
          currentStatus={ClaimStatus.VALIDATION}
          onTransition={onTransition}
        />
      )

      expect(screen.getByRole('button', { name: /Devolver/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Presentar/i })).toBeInTheDocument()
    })

    it('renders multiple action buttons for SUBMITTED status', () => {
      const onTransition = vi.fn()
      render(
        <ClaimWorkflowStepper
          currentStatus={ClaimStatus.SUBMITTED}
          onTransition={onTransition}
        />
      )

      expect(screen.getByRole('button', { name: /Solicitar Info/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Devolver/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Liquidar/i })).toBeInTheDocument()
    })

    it('renders no action buttons for terminal SETTLED status', () => {
      const onTransition = vi.fn()
      render(
        <ClaimWorkflowStepper
          currentStatus={ClaimStatus.SETTLED}
          onTransition={onTransition}
        />
      )

      // Only the success message, no action buttons
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('calls onTransition with correct status when button clicked', async () => {
      const user = userEvent.setup()
      const onTransition = vi.fn()

      render(
        <ClaimWorkflowStepper
          currentStatus={ClaimStatus.DRAFT}
          onTransition={onTransition}
        />
      )

      await user.click(screen.getByRole('button', { name: /Enviar a Validación/i }))

      expect(onTransition).toHaveBeenCalledWith(ClaimStatus.VALIDATION)
    })
  })
})
