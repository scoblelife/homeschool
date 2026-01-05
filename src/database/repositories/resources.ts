import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type { MilestoneResource, CreateResource, WeeklyPlan } from '../../shared/types'

function rowToResource(row: Record<string, unknown>): MilestoneResource {
  return {
    id: row.id as string,
    milestoneId: row.milestone_id as string,
    type: row.type as 'url' | 'file',
    title: row.title as string,
    url: row.url as string | undefined,
    filePath: row.file_path as string | undefined,
    fileName: row.file_name as string | undefined,
    createdAt: row.created_at as string
  }
}

function rowToWeeklyPlan(row: Record<string, unknown>): WeeklyPlan {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    weekStart: row.week_start as string,
    milestoneIds: JSON.parse(row.milestone_ids as string),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getResources(milestoneId: string): Promise<MilestoneResource[]> {
  const db = await getDatabase()
  const rows = await db.all(
    'SELECT * FROM milestone_resources WHERE milestone_id = ? ORDER BY created_at',
    milestoneId
  )
  return rows.map(rowToResource)
}

export async function getResource(id: string): Promise<MilestoneResource | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM milestone_resources WHERE id = ?', id)
  return rows.length > 0 ? rowToResource(rows[0]) : null
}

export async function createResource(data: CreateResource): Promise<MilestoneResource> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO milestone_resources (id, milestone_id, type, title, url, file_path, file_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.milestoneId,
    data.type,
    data.title,
    data.url || null,
    data.filePath || null,
    data.fileName || null,
    now
  )

  return (await getResource(id))!
}

export async function deleteResource(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM milestone_resources WHERE id = ?', id)
}

export async function getWeeklyPlan(
  studentId: string,
  weekStart: string
): Promise<WeeklyPlan | null> {
  const db = await getDatabase()
  const rows = await db.all(
    'SELECT * FROM weekly_plans WHERE student_id = ? AND week_start = ?',
    studentId,
    weekStart
  )
  return rows.length > 0 ? rowToWeeklyPlan(rows[0]) : null
}

export async function saveWeeklyPlan(
  studentId: string,
  weekStart: string,
  milestoneIds: string[]
): Promise<WeeklyPlan> {
  const db = await getDatabase()
  const existing = await getWeeklyPlan(studentId, weekStart)
  const now = new Date().toISOString()

  if (existing) {
    await db.run(
      `UPDATE weekly_plans SET milestone_ids = ?, updated_at = ? WHERE id = ?`,
      JSON.stringify(milestoneIds),
      now,
      existing.id
    )
    return (await getWeeklyPlan(studentId, weekStart))!
  } else {
    const id = uuidv4()
    await db.run(
      `INSERT INTO weekly_plans (id, student_id, week_start, milestone_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      studentId,
      weekStart,
      JSON.stringify(milestoneIds),
      now,
      now
    )
    return (await getWeeklyPlan(studentId, weekStart))!
  }
}
