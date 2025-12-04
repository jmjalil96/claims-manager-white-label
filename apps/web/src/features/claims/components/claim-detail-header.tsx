import { Link } from '@tanstack/react-router'
import { ChevronLeft, Pencil, MoreVertical } from 'lucide-react'
import { Button, StatusBadge, type BadgeVariant } from '@/components/ui'
import { ClaimStatusLabel, CareTypeLabel } from '@claims/shared'
import type { ClaimStatus, CareType } from '@claims/shared'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * Status Badge Variant Mapping
 * -------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
 * ClaimDetailHeader Component
 * -------------------------------------------------------------------------- */

interface ClaimDetailHeaderProps {
  claimNumber: string
  status: ClaimStatus
  careType: CareType | null
  onEdit?: () => void
  onMoreActions?: () => void
  className?: string
  children?: React.ReactNode
}

export function ClaimDetailHeader({
  claimNumber,
  status,
  careType,
  onEdit,
  onMoreActions,
  className,
  children,
}: ClaimDetailHeaderProps) {
  return (
    <div className={cn('bg-white border-b border-slate-200', className)}>
      {/* Inner content constrained to match main content width */}
      <div className="max-w-7xl mx-auto px-8 pt-6">
        {/* Back Navigation */}
        <nav aria-label="Breadcrumb" className="mb-3">
          <Link
            to="/claims"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>Volver a Reclamos</span>
          </Link>
        </nav>

        {/* Title Row */}
        <div className="flex items-start justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Reclamo #{claimNumber}
              </h1>
              {/* Badges inline with title */}
              <div className="flex items-center gap-2">
                {careType && (
                  <StatusBadge
                    label={CareTypeLabel[careType]}
                    variant="default"
                  />
                )}
                <StatusBadge
                  label={ClaimStatusLabel[status]}
                  variant={getClaimStatusVariant(status)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Pencil className="size-4" />}
                onClick={onEdit}
              >
                Editar
              </Button>
            )}
            {onMoreActions && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMoreActions}
                aria-label="Más acciones"
              >
                <MoreVertical className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Area - constrained to match main content width */}
      {children && (
        <div className="max-w-7xl mx-auto px-8">
          <div className="-mb-px">{children}</div>
        </div>
      )}
    </div>
  )
}
