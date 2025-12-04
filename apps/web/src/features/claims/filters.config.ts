/**
 * Claims Filter Configuration
 *
 * Defines all filters available for the claims list view.
 * Uses the config-driven advanced filters system.
 */

import { ClaimStatus, ClaimStatusLabel, CareType, CareTypeLabel } from '@claims/shared'
import type { FilterPanelConfig } from '@/components/ui/filters'

/**
 * Claims filter panel configuration
 */
export const claimsFilterConfig: FilterPanelConfig = {
  filters: [
    // ==========================================================================
    // Quick Filters (shown in filter bar)
    // ==========================================================================
    {
      type: 'search',
      key: 'search',
      label: 'Buscar',
      placement: 'quick',
      placeholder: 'Buscar por N° reclamo, paciente, afiliado...',
    },
    {
      type: 'multiSelect',
      key: 'status',
      label: 'Estado',
      placement: 'quick',
      options: Object.values(ClaimStatus).map((value) => ({
        value,
        label: ClaimStatusLabel[value],
      })),
    },
    {
      type: 'dateRange',
      key: 'submittedDate',
      label: 'Fecha Presentado',
      placement: 'quick',
      fromKey: 'submittedDateFrom',
      toKey: 'submittedDateTo',
    },

    // ==========================================================================
    // Advanced Filters (shown in drawer)
    // ==========================================================================
    {
      type: 'multiSelect',
      key: 'careType',
      label: 'Tipo de Atención',
      placement: 'advanced',
      options: Object.values(CareType).map((value) => ({
        value,
        label: CareTypeLabel[value],
      })),
    },
    {
      type: 'dateRange',
      key: 'incidentDate',
      label: 'Fecha del Incidente',
      placement: 'advanced',
      fromKey: 'incidentDateFrom',
      toKey: 'incidentDateTo',
    },
    {
      type: 'dateRange',
      key: 'settlementDate',
      label: 'Fecha de Liquidación',
      placement: 'advanced',
      fromKey: 'settlementDateFrom',
      toKey: 'settlementDateTo',
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
      title: 'Tipo de Atención',
      keys: ['careType'],
    },
    {
      title: 'Fechas',
      description: 'Filtrar por rangos de fechas',
      keys: ['incidentDate', 'settlementDate', 'createdAt'],
    },
  ],
}
