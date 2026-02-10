import { getDatabase } from '../index'
import { v4 as uuidv4 } from 'uuid'

export interface CalendarSyncRecord {
  id: string
  milestoneId: string
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
  week_start: string
  google_event_id: string
  calendar_id: string
  synced_at: string
}

function rowToSyncRecord(row: SyncRow): CalendarSyncRecord {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    weekStart: row.week_start,
    googleEventId: row.google_event_id,
    calendarId: row.calendar_id,
    syncedAt: row.synced_at
  }
}

/**
 * Get sync record for a milestone in a specific week
 */
export async function getSyncRecord(
  milestoneId: string,
  weekStart: string
): Promise<CalendarSyncRecord | null> {
  const db = await getDatabase()
  const rows = await db.all<SyncRow>(
    `SELECT * FROM calendar_sync WHERE milestone_id = ? AND week_start = ?`,
    milestoneId,
    weekStart
  )

  if (rows.length === 0) return null

  return rowToSyncRecord(rows[0])
}

/**
 * Get all sync records for a week
 */
export async function getSyncRecordsForWeek(weekStart: string): Promise<CalendarSyncRecord[]> {
  const db = await getDatabase()
  const rows = await db.all<SyncRow>(`SELECT * FROM calendar_sync WHERE week_start = ?`, weekStart)

  return rows.map(rowToSyncRecord)
}

/**
 * Create or update sync record
 */
export async function upsertSyncRecord(
  milestoneId: string,
  weekStart: string,
  googleEventId: string,
  calendarId: string
): Promise<CalendarSyncRecord> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  // Try to find existing record
  const existing = await getSyncRecord(milestoneId, weekStart)

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
      `INSERT INTO calendar_sync (id, milestone_id, week_start, google_event_id, calendar_id, synced_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      milestoneId,
      weekStart,
      googleEventId,
      calendarId,
      now
    )
    return {
      id,
      milestoneId,
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
export async function deleteSyncRecord(milestoneId: string, weekStart: string): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `DELETE FROM calendar_sync WHERE milestone_id = ? AND week_start = ?`,
    milestoneId,
    weekStart
  )
}

/**
 * Delete all sync records for a week
 */
export async function deleteSyncRecordsForWeek(weekStart: string): Promise<void> {
  const db = await getDatabase()
  await db.run(`DELETE FROM calendar_sync WHERE week_start = ?`, weekStart)
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
