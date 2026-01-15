import { getDatabase } from '../index'
import { v4 as uuidv4 } from 'uuid'

export interface CalendarSyncRecord {
  id: string
  milestoneId: string
  studentId: string | null
  weekStart: string
  googleEventId: string
  calendarId: string
  syncedAt: string
}

export interface UserSetting {
  key: string
  value: string
  updatedAt: string
}

// Calendar Sync Operations

interface SyncRow {
  id: string
  milestone_id: string
  student_id: string | null
  week_start: string
  google_event_id: string
  calendar_id: string
  synced_at: string
}

function rowToSyncRecord(row: SyncRow): CalendarSyncRecord {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    studentId: row.student_id,
    weekStart: row.week_start,
    googleEventId: row.google_event_id,
    calendarId: row.calendar_id,
    syncedAt: row.synced_at
  }
}

/**
 * Get sync record for a milestone in a specific week for a student
 */
export async function getSyncRecord(
  milestoneId: string,
  weekStart: string,
  studentId?: string
): Promise<CalendarSyncRecord | null> {
  const db = await getDatabase()
  let query = `SELECT * FROM calendar_sync WHERE milestone_id = ? AND week_start = ?`
  const params: (string | null)[] = [milestoneId, weekStart]

  if (studentId) {
    query += ` AND student_id = ?`
    params.push(studentId)
  }

  const rows = await db.all<SyncRow>(query, ...params)

  if (rows.length === 0) return null

  return rowToSyncRecord(rows[0])
}

/**
 * Get all sync records for a week, optionally filtered by student
 */
export async function getSyncRecordsForWeek(
  weekStart: string,
  studentId?: string
): Promise<CalendarSyncRecord[]> {
  const db = await getDatabase()
  let query = `SELECT * FROM calendar_sync WHERE week_start = ?`
  const params: (string | null)[] = [weekStart]

  if (studentId) {
    query += ` AND student_id = ?`
    params.push(studentId)
  }

  const rows = await db.all<SyncRow>(query, ...params)

  return rows.map(rowToSyncRecord)
}

/**
 * Create or update sync record
 */
export async function upsertSyncRecord(
  milestoneId: string,
  weekStart: string,
  googleEventId: string,
  calendarId: string,
  studentId?: string
): Promise<CalendarSyncRecord> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  // Try to find existing record
  const existing = await getSyncRecord(milestoneId, weekStart, studentId)

  if (existing) {
    // Update existing record
    await db.run(
      `UPDATE calendar_sync
       SET google_event_id = ?, calendar_id = ?, synced_at = ?
       WHERE id = ?`,
      googleEventId,
      calendarId,
      now,
      existing.id
    )
    return { ...existing, googleEventId, calendarId, syncedAt: now }
  } else {
    // Create new record
    const id = uuidv4()
    await db.run(
      `INSERT INTO calendar_sync (id, milestone_id, student_id, week_start, google_event_id, calendar_id, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      milestoneId,
      studentId || null,
      weekStart,
      googleEventId,
      calendarId,
      now
    )
    return {
      id,
      milestoneId,
      studentId: studentId || null,
      weekStart,
      googleEventId,
      calendarId,
      syncedAt: now
    }
  }
}

/**
 * Delete sync record
 */
export async function deleteSyncRecord(
  milestoneId: string,
  weekStart: string,
  studentId?: string
): Promise<void> {
  const db = await getDatabase()
  let query = `DELETE FROM calendar_sync WHERE milestone_id = ? AND week_start = ?`
  const params: (string | null)[] = [milestoneId, weekStart]

  if (studentId) {
    query += ` AND student_id = ?`
    params.push(studentId)
  }

  await db.run(query, ...params)
}

/**
 * Delete all sync records for a week, optionally filtered by student
 */
export async function deleteSyncRecordsForWeek(
  weekStart: string,
  studentId?: string
): Promise<void> {
  const db = await getDatabase()
  let query = `DELETE FROM calendar_sync WHERE week_start = ?`
  const params: (string | null)[] = [weekStart]

  if (studentId) {
    query += ` AND student_id = ?`
    params.push(studentId)
  }

  await db.run(query, ...params)
}

// User Settings Operations

/**
 * Get a user setting
 */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase()
  const rows = await db.all<{ value: string }>(
    `SELECT value FROM user_settings WHERE key = ?`,
    key
  )
  return rows.length > 0 ? rows[0].value : null
}

/**
 * Set a user setting
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO user_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    now
  )
}

/**
 * Delete a user setting
 */
export async function deleteSetting(key: string): Promise<void> {
  const db = await getDatabase()
  await db.run(`DELETE FROM user_settings WHERE key = ?`, key)
}

// Setting Keys
export const SETTING_KEYS = {
  GOOGLE_CALENDAR_ID: 'google_calendar_id',
  SYNC_ALL_DAY_EVENTS: 'sync_all_day_events',
  SYNC_ENABLED: 'sync_enabled'
} as const
