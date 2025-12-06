/**
 * Domain enums - Single source of truth
 * These are used by both API and web apps
 */

// =============================================================================
// CLAIMS
// =============================================================================

export const ClaimStatus = {
  DRAFT: 'DRAFT',
  PENDING_INFO: 'PENDING_INFO',
  VALIDATION: 'VALIDATION',
  SUBMITTED: 'SUBMITTED',
  RETURNED: 'RETURNED',
  SETTLED: 'SETTLED',
  CANCELLED: 'CANCELLED',
} as const
export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus]

export const CareType = {
  AMBULATORY: 'AMBULATORY',
  HOSPITALIZATION: 'HOSPITALIZATION',
  MATERNITY: 'MATERNITY',
  EMERGENCY: 'EMERGENCY',
  OTHER: 'OTHER',
} as const
export type CareType = (typeof CareType)[keyof typeof CareType]

// =============================================================================
// AFFILIATES
// =============================================================================

export const AffiliateType = {
  OWNER: 'OWNER',
  DEPENDENT: 'DEPENDENT',
} as const
export type AffiliateType = (typeof AffiliateType)[keyof typeof AffiliateType]

export const CoverageType = {
  T: 'T',
  TPLUS1: 'TPLUS1',
  TPLUSF: 'TPLUSF',
} as const
export type CoverageType = (typeof CoverageType)[keyof typeof CoverageType]

// =============================================================================
// POLICIES
// =============================================================================

export const PolicyStatus = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const
export type PolicyStatus = (typeof PolicyStatus)[keyof typeof PolicyStatus]

export const PolicyType = {
  HEALTH: 'HEALTH',
  LIFE: 'LIFE',
  DENTAL: 'DENTAL',
  VISION: 'VISION',
  DISABILITY: 'DISABILITY',
} as const
export type PolicyType = (typeof PolicyType)[keyof typeof PolicyType]

// =============================================================================
// INVOICES
// =============================================================================

export const InvoiceStatus = {
  PENDING: 'PENDING',
  VALIDATED: 'VALIDATED',
  DISCREPANCY: 'DISCREPANCY',
  CANCELLED: 'CANCELLED',
} as const
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus]

export const PaymentStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

// =============================================================================
// TICKETS
// =============================================================================

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_ON_CLIENT: 'WAITING_ON_CLIENT',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]

export const TicketPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority]

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export const NotificationType = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

// =============================================================================
// INVITATIONS
// =============================================================================

export const InvitationType = {
  EMPLOYEE: 'EMPLOYEE',
  AGENT: 'AGENT',
  AFFILIATE: 'AFFILIATE',
} as const
export type InvitationType = (typeof InvitationType)[keyof typeof InvitationType]

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
} as const
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus]

// =============================================================================
// FILES
// =============================================================================

export const FileEntityType = {
  CLAIM: 'CLAIM',
  INVOICE: 'INVOICE',
  TICKET: 'TICKET',
  POLICY: 'POLICY',
  INSURER: 'INSURER',
  CLIENT: 'CLIENT',
  DOCUMENT: 'DOCUMENT',
} as const
export type FileEntityType = (typeof FileEntityType)[keyof typeof FileEntityType]

export const ClaimFileCategory = {
  RECEIPT: 'RECEIPT',
  PRESCRIPTION: 'PRESCRIPTION',
  LAB_REPORT: 'LAB_REPORT',
  DISCHARGE_SUMMARY: 'DISCHARGE_SUMMARY',
  AUTHORIZATION: 'AUTHORIZATION',
  OTHER: 'OTHER',
} as const
export type ClaimFileCategory = (typeof ClaimFileCategory)[keyof typeof ClaimFileCategory]

export const InvoiceFileCategory = {
  INVOICE_PDF: 'INVOICE_PDF',
  BREAKDOWN: 'BREAKDOWN',
  RECEIPT: 'RECEIPT',
  SUPPORTING_DOC: 'SUPPORTING_DOC',
  OTHER: 'OTHER',
} as const
export type InvoiceFileCategory = (typeof InvoiceFileCategory)[keyof typeof InvoiceFileCategory]

export const PolicyFileCategory = {
  CONTRACT: 'CONTRACT',
  AMENDMENT: 'AMENDMENT',
  CERTIFICATE: 'CERTIFICATE',
  TERMS_CONDITIONS: 'TERMS_CONDITIONS',
  OTHER: 'OTHER',
} as const
export type PolicyFileCategory = (typeof PolicyFileCategory)[keyof typeof PolicyFileCategory]

export const InsurerFileCategory = {
  CONTRACT: 'CONTRACT',
  RATE_SHEET: 'RATE_SHEET',
  LOGO: 'LOGO',
  OTHER: 'OTHER',
} as const
export type InsurerFileCategory = (typeof InsurerFileCategory)[keyof typeof InsurerFileCategory]

export const ClientFileCategory = {
  CONTRACT: 'CONTRACT',
  TAX_DOCUMENT: 'TAX_DOCUMENT',
  LOGO: 'LOGO',
  OTHER: 'OTHER',
} as const
export type ClientFileCategory = (typeof ClientFileCategory)[keyof typeof ClientFileCategory]


// =============================================================================
// LABELS (Spanish UI strings)
// =============================================================================

export * from './labels.js'
