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
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6">
        {/* Back Navigation */}
        <nav aria-label="Breadcrumb" className="mb-2 md:mb-3">
          <Link
            to="/claims"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Volver a Reclamos</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </nav>

        {/* Title Row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 pb-3 md:pb-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900">
              Reclamo #{claimNumber}
            </h1>
            {/* Badges below title on mobile, inline on desktop */}
            <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-1">
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

          {/* Actions - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
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
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="-mb-px">{children}</div>
        </div>
      )}
    </div>
  )
}
