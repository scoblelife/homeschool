import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type { Session, CreateSession, UpdateSession } from '../../shared/types'

function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    subjectId: row.subject_id as string,
    date: row.date as string,
    startTime: row.start_time as string | null,
    endTime: row.end_time as string | null,
    notes: row.notes as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getSessions(filters?: {
  studentId?: string
  startDate?: string
  endDate?: string
}): Promise<Session[]> {
  const db = await getDatabase()
  let query = 'SELECT * FROM sessions WHERE 1=1'
  const params: unknown[] = []

  if (filters?.studentId) {
    query += ' AND student_id = ?'
    params.push(filters.studentId)
  }
  if (filters?.startDate) {
    query += ' AND date >= ?'
    params.push(filters.startDate)
  }
  if (filters?.endDate) {
    query += ' AND date <= ?'
    params.push(filters.endDate)
  }

  query += ' ORDER BY date DESC, start_time DESC'

  const rows = await db.all(query, ...params)
  return rows.map(rowToSession)
}

export async function getSession(id: string): Promise<Session | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM sessions WHERE id = ?', id)
  return rows.length > 0 ? rowToSession(rows[0]) : null
}

export async function createSession(data: CreateSession): Promise<Session> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO sessions (id, student_id, subject_id, date, start_time, end_time, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.studentId,
    data.subjectId,
    data.date,
    data.startTime,
    data.endTime,
    data.notes,
    now,
    now
  )

  return (await getSession(id))!
}

export async function updateSession(id: string, data: UpdateSession): Promise<Session> {
  const db = await getDatabase()
  const existing = await getSession(id)
  if (!existing) throw new Error(`Session ${id} not found`)

  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }

  await db.run(
    `UPDATE sessions SET student_id = ?, subject_id = ?, date = ?, start_time = ?, end_time = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    updated.studentId,
    updated.subjectId,
    updated.date,
    updated.startTime,
    updated.endTime,
    updated.notes,
    updated.updatedAt,
    id
  )

  return (await getSession(id))!
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM sessions WHERE id = ?', id)
}
