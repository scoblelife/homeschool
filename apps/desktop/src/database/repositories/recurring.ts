/**
 * Recurring Activities Repository
 *
 * CRUD operations for recurring activity templates.
 */

import { getDatabase } from '../connection'
import { v4 as uuidv4 } from 'uuid'
import type {
  RecurringActivity,
  CreateRecurringActivity,
  UpdateRecurringActivity
} from '../../shared/types'

interface RecurringActivityRow {
  id: string
  student_id: string
  subject_id: string
  title: string
  activity_type: string
  duration_minutes: number | null
  recurrence_pattern: string
  recurrence_days: string | null
  start_time: string | null
  is_active: number
  last_logged_date: string | null
  created_at: string
  updated_at: string
}

function rowToRecurringActivity(row: RecurringActivityRow): RecurringActivity {
  return {
    id: row.id,
    studentId: row.student_id,
    subjectId: row.subject_id,
    title: row.title,
    activityType: row.activity_type as RecurringActivity['activityType'],
    durationMinutes: row.duration_minutes,
    recurrencePattern: row.recurrence_pattern as RecurringActivity['recurrencePattern'],
    recurrenceDays: row.recurrence_days ? JSON.parse(row.recurrence_days) : null,
    startTime: row.start_time,
    isActive: row.is_active === 1,
    lastLoggedDate: row.last_logged_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export async function getRecurringActivities(studentId?: string): Promise<RecurringActivity[]> {
  const db = await getDatabase()
  let query = 'SELECT * FROM recurring_activities WHERE is_active = 1'
  const params: string[] = []

  if (studentId) {
    query += ' AND student_id = ?'
    params.push(studentId)
  }

  query += ' ORDER BY start_time ASC, title ASC'

  const rows = await db.all<RecurringActivityRow>(query, ...params)
  return rows.map(rowToRecurringActivity)
}

export async function getRecurringActivity(id: string): Promise<RecurringActivity | null> {
  const db = await getDatabase()
  const rows = await db.all<RecurringActivityRow>(
    'SELECT * FROM recurring_activities WHERE id = ?',
    id
  )
  return rows.length > 0 ? rowToRecurringActivity(rows[0]) : null
}

export async function createRecurringActivity(
  data: CreateRecurringActivity
): Promise<RecurringActivity> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO recurring_activities (
      id, student_id, subject_id, title, activity_type, duration_minutes,
      recurrence_pattern, recurrence_days, start_time, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.studentId,
    data.subjectId,
    data.title,
    data.activityType,
    data.durationMinutes,
    data.recurrencePattern,
    data.recurrenceDays ? JSON.stringify(data.recurrenceDays) : null,
    data.startTime,
    data.isActive ? 1 : 0,
    now,
    now
  )

  const created = await getRecurringActivity(id)
  if (!created) throw new Error('Failed to create recurring activity')

  return created
}

export async function updateRecurringActivity(
  id: string,
  data: UpdateRecurringActivity
): Promise<RecurringActivity | null> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const updates: string[] = ['updated_at = ?']
  const params: (string | number | null)[] = [now]

  if (data.subjectId !== undefined) {
    updates.push('subject_id = ?')
    params.push(data.subjectId)
  }
  if (data.title !== undefined) {
    updates.push('title = ?')
    params.push(data.title)
  }
  if (data.activityType !== undefined) {
    updates.push('activity_type = ?')
    params.push(data.activityType)
  }
  if (data.durationMinutes !== undefined) {
    updates.push('duration_minutes = ?')
    params.push(data.durationMinutes)
  }
  if (data.recurrencePattern !== undefined) {
    updates.push('recurrence_pattern = ?')
    params.push(data.recurrencePattern)
  }
  if (data.recurrenceDays !== undefined) {
    updates.push('recurrence_days = ?')
    params.push(data.recurrenceDays ? JSON.stringify(data.recurrenceDays) : null)
  }
  if (data.startTime !== undefined) {
    updates.push('start_time = ?')
    params.push(data.startTime)
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?')
    params.push(data.isActive ? 1 : 0)
  }

  params.push(id)

  await db.run(
    `UPDATE recurring_activities SET ${updates.join(', ')} WHERE id = ?`,
    ...params
  )

  return getRecurringActivity(id)
}

export async function markRecurringActivityLogged(
  id: string,
  date: string
): Promise<void> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  await db.run(
    `UPDATE recurring_activities SET last_logged_date = ?, updated_at = ? WHERE id = ?`,
    date,
    now,
    id
  )
}

export async function deleteRecurringActivity(id: string): Promise<boolean> {
  const db = await getDatabase()
  // Check if exists first
  const existing = await getRecurringActivity(id)
  if (!existing) return false

  await db.run('DELETE FROM recurring_activities WHERE id = ?', id)
  return true
}

/**
 * Get recurring activities that are due today based on their recurrence pattern
 */
export async function getDueRecurringActivities(
  studentId?: string,
  date?: string
): Promise<RecurringActivity[]> {
  const targetDate = date ? new Date(date) : new Date()
  const dayOfWeek = targetDate.getDay() // 0=Sun, 1=Mon, ... 6=Sat
  const dateStr = targetDate.toISOString().split('T')[0]

  const allActive = await getRecurringActivities(studentId)

  return allActive.filter((activity) => {
    // Skip if already logged today
    if (activity.lastLoggedDate === dateStr) {
      return false
    }

    switch (activity.recurrencePattern) {
      case 'daily':
        return true

      case 'weekdays':
        // Monday (1) through Friday (5)
        return dayOfWeek >= 1 && dayOfWeek <= 5

      case 'weekly':
        // For weekly, use the day the activity was created or first day in recurrenceDays
        if (activity.recurrenceDays && activity.recurrenceDays.length > 0) {
          return activity.recurrenceDays.includes(dayOfWeek)
        }
        // Default to Monday for weekly without specific days
        return dayOfWeek === 1

      case 'custom':
        // Custom days specified in recurrenceDays
        if (activity.recurrenceDays && activity.recurrenceDays.length > 0) {
          return activity.recurrenceDays.includes(dayOfWeek)
        }
        return false

      default:
        return false
    }
  })
}
