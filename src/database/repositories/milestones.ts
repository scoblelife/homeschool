import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type {
  Milestone,
  MilestoneTemplate,
  CreateMilestone,
  UpdateMilestone,
  GradeLevel
} from '../../shared/types'
import { milestoneTemplates } from '../milestones-data'
import { seedDefaultSubjects } from '../schema'

function rowToMilestoneTemplate(row: Record<string, unknown>): MilestoneTemplate {
  return {
    id: row.id as string,
    gradeLevel: row.grade_level as GradeLevel,
    subjectId: row.subject_id as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    sortOrder: row.sort_order as number
  }
}

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
    status: row.status as 'not_started' | 'in_progress' | 'completed',
    evidenceNotes: row.evidence_notes as string,
    starValue: (row.star_value as number) ?? 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getMilestoneTemplates(gradeLevel?: GradeLevel): Promise<MilestoneTemplate[]> {
  const db = await getDatabase()
  let query = 'SELECT * FROM milestone_templates'
  const params: unknown[] = []

  if (gradeLevel) {
    query += ' WHERE grade_level = ?'
    params.push(gradeLevel)
  }

  query += ' ORDER BY sort_order'

  const rows = await db.all(query, ...params)
  return rows.map(rowToMilestoneTemplate)
}

/**
 * Fetches all milestones for a given student ordered by subject, category, and title.
 *
 * @param studentId - The student ID to retrieve milestones for
 * @returns An array of `Milestone` objects for the specified student, ordered by `subjectId`, `category`, then `title`
 */
export async function getMilestones(studentId: string): Promise<Milestone[]> {
  const db = await getDatabase()
  const rows = await db.all(
    `SELECT * FROM milestones WHERE student_id = ? ORDER BY subject_id, category, title`,
    studentId
  )
  return rows.map(rowToMilestone)
}

/**
 * Retrieve all milestones in the database.
 *
 * @returns An array of `Milestone` objects ordered by student id, subject id, category, then title
 */
export async function getAllMilestones(): Promise<Milestone[]> {
  const db = await getDatabase()
  const rows = await db.all(
    `SELECT * FROM milestones ORDER BY student_id, subject_id, category, title`
  )
  return rows.map(rowToMilestone)
}

/**
 * Fetches a milestone by its id.
 *
 * @returns The milestone matching `id` if found, `null` otherwise.
 */
export async function getMilestone(id: string): Promise<Milestone | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM milestones WHERE id = ?', id)
  return rows.length > 0 ? rowToMilestone(rows[0]) : null
}

export async function createMilestone(data: CreateMilestone): Promise<Milestone> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO milestones (
      id, student_id, subject_id, template_id, title, description, category,
      target_date, completed_date, status, evidence_notes, star_value, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.studentId,
    data.subjectId,
    data.templateId,
    data.title,
    data.description,
    data.category,
    data.targetDate,
    data.completedDate,
    data.status,
    data.evidenceNotes,
    data.starValue ?? 1,
    now,
    now
  )

  return (await getMilestone(id))!
}

export async function updateMilestone(id: string, data: UpdateMilestone): Promise<Milestone> {
  const db = await getDatabase()
  const existing = await getMilestone(id)
  if (!existing) throw new Error(`Milestone ${id} not found`)

  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }

  // Auto-set completed date when status changes to completed
  if (data.status === 'completed' && !updated.completedDate) {
    updated.completedDate = new Date().toISOString().split('T')[0]
  }
  // Clear completed date if status changes away from completed
  if (data.status && data.status !== 'completed') {
    updated.completedDate = null
  }

  await db.run(
    `UPDATE milestones SET
      title = ?, description = ?, category = ?, target_date = ?,
      completed_date = ?, status = ?, evidence_notes = ?, star_value = ?, updated_at = ?
     WHERE id = ?`,
    updated.title,
    updated.description,
    updated.category,
    updated.targetDate,
    updated.completedDate,
    updated.status,
    updated.evidenceNotes,
    updated.starValue,
    updated.updatedAt,
    id
  )

  return (await getMilestone(id))!
}

export async function deleteMilestone(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM milestones WHERE id = ?', id)
}

export async function initializeStudentMilestones(
  studentId: string,
  gradeLevel: GradeLevel
): Promise<Milestone[]> {
  const db = await getDatabase()

  // Check if student already has milestones
  const existing = await db.all<{ count: number }>(
    'SELECT COUNT(*) as count FROM milestones WHERE student_id = ?',
    studentId
  )
  if (existing[0].count > 0) {
    // Return existing milestones instead of creating duplicates
    return getMilestones(studentId)
  }

  // Ensure subjects exist before creating milestones
  const subjectCount = await db.all('SELECT COUNT(*) as count FROM subjects')
  if (subjectCount[0].count === 0) {
    // Seed subjects if missing
    await seedDefaultSubjects()
  }

  // Get templates for this grade level from the data file
  const templates = milestoneTemplates.filter((t) => t.gradeLevel === gradeLevel)
  const now = new Date().toISOString()

  // Create milestones from templates with resources
  for (const template of templates) {
    const milestoneId = uuidv4()
    const templateId = `${gradeLevel}-${template.subjectId}-${template.title}`

    await db.run(
      `INSERT INTO milestones (
        id, student_id, subject_id, template_id, title, description, category,
        target_date, completed_date, status, evidence_notes, star_value, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      milestoneId,
      studentId,
      template.subjectId,
      templateId,
      template.title,
      template.description,
      template.category,
      null,
      null,
      'not_started',
      '',
      1,
      now,
      now
    )

    // Create resources for this milestone if the template has them
    if (template.resources && template.resources.length > 0) {
      for (const resource of template.resources) {
        const resourceId = uuidv4()
        await db.run(
          `INSERT INTO milestone_resources (id, milestone_id, type, title, url, file_path, file_name, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          resourceId,
          milestoneId,
          resource.type,
          resource.title,
          resource.url,
          null,
          null,
          now
        )
      }
    }
  }

  return getMilestones(studentId)
}

export async function getSuggestedMilestones(
  studentId: string,
  count: number
): Promise<Milestone[]> {
  const db = await getDatabase()

  // Check if student has any milestones, if not auto-initialize them
  const milestoneCount = await db.all<{ count: number }>(
    'SELECT COUNT(*) as count FROM milestones WHERE student_id = ?',
    studentId
  )
  if (milestoneCount[0].count === 0) {
    // Get student's grade level and initialize milestones
    const studentRows = await db.all(
      'SELECT grade_level FROM students WHERE id = ?',
      studentId
    )
    if (studentRows.length > 0 && studentRows[0].grade_level) {
      await initializeStudentMilestones(studentId, studentRows[0].grade_level as GradeLevel)
    }
  }

  // Get all incomplete milestones grouped by subject
  const rows = await db.all(
    `SELECT * FROM milestones
     WHERE student_id = ? AND status != 'completed'
     ORDER BY
       CASE status
         WHEN 'in_progress' THEN 0
         WHEN 'not_started' THEN 1
       END,
       title`,
    studentId
  )

  const allMilestones = rows.map(rowToMilestone)

  // Group by subject
  const bySubject: Record<string, Milestone[]> = {}
  for (const m of allMilestones) {
    if (!bySubject[m.subjectId]) {
      bySubject[m.subjectId] = []
    }
    bySubject[m.subjectId].push(m)
  }

  // Round-robin pick from each subject to distribute evenly
  const result: Milestone[] = []
  const subjectIds = Object.keys(bySubject)
  const indices: Record<string, number> = {}
  subjectIds.forEach((id) => (indices[id] = 0))

  while (result.length < count) {
    let added = false
    for (const subjectId of subjectIds) {
      if (result.length >= count) break
      const idx = indices[subjectId]
      if (idx < bySubject[subjectId].length) {
        result.push(bySubject[subjectId][idx])
        indices[subjectId]++
        added = true
      }
    }
    // No more milestones available
    if (!added) break
  }

  return result
}