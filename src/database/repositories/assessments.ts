/**
 * Assessments Repository
 *
 * CRUD operations for tracking standardized tests, evaluations, and assessments.
 */

import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type { Assessment, CreateAssessment, UpdateAssessment, AssessmentType, UniversalStatus } from '../../shared/types'

function rowToAssessment(row: Record<string, unknown>): Assessment {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    type: row.type as AssessmentType,
    name: row.name as string,
    provider: row.provider as string | null,
    date: row.date as string,
    scheduledTime: row.scheduled_time as string | null,
    location: row.location as string | null,
    status: row.status as UniversalStatus,
    score: row.score as string | null,
    percentile: row.percentile as number | null,
    gradeEquivalent: row.grade_equivalent as string | null,
    resultsUrl: row.results_url as string | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getAssessments(studentId?: string): Promise<Assessment[]> {
  const db = await getDatabase()

  let query = 'SELECT * FROM assessments'
  const params: string[] = []

  if (studentId) {
    query += ' WHERE student_id = ?'
    params.push(studentId)
  }

  query += ' ORDER BY date DESC, created_at DESC'

  const rows = await db.all(query, ...params)
  return rows.map(rowToAssessment)
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const db = await getDatabase()
  const row = await db.all('SELECT * FROM assessments WHERE id = ?', id)
  return row.length > 0 ? rowToAssessment(row[0]) : null
}

export async function getUpcomingAssessments(studentId?: string): Promise<Assessment[]> {
  const db = await getDatabase()
  const today = new Date().toISOString().split('T')[0]

  let query = `SELECT * FROM assessments WHERE date >= ? AND status = 'scheduled'`
  const params: string[] = [today]

  if (studentId) {
    query += ' AND student_id = ?'
    params.push(studentId)
  }

  query += ' ORDER BY date ASC'

  const rows = await db.all(query, ...params)
  return rows.map(rowToAssessment)
}

export async function getAssessmentsByDateRange(
  startDate: string,
  endDate: string,
  studentId?: string
): Promise<Assessment[]> {
  const db = await getDatabase()

  let query = 'SELECT * FROM assessments WHERE date >= ? AND date <= ?'
  const params: string[] = [startDate, endDate]

  if (studentId) {
    query += ' AND student_id = ?'
    params.push(studentId)
  }

  query += ' ORDER BY date ASC'

  const rows = await db.all(query, ...params)
  return rows.map(rowToAssessment)
}

export async function createAssessment(assessment: CreateAssessment): Promise<Assessment> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO assessments (
      id, student_id, type, name, provider, date, scheduled_time,
      location, status, score, percentile, grade_equivalent, results_url, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    assessment.studentId,
    assessment.type,
    assessment.name,
    assessment.provider,
    assessment.date,
    assessment.scheduledTime,
    assessment.location,
    assessment.status,
    assessment.score,
    assessment.percentile,
    assessment.gradeEquivalent,
    assessment.resultsUrl,
    assessment.notes,
    now,
    now
  )

  return (await getAssessmentById(id))!
}

export async function updateAssessment(
  id: string,
  updates: UpdateAssessment
): Promise<Assessment | null> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const fields: string[] = ['updated_at = ?']
  const params: (string | number | null)[] = [now]

  if (updates.type !== undefined) {
    fields.push('type = ?')
    params.push(updates.type)
  }
  if (updates.name !== undefined) {
    fields.push('name = ?')
    params.push(updates.name)
  }
  if (updates.provider !== undefined) {
    fields.push('provider = ?')
    params.push(updates.provider)
  }
  if (updates.date !== undefined) {
    fields.push('date = ?')
    params.push(updates.date)
  }
  if (updates.scheduledTime !== undefined) {
    fields.push('scheduled_time = ?')
    params.push(updates.scheduledTime)
  }
  if (updates.location !== undefined) {
    fields.push('location = ?')
    params.push(updates.location)
  }
  if (updates.status !== undefined) {
    fields.push('status = ?')
    params.push(updates.status)
  }
  if (updates.score !== undefined) {
    fields.push('score = ?')
    params.push(updates.score)
  }
  if (updates.percentile !== undefined) {
    fields.push('percentile = ?')
    params.push(updates.percentile)
  }
  if (updates.gradeEquivalent !== undefined) {
    fields.push('grade_equivalent = ?')
    params.push(updates.gradeEquivalent)
  }
  if (updates.resultsUrl !== undefined) {
    fields.push('results_url = ?')
    params.push(updates.resultsUrl)
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?')
    params.push(updates.notes)
  }

  params.push(id)

  await db.run(`UPDATE assessments SET ${fields.join(', ')} WHERE id = ?`, ...params)

  return getAssessmentById(id)
}

export async function deleteAssessment(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM assessments WHERE id = ?', id)
}

// Get assessment statistics for portfolio/reports
export async function getAssessmentStats(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  total: number
  completed: number
  scheduled: number
  byType: Record<AssessmentType, number>
}> {
  const db = await getDatabase()

  let query = `SELECT type, status FROM assessments WHERE student_id = ?`
  const params: string[] = [studentId]

  if (startDate) {
    query += ' AND date >= ?'
    params.push(startDate)
  }
  if (endDate) {
    query += ' AND date <= ?'
    params.push(endDate)
  }

  const rows = await db.all(query, ...params)

  const byType: Record<AssessmentType, number> = {
    standardized_test: 0,
    evaluation: 0,
    portfolio_review: 0,
    progress_assessment: 0,
    other: 0,
  }

  let completed = 0
  let scheduled = 0

  for (const row of rows) {
    const type = row.type as AssessmentType
    const status = row.status as UniversalStatus

    byType[type]++

    if (status === 'completed') {
      completed++
    } else if (status === 'not_started') {
      scheduled++
    }
  }

  return {
    total: rows.length,
    completed,
    scheduled,
    byType,
  }
}
