import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Helmet with sensible defaults
export const securityHeaders = helmet()

// Rate limiter: 100 requests per minute per IP
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
  skip: () => process.env.NODE_ENV === 'test',
})

// Stricter rate limit for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many auth attempts', code: 'RATE_LIMITED' },
  skip: () => process.env.NODE_ENV === 'test',
})
