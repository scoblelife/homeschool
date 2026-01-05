import { getDatabase } from '../connection'
import { v4 as uuidv4 } from 'uuid'
import type { FamilyGoal, CreateFamilyGoal, UpdateFamilyGoal } from '../../shared/types'

interface GoalRow {
  id: string
  title: string
  star_target: number
  reward_description: string | null
  start_date: string | null
  end_date: string | null
  achieved_at: string | null
  created_at: string
}

function rowToGoal(row: GoalRow): FamilyGoal {
  return {
    id: row.id,
    title: row.title,
    starTarget: row.star_target,
    rewardDescription: row.reward_description,
    startDate: row.start_date,
    endDate: row.end_date,
    achievedAt: row.achieved_at,
    createdAt: row.created_at
  }
}

/**
 * Get all family goals
 */
export async function getFamilyGoals(): Promise<FamilyGoal[]> {
  const db = await getDatabase()
  const rows = await db.all<GoalRow>('SELECT * FROM family_goals ORDER BY created_at DESC')
  return rows.map(rowToGoal)
}

/**
 * Get the active (unachieved) family goal, if any
 */
export async function getActiveFamilyGoal(): Promise<FamilyGoal | null> {
  const db = await getDatabase()
  const rows = await db.all<GoalRow>(
    `SELECT * FROM family_goals
     WHERE achieved_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`
  )
  return rows.length > 0 ? rowToGoal(rows[0]) : null
}

/**
 * Get a family goal by ID
 */
export async function getFamilyGoal(id: string): Promise<FamilyGoal | null> {
  const db = await getDatabase()
  const rows = await db.all<GoalRow>('SELECT * FROM family_goals WHERE id = ?', id)
  return rows.length > 0 ? rowToGoal(rows[0]) : null
}

/**
 * Create a new family goal
 */
export async function createFamilyGoal(data: CreateFamilyGoal): Promise<FamilyGoal> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO family_goals (
      id, title, star_target, reward_description, start_date, end_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.title,
    data.starTarget,
    data.rewardDescription,
    data.startDate,
    data.endDate,
    now
  )

  return (await getFamilyGoal(id))!
}

/**
 * Update a family goal
 */
export async function updateFamilyGoal(id: string, data: UpdateFamilyGoal): Promise<FamilyGoal> {
  const db = await getDatabase()
  const existing = await getFamilyGoal(id)
  if (!existing) throw new Error(`Family goal ${id} not found`)

  const updated = { ...existing, ...data }

  await db.run(
    `UPDATE family_goals SET
      title = ?, star_target = ?, reward_description = ?, start_date = ?, end_date = ?
     WHERE id = ?`,
    updated.title,
    updated.starTarget,
    updated.rewardDescription,
    updated.startDate,
    updated.endDate,
    id
  )

  return (await getFamilyGoal(id))!
}

/**
 * Delete a family goal
 */
export async function deleteFamilyGoal(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM family_goals WHERE id = ?', id)
}

/**
 * Mark a family goal as achieved
 */
export async function achieveFamilyGoal(id: string): Promise<FamilyGoal> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  await db.run('UPDATE family_goals SET achieved_at = ? WHERE id = ?', now, id)

  return (await getFamilyGoal(id))!
}

/**
 * Get total stars earned by all students (family total)
 */
export async function getFamilyTotalStars(): Promise<number> {
  const db = await getDatabase()
  const result = await db.all<{ total: number }>(
    `SELECT COALESCE(SUM(stars_awarded), 0) as total FROM student_rewards`
  )
  return result[0]?.total || 0
}
