import { Link } from '@tanstack/react-router'
import { ChevronLeft, Pencil, MoreVertical } from 'lucide-react'
import { Button, StatusBadge, type BadgeVariant } from '@/components/ui'
import { PolicyStatusLabel, PolicyTypeLabel } from '@claims/shared'
import type { PolicyStatus, PolicyType } from '@claims/shared'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * Status Badge Variant Mapping
 * -------------------------------------------------------------------------- */

function getPolicyStatusVariant(status: PolicyStatus): BadgeVariant {
  const map: Record<PolicyStatus, BadgeVariant> = {
    PENDING: 'warning',
    ACTIVE: 'success',
    EXPIRED: 'error',
    CANCELLED: 'default',
  }
  return map[status]
}

/* -----------------------------------------------------------------------------
 * PolicyDetailHeader Component
 * -------------------------------------------------------------------------- */

interface PolicyDetailHeaderProps {
  policyNumber: string
  status: PolicyStatus
  type: PolicyType | null
  onEdit?: () => void
  onMoreActions?: () => void
  className?: string
  children?: React.ReactNode
}

export function PolicyDetailHeader({
  policyNumber,
  status,
  type,
  onEdit,
  onMoreActions,
  className,
  children,
}: PolicyDetailHeaderProps) {
  return (
    <div className={cn('bg-white border-b border-slate-200', className)}>
      {/* Inner content constrained to match main content width */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6">
        {/* Back Navigation */}
        <nav aria-label="Breadcrumb" className="mb-2 md:mb-3">
          <Link
            to="/policies"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Volver a Pólizas</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </nav>

        {/* Title Row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 pb-3 md:pb-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900">
              Póliza {policyNumber}
            </h1>
            {/* Badges below title on mobile, inline on desktop */}
            <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-1">
              {type && (
                <StatusBadge
                  label={PolicyTypeLabel[type]}
                  variant="default"
                />
              )}
              <StatusBadge
                label={PolicyStatusLabel[status]}
                variant={getPolicyStatusVariant(status)}
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
