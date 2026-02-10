import type { ActivityType, GradeLevel } from './enums'
import type { LearningStandard } from './entities'

export interface ActivitySummary {
  subjectId: string
  subjectName: string
  totalActivities: number
  totalMinutes: number
  averageGrade: number | null
  byType: Record<ActivityType, number>
}

export interface DailySummary {
  date: string
  sessionsCount: number
  activitiesCount: number
  totalMinutes: number
}

export interface CurriculumReport {
  gradeLevel: GradeLevel
  totalStandards: number
  coveredStandards: number
  coveragePercent: number
  bySubject: {
    subjectId: string
    subjectName: string
    total: number
    covered: number
    coveragePercent: number
  }[]
  byDomain: {
    domain: string
    total: number
    covered: number
    coveragePercent: number
  }[]
  uncoveredStandards: LearningStandard[]
}

export interface StandardCoverage {
  standard: LearningStandard
  activityCount: number
  totalMinutes: number
  lastActivity?: string // date
}
