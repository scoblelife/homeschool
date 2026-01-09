import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import type { Milestone, CreateMilestone, UpdateMilestone } from '../../types'

function rowToMilestone(row: Record<string, unknown>): Milestone {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    subjectId: row.subject_id as string,
    templateId: row.template_id as string | null,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    targetDate: row.target_date as string | null,
    completedDate: row.completed_date as string | null,
    status: row.status as Milestone['status'],
    evidenceNotes: row.evidence_notes as string,
    starValue: row.star_value as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getMilestones(studentId: string): Promise<Milestone[]> {
  const db = await getDatabase()
  const rows = await db.getAllAsync(
    'SELECT * FROM milestones WHERE student_id = ? ORDER BY category, title',
    studentId
  ) as Record<string, unknown>[]
  return rows.map(rowToMilestone)
}

export async function getMilestone(id: string): Promise<Milestone | null> {
  const db = await getDatabase()
  const row = await db.getFirstAsync('SELECT * FROM milestones WHERE id = ?', id)
  return row ? rowToMilestone(row as Record<string, unknown>) : null
}

export async function createMilestone(data: CreateMilestone): Promise<Milestone> {
  const db = await getDatabase()
  const id = uuid()
  const now = new Date().toISOString()

  await db.runAsync(
    `INSERT INTO milestones (id, student_id, subject_id, template_id, title, description, category,
       target_date, completed_date, status, evidence_notes, star_value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.studentId,
    data.subjectId,
    data.templateId ?? null,
    data.title,
    data.description,
    data.category,
    data.targetDate ?? null,
    data.completedDate ?? null,
    data.status,
    data.evidenceNotes,
    data.starValue,
    now,
    now
  )

  return (await getMilestone(id))!
}

export async function updateMilestone(id: string, data: UpdateMilestone): Promise<Milestone> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const current = await getMilestone(id)
  if (!current) throw new Error(`Milestone ${id} not found`)

  const updated = { ...current, ...data, updatedAt: now }

  await db.runAsync(
    `UPDATE milestones SET subject_id = ?, title = ?, description = ?, category = ?,
       target_date = ?, completed_date = ?, status = ?, evidence_notes = ?, star_value = ?, updated_at = ?
     WHERE id = ?`,
    updated.subjectId,
    updated.title,
    updated.description,
    updated.category,
    updated.targetDate ?? null,
    updated.completedDate ?? null,
    updated.status,
    updated.evidenceNotes,
    updated.starValue,
    now,
    id
  )

  return (await getMilestone(id))!
}

export async function deleteMilestone(id: string): Promise<void> {
  const db = await getDatabase()
  await db.runAsync('DELETE FROM milestones WHERE id = ?', id)
}

export async function getSuggestedMilestones(studentId: string, count: number): Promise<Milestone[]> {
  const db = await getDatabase()
  const rows = await db.getAllAsync(
    `SELECT * FROM milestones
     WHERE student_id = ? AND status IN ('not_started', 'in_progress')
     ORDER BY
       CASE status WHEN 'in_progress' THEN 0 ELSE 1 END,
       target_date ASC NULLS LAST,
       created_at ASC
     LIMIT ?`,
    studentId,
    count
  ) as Record<string, unknown>[]
  return rows.map(rowToMilestone)
}
