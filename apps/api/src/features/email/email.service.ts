import { getQueue } from '../../lib/queue.js'
import { createLogger } from '../../lib/logger.js'
import { EMAIL_QUEUE_NAME, type EmailJobData } from './email.job.js'
import * as templates from './email.templates.js'

const logger = createLogger('email-service')

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  metadata?: Record<string, unknown>
}

/**
 * Enqueue an email for async sending
 */
export async function sendEmail(options: SendEmailOptions): Promise<string | null> {
  try {
    const boss = getQueue()
    const jobData: EmailJobData = {
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      from: options.from,
      metadata: options.metadata,
    }

    const jobId = await boss.send(EMAIL_QUEUE_NAME, jobData)
    logger.debug({ jobId, to: options.to, subject: options.subject }, 'Email queued')
    return jobId
  } catch (error) {
    logger.error({ error, to: options.to }, 'Failed to queue email')
    return null
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordReset(
  to: string,
  data: templates.PasswordResetData
): Promise<string | null> {
  const template = templates.passwordReset(data)
  return sendEmail({
    to,
    ...template,
    metadata: { type: 'password-reset', userId: data.userName },
  })
}

/**
 * Send an email verification email
 */
export async function sendEmailVerification(
  to: string,
  data: templates.EmailVerificationData
): Promise<string | null> {
  const template = templates.emailVerification(data)
  return sendEmail({
    to,
    ...template,
    metadata: { type: 'email-verification', userId: data.userName },
  })
}

/**
 * Send a claim status update notification
 */
export async function sendClaimStatusUpdate(
  to: string,
  data: templates.ClaimStatusData
): Promise<string | null> {
  const template = templates.claimStatusUpdate(data)
  return sendEmail({
    to,
    ...template,
    metadata: { type: 'claim-status', claimNumber: data.claimNumber },
  })
}

/**
 * Send a generic notification
 */
export async function sendNotification(
  to: string,
  data: templates.NotificationData
): Promise<string | null> {
  const template = templates.notification(data)
  return sendEmail({
    to,
    ...template,
    metadata: { type: 'notification' },
  })
}

export const emailService = {
  send: sendEmail,
  sendPasswordReset,
  sendEmailVerification,
  sendClaimStatusUpdate,
  sendNotification,
}
