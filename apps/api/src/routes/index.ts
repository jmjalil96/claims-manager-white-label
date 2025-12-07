import { Router } from 'express'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { affiliatesRouter } from '../features/affiliates/index.js'
import { claimsRouter } from '../features/claims/index.js'
import { policiesRouter } from '../features/policies/index.js'
import { clientsRouter } from '../features/clients/index.js'

const router = Router()

// Feature routers
router.use('/api/affiliates', affiliatesRouter)
router.use('/api/claims', claimsRouter)
router.use('/api/policies', policiesRouter)
router.use('/api/clients', clientsRouter)

// Health check with DB status
router.get('/health', async (_req, res) => {
  const dbStatus = await checkDatabase()
  const status = dbStatus ? 'ok' : 'degraded'
  const statusCode = dbStatus ? 200 : 503

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus ? 'ok' : 'error',
    },
  })
})

// API info
router.get('/api', (_req, res) => {
  res.json({ message: 'Claims Manager API', version: '1.0.0' })
})

// Protected route - get current user with client access
router.get('/api/me', requireAuth, async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.user!.id },
    include: {
      clientAccess: {
        where: { isActive: true },
        include: { client: { select: { id: true, name: true } } },
      },
    },
  })
  res.json({ user })
})

async function checkDatabase(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export { router }
