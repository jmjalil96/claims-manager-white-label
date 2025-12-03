/**
 * Service layer for creating claims
 * Contains business logic, validation, and authorization
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit } from '../../../lib/audit.js'
import { isInternalRole } from '../../../lib/constants.js'
import { fileExists, validateTempKeyOwnership } from '../../../lib/storage.js'
import { generateClaimNumber } from '../utils/generateClaimNumber.js'
import type { CreateClaimInput, ClaimFileInput } from './createClaim.schema.js'
import type { CreateClaimResponseDto } from './createClaim.dto.js'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('claims:createClaim')

/**
 * Create a new claim with authorization checks
 *
 * Authorization matrix:
 * - Internal roles (superadmin, claims_admin, claims_employee, operations_employee): Full access
 * - External roles with client access: Can create for accessible clients only
 * - Affiliates (client_affiliate): Can only create where patient is self or their dependent
 *
 * @param input - Validated claim input data
 * @param user - Authenticated user context
 * @returns Created claim data
 * @throws AppError for authorization or validation failures
 */
export async function createClaim(
  input: CreateClaimInput,
  user: AuthUser
): Promise<CreateClaimResponseDto> {
  const { clientId, affiliateId, patientId, description } = input

  logger.info({ clientId, affiliateId, patientId, userId: user.id }, 'Creating new claim')

  // 1. Validate client exists and is active
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, isActive: true },
  })

  if (!client) {
    throw AppError.notFound('Cliente')
  }

  if (!client.isActive) {
    throw AppError.badRequest('El cliente no está activo')
  }

  // 2. Check user has access to this client (unless internal role)
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    const hasClientAccess = await db.userClient.findUnique({
      where: {
        userId_clientId: { userId: user.id, clientId },
        isActive: true,
      },
    })

    if (!hasClientAccess) {
      logger.warn({ userId: user.id, clientId }, 'User does not have access to client')
      throw AppError.forbidden('Sin acceso a este cliente')
    }
  }

  // 3. Validate affiliate exists and belongs to client
  const affiliate = await db.affiliate.findUnique({
    where: { id: affiliateId },
    select: {
      id: true,
      clientId: true,
      userId: true,
      isActive: true,
    },
  })

  if (!affiliate) {
    throw AppError.notFound('Afiliado')
  }

  if (affiliate.clientId !== clientId) {
    throw AppError.badRequest('El afiliado no pertenece a este cliente')
  }

  if (!affiliate.isActive) {
    throw AppError.badRequest('El afiliado no está activo')
  }

  // 4. Validate patient exists and belongs to client
  const patient = await db.affiliate.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      clientId: true,
      primaryAffiliateId: true,
      isActive: true,
    },
  })

  if (!patient) {
    throw AppError.notFound('Paciente')
  }

  if (patient.clientId !== clientId) {
    throw AppError.badRequest('El paciente no pertenece a este cliente')
  }

  if (!patient.isActive) {
    throw AppError.badRequest('El paciente no está activo')
  }

  // 5. Authorization for affiliates: can only create claims for self or dependents
  if (user.role === 'client_affiliate') {
    const isPatientSelf = patientId === affiliateId
    const isPatientDependent = patient.primaryAffiliateId === affiliateId

    if (!isPatientSelf && !isPatientDependent) {
      logger.warn(
        { userId: user.id, affiliateId, patientId },
        'Affiliate attempted to create claim for non-dependent patient'
      )
      throw AppError.forbidden('Solo puede crear reclamos para usted o sus dependientes')
    }

    // Ensure the affiliate creating is linked to the user
    if (affiliate.userId !== user.id) {
      logger.warn(
        { userId: user.id, affiliateId, affiliateUserId: affiliate.userId },
        'User attempted to create claim as different affiliate'
      )
      throw AppError.forbidden('No puede crear reclamos como otro afiliado')
    }
  }

  // 6. Validate files if provided
  const files = input.files ?? []
  if (files.length > 0) {
    await validateUploadedFiles(files, user.id)
  }

  // 7. Create the claim with DRAFT status (in transaction if files exist)
  const claim = await db.claim.create({
    data: {
      claimNumber: 'PENDING', // Temporary, will update after getting sequence
      clientId,
      affiliateId,
      patientId,
      description,
      status: 'DRAFT',
      createdById: user.id,
    },
  })

  // 8. Generate claim number from sequence and update
  const claimNumber = generateClaimNumber(claim.claimSequence)

  const updatedClaim = await db.claim.update({
    where: { id: claim.id },
    data: { claimNumber },
    select: {
      id: true,
      claimNumber: true,
      claimSequence: true,
      status: true,
      affiliateId: true,
      patientId: true,
      clientId: true,
      description: true,
      createdAt: true,
      createdById: true,
    },
  })

  // 9. Create file records if files were uploaded
  if (files.length > 0) {
    await createClaimFiles(files, updatedClaim.id, clientId, user.id)

    logger.info({ claimId: updatedClaim.id, fileCount: files.length }, 'Claim files created')
  }

  logger.info(
    { claimId: updatedClaim.id, claimNumber: updatedClaim.claimNumber, fileCount: files.length },
    'Claim created successfully'
  )

  audit({
    action: 'CREATE',
    resourceType: 'Claim',
    resourceId: updatedClaim.id,
    userId: user.id,
    clientId: updatedClaim.clientId,
    metadata: { claimNumber: updatedClaim.claimNumber, fileCount: files.length },
  })

  return {
    ...updatedClaim,
    createdAt: updatedClaim.createdAt.toISOString(),
  }
}

/**
 * Validate that all uploaded files exist and belong to the user
 */
async function validateUploadedFiles(files: ClaimFileInput[], userId: string): Promise<void> {
  for (const file of files) {
    // Verify user-scoped key ownership
    if (!validateTempKeyOwnership(file.storageKey, 'claims', userId)) {
      logger.warn({ storageKey: file.storageKey, userId }, 'Invalid storage key ownership')
      throw AppError.forbidden('Carga no válida')
    }

    // Verify file exists in R2
    const exists = await fileExists(file.storageKey)
    if (!exists) {
      logger.warn({ storageKey: file.storageKey }, 'File not found in storage')
      throw AppError.badRequest('Archivo no encontrado en almacenamiento')
    }
  }
}

/**
 * Create File and ClaimFile records for uploaded files
 */
async function createClaimFiles(
  files: ClaimFileInput[],
  claimId: string,
  clientId: string,
  userId: string
): Promise<void> {
  for (const file of files) {
    // Create File record
    const fileRecord = await db.file.create({
      data: {
        storageKey: file.storageKey,
        storageBucket: 'claims-manager',
        originalName: file.originalName,
        fileSize: BigInt(file.fileSize),
        mimeType: file.mimeType,
        entityType: 'CLAIM',
        entityId: claimId,
        clientId,
        uploadedById: userId,
      },
    })

    // Create ClaimFile junction record
    await db.claimFile.create({
      data: {
        fileId: fileRecord.id,
        claimId,
        category: file.category,
        description: file.description,
      },
    })
  }
}
