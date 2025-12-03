import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { Resend } from 'resend'
import { createLogger } from '../../lib/logger.js'

const logger = createLogger('email')

export interface EmailMessage {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<{ id: string }>
}

const isDev = process.env.NODE_ENV !== 'production'

function createInbucketTransport(): EmailTransport {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    secure: false,
    ignoreTLS: true,
  })

  return {
    async send(message: EmailMessage) {
      const result = (await transporter.sendMail({
        from: message.from || process.env.EMAIL_FROM || 'noreply@claims.local',
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      })) as { messageId: string }
      logger.debug({ messageId: result.messageId, to: message.to }, 'Email sent via Inbucket')
      return { id: result.messageId }
    },
  }
}

function createResendTransport(): EmailTransport {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required in production')
  }

  const resend = new Resend(apiKey)

  return {
    async send(message: EmailMessage) {
      const result = await resend.emails.send({
        from: message.from || process.env.EMAIL_FROM || 'noreply@example.com',
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      })

      if (result.error) {
        throw new Error(`Resend error: ${result.error.message}`)
      }

      logger.debug({ id: result.data?.id, to: message.to }, 'Email sent via Resend')
      return { id: result.data?.id || 'unknown' }
    },
  }
}

let transport: EmailTransport | null = null

export function getEmailTransport(): EmailTransport {
  if (transport) return transport

  if (isDev) {
    logger.info('Using Inbucket transport for development')
    transport = createInbucketTransport()
  } else {
    logger.info('Using Resend transport for production')
    transport = createResendTransport()
  }

  return transport
}
