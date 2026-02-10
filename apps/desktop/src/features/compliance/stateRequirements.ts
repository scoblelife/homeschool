/**
 * State Homeschool Requirements Database
 *
 * Contains requirements for top homeschool states.
 * Data sourced from HSLDA and state education departments.
 */

export interface StateRequirement {
  state: string
  stateCode: string
  requiresNotice: boolean
  noticeDeadline?: string // e.g., "August 15" or "30 days before start"
  requiredSubjects: string[]
  recordKeeping: 'none' | 'attendance' | 'portfolio' | 'detailed'
  assessmentRequired: boolean
  assessmentType?: 'standardized_test' | 'evaluation' | 'either' | 'none'
  assessmentFrequency?: string
  minHours?: number
  minDays?: number
  teacherQualifications: string
  filingDeadlines: Array<{
    name: string
    date: string
    description: string
  }>
  notes?: string
}

export const STATE_REQUIREMENTS: Record<string, StateRequirement> = {
  NV: {
    state: 'Nevada',
    stateCode: 'NV',
    requiresNotice: true,
    noticeDeadline: 'Before starting homeschool',
    requiredSubjects: ['Reading', 'Writing', 'Math', 'Science', 'Social Studies'],
    recordKeeping: 'none',
    assessmentRequired: false,
    minHours: undefined,
    minDays: 180,
    teacherQualifications: 'None required',
    filingDeadlines: [
      {
        name: 'Notice of Intent',
        date: 'Before starting',
        description: 'File notice with school district before beginning homeschool',
      },
    ],
    notes: 'Nevada has minimal requirements. Notice must be filed but no follow-up required.',
  },
  CA: {
    state: 'California',
    stateCode: 'CA',
    requiresNotice: true,
    noticeDeadline: 'October 1 - October 15',
    requiredSubjects: [
      'English',
      'Math',
      'Social Sciences',
      'Science',
      'Fine Arts',
      'Health',
      'Physical Education',
    ],
    recordKeeping: 'attendance',
    assessmentRequired: false,
    minHours: undefined,
    minDays: 175,
    teacherQualifications: 'Capable of teaching',
    filingDeadlines: [
      {
        name: 'Private School Affidavit',
        date: 'October 1 - October 15',
        description: 'File annual Private School Affidavit online',
      },
    ],
    notes: 'Most families file as private school. Attendance records required.',
  },
  TX: {
    state: 'Texas',
    stateCode: 'TX',
    requiresNotice: false,
    requiredSubjects: ['Reading', 'Spelling', 'Grammar', 'Math', 'Good Citizenship'],
    recordKeeping: 'none',
    assessmentRequired: false,
    minHours: undefined,
    minDays: undefined,
    teacherQualifications: 'None required',
    filingDeadlines: [],
    notes: 'Texas has very few requirements. No notification needed.',
  },
  FL: {
    state: 'Florida',
    stateCode: 'FL',
    requiresNotice: true,
    noticeDeadline: '30 days of starting',
    requiredSubjects: [],
    recordKeeping: 'portfolio',
    assessmentRequired: true,
    assessmentType: 'either',
    assessmentFrequency: 'Annual',
    minHours: undefined,
    minDays: undefined,
    teacherQualifications: 'None required',
    filingDeadlines: [
      {
        name: 'Notice of Intent',
        date: 'Within 30 days of starting',
        description: 'Notify superintendent of intent to homeschool',
      },
      {
        name: 'Annual Evaluation',
        date: 'End of school year',
        description: 'Submit evaluation or test scores annually',
      },
    ],
    notes: 'Portfolio must be kept for 2 years. Annual evaluation required.',
  },
  NY: {
    state: 'New York',
    stateCode: 'NY',
    requiresNotice: true,
    noticeDeadline: 'July 1 or 14 days after starting',
    requiredSubjects: [
      'Arithmetic',
      'Reading',
      'Spelling',
      'Writing',
      'English',
      'Geography',
      'US History',
      'Science',
      'Health',
      'Music',
      'Visual Arts',
      'Physical Education',
    ],
    recordKeeping: 'detailed',
    assessmentRequired: true,
    assessmentType: 'standardized_test',
    assessmentFrequency: 'Grades 4, 6, 8 and annually in high school',
    minHours: 900, // Elementary: 900, Secondary: 990
    minDays: 180,
    teacherQualifications: 'Competent',
    filingDeadlines: [
      {
        name: 'Letter of Intent',
        date: 'July 1 (or within 14 days of starting)',
        description: 'Submit annual letter of intent',
      },
      {
        name: 'IHIP',
        date: 'Within 4 weeks of intent',
        description: 'Submit Individualized Home Instruction Plan',
      },
      {
        name: 'Quarterly Reports',
        date: 'Every quarter',
        description: 'Submit quarterly reports (4 per year)',
      },
      {
        name: 'Annual Assessment',
        date: 'June 30',
        description: 'Submit annual assessment by end of school year',
      },
    ],
    notes: 'New York has detailed requirements. Keep thorough records.',
  },
  PA: {
    state: 'Pennsylvania',
    stateCode: 'PA',
    requiresNotice: true,
    noticeDeadline: 'August 1',
    requiredSubjects: [
      'English',
      'Math',
      'Science',
      'Social Studies',
      'Art',
      'Music',
      'Physical Education',
      'Health',
      'Safety',
    ],
    recordKeeping: 'portfolio',
    assessmentRequired: true,
    assessmentType: 'either',
    assessmentFrequency: 'Grades 3, 5, 8',
    minHours: 900, // Elementary: 900, Secondary: 990
    minDays: 180,
    teacherQualifications: 'High school diploma',
    filingDeadlines: [
      {
        name: 'Affidavit',
        date: 'August 1',
        description: 'File notarized affidavit with superintendent',
      },
      {
        name: 'Portfolio Review',
        date: 'End of school year',
        description: 'Annual portfolio review by evaluator',
      },
    ],
    notes: 'Requires supervisor/evaluator for portfolio review.',
  },
  NC: {
    state: 'North Carolina',
    stateCode: 'NC',
    requiresNotice: true,
    noticeDeadline: 'Before starting',
    requiredSubjects: [],
    recordKeeping: 'attendance',
    assessmentRequired: true,
    assessmentType: 'standardized_test',
    assessmentFrequency: 'Annual',
    minHours: undefined,
    minDays: undefined,
    teacherQualifications: 'High school diploma',
    filingDeadlines: [
      {
        name: 'Notice of Intent',
        date: 'Before starting',
        description: 'File with DNPE (Division of Non-Public Education)',
      },
    ],
    notes: 'Must use nationally standardized test annually.',
  },
  OH: {
    state: 'Ohio',
    stateCode: 'OH',
    requiresNotice: true,
    noticeDeadline: 'Before starting (annually)',
    requiredSubjects: [
      'Language Arts',
      'Math',
      'Science',
      'Social Studies',
      'Health',
      'Physical Education',
      'Fine Arts',
    ],
    recordKeeping: 'none',
    assessmentRequired: true,
    assessmentType: 'either',
    assessmentFrequency: 'Annual',
    minHours: 900,
    minDays: undefined,
    teacherQualifications: 'High school diploma or GED',
    filingDeadlines: [
      {
        name: 'Annual Notification',
        date: 'Before starting each year',
        description: 'Submit notification to superintendent',
      },
      {
        name: 'Assessment Results',
        date: 'By school year end',
        description: 'Submit assessment or evaluation results',
      },
    ],
    notes: 'Can choose standardized test or written narrative evaluation.',
  },
  GA: {
    state: 'Georgia',
    stateCode: 'GA',
    requiresNotice: true,
    noticeDeadline: 'September 1 (or 30 days after starting)',
    requiredSubjects: ['Reading', 'Language Arts', 'Math', 'Science', 'Social Studies'],
    recordKeeping: 'attendance',
    assessmentRequired: true,
    assessmentType: 'standardized_test',
    assessmentFrequency: 'Every 3 years',
    minHours: undefined,
    minDays: 180,
    teacherQualifications: 'High school diploma or GED',
    filingDeadlines: [
      {
        name: 'Declaration of Intent',
        date: 'September 1 (or within 30 days)',
        description: 'File declaration with DOE',
      },
      {
        name: 'Attendance Report',
        date: 'End of school year',
        description: 'Submit monthly attendance by September 1',
      },
    ],
    notes: 'Standardized test required every 3 years starting grade 3.',
  },
  VA: {
    state: 'Virginia',
    stateCode: 'VA',
    requiresNotice: true,
    noticeDeadline: 'August 15',
    requiredSubjects: [],
    recordKeeping: 'none',
    assessmentRequired: true,
    assessmentType: 'either',
    assessmentFrequency: 'Annual',
    minHours: undefined,
    minDays: undefined,
    teacherQualifications: 'High school diploma (or religious exemption)',
    filingDeadlines: [
      {
        name: 'Notice of Intent',
        date: 'August 15',
        description: 'Annual notice to superintendent',
      },
      {
        name: 'Evidence of Progress',
        date: 'August 1',
        description: 'Submit test scores or evaluation by following August',
      },
    ],
    notes: 'Religious exemption available. Evidence of progress required annually.',
  },
  MI: {
    state: 'Michigan',
    stateCode: 'MI',
    requiresNotice: false,
    requiredSubjects: [
      'Math',
      'Reading',
      'English Grammar',
      'Spelling',
      'Writing',
      'Science',
      'Social Studies',
    ],
    recordKeeping: 'none',
    assessmentRequired: false,
    minHours: undefined,
    minDays: undefined,
    teacherQualifications: 'None required',
    filingDeadlines: [],
    notes: 'No notification required. Very homeschool-friendly state.',
  },
}

/**
 * Get requirements for a state
 */
export function getStateRequirements(stateCode: string): StateRequirement | null {
  return STATE_REQUIREMENTS[stateCode.toUpperCase()] || null
}

/**
 * Get all supported states
 */
export function getSupportedStates(): Array<{ code: string; name: string }> {
  return Object.entries(STATE_REQUIREMENTS).map(([code, req]) => ({
    code,
    name: req.state,
  }))
}

/**
 * Get upcoming deadlines for a state
 */
export function getUpcomingDeadlines(
  stateCode: string,
  referenceDate: Date = new Date()
): Array<{ name: string; date: Date; description: string; daysUntil: number }> {
  const requirements = getStateRequirements(stateCode)
  if (!requirements) return []

  const currentYear = referenceDate.getFullYear()
  const deadlines: Array<{ name: string; date: Date; description: string; daysUntil: number }> = []

  for (const deadline of requirements.filingDeadlines) {
    // Parse deadline date (handle various formats)
    let deadlineDate: Date | null = null

    if (deadline.date.includes('August 1')) {
      deadlineDate = new Date(currentYear, 7, 1)
    } else if (deadline.date.includes('August 15')) {
      deadlineDate = new Date(currentYear, 7, 15)
    } else if (deadline.date.includes('September 1')) {
      deadlineDate = new Date(currentYear, 8, 1)
    } else if (deadline.date.includes('October 1')) {
      deadlineDate = new Date(currentYear, 9, 1)
    } else if (deadline.date.includes('July 1')) {
      deadlineDate = new Date(currentYear, 6, 1)
    } else if (deadline.date.includes('June 30')) {
      deadlineDate = new Date(currentYear, 5, 30)
    }

    if (deadlineDate) {
      // If deadline has passed, use next year
      if (deadlineDate < referenceDate) {
        deadlineDate.setFullYear(currentYear + 1)
      }

      const daysUntil = Math.ceil(
        (deadlineDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      deadlines.push({
        name: deadline.name,
        date: deadlineDate,
        description: deadline.description,
        daysUntil,
      })
    }
  }

  return deadlines.sort((a, b) => a.daysUntil - b.daysUntil)
}
