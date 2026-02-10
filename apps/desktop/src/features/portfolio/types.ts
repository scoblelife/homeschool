/**
 * Portfolio export types
 */

import type { Student, Activity, AttendanceRecord } from '../../shared/types'

export interface PortfolioSection {
  id: string
  name: string
  enabled: boolean
}

export interface PortfolioConfig {
  title: string
  subtitle?: string
  schoolYear: string
  studentId: string
  dateRange: {
    startDate: string
    endDate: string
  }
  sections: PortfolioSection[]
  includePhotos: boolean
  includeSummaryStats: boolean
}

export const DEFAULT_SECTIONS: PortfolioSection[] = [
  { id: 'cover', name: 'Cover Page', enabled: true },
  { id: 'student-info', name: 'Student Information', enabled: true },
  { id: 'attendance', name: 'Attendance Record', enabled: true },
  { id: 'activities', name: 'Learning Activities', enabled: true },
  { id: 'subjects', name: 'Subject Summaries', enabled: true },
  { id: 'reading', name: 'Reading Log', enabled: true },
  { id: 'milestones', name: 'Milestones', enabled: true },
  { id: 'photos', name: 'Photo Gallery', enabled: false }
]

export interface PortfolioData {
  student: Student
  schoolYear: string
  dateRange: { startDate: string; endDate: string }
  attendance: {
    records: AttendanceRecord[]
    stats: {
      totalDays: number
      schoolDays: number
      absences: number
      percentage: number
    }
  }
  activities: {
    all: Activity[]
    bySubject: Record<string, {
      subjectName: string
      activities: Activity[]
      totalMinutes: number
      count: number
    }>
  }
  subjects: {
    id: string
    name: string
    totalActivities: number
    totalMinutes: number
  }[]
  reading: {
    booksCompleted: number
    currentlyReading: number
    books: Array<{
      title: string
      author?: string
      status: string
      pagesRead?: number
      totalPages?: number
    }>
  }
  milestones: {
    completed: number
    inProgress: number
    total: number
    items: Array<{
      title: string
      subject: string
      status: string
      completedDate?: string
    }>
  }
  photos: Array<{
    path: string
    activityTitle: string
    date: string
  }>
}

export interface GeneratePDFOptions {
  config: PortfolioConfig
  outputPath: string
}

export interface GeneratePDFResult {
  success: boolean
  filePath?: string
  error?: string
}
