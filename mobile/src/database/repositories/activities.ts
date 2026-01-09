import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import type { Activity, CreateActivity, UpdateActivity, ActivityType } from '../../types'

function rowToActivity(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    sessionId: row.session_id as string | null,
    studentId: row.student_id as string,
    subjectId: row.subject_id as string,
    activityType: row.activity_type as ActivityType,
    title: row.title as string,
    description: row.description as string,
    dateCompleted: row.date_completed as string,
    durationMinutes: row.duration_minutes as number | null,
    grade: row.grade as number | null,
    maxGrade: row.max_grade as number | null,
    notes: row.notes as string,
    bookTitle: row.book_title as string | undefined,
    pagesRead: row.pages_read as number | undefined,
    totalPages: row.total_pages as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

interface ActivityFilters {
  studentId?: string
  subjectId?: string
  activityType?: ActivityType
  startDate?: string
  endDate?: string
}

export async function getActivities(filters?: ActivityFilters): Promise<Activity[]> {
  const db = await getDatabase()

  let query = 'SELECT * FROM activities WHERE 1=1'
  const params: (string | number | null)[] = []

  if (filters?.studentId) {
    query += ' AND student_id = ?'
    params.push(filters.studentId)
  }
  if (filters?.subjectId) {
    query += ' AND subject_id = ?'
    params.push(filters.subjectId)
  }
  if (filters?.activityType) {
    query += ' AND activity_type = ?'
    params.push(filters.activityType)
  }
  if (filters?.startDate) {
    query += ' AND date_completed >= ?'
    params.push(filters.startDate)
  }
  if (filters?.endDate) {
    query += ' AND date_completed <= ?'
    params.push(filters.endDate)
  }

  query += ' ORDER BY date_completed DESC, created_at DESC'

  const rows = await db.getAllAsync(query, ...params) as Record<string, unknown>[]
  return rows.map(rowToActivity)
}

export async function getActivity(id: string): Promise<Activity | null> {
  const db = await getDatabase()
  const row = await db.getFirstAsync('SELECT * FROM activities WHERE id = ?', id)
  return row ? rowToActivity(row as Record<string, unknown>) : null
}

export async function createActivity(data: CreateActivity): Promise<Activity> {
  const db = await getDatabase()
  const id = uuid()
  const now = new Date().toISOString()

  await db.runAsync(
    `INSERT INTO activities (id, session_id, student_id, subject_id, activity_type, title, description,
       date_completed, duration_minutes, grade, max_grade, notes, book_title, pages_read, total_pages,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.sessionId ?? null,
    data.studentId,
    data.subjectId,
    data.activityType,
    data.title,
    data.description,
    data.dateCompleted,
    data.durationMinutes ?? null,
    data.grade ?? null,
    data.maxGrade ?? null,
    data.notes,
    data.bookTitle ?? null,
    data.pagesRead ?? null,
    data.totalPages ?? null,
    now,
    now
  )

  return (await getActivity(id))!
}

export async function updateActivity(id: string, data: UpdateActivity): Promise<Activity> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const current = await getActivity(id)
  if (!current) throw new Error(`Activity ${id} not found`)

  const updated = { ...current, ...data, updatedAt: now }

  await db.runAsync(
    `UPDATE activities SET session_id = ?, student_id = ?, subject_id = ?, activity_type = ?,
       title = ?, description = ?, date_completed = ?, duration_minutes = ?, grade = ?, max_grade = ?,
       notes = ?, book_title = ?, pages_read = ?, total_pages = ?, updated_at = ?
     WHERE id = ?`,
    updated.sessionId ?? null,
    updated.studentId,
    updated.subjectId,
    updated.activityType,
    updated.title,
    updated.description,
    updated.dateCompleted,
    updated.durationMinutes ?? null,
    updated.grade ?? null,
    updated.maxGrade ?? null,
    updated.notes,
    updated.bookTitle ?? null,
    updated.pagesRead ?? null,
    updated.totalPages ?? null,
    now,
    id
  )

  return (await getActivity(id))!
}

export async function deleteActivity(id: string): Promise<void> {
  const db = await getDatabase()
  await db.runAsync('DELETE FROM activities WHERE id = ?', id)
}
