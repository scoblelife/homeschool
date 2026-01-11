/**
 * Portfolio Data Collector
 * Gathers all data needed for portfolio generation
 */

import {
  studentsRepo,
  subjectsRepo,
  activitiesRepo,
  attendanceRepo,
  milestonesRepo,
  booksRepo,
  attachmentsRepo
} from '../../database'
import type { PortfolioData, PortfolioConfig } from './types'

export async function collectPortfolioData(config: PortfolioConfig): Promise<PortfolioData> {
  const { studentId, dateRange } = config
  const { startDate, endDate } = dateRange

  // Get student
  const student = await studentsRepo.getStudent(studentId)
  if (!student) {
    throw new Error('Student not found')
  }

  // Get all subjects
  const subjects = await subjectsRepo.getSubjects()
  const subjectMap = new Map(subjects.map(s => [s.id, s]))

  // Get attendance
  const attendanceRecords = await attendanceRepo.getAttendanceRecords(studentId, startDate, endDate)
  const attendanceStats = await attendanceRepo.getAttendanceStats(studentId, startDate, endDate)

  // Get activities
  const activities = await activitiesRepo.getActivities({
    studentId,
    startDate,
    endDate
  })

  // Group activities by subject
  const activitiesBySubject: Record<string, {
    subjectName: string
    activities: typeof activities
    totalMinutes: number
    count: number
  }> = {}

  for (const activity of activities) {
    const subject = subjectMap.get(activity.subjectId)
    const subjectName = subject?.name || 'Unknown'

    if (!activitiesBySubject[activity.subjectId]) {
      activitiesBySubject[activity.subjectId] = {
        subjectName,
        activities: [],
        totalMinutes: 0,
        count: 0
      }
    }

    activitiesBySubject[activity.subjectId].activities.push(activity)
    activitiesBySubject[activity.subjectId].totalMinutes += activity.durationMinutes || 0
    activitiesBySubject[activity.subjectId].count++
  }

  // Calculate subject summaries
  const subjectSummaries = Object.entries(activitiesBySubject).map(([id, data]) => ({
    id,
    name: data.subjectName,
    totalActivities: data.count,
    totalMinutes: data.totalMinutes
  }))

  // Get milestones
  const milestones = await milestonesRepo.getMilestones(studentId)
  const completedMilestones = milestones.filter(m => m.status === 'completed')
  const inProgressMilestones = milestones.filter(m => m.status === 'in_progress')

  const milestoneItems = milestones.map(m => {
    const subject = subjectMap.get(m.subjectId)
    return {
      title: m.title,
      subject: subject?.name || 'Unknown',
      status: m.status,
      completedDate: m.completedDate || undefined
    }
  })

  // Get books
  const booksWithProgress = await booksRepo.getBooksWithProgress(studentId)
  const completedBooks = booksWithProgress.filter(
    b => b.studentProgress?.status === 'finished'
  )
  const readingBooks = booksWithProgress.filter(
    b => b.studentProgress?.status === 'reading'
  )

  const bookItems = booksWithProgress
    .filter(b => b.studentProgress)
    .map(b => ({
      title: b.title,
      author: b.author,
      status: b.studentProgress!.status,
      pagesRead: b.studentProgress!.currentPage,
      totalPages: b.totalPages
    }))

  // Get photos from activity attachments
  const activityIds = activities.map(a => a.id)
  const attachmentsMap = activityIds.length > 0
    ? await attachmentsRepo.getAttachmentsForActivities(activityIds)
    : new Map()

  const photos: PortfolioData['photos'] = []
  for (const activity of activities) {
    const attachments = attachmentsMap.get(activity.id) || []
    for (const attachment of attachments) {
      if (attachment.fileType.startsWith('image/')) {
        photos.push({
          path: attachment.filePath,
          activityTitle: activity.title,
          date: activity.dateCompleted
        })
      }
    }
  }

  return {
    student,
    schoolYear: config.schoolYear,
    dateRange,
    attendance: {
      records: attendanceRecords,
      stats: attendanceStats
    },
    activities: {
      all: activities,
      bySubject: activitiesBySubject
    },
    subjects: subjectSummaries,
    reading: {
      booksCompleted: completedBooks.length,
      currentlyReading: readingBooks.length,
      books: bookItems
    },
    milestones: {
      completed: completedMilestones.length,
      inProgress: inProgressMilestones.length,
      total: milestones.length,
      items: milestoneItems
    },
    photos
  }
}
