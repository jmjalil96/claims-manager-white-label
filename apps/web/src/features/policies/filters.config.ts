/**
 * Policies Filter Configuration
 *
 * Defines all filters available for the policies list view.
 * Uses the config-driven advanced filters system.
 */

import { PolicyStatus, PolicyStatusLabel, PolicyType, PolicyTypeLabel } from '@claims/shared'
import type { FilterPanelConfig } from '@/components/ui/filters'

/**
 * Policies filter panel configuration
 */
export const policiesFilterConfig: FilterPanelConfig = {
  filters: [
    // ==========================================================================
    // Quick Filters (shown in filter bar)
    // ==========================================================================
    {
      type: 'search',
      key: 'search',
      label: 'Buscar',
      placement: 'quick',
      placeholder: 'Buscar por N° póliza, cliente, aseguradora...',
    },
    {
      type: 'multiSelect',
      key: 'status',
      label: 'Estado',
      placement: 'quick',
      options: Object.values(PolicyStatus).map((value) => ({
        value,
        label: PolicyStatusLabel[value],
      })),
    },
    {
      type: 'dateRange',
      key: 'startDate',
      label: 'Fecha Inicio',
      placement: 'quick',
      fromKey: 'startDateFrom',
      toKey: 'startDateTo',
    },

    // ==========================================================================
    // Advanced Filters (shown in drawer)
    // ==========================================================================
    {
      type: 'multiSelect',
      key: 'type',
      label: 'Tipo de Póliza',
      placement: 'advanced',
      options: Object.values(PolicyType).map((value) => ({
        value,
        label: PolicyTypeLabel[value],
      })),
    },
    {
      type: 'dateRange',
      key: 'endDate',
      label: 'Fecha Vencimiento',
      placement: 'advanced',
      fromKey: 'endDateFrom',
      toKey: 'endDateTo',
    },
    {
      type: 'dateRange',
      key: 'createdAt',
      label: 'Fecha de Creación',
      placement: 'advanced',
      fromKey: 'createdAtFrom',
      toKey: 'createdAtTo',
    },
  ],

  // Section grouping for advanced filters drawer
  sections: [
    {
      title: 'Tipo de Póliza',
      keys: ['type'],
    },
    {
      title: 'Fechas',
      description: 'Filtrar por rangos de fechas',
      keys: ['endDate', 'createdAt'],
    },
  ],
}
