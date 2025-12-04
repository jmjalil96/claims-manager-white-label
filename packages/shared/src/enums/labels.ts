/**
 * UI Labels for enums - Spanish
 * Single source of truth for display labels across API and web
 */

import type { ClaimStatus, CareType, PolicyStatus, TicketStatus, TicketPriority } from './index.js'

// =============================================================================
// CLAIMS
// =============================================================================

export const ClaimStatusLabel: Record<ClaimStatus, string> = {
  DRAFT: 'Borrador',
  PENDING_INFO: 'Pendiente de información',
  VALIDATION: 'Validación',
  SUBMITTED: 'Presentado',
  RETURNED: 'Devuelto',
  SETTLED: 'Liquidado',
  CANCELLED: 'Cancelado',
}

export const CareTypeLabel: Record<CareType, string> = {
  AMBULATORY: 'Ambulatorio',
  HOSPITALIZATION: 'Hospitalización',
  MATERNITY: 'Maternidad',
  EMERGENCY: 'Emergencia',
  OTHER: 'Otro',
}

// =============================================================================
// POLICIES
// =============================================================================

export const PolicyStatusLabel: Record<PolicyStatus, string> = {
  ACTIVE: 'Activa',
  PENDING: 'Pendiente',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
}

// =============================================================================
// TICKETS
// =============================================================================

export const TicketStatusLabel: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  WAITING_ON_CLIENT: 'Esperando cliente',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
}

export const TicketPriorityLabel: Record<TicketPriority, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}
