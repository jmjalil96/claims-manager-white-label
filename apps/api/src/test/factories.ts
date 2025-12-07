/**
 * Simple test factories - create data for tests
 */

import { db } from '../lib/db.js'
import type {
  ClaimStatus,
  Prisma,
  AuditLog,
  ClaimInvoice,
  ClaimFileCategory,
  Gender,
  MaritalStatus,
  DependentRelationship,
} from '@prisma/client'

// Random suffix for unique values
const uid = () => Math.random().toString(36).slice(2, 10)

export async function createUser(role: string = 'client_affiliate') {
  return db.user.create({
    data: {
      email: `test-${uid()}@test.com`,
      name: `Test User`,
      role,
    },
  })
}

export async function createClient(isActive = true) {
  return db.client.create({
    data: {
      name: `Test Client ${uid()}`,
      taxId: `TAX-${uid()}`,
      isActive,
    },
  })
}

export async function createUserClient(userId: string, clientId: string, isActive = true) {
  return db.userClient.create({
    data: { userId, clientId, isActive },
  })
}

export async function createAffiliate(
  clientId: string,
  opts: {
    primaryAffiliateId?: string
    relationship?: DependentRelationship
    gender?: Gender
    maritalStatus?: MaritalStatus
    userId?: string
    isActive?: boolean
  } = {}
) {
  return db.affiliate.create({
    data: {
      firstName: `First-${uid()}`,
      lastName: `Last-${uid()}`,
      email: `aff-${uid()}@test.com`,
      documentNumber: `DOC-${uid()}`,
      primaryAffiliateId: opts.primaryAffiliateId ?? null,
      relationship: opts.relationship ?? null,
      gender: opts.gender ?? null,
      maritalStatus: opts.maritalStatus ?? null,
      clientId,
      userId: opts.userId ?? null,
      isActive: opts.isActive ?? true,
    },
  })
}

export async function createInsurer() {
  return db.insurer.create({
    data: {
      name: `Test Insurer ${uid()}`,
      code: `INS-${uid()}`,
    },
  })
}

export async function createPolicy(clientId: string, insurerId: string) {
  return db.policy.create({
    data: {
      policyNumber: `POL-${uid()}`,
      clientId,
      insurerId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    },
  })
}

/** Auth user shape expected by services */
export function authUser(user: {
  id: string
  email: string
  name: string | null
  role: string | null
}) {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export async function createClaim(
  clientId: string,
  affiliateId: string,
  opts: {
    patientId?: string
    status?: ClaimStatus
    createdById: string
    incidentDate?: Date
  }
) {
  const status = opts.status ?? 'DRAFT'

  // Build data based on status requirements (state machine invariants)
  const data: Prisma.ClaimUncheckedCreateInput = {
    claimNumber: 'PENDING',
    clientId,
    affiliateId,
    patientId: opts.patientId ?? affiliateId,
    status,
    description: `Test claim ${uid()}`,
    createdById: opts.createdById,
    incidentDate: opts.incidentDate ?? new Date('2024-01-15'),
  }

  // Add fields required for non-DRAFT statuses
  if (status !== 'DRAFT') {
    // Create insurer and policy for claims that need policyId
    const insurer = await createInsurer()
    const policy = await createPolicy(clientId, insurer.id)
    data.policyId = policy.id
    data.careType = 'AMBULATORY'
    data.diagnosisCode = 'A00'
    data.diagnosisDescription = 'Test diagnosis'
  }

  // Add fields required for SUBMITTED and beyond
  if (['SUBMITTED', 'PENDING_INFO', 'SETTLED'].includes(status)) {
    data.amountSubmitted = 1000
    data.submittedDate = new Date('2024-01-20')
  }

  // Add fields required for SETTLED
  if (status === 'SETTLED') {
    data.amountApproved = 800
    data.amountDenied = 100
    data.amountUnprocessed = 0
    data.deductibleApplied = 50
    data.copayApplied = 50
    data.settlementDate = new Date('2024-02-01')
    data.settlementNumber = `SET-${uid()}`
    data.settlementNotes = 'Test settlement'
  }

  // Add cancellation reason for CANCELLED
  if (status === 'CANCELLED') {
    data.cancellationReason = 'Test cancellation'
  }

  // Add pending reason for PENDING_INFO
  if (status === 'PENDING_INFO') {
    data.pendingReason = 'Test pending reason'
  }

  const claim = await db.claim.create({ data })

  // Generate claim number from sequence
  const claimNumber = `RECL_${String(claim.claimSequence).padStart(6, '0')}`
  return db.claim.update({
    where: { id: claim.id },
    data: { claimNumber },
  })
}

export async function createInvoice(
  claimId: string,
  createdById: string,
  opts: {
    invoiceNumber?: string
    providerName?: string
    amountSubmitted?: number
  } = {}
): Promise<ClaimInvoice> {
  return db.claimInvoice.create({
    data: {
      claimId,
      invoiceNumber: opts.invoiceNumber ?? `INV-${uid()}`,
      providerName: opts.providerName ?? `Provider ${uid()}`,
      amountSubmitted: opts.amountSubmitted ?? 500,
      createdById,
    },
  })
}

export async function createAuditLog(
  resourceType: string,
  resourceId: string,
  userId: string,
  opts: {
    action?: string
    clientId?: string
    changes?: Prisma.InputJsonValue
    metadata?: Prisma.InputJsonValue
    createdAt?: Date
  } = {}
): Promise<AuditLog> {
  return db.auditLog.create({
    data: {
      action: opts.action ?? 'UPDATE',
      resourceType,
      resourceId,
      userId,
      clientId: opts.clientId ?? null,
      changes: opts.changes,
      metadata: opts.metadata,
      createdAt: opts.createdAt,
    },
  })
}

/**
 * Create a file and attach it to a claim
 * Returns both the File and ClaimFile records
 */
export async function createClaimFile(
  claimId: string,
  clientId: string,
  uploadedById: string,
  opts: {
    originalName?: string
    mimeType?: string
    fileSize?: number
    category?: ClaimFileCategory
    description?: string
    deletedAt?: Date | null
  } = {}
) {
  const file = await db.file.create({
    data: {
      storageKey: `claims/${claimId}/${uid()}-${opts.originalName ?? 'test.pdf'}`,
      storageBucket: 'claims-manager',
      originalName: opts.originalName ?? `test-${uid()}.pdf`,
      mimeType: opts.mimeType ?? 'application/pdf',
      fileSize: BigInt(opts.fileSize ?? 1024),
      entityType: 'CLAIM',
      entityId: claimId,
      clientId,
      uploadedById,
      deletedAt: opts.deletedAt ?? null,
    },
  })

  const claimFile = await db.claimFile.create({
    data: {
      fileId: file.id,
      claimId,
      category: opts.category ?? null,
      description: opts.description ?? null,
    },
  })

  return { file, claimFile }
}
