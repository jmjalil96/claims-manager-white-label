import type { PgBoss, Job } from 'pg-boss'
import { getEmailTransport } from './email.transport.js'
import { createLogger } from '../../lib/logger.js'

const logger = createLogger('email-job')

export const EMAIL_QUEUE_NAME = 'email'

export interface EmailJobData {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  metadata?: Record<string, unknown>
}

export async function registerEmailWorker(boss: PgBoss): Promise<void> {
  // Create the email queue with retry settings
  await boss.createQueue(EMAIL_QUEUE_NAME, {
    retryLimit: 3,
    retryDelay: 60, // 1 minute
    retryBackoff: true,
    expireInSeconds: 60 * 60, // 1 hour
    retentionSeconds: 60 * 60 * 24 * 7, // 7 days
  })

  await boss.work<EmailJobData>(
    EMAIL_QUEUE_NAME,
    { batchSize: 1 },
    async (jobs: Job<EmailJobData>[]) => {
      for (const job of jobs) {
        const { to, subject, html, text, from, metadata } = job.data

        logger.info({ jobId: job.id, to, subject, metadata }, 'Processing email job')

        try {
          const transport = getEmailTransport()
          const result = await transport.send({ to, subject, html, text, from })

          logger.info({ jobId: job.id, emailId: result.id, to }, 'Email sent successfully')
        } catch (error) {
          logger.error({ jobId: job.id, error, to, subject }, 'Failed to send email')
          throw error // Re-throw to trigger retry
        }
      }
    }
  )

  logger.info('Email worker registered')
}
