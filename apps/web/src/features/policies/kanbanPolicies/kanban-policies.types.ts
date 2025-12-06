export interface KanbanPoliciesQueryParams {
  // Search
  search?: string

  // ID filters
  clientId?: string
  insurerId?: string

  // Enum filters (no status - kanban shows all)
  type?: string

  // Boolean filter
  isActive?: boolean

  // Date filters
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
  createdAtFrom?: string
  createdAtTo?: string

  // Items per column (default: 10, max: 50)
  limitPerColumn?: number

  // Single-column expansion
  expandStatus?: string
  expandLimit?: number
}
