import { getDatabase } from '../connection'
import type { ActivitySummary, DailySummary, ActivityType } from '../../shared/types'

export async function getActivitySummary(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<ActivitySummary[]> {
  const db = await getDatabase()

  const rows = await db.all(
    `SELECT
      s.id as subject_id,
      s.name as subject_name,
      COUNT(a.id) as total_activities,
      COALESCE(SUM(a.duration_minutes), 0) as total_minutes,
      AVG(CASE WHEN a.max_grade > 0 THEN (a.grade / a.max_grade) * 100 END) as average_grade,
      a.activity_type
    FROM subjects s
    LEFT JOIN activities a ON a.subject_id = s.id
      AND a.student_id = ?
      AND a.date_completed >= ?
      AND a.date_completed <= ?
    GROUP BY s.id, s.name, a.activity_type
    ORDER BY s.name`,
    studentId,
    startDate,
    endDate
  )

  // Aggregate by subject
  const summaryMap = new Map<string, ActivitySummary>()

  for (const row of rows) {
    const subjectId = row.subject_id as string
    if (!summaryMap.has(subjectId)) {
      summaryMap.set(subjectId, {
        subjectId,
        subjectName: row.subject_name as string,
        totalActivities: 0,
        totalMinutes: 0,
        averageGrade: null,
        byType: {
          worksheet: 0,
          video: 0,
          reading: 0,
          writing: 0,          // MERGED: was writing_print + writing_cursive
          hands_on: 0,
          interactive: 0       // MERGED: was game + assessment + field_trip
        }
      })
    }

    const summary = summaryMap.get(subjectId)!
    const activityType = row.activity_type as ActivityType | null
    const count = Number(row.total_activities) || 0

    summary.totalActivities += count
    summary.totalMinutes += Number(row.total_minutes) || 0

    if (row.average_grade !== null) {
      summary.averageGrade = Number(row.average_grade)
    }

    if (activityType && activityType in summary.byType) {
      summary.byType[activityType] = count
    }
  }

  return Array.from(summaryMap.values())
}

export async function getDailySummaries(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<DailySummary[]> {
  const db = await getDatabase()

  const rows = await db.all(
    `SELECT
      date_completed as date,
      COUNT(DISTINCT session_id) as sessions_count,
      COUNT(*) as activities_count,
      COALESCE(SUM(duration_minutes), 0) as total_minutes
    FROM activities
    WHERE student_id = ?
      AND date_completed >= ?
      AND date_completed <= ?
    GROUP BY date_completed
    ORDER BY date_completed DESC`,
    studentId,
    startDate,
    endDate
  )

  return rows.map((row) => ({
    date: row.date as string,
    sessionsCount: Number(row.sessions_count) || 0,
    activitiesCount: Number(row.activities_count) || 0,
    totalMinutes: Number(row.total_minutes) || 0
  }))
}
