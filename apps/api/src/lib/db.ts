import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { logger } from './logger.js'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const db = new PrismaClient({ adapter })

// Log connection errors
pool.on('error', (err) => {
  logger.error({ err }, 'PostgreSQL pool error')
})
