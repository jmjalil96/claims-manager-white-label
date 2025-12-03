import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from './db.js'
import { emailService } from '../features/email/index.js'

const trustedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3001'

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await emailService.sendPasswordReset(user.email, {
        userName: user.name || user.email,
        resetUrl: url,
        expiresIn: '1 hour',
      })
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh every 24 hours
  },

  baseURL: baseUrl,
  trustedOrigins,
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
