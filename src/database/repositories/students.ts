import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type { Student, CreateStudent, UpdateStudent, GradeLevel } from '../../shared/types'

function rowToStudent(row: Record<string, unknown>): Student {
  return {
    id: row.id as string,
    name: row.name as string,
    dateOfBirth: row.date_of_birth as string,
    gradeLevel: row.grade_level as GradeLevel,
    color: row.color as 'child1' | 'child2',
    calendarFeedUrl: row.calendar_feed_url as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getStudents(): Promise<Student[]> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM students ORDER BY name')
  return rows.map(rowToStudent)
}

export async function getStudent(id: string): Promise<Student | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM students WHERE id = ?', id)
  return rows.length > 0 ? rowToStudent(rows[0]) : null
}

export async function createStudent(data: CreateStudent): Promise<Student> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO students (id, name, date_of_birth, grade_level, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.name,
    data.dateOfBirth,
    data.gradeLevel,
    data.color,
    now,
    now
  )

  return (await getStudent(id))!
}

export async function updateStudent(id: string, data: UpdateStudent): Promise<Student> {
  const db = await getDatabase()
  const existing = await getStudent(id)
  if (!existing) throw new Error(`Student ${id} not found`)

  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }

  await db.run(
    `UPDATE students SET name = ?, date_of_birth = ?, grade_level = ?, color = ?, calendar_feed_url = ?, updated_at = ?
     WHERE id = ?`,
    updated.name,
    updated.dateOfBirth,
    updated.gradeLevel,
    updated.color,
    updated.calendarFeedUrl || null,
    updated.updatedAt,
    id
  )

  return (await getStudent(id))!
}

export async function deleteStudent(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM students WHERE id = ?', id)
}
