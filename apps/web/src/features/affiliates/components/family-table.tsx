import { Fragment } from 'react'
import type { AffiliateFamilyDto, PaginationMeta } from '@claims/shared'
import { StatusBadge, DataTableRowActions, createViewAction } from '@/components/ui'

const RELATIONSHIP_LABELS: Record<string, string> = {
  SPOUSE: 'Cónyuge',
  CHILD: 'Hijo/a',
  PARENT: 'Padre/Madre',
  DOMESTIC_PARTNER: 'Pareja',
  SIBLING: 'Hermano/a',
  OTHER: 'Otro',
}

function getRelationshipLabel(relationship: string | null): string {
  if (!relationship) return '-'
  return RELATIONSHIP_LABELS[relationship] ?? relationship
}

interface FamilyTableProps {
  families: AffiliateFamilyDto[]
  meta?: PaginationMeta
  isLoading: boolean
  onViewAffiliate: (id: string) => void
  pagination?: React.ReactNode
}

export function FamilyTable({
  families,
  isLoading,
  onViewAffiliate,
  pagination,
}: FamilyTableProps) {
  const columnCount = 6

  return (
    <div className="flex flex-col w-full rounded-lg border border-slate-200 overflow-hidden bg-white flex-1 min-h-0">
      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto min-h-0">
        <table
          className="w-full text-sm"
          style={{ minWidth: '900px' }}
          role="grid"
          aria-busy={isLoading}
        >
          <thead className="bg-slate-800 sticky top-0 z-10">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100 whitespace-nowrap"
                style={{ width: 250 }}
              >
                Nombre
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100 whitespace-nowrap"
                style={{ width: 180 }}
              >
                Documento
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100 whitespace-nowrap"
                style={{ width: 200 }}
              >
                Email
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100 whitespace-nowrap"
                style={{ width: 140 }}
              >
                Tipo/Relación
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100 whitespace-nowrap"
                style={{ width: 100 }}
              >
                Estado
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100 whitespace-nowrap"
                style={{ width: 60 }}
              >
                {/* Actions */}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <SkeletonRows columns={columnCount} />
            ) : families.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="py-12 text-center text-slate-500">
                  No se encontraron familias
                </td>
              </tr>
            ) : (
              families.map((family) => (
                <Fragment key={family.id}>
                  {/* Owner row */}
                  <tr className="transition-colors hover:bg-teal-50/50">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewAffiliate(family.id)}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                      >
                        {family.firstName} {family.lastName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {family.documentNumber ? (
                        <span className="font-mono text-sm">
                          {family.documentType ? `${family.documentType} ` : ''}
                          {family.documentNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {family.email ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge label="Titular" variant="info" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge
                        label={family.isActive ? 'Activo' : 'Inactivo'}
                        variant={family.isActive ? 'success' : 'default'}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <DataTableRowActions
                        label={`Acciones para ${family.firstName} ${family.lastName}`}
                        actions={[createViewAction(() => onViewAffiliate(family.id))]}
                      />
                    </td>
                  </tr>
                  {/* Dependent rows */}
                  {family.dependents.map((dep) => (
                    <tr
                      key={dep.id}
                      className="transition-colors hover:bg-slate-100/50 bg-slate-50/30"
                    >
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap pl-8">
                        <span className="text-slate-300 mr-2">└</span>
                        <button
                          type="button"
                          onClick={() => onViewAffiliate(dep.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left text-sm"
                        >
                          {dep.firstName} {dep.lastName}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                        {dep.documentNumber ? (
                          <span className="font-mono text-xs">{dep.documentNumber}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                        —
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <StatusBadge
                          label={getRelationshipLabel(dep.relationship)}
                          variant="warning"
                        />
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <StatusBadge
                          label={dep.isActive ? 'Activo' : 'Inactivo'}
                          variant={dep.isActive ? 'success' : 'default'}
                        />
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <DataTableRowActions
                          label={`Acciones para ${dep.firstName} ${dep.lastName}`}
                          actions={[createViewAction(() => onViewAffiliate(dep.id))]}
                        />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - fixed at bottom */}
      {pagination && <div className="flex-shrink-0">{pagination}</div>}
    </div>
  )
}

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 rounded bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
