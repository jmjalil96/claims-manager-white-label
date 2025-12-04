import { Link } from '@tanstack/react-router'
import { User, Calendar, DollarSign, ChevronRight } from 'lucide-react'
import { StatusBadge, type BadgeVariant } from '@/components/ui'
import { ClaimStatusLabel } from '@claims/shared'
import type { ClaimStatus, ClaimListItemDto } from '@claims/shared'

/* -----------------------------------------------------------------------------
 * ClaimCard - "Ticket" Design
 * -------------------------------------------------------------------------- */

interface ClaimCardProps {
  claim: ClaimListItemDto
}

// Status color map for left border stripe
const statusBorderColorMap: Record<ClaimStatus, string> = {
  SETTLED: 'border-l-green-500',
  RETURNED: 'border-l-red-500',
  PENDING_INFO: 'border-l-amber-500',
  VALIDATION: 'border-l-blue-500',
  SUBMITTED: 'border-l-slate-400',
  DRAFT: 'border-l-slate-300',
  CANCELLED: 'border-l-slate-300',
}

// Helper function to get variant for claim status badge
function getClaimStatusVariant(status: ClaimStatus): BadgeVariant {
  const map: Record<ClaimStatus, BadgeVariant> = {
    DRAFT: 'default',
    PENDING_INFO: 'warning',
    VALIDATION: 'info',
    SUBMITTED: 'secondary',
    RETURNED: 'error',
    SETTLED: 'success',
    CANCELLED: 'default',
  }
  return map[status]
}

// Format date
function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString()
}

export function ClaimCard({ claim }: ClaimCardProps) {
  const borderColor = statusBorderColorMap[claim.status]

  return (
    <div
      className={`group relative bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden border-l-4 ${borderColor}`}
    >
      {/* 1. Header Row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="font-mono text-xs font-semibold text-slate-500">
          #{claim.claimNumber}
        </span>
        <StatusBadge
          label={ClaimStatusLabel[claim.status]}
          variant={getClaimStatusVariant(claim.status)}
        />
      </div>

      {/* 2. Body - Grid Layout */}
      <div className="p-4 grid grid-cols-[1fr_auto] gap-4 items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User size={14} className="text-slate-400" />
            <h3 className="font-medium text-slate-900">{claim.patientName}</h3>
          </div>
          <p className="text-sm text-slate-500 pl-6">
            {claim.affiliateName}
            {claim.clientName && (
              <span className="text-slate-400"> • {claim.clientName}</span>
            )}
          </p>
        </div>
        {/* Amount - Right aligned */}
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Aprobado
          </div>
          <div className="text-lg font-bold text-slate-700">
            {claim.amountApproved != null
              ? `$${claim.amountApproved.toLocaleString()}`
              : '—'}
          </div>
        </div>
      </div>

      {/* 3. Footer */}
      <div className="bg-slate-50 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {formatDate(claim.submittedDate)}
          </span>
          {claim.amountSubmitted != null && (
            <span className="flex items-center gap-1.5">
              <DollarSign size={12} />
              Pres: ${claim.amountSubmitted.toLocaleString()}
            </span>
          )}
        </div>
        <ChevronRight
          size={16}
          className="text-slate-400 group-hover:text-teal-600 transition-colors"
        />
      </div>

      {/* Full card clickable overlay */}
      <Link
        to="/claims/$claimId"
        params={{ claimId: claim.id }}
        className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 rounded-lg"
        aria-label={`Ver detalles de ${claim.claimNumber}`}
      />
    </div>
  )
}

ClaimCard.displayName = 'ClaimCard'
