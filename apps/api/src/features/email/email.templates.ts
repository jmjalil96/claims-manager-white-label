/**
 * Email template system
 *
 * Simple, type-safe template functions for email notifications.
 * Each template returns { subject, html, text } for use with the email service.
 */

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// Base layout wrapper
function layout(content: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 20px; }
    .content { padding: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: #fff; text-decoration: none; border-radius: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`
}

// Password Reset
export interface PasswordResetData {
  userName: string
  resetUrl: string
  expiresIn: string
}

export function passwordReset(data: PasswordResetData): EmailTemplate {
  const subject = 'Reset your password'

  const html = layout(
    `
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hi ${data.userName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </p>
      <p>This link will expire in ${data.expiresIn}.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p>${data.resetUrl}</p>
    </div>
  `,
    subject
  )

  const text = `Hi ${data.userName},

We received a request to reset your password.

Reset your password: ${data.resetUrl}

This link will expire in ${data.expiresIn}.

If you didn't request this, you can safely ignore this email.`

  return { subject, html, text }
}

// Email Verification
export interface EmailVerificationData {
  userName: string
  verifyUrl: string
}

export function emailVerification(data: EmailVerificationData): EmailTemplate {
  const subject = 'Verify your email address'

  const html = layout(
    `
    <div class="header">
      <h1>Welcome!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.userName},</p>
      <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.verifyUrl}" class="button">Verify Email</a>
      </p>
    </div>
    <div class="footer">
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p>${data.verifyUrl}</p>
    </div>
  `,
    subject
  )

  const text = `Hi ${data.userName},

Thanks for signing up! Please verify your email address:

${data.verifyUrl}`

  return { subject, html, text }
}

// Claim Status Update
export interface ClaimStatusData {
  userName: string
  claimNumber: string
  oldStatus: string
  newStatus: string
  claimUrl: string
  note?: string
}

export function claimStatusUpdate(data: ClaimStatusData): EmailTemplate {
  const subject = `Claim ${data.claimNumber} - Status Update`

  const noteHtml = data.note ? `<p><strong>Note:</strong> ${data.note}</p>` : ''
  const noteText = data.note ? `\nNote: ${data.note}` : ''

  const html = layout(
    `
    <div class="header">
      <h1>Claim Status Update</h1>
    </div>
    <div class="content">
      <p>Hi ${data.userName},</p>
      <p>Your claim <strong>${data.claimNumber}</strong> has been updated:</p>
      <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; border: 1px solid #eee;"><strong>Previous Status</strong></td>
          <td style="padding: 10px; border: 1px solid #eee;">${data.oldStatus}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #eee;"><strong>New Status</strong></td>
          <td style="padding: 10px; border: 1px solid #eee; background: #e8f5e9;">${data.newStatus}</td>
        </tr>
      </table>
      ${noteHtml}
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.claimUrl}" class="button">View Claim</a>
      </p>
    </div>
  `,
    subject
  )

  const text = `Hi ${data.userName},

Your claim ${data.claimNumber} has been updated:

Previous Status: ${data.oldStatus}
New Status: ${data.newStatus}${noteText}

View your claim: ${data.claimUrl}`

  return { subject, html, text }
}

// Generic Notification
export interface NotificationData {
  userName: string
  title: string
  message: string
  actionUrl?: string
  actionText?: string
}

export function notification(data: NotificationData): EmailTemplate {
  const subject = data.title

  const actionHtml = data.actionUrl
    ? `<p style="text-align: center; margin: 30px 0;">
        <a href="${data.actionUrl}" class="button">${data.actionText || 'View Details'}</a>
      </p>`
    : ''

  const actionText = data.actionUrl ? `\n\n${data.actionText || 'View Details'}: ${data.actionUrl}` : ''

  const html = layout(
    `
    <div class="header">
      <h1>${data.title}</h1>
    </div>
    <div class="content">
      <p>Hi ${data.userName},</p>
      <p>${data.message}</p>
      ${actionHtml}
    </div>
  `,
    subject
  )

  const text = `Hi ${data.userName},

${data.message}${actionText}`

  return { subject, html, text }
}

// Template registry for type-safe template lookup
export const templates = {
  passwordReset,
  emailVerification,
  claimStatusUpdate,
  notification,
} as const

export type TemplateName = keyof typeof templates
