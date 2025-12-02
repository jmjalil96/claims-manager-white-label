import express from 'express'
import { pinoHttp } from 'pino-http'
import type { IncomingMessage } from 'http'
import { toNodeHandler } from 'better-auth/node'
import { logger } from './lib/logger.js'
import { auth } from './lib/auth.js'
import { corsMiddleware } from './middleware/cors.js'
import { securityHeaders, rateLimiter, authRateLimiter } from './middleware/security.js'
import { requestId } from './middleware/requestId.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import { router } from './routes/index.js'

const app = express()

// Security headers first
app.use(securityHeaders)

// CORS
app.use(corsMiddleware)

// Rate limiting (global)
app.use(rateLimiter)

// Request ID (so all logs have it)
app.use(requestId)

// Logging with request ID
app.use(
  pinoHttp({
    logger,
    genReqId: (req: IncomingMessage) => req.id,
  })
)

// Body parsing with size limit
app.use(express.json({ limit: '10kb' }))

// BetterAuth handler with stricter rate limit (Express 5 wildcard syntax)
app.all('/api/auth/{*splat}', authRateLimiter, toNodeHandler(auth))

// Routes
app.use(router)

// 404 and error handlers (must be last)
app.use(notFound)
app.use(errorHandler)

export { app }
