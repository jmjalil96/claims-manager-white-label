import { Router } from 'express'
import { createUserRouter } from './createUser/createUser.route.js'
import { emailService } from '../features/email/index.js'

const router = Router()

router.use(createUserRouter)

// Test email endpoint (dev only)
router.post('/test-email', async (req, res) => {
  const body = req.body as { to?: string }
  const to = body.to ?? 'test@example.com'
  const jobId = await emailService.sendNotification(to, {
    userName: 'Test User',
    title: 'Test Email',
    message: 'This is a test email from the claims manager system.',
    actionUrl: 'http://localhost:5173',
    actionText: 'Go to App',
  })
  res.json({ success: true, jobId })
})

export { router as devRouter }
