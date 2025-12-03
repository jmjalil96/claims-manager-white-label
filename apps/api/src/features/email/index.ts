/**
 * Email feature
 * Provides async email sending via pg-boss queue with template support
 */

export { emailService, sendEmail, sendPasswordReset, sendEmailVerification, sendClaimStatusUpdate, sendNotification } from './email.service.js'
export { registerEmailWorker, EMAIL_QUEUE_NAME, type EmailJobData } from './email.job.js'
export { getEmailTransport, type EmailMessage, type EmailTransport } from './email.transport.js'
export * from './email.templates.js'
