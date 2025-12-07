import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { StatusBadge, type BadgeVariant } from '@/components/ui'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * Status Badge Variant Mapping
 * -------------------------------------------------------------------------- */

function getInsurerStatusVariant(isActive: boolean): BadgeVariant {
  return isActive ? 'success' : 'default'
}

function getInsurerStatusLabel(isActive: boolean): string {
  return isActive ? 'Activo' : 'Inactivo'
}

/* -----------------------------------------------------------------------------
 * InsurerDetailHeader Component
 * -------------------------------------------------------------------------- */

interface InsurerDetailHeaderProps {
  name: string
  code: string | null
  isActive: boolean
  className?: string
  children?: React.ReactNode
}

export function InsurerDetailHeader({
  name,
  code,
  isActive,
  className,
  children,
}: InsurerDetailHeaderProps) {
  return (
    <div className={cn('bg-white border-b border-slate-200', className)}>
      {/* Inner content constrained to match main content width */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6">
        {/* Back Navigation */}
        <nav aria-label="Breadcrumb" className="mb-2 md:mb-3">
          <Link
            to="/insurers"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Volver a Aseguradoras</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </nav>

        {/* Title Row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 pb-3 md:pb-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900">
              {name}
            </h1>
            {/* Badges below title on mobile, inline on desktop */}
            <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-1">
              {code && (
                <StatusBadge
                  label={code}
                  variant="default"
                />
              )}
              <StatusBadge
                label={getInsurerStatusLabel(isActive)}
                variant={getInsurerStatusVariant(isActive)}
              />
            </div>
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
