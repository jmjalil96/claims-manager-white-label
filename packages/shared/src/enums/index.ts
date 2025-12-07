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
// AFFILIATES & ENROLLMENTS
// =============================================================================

export const CoverageType = {
  T: 'T',
  TPLUS1: 'TPLUS1',
  TPLUSF: 'TPLUSF',
} as const
export type CoverageType = (typeof CoverageType)[keyof typeof CoverageType]

export const DependentRelationship = {
  SPOUSE: 'SPOUSE',
  CHILD: 'CHILD',
  PARENT: 'PARENT',
  DOMESTIC_PARTNER: 'DOMESTIC_PARTNER',
  SIBLING: 'SIBLING',
  OTHER: 'OTHER',
} as const
export type DependentRelationship = (typeof DependentRelationship)[keyof typeof DependentRelationship]

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const
export type Gender = (typeof Gender)[keyof typeof Gender]

export const MaritalStatus = {
  SINGLE: 'SINGLE',
  MARRIED: 'MARRIED',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
  DOMESTIC_PARTNER: 'DOMESTIC_PARTNER',
} as const
export type MaritalStatus = (typeof MaritalStatus)[keyof typeof MaritalStatus]

export const EnrollmentStartReason = {
  INITIAL_ENROLLMENT: 'INITIAL_ENROLLMENT',
  ADDED_AS_DEPENDENT: 'ADDED_AS_DEPENDENT',
  REHIRED: 'REHIRED',
  POLICY_RENEWAL: 'POLICY_RENEWAL',
  TRANSFER: 'TRANSFER',
  CHANGE_OF_COVERAGE: 'CHANGE_OF_COVERAGE',
  OTHER: 'OTHER',
} as const
export type EnrollmentStartReason = (typeof EnrollmentStartReason)[keyof typeof EnrollmentStartReason]

export const EnrollmentEndReason = {
  LEFT_COMPANY: 'LEFT_COMPANY',
  TERMINATED: 'TERMINATED',
  REMOVED_BY_OWNER: 'REMOVED_BY_OWNER',
  DEPENDENT_AGED_OUT: 'DEPENDENT_AGED_OUT',
  POLICY_CANCELLED: 'POLICY_CANCELLED',
  POLICY_EXPIRED: 'POLICY_EXPIRED',
  DEATH: 'DEATH',
  VOLUNTARY_WITHDRAWAL: 'VOLUNTARY_WITHDRAWAL',
  CHANGE_OF_COVERAGE: 'CHANGE_OF_COVERAGE',
  OTHER: 'OTHER',
} as const
export type EnrollmentEndReason = (typeof EnrollmentEndReason)[keyof typeof EnrollmentEndReason]

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
  AFFILIATE: 'AFFILIATE',
  ENROLLMENT: 'ENROLLMENT',
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

export const AffiliateFileCategory = {
  ID_DOCUMENT: 'ID_DOCUMENT',
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  PHOTO: 'PHOTO',
  OTHER: 'OTHER',
} as const
export type AffiliateFileCategory = (typeof AffiliateFileCategory)[keyof typeof AffiliateFileCategory]

export const EnrollmentFileCategory = {
  ENROLLMENT_FORM: 'ENROLLMENT_FORM',
  PROOF_OF_RELATIONSHIP: 'PROOF_OF_RELATIONSHIP',
  MARRIAGE_CERTIFICATE: 'MARRIAGE_CERTIFICATE',
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  ADOPTION_PAPERS: 'ADOPTION_PAPERS',
  OTHER: 'OTHER',
} as const
export type EnrollmentFileCategory = (typeof EnrollmentFileCategory)[keyof typeof EnrollmentFileCategory]

// =============================================================================
// LABELS (Spanish UI strings)
// =============================================================================

export * from './labels.js'
