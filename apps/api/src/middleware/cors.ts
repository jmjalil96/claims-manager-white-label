import cors from 'cors'

function parseOrigins(originsEnv: string | undefined): string[] {
  if (!originsEnv) return []
  return originsEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN)

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
})
