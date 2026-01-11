/**
 * Email Sender
 *
 * Sends weekly summary emails using the system's default email client
 * or via configured SMTP settings.
 */

import { shell } from 'electron'
import {
  generateWeeklyEmailHTML,
  generateWeeklyEmailPlainText,
  generateEmailSubject,
} from './emailGenerator'
import { startOfWeek, endOfWeek } from 'date-fns'

interface StudentSummary {
  name: string
  gradeLevel: string
  totalActivities: number
  totalMinutes: number
  activeDays: number
  subjects: Array<{
    name: string
    activities: number
    minutes: number
  }>
}

interface WeeklySummaryData {
  weekStart: Date
  weekEnd: Date
  students: StudentSummary[]
  familyTotalActivities: number
  familyTotalMinutes: number
}

export interface EmailConfig {
  enabled: boolean
  recipientEmail: string
  sendDay?: 'sunday' | 'monday' // Day to send weekly summary (optional, used for scheduling)
  method: 'mailto' | 'resend' // 'mailto' uses system email, 'resend' uses API
  resendApiKey?: string // Only needed for 'resend' method
}

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  enabled: false,
  recipientEmail: '',
  sendDay: 'sunday',
  method: 'mailto',
}

/**
 * Opens the default email client with a pre-filled weekly summary email
 */
export async function sendViaMailto(
  data: WeeklySummaryData,
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = encodeURIComponent(generateEmailSubject(data.weekStart))
    const body = encodeURIComponent(generateWeeklyEmailPlainText(data))

    // Note: mailto has length limits, so we use plain text
    const mailtoUrl = `mailto:${recipientEmail}?subject=${subject}&body=${body}`

    await shell.openExternal(mailtoUrl)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open email client',
    }
  }
}

/**
 * Sends email via Resend API (requires API key)
 */
export async function sendViaResend(
  data: WeeklySummaryData,
  recipientEmail: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Homeschool App <onboarding@resend.dev>',
        to: recipientEmail,
        subject: generateEmailSubject(data.weekStart),
        html: generateWeeklyEmailHTML(data),
        text: generateWeeklyEmailPlainText(data),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Resend API error: ${error}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send via Resend',
    }
  }
}

/**
 * Send weekly summary email using the configured method
 */
export async function sendWeeklySummary(
  data: WeeklySummaryData,
  config: EmailConfig
): Promise<{ success: boolean; error?: string }> {
  if (!config.enabled) {
    return { success: false, error: 'Email summaries are disabled' }
  }

  if (!config.recipientEmail) {
    return { success: false, error: 'No recipient email configured' }
  }

  if (config.method === 'resend') {
    if (!config.resendApiKey) {
      return { success: false, error: 'Resend API key not configured' }
    }
    return sendViaResend(data, config.recipientEmail, config.resendApiKey)
  }

  return sendViaMailto(data, config.recipientEmail)
}

/**
 * Generate preview of the email (HTML format)
 */
export function generateEmailPreview(data: WeeklySummaryData): string {
  return generateWeeklyEmailHTML(data)
}
