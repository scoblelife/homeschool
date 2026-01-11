export {
  generateWeeklyEmailHTML,
  generateWeeklyEmailPlainText,
  generateEmailSubject,
} from './emailGenerator'

export {
  sendWeeklySummary,
  sendViaMailto,
  sendViaResend,
  generateEmailPreview,
  DEFAULT_EMAIL_CONFIG,
  type EmailConfig,
} from './emailSender'
