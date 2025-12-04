export interface KanbanQueryParams {
  // Search
  search?: string

  // ID filters
  clientId?: string
  affiliateId?: string
  patientId?: string
  policyId?: string
  createdById?: string

  // Enum filters (no status - kanban shows all)
  careType?: string

  // Date filters
  incidentDateFrom?: string
  incidentDateTo?: string
  submittedDateFrom?: string
  submittedDateTo?: string
  settlementDateFrom?: string
  settlementDateTo?: string
  createdAtFrom?: string
  createdAtTo?: string

  // Items per column (default: 10, max: 50)
  limitPerColumn?: number
}
