import { Link } from '@tanstack/react-router'
import { Building2, Calendar, ChevronRight, Shield } from 'lucide-react'
import { StatusBadge, type BadgeVariant } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { PolicyStatusLabel, PolicyTypeLabel } from '@claims/shared'
import type { PolicyStatus, PolicyListItemDto } from '@claims/shared'

/* -----------------------------------------------------------------------------
 * PolicyCard - "Ticket" Design
 * -------------------------------------------------------------------------- */

interface PolicyCardProps {
  policy: PolicyListItemDto
}

// Status color map for left border stripe
const statusBorderColorMap: Record<PolicyStatus, string> = {
  ACTIVE: 'border-l-green-500',
  PENDING: 'border-l-amber-500',
  EXPIRED: 'border-l-slate-400',
  CANCELLED: 'border-l-slate-300',
}

// Helper function to get variant for policy status badge
function getPolicyStatusVariant(status: PolicyStatus): BadgeVariant {
  const map: Record<PolicyStatus, BadgeVariant> = {
    ACTIVE: 'success',
    PENDING: 'warning',
    EXPIRED: 'secondary',
    CANCELLED: 'default',
  }
  return map[status]
}

export function PolicyCard({ policy }: PolicyCardProps) {
  const borderColor = statusBorderColorMap[policy.status]

  return (
    <div
      className={`group relative bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden border-l-4 ${borderColor}`}
    >
      {/* 1. Header Row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="font-mono text-xs font-semibold text-slate-500">
          #{policy.policyNumber}
        </span>
        <StatusBadge
          label={PolicyStatusLabel[policy.status]}
          variant={getPolicyStatusVariant(policy.status)}
        />
      </div>

      {/* 2. Body - Grid Layout */}
      <div className="p-4 grid grid-cols-[1fr_auto] gap-4 items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={14} className="text-slate-400" />
            <h3 className="font-medium text-slate-900">{policy.clientName}</h3>
          </div>
          <p className="text-sm text-slate-500 pl-6">
            <Shield size={12} className="inline mr-1" />
            {policy.insurerName}
          </p>
        </div>
        {/* Type - Right aligned */}
        <div className="text-right">
          {policy.type ? (
            <StatusBadge
              label={PolicyTypeLabel[policy.type]}
              variant="info"
            />
          ) : (
            <span className="text-xs text-slate-400">Sin tipo</span>
          )}
        </div>
      </div>

      {/* 3. Footer */}
      <div className="bg-slate-50 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {formatDate(policy.startDate)} - {formatDate(policy.endDate)}
          </span>
        </div>
        <ChevronRight
          size={16}
          className="text-slate-400 group-hover:text-teal-600 transition-colors"
        />
      </div>

      {/* Full card clickable overlay - links to detail page */}
      <Link
        to="/policies/$policyId"
        params={{ policyId: policy.id }}
        className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 rounded-lg"
        aria-label={`Ver detalles de ${policy.policyNumber}`}
      />
    </div>
  )
}

PolicyCard.displayName = 'PolicyCard'
