/**
 * UI Labels for enums - Spanish
 * Single source of truth for display labels across API and web
 */

import type {
  ClaimStatus,
  CareType,
  PolicyStatus,
  PolicyType,
  TicketStatus,
  TicketPriority,
  ClaimFileCategory,
  InvoiceFileCategory,
  PolicyFileCategory,
  InsurerFileCategory,
  ClientFileCategory,
  CoverageType,
} from './index.js'

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

export const PolicyTypeLabel: Record<PolicyType, string> = {
  HEALTH: 'Salud',
  LIFE: 'Vida',
  DENTAL: 'Dental',
  VISION: 'Visión',
  DISABILITY: 'Discapacidad',
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

// =============================================================================
// FILE CATEGORIES
// =============================================================================

export const ClaimFileCategoryLabel: Record<ClaimFileCategory, string> = {
  RECEIPT: 'Recibo',
  PRESCRIPTION: 'Receta',
  LAB_REPORT: 'Reporte de laboratorio',
  DISCHARGE_SUMMARY: 'Resumen de alta',
  AUTHORIZATION: 'Autorización',
  OTHER: 'Otro',
}

export const InvoiceFileCategoryLabel: Record<InvoiceFileCategory, string> = {
  INVOICE_PDF: 'Factura PDF',
  BREAKDOWN: 'Desglose',
  RECEIPT: 'Recibo',
  SUPPORTING_DOC: 'Documento de apoyo',
  OTHER: 'Otro',
}

export const PolicyFileCategoryLabel: Record<PolicyFileCategory, string> = {
  CONTRACT: 'Contrato',
  AMENDMENT: 'Enmienda',
  CERTIFICATE: 'Certificado',
  TERMS_CONDITIONS: 'Términos y condiciones',
  OTHER: 'Otro',
}

export const InsurerFileCategoryLabel: Record<InsurerFileCategory, string> = {
  CONTRACT: 'Contrato',
  RATE_SHEET: 'Tabla de tarifas',
  LOGO: 'Logo',
  OTHER: 'Otro',
}

export const ClientFileCategoryLabel: Record<ClientFileCategory, string> = {
  CONTRACT: 'Contrato',
  TAX_DOCUMENT: 'Documento fiscal',
  LOGO: 'Logo',
  OTHER: 'Otro',
}

export const CoverageTypeLabel: Record<CoverageType, string> = {
  T: 'Titular',
  TPLUS1: 'Titular + 1',
  TPLUSF: 'Titular + Familia',
}

