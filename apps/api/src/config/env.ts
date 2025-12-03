/**
 * Environment configuration module
 * Centralizes all environment variable access with type safety
 */

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Application environment configuration
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  /** Salt for generating claim numbers via hashids */
  CLAIM_NUMBER_SALT: process.env.CLAIM_NUMBER_SALT,

  /** R2 Storage (Cloudflare) */
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'claims-manager',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,

  /** Email (Resend for production, Inbucket for dev) */
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@claims.local',
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: process.env.SMTP_PORT || '2525',
} as const

// Development warning for missing claim number salt
if (!env.CLAIM_NUMBER_SALT && isDev) {
  console.warn(
    '⚠️  WARNING: Using default CLAIM_NUMBER_SALT. ' +
      'Set CLAIM_NUMBER_SALT in .env for production.'
  )
}
