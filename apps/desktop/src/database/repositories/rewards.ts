import { getDatabase } from '../connection'
import { v4 as uuidv4 } from 'uuid'
import { startOfWeek, format } from 'date-fns'
import type { StudentReward, CreateReward } from '../../shared/types'

interface RewardRow {
  id: string
  student_id: string
  milestone_id: string | null
  stars_awarded: number
  awarded_date: string
  week_start: string | null
  synced_to_skylight: number // SQLite stores booleans as 0/1
  created_at: string
}

function rowToReward(row: RewardRow): StudentReward {
  return {
    id: row.id,
    studentId: row.student_id,
    milestoneId: row.milestone_id,
    starsAwarded: row.stars_awarded,
    awardedDate: row.awarded_date,
    weekStart: row.week_start,
    syncedToSkylight: row.synced_to_skylight === 1,
    createdAt: row.created_at
  }
}

/**
 * Get rewards for a student, optionally filtered by week
 */
export async function getStudentRewards(
  studentId: string,
  weekStart?: string
): Promise<StudentReward[]> {
  const db = await getDatabase()
  let query = 'SELECT * FROM student_rewards WHERE student_id = ?'
  const params: unknown[] = [studentId]

  if (weekStart) {
    query += ' AND week_start = ?'
    params.push(weekStart)
  }

  query += ' ORDER BY awarded_date DESC, created_at DESC'

  const rows = await db.all<RewardRow>(query, ...params)
  return rows.map(rowToReward)
}

/**
 * Get star totals for a student (weekly and all-time)
 */
export async function getStudentStarTotals(
  studentId: string
): Promise<{ weeklyTotal: number; allTimeTotal: number }> {
  const db = await getDatabase()
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  // Weekly total
  const weeklyResult = await db.all<{ total: number }>(
    `SELECT COALESCE(SUM(stars_awarded), 0) as total
     FROM student_rewards
     WHERE student_id = ? AND week_start = ?`,
    studentId,
    currentWeekStart
  )

  // All-time total
  const allTimeResult = await db.all<{ total: number }>(
    `SELECT COALESCE(SUM(stars_awarded), 0) as total
     FROM student_rewards
     WHERE student_id = ?`,
    studentId
  )

  return {
    weeklyTotal: weeklyResult[0]?.total || 0,
    allTimeTotal: allTimeResult[0]?.total || 0
  }
}

/**
 * Create a new reward entry
 */
export async function createReward(data: CreateReward): Promise<StudentReward> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO student_rewards (
      id, student_id, milestone_id, stars_awarded, awarded_date,
      week_start, synced_to_skylight, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.studentId,
    data.milestoneId,
    data.starsAwarded,
    data.awardedDate,
    data.weekStart,
    data.syncedToSkylight ? 1 : 0,
    now
  )

  // Fetch and return the created reward
  const rows = await db.all<RewardRow>('SELECT * FROM student_rewards WHERE id = ?', id)
  return rowToReward(rows[0])
}

/**
 * Check if a reward already exists for a milestone in a specific week
 */
export async function hasRewardForMilestone(
  milestoneId: string,
  weekStart: string
): Promise<boolean> {
  const db = await getDatabase()
  const rows = await db.all<{ count: number }>(
    `SELECT COUNT(*) as count FROM student_rewards
     WHERE milestone_id = ? AND week_start = ?`,
    milestoneId,
    weekStart
  )
  return rows[0].count > 0
}

/**
 * Mark rewards as synced to Skylight
 */
export async function markRewardsSynced(rewardIds: string[]): Promise<void> {
  if (rewardIds.length === 0) return

  const db = await getDatabase()
  const placeholders = rewardIds.map(() => '?').join(',')
  await db.run(
    `UPDATE student_rewards SET synced_to_skylight = 1 WHERE id IN (${placeholders})`,
    ...rewardIds
  )
}
