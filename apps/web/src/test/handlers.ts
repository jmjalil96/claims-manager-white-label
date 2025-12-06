import { http, HttpResponse } from 'msw'
import { ClaimStatus, CareType, AffiliateType } from '@claims/shared'
import type {
  ListClaimsResponse,
  ClaimListItemDto,
  GetAvailableClientsResponse,
  GetAvailableAffiliatesResponse,
  GetAvailablePatientsResponse,
  GetClaimResponse,
  ListInvoicesResponse,
  KanbanColumnDto,
} from '@claims/shared'

// =============================================================================
// MOCK DATA FACTORIES
// =============================================================================

let claimIdCounter = 1

export function createMockClaim(overrides: Partial<ClaimListItemDto> = {}): ClaimListItemDto {
  const id = `cl${String(claimIdCounter++).padStart(24, '0')}`
  return {
    id,
    claimNumber: `RECL_${String(claimIdCounter).padStart(6, '0')}`,
    claimSequence: claimIdCounter,
    status: ClaimStatus.DRAFT,
    careType: CareType.AMBULATORY,
    description: 'Test claim description',
    clientId: 'clclient000000000000001',
    affiliateId: 'claffiliate0000000001',
    patientId: 'clpatient00000000001',
    policyId: null,
    clientName: 'Test Client',
    affiliateName: 'John Doe',
    patientName: 'John Doe',
    policyNumber: null,
    amountSubmitted: 1000,
    amountApproved: null,
    incidentDate: '2024-01-15',
    submittedDate: null,
    settlementDate: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

export const mockClients = [
  { id: 'clclient000000000000001', name: 'Acme Insurance', taxId: '123456-7' },
  { id: 'clclient000000000000002', name: 'Global Health', taxId: '987654-3' },
]

export const mockAffiliates = [
  {
    id: 'claffiliate0000000001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    documentNumber: '12345678',
    affiliateType: AffiliateType.OWNER,
  },
  {
    id: 'claffiliate0000000002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    documentNumber: '87654321',
    affiliateType: AffiliateType.OWNER,
  },
]

export const mockPatients = [
  {
    id: 'clpatient00000000001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    documentNumber: '12345678',
    affiliateType: AffiliateType.OWNER,
    isDependent: false,
  },
  {
    id: 'clpatient00000000002',
    firstName: 'Johnny Jr',
    lastName: 'Doe',
    email: null,
    documentNumber: '11111111',
    affiliateType: AffiliateType.DEPENDENT,
    isDependent: true,
  },
]

// Default mock claims for list
export let mockClaims = [
  createMockClaim({ status: ClaimStatus.DRAFT }),
  createMockClaim({ status: ClaimStatus.VALIDATION }),
  createMockClaim({ status: ClaimStatus.SUBMITTED }),
  createMockClaim({ status: ClaimStatus.PENDING_INFO }),
  createMockClaim({ status: ClaimStatus.SETTLED }),
]

// Reset mock state between tests to prevent order-dependent failures
export function resetMocks() {
  claimIdCounter = 1
  mockClaims = [
    createMockClaim({ status: ClaimStatus.DRAFT }),
    createMockClaim({ status: ClaimStatus.VALIDATION }),
    createMockClaim({ status: ClaimStatus.SUBMITTED }),
    createMockClaim({ status: ClaimStatus.PENDING_INFO }),
    createMockClaim({ status: ClaimStatus.SETTLED }),
  ]
}

// Helper to create kanban columns Record
function createKanbanColumns(): Record<ClaimStatus, KanbanColumnDto> {
  const columns = {} as Record<ClaimStatus, KanbanColumnDto>
  for (const status of Object.values(ClaimStatus)) {
    columns[status] = {
      status,
      claims: mockClaims.filter((c) => c.status === status),
      count: mockClaims.filter((c) => c.status === status).length,
      hasMore: false,
    }
  }
  return columns
}

// =============================================================================
// API HANDLERS
// =============================================================================

// IMPORTANT: More specific routes must come BEFORE parameterized routes
// because MSW matches routes in order and :id will match any string like "clients"

export const handlers = [
  // =============================================================================
  // SPECIFIC ROUTES (must come first, before :id routes)
  // =============================================================================

  // Kanban claims - must be before /claims/:id
  http.get('*/api/claims/kanban', () => {
    return HttpResponse.json({
      columns: createKanbanColumns(),
    })
  }),

  // Available clients - must be before /claims/:id
  http.get('*/api/claims/clients', () => {
    const response: GetAvailableClientsResponse = {
      clients: mockClients,
    }
    return HttpResponse.json(response)
  }),

  // Available affiliates for client - must be before /claims/:id
  http.get('*/api/claims/clients/:clientId/affiliates', () => {
    const response: GetAvailableAffiliatesResponse = {
      affiliates: mockAffiliates,
    }
    return HttpResponse.json(response)
  }),

  // Available patients for affiliate - must be before /claims/:id
  http.get('*/api/claims/affiliates/:affiliateId/patients', () => {
    const response: GetAvailablePatientsResponse = {
      patients: mockPatients,
    }
    return HttpResponse.json(response)
  }),

  // =============================================================================
  // PARAMETERIZED ROUTES
  // =============================================================================

  // Claim invoices
  http.get('*/api/claims/:id/invoices', () => {
    const response: ListInvoicesResponse = {
      invoices: [],
    }
    return HttpResponse.json(response)
  }),

  // Claim files
  http.get('*/api/claims/:id/files', () => {
    return HttpResponse.json({ files: [] })
  }),

  // Claim audit
  http.get('*/api/claims/:id/audit', () => {
    return HttpResponse.json({
      logs: [],
      meta: { page: 1, limit: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    })
  }),

  // Claim SLA
  http.get('*/api/claims/:id/sla', () => {
    return HttpResponse.json({ stages: [] })
  }),

  // Claim policies
  http.get('*/api/claims/:id/policies', () => {
    return HttpResponse.json({ policies: [] })
  }),

  // Get claim detail - AFTER all specific /claims/* routes
  http.get('*/api/claims/:id', ({ params }) => {
    const claim = mockClaims.find((c) => c.id === params.id)
    if (!claim) {
      return new HttpResponse(null, { status: 404 })
    }

    const response: GetClaimResponse = {
      claim: {
        ...claim,
        careType: CareType.AMBULATORY,
        diagnosisCode: null,
        diagnosisDescription: null,
        amountDenied: null,
        amountUnprocessed: null,
        deductibleApplied: null,
        copayApplied: null,
        businessDays: null,
        settlementNumber: null,
        settlementNotes: null,
        pendingReason: null,
        returnReason: null,
        cancellationReason: null,
        createdById: 'user123',
        updatedById: null,
        updatedAt: new Date().toISOString(),
      },
    }

    return HttpResponse.json(response)
  }),

  // Update claim
  http.patch('*/api/claims/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<ClaimListItemDto>
    const claim = mockClaims.find((c) => c.id === params.id)
    if (!claim) {
      return new HttpResponse(null, { status: 404 })
    }

    // Update claim in mock data
    Object.assign(claim, body)

    return HttpResponse.json({
      claim: { ...claim, ...body },
    })
  }),

  // List claims - base route last
  http.get('*/api/claims', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    let claims = [...mockClaims]

    // Filter by status
    if (status) {
      const statuses = status.split(',')
      claims = claims.filter((c) => statuses.includes(c.status))
    }

    // Paginate
    const start = (page - 1) * limit
    const paginatedClaims = claims.slice(start, start + limit)

    const response: ListClaimsResponse = {
      claims: paginatedClaims,
      meta: {
        page,
        limit,
        totalCount: claims.length,
        totalPages: Math.ceil(claims.length / limit),
        hasNextPage: page * limit < claims.length,
        hasPrevPage: page > 1,
      },
    }

    return HttpResponse.json(response)
  }),

  // =============================================================================
  // POST ROUTES
  // =============================================================================

  // Create claim
  http.post('*/api/claims', async ({ request }) => {
    const body = (await request.json()) as Partial<ClaimListItemDto>
    const newClaim = createMockClaim(body)
    mockClaims.push(newClaim)
    return HttpResponse.json({ claim: newClaim }, { status: 201 })
  }),

  // Create invoice
  http.post('*/api/claims/:id/invoices', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      invoice: {
        id: `clinvoice${Date.now()}`,
        claimId: 'test',
        ...body,
        createdAt: new Date().toISOString(),
      },
    })
  }),

  // Upload URL
  http.post('*/api/claims/:id/files/upload-url', () => {
    return HttpResponse.json({
      uploadUrl: 'https://storage.example.com/presigned',
      storageKey: `claims/test/${Date.now()}-file.pdf`,
    })
  }),
]
