/**
 * Compliance Module
 *
 * State requirements tracking and document generation for homeschool compliance.
 */

export {
  STATE_REQUIREMENTS,
  getStateRequirements,
  getSupportedStates,
  getUpcomingDeadlines,
  type StateRequirement,
} from './stateRequirements'

export {
  generateNoticeOfIntent,
  generateAttendanceRecord,
  generateIHIP,
  generateQuarterlyReport,
  type DocumentData,
  type GeneratedDocument,
} from './documentTemplates'
