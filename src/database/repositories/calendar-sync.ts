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

/**
 * Convert a database `SyncRow` (snake_case) into a `CalendarSyncRecord` (camelCase).
 *
 * @param row - The database row containing calendar sync fields in snake_case
 * @returns A `CalendarSyncRecord` with fields mapped to camelCase (`studentId` may be `null`)
 */
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
 * Retrieve the calendar sync record for a given milestone and week, optionally scoped to a student.
 *
 * @param studentId - If provided, limits the lookup to the specified student's record
 * @returns A CalendarSyncRecord for the matching milestone and week, or `null` if none exists
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
 * Retrieve calendar sync records for a given week.
 *
 * If `studentId` is provided, only records for that student are returned.
 *
 * @param weekStart - The week start value used to match `week_start` in the database
 * @param studentId - Optional student identifier to scope the query; when omitted, records for all students are returned
 * @returns An array of `CalendarSyncRecord` objects matching the specified week (and student when provided)
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
 * Create or update a calendar synchronization record for a milestone and week.
 *
 * If a record exists (matching `milestoneId`, `weekStart`, and `studentId` when provided), updates its event, calendar, and `syncedAt`; otherwise inserts a new record.
 *
 * @param studentId - Optional student identifier; when omitted the record's `studentId` is stored as `null` and matching/upsert is not scoped to a particular student.
 * @returns The calendar sync record reflecting the stored fields, with `syncedAt` set to the current timestamp.
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
 * Delete the calendar_sync entry for a specific milestone and week.
 *
 * @param milestoneId - Identifier of the milestone to delete the sync for
 * @param weekStart - Week start value used to locate the sync entry
 * @param studentId - Optional student identifier; if provided, only the record for that student will be deleted
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