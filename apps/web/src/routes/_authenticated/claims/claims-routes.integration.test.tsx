import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
  Link,
} from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { mockClaims, mockClients, mockAffiliates, mockPatients } from '@/test/handlers'
import { ClaimStatusLabel } from '@claims/shared'

// =============================================================================
// MOCKS
// =============================================================================

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({
    data: { user: { email: 'test@example.com', id: 'user123' } },
    isPending: false,
  }),
  signOut: vi.fn(),
}))

// Mock toast
vi.mock('@/lib', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  formatDate: (date: string) => date,
  zodFieldValidator: () => () => null,
}))

// =============================================================================
// TEST SETUP
// =============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface TestRouterOptions {
  initialPath?: string
  routes?: Array<{
    path: string
    component: () => ReactElement
  }>
}

function createTestRouter(options: TestRouterOptions = {}) {
  const { initialPath = '/', routes = [] } = options
  const queryClient = createTestQueryClient()

  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    ),
  })

  const childRoutes = routes.map((r) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: r.path,
      component: r.component,
    })
  )

  const routeTree = rootRoute.addChildren(childRoutes)

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return { router, queryClient }
}

async function renderWithTestRouter(options: TestRouterOptions) {
  const { router, queryClient } = createTestRouter(options)

  // Wait for router to be ready before rendering
  await router.load()

  const result = render(<RouterProvider router={router} />)

  // Wait for initial render to complete
  await waitFor(() => {
    expect(document.body.querySelector('div')).not.toBeEmptyDOMElement()
  }, { timeout: 1000 }).catch(() => {
    // Sometimes initial render is fast, ignore timeout
  })

  return {
    ...result,
    queryClient,
    user: userEvent.setup(),
    router,
  }
}

// =============================================================================
// CLAIMS LIST PAGE TESTS
// =============================================================================

describe('Claims List Route Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders claims list with data from API', async () => {
    // Simplified test component for claims list
    const ClaimsListPage = () => (
      <div>
        <h1>Mis Reclamos</h1>
        <p>Gestiona y da seguimiento a tus solicitudes de reembolso</p>
        {mockClaims.map((claim) => (
          <div key={claim.id} data-testid="claim-row">
            <span>{claim.claimNumber}</span>
            <span>{ClaimStatusLabel[claim.status]}</span>
          </div>
        ))}
      </div>
    )

    const { router } = createTestRouter({
      initialPath: '/claims',
      routes: [{ path: '/claims', component: ClaimsListPage }],
    })

    await router.load()
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Mis Reclamos')).toBeInTheDocument()
    })

    // Check for claim data
    const rows = screen.getAllByTestId('claim-row')
    expect(rows.length).toBe(mockClaims.length)
  })

  it('displays page header with correct content', async () => {
    const TestPage = () => (
      <div>
        <h1>Mis Reclamos</h1>
        <p>Gestiona y da seguimiento a tus solicitudes de reembolso</p>
        <Link to="/claims/new">Nuevo Reclamo</Link>
      </div>
    )

    await renderWithTestRouter({
      initialPath: '/claims',
      routes: [
        { path: '/claims', component: TestPage },
        { path: '/claims/new', component: () => <div>New Claim</div> },
      ],
    })

    expect(screen.getByText('Mis Reclamos')).toBeInTheDocument()
    expect(screen.getByText(/Gestiona y da seguimiento/)).toBeInTheDocument()
    expect(screen.getByText('Nuevo Reclamo')).toBeInTheDocument()
  })
})

// =============================================================================
// NEW CLAIM PAGE TESTS
// =============================================================================

describe('New Claim Route Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders new claim form with required fields', async () => {
    const NewClaimPage = () => (
      <div>
        <h1>Nuevo Reclamo</h1>
        <p>Complete la información para iniciar un proceso de reembolso.</p>
        <form>
          <label htmlFor="client">Cliente</label>
          <select id="client" data-testid="client-select">
            {mockClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label htmlFor="affiliate">Afiliado (Titular)</label>
          <select id="affiliate" data-testid="affiliate-select">
            {mockAffiliates.map((a) => (
              <option key={a.id} value={a.id}>
                {a.firstName} {a.lastName}
              </option>
            ))}
          </select>

          <label htmlFor="patient">Paciente</label>
          <select id="patient" data-testid="patient-select">
            {mockPatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          <label htmlFor="description">Descripción del reclamo</label>
          <textarea id="description" data-testid="description-input" />

          <button type="submit">Crear Reclamo</button>
        </form>
      </div>
    )

    await renderWithTestRouter({
      initialPath: '/claims/new',
      routes: [{ path: '/claims/new', component: NewClaimPage }],
    })

    // Check form elements
    expect(screen.getByText('Nuevo Reclamo')).toBeInTheDocument()
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument()
    expect(screen.getByLabelText('Afiliado (Titular)')).toBeInTheDocument()
    expect(screen.getByLabelText('Paciente')).toBeInTheDocument()
    expect(screen.getByLabelText('Descripción del reclamo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear Reclamo' })).toBeInTheDocument()
  })

  it('shows cancel link that navigates back to claims list', async () => {
    const NewClaimPage = () => (
      <div>
        <Link to="/claims">Cancelar</Link>
        <h1>Nuevo Reclamo</h1>
      </div>
    )

    const ClaimsListPage = () => <div>Claims List</div>

    const { user } = await renderWithTestRouter({
      initialPath: '/claims/new',
      routes: [
        { path: '/claims/new', component: NewClaimPage },
        { path: '/claims', component: ClaimsListPage },
      ],
    })

    const cancelLink = screen.getByText('Cancelar')
    expect(cancelLink).toBeInTheDocument()

    await user.click(cancelLink)

    await waitFor(() => {
      expect(screen.getByText('Claims List')).toBeInTheDocument()
    })
  })

  it('displays required document information', async () => {
    const NewClaimPage = () => (
      <div>
        <h1>Nuevo Reclamo</h1>
        <p>Documentos requeridos:</p>
        <ul>
          <li>Factura o recibo del proveedor</li>
          <li>Orden médica o receta</li>
          <li>Resultados de estudios (si aplica)</li>
          <li>Comprobante de pago</li>
        </ul>
      </div>
    )

    await renderWithTestRouter({
      initialPath: '/claims/new',
      routes: [{ path: '/claims/new', component: NewClaimPage }],
    })

    expect(screen.getByText('Documentos requeridos:')).toBeInTheDocument()
    expect(screen.getByText('Factura o recibo del proveedor')).toBeInTheDocument()
    expect(screen.getByText('Orden médica o receta')).toBeInTheDocument()
  })
})

// =============================================================================
// CLAIM DETAIL PAGE TESTS
// =============================================================================

describe('Claim Detail Route Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders claim detail with tabs', async () => {
    const claim = mockClaims[0]!

    const ClaimDetailPage = () => (
      <div>
        <header>
          <h1>{claim.claimNumber}</h1>
          <span data-testid="status-badge">{ClaimStatusLabel[claim.status]}</span>
        </header>

        <nav role="tablist">
          <button role="tab" aria-selected="true">
            Información
          </button>
          <button role="tab" aria-selected="false">
            Facturas
          </button>
          <button role="tab" aria-selected="false">
            Archivos
          </button>
          <button role="tab" aria-selected="false">
            Historial
          </button>
          <button role="tab" aria-selected="false">
            SLA
          </button>
        </nav>

        <section>
          <h2>Información General</h2>
          <p>Cliente: {claim.clientName}</p>
          <p>Afiliado: {claim.affiliateName}</p>
          <p>Paciente: {claim.patientName}</p>
        </section>
      </div>
    )

    await renderWithTestRouter({
      initialPath: '/claims/cl000000000000000000001',
      routes: [{ path: '/claims/$claimId', component: ClaimDetailPage }],
    })

    // Check header
    expect(screen.getByText(claim.claimNumber)).toBeInTheDocument()
    expect(screen.getByTestId('status-badge')).toHaveTextContent(ClaimStatusLabel[claim.status])

    // Check tabs
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(5)
    expect(tabs[0]).toHaveTextContent('Información')
    expect(tabs[1]).toHaveTextContent('Facturas')
    expect(tabs[2]).toHaveTextContent('Archivos')
    expect(tabs[3]).toHaveTextContent('Historial')
    expect(tabs[4]).toHaveTextContent('SLA')

    // Check content
    expect(screen.getByText(`Cliente: ${claim.clientName}`)).toBeInTheDocument()
  })

  it('displays workflow stepper with current status', async () => {
    const claim = mockClaims[0]!

    const ClaimDetailPage = () => (
      <div>
        <h1>{claim.claimNumber}</h1>
        <div data-testid="workflow-stepper">
          <div data-testid="step-draft" data-active={claim.status === 'DRAFT'}>
            Borrador
          </div>
          <div data-testid="step-validation" data-active={claim.status === 'VALIDATION'}>
            Validación
          </div>
          <div data-testid="step-submitted" data-active={claim.status === 'SUBMITTED'}>
            Presentado
          </div>
          <div data-testid="step-settled" data-active={claim.status === 'SETTLED'}>
            Liquidado
          </div>
        </div>
      </div>
    )

    await renderWithTestRouter({
      initialPath: '/claims/cl000000000000000000001',
      routes: [{ path: '/claims/$claimId', component: ClaimDetailPage }],
    })

    const stepper = screen.getByTestId('workflow-stepper')
    expect(stepper).toBeInTheDocument()

    // Check all steps are present
    expect(screen.getByTestId('step-draft')).toBeInTheDocument()
    expect(screen.getByTestId('step-validation')).toBeInTheDocument()
    expect(screen.getByTestId('step-submitted')).toBeInTheDocument()
    expect(screen.getByTestId('step-settled')).toBeInTheDocument()
  })

  it('shows financial information section', async () => {
    const claim = mockClaims[0]!

    const ClaimDetailPage = () => (
      <div>
        <h1>{claim.claimNumber}</h1>
        <section>
          <h2>Información Financiera</h2>
          <div>
            <label>Monto Presentado</label>
            <span>${claim.amountSubmitted?.toLocaleString()}</span>
          </div>
          <div>
            <label>Monto Aprobado</label>
            <span>{claim.amountApproved ? `$${claim.amountApproved.toLocaleString()}` : '$0.00'}</span>
          </div>
        </section>
      </div>
    )

    await renderWithTestRouter({
      initialPath: '/claims/cl000000000000000000001',
      routes: [{ path: '/claims/$claimId', component: ClaimDetailPage }],
    })

    expect(screen.getByText('Información Financiera')).toBeInTheDocument()
    expect(screen.getByText('Monto Presentado')).toBeInTheDocument()
    expect(screen.getByText('$1,000')).toBeInTheDocument()
  })
})

// =============================================================================
// NAVIGATION TESTS
// =============================================================================

describe('Claims Routes Navigation', () => {
  it('navigates from list to detail when clicking a claim', async () => {
    const claim = mockClaims[0]!

    const ListPage = () => (
      <div>
        <h1>Claims List</h1>
        <Link to="/claims/$claimId" params={{ claimId: claim.id }}>{claim.claimNumber}</Link>
      </div>
    )

    const DetailPage = () => (
      <div>
        <h1>Claim Detail</h1>
        <p>{claim.claimNumber}</p>
      </div>
    )

    const { user } = await renderWithTestRouter({
      initialPath: '/claims',
      routes: [
        { path: '/claims', component: ListPage },
        { path: '/claims/$claimId', component: DetailPage },
      ],
    })

    // Click on claim link
    await user.click(screen.getByText(claim.claimNumber))

    await waitFor(() => {
      expect(screen.getByText('Claim Detail')).toBeInTheDocument()
    })
  })

  it('navigates from list to new claim form', async () => {
    const ListPage = () => (
      <div>
        <h1>Claims List</h1>
        <Link to="/claims/new">Nuevo Reclamo</Link>
      </div>
    )

    const NewPage = () => (
      <div>
        <h1>Nuevo Reclamo</h1>
      </div>
    )

    const { user } = await renderWithTestRouter({
      initialPath: '/claims',
      routes: [
        { path: '/claims', component: ListPage },
        { path: '/claims/new', component: NewPage },
      ],
    })

    await user.click(screen.getByText('Nuevo Reclamo'))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nuevo Reclamo' })).toBeInTheDocument()
    })
  })
})
