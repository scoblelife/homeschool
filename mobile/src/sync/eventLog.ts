/**
 * Event Log - stores sync events in SQLite for persistence
 */

import { SyncEvent, HLCTimestamp } from './events'
import { HybridLogicalClock } from './hlc'
import { getDatabase } from '../database/connection'

export class EventLog {
  private static instance: EventLog | null = null
  private initialized = false

  private constructor() {}

  static getInstance(): EventLog {
    if (!EventLog.instance) {
      EventLog.instance = new EventLog()
    }
    return EventLog.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    const db = await getDatabase()

    // Create event log table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        timestamp_time INTEGER NOT NULL,
        timestamp_counter INTEGER NOT NULL,
        timestamp_node TEXT NOT NULL,
        device_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        data TEXT NOT NULL,
        received_at INTEGER NOT NULL,
        processed INTEGER DEFAULT 0
      )
    `)

    // Create index for efficient queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sync_events_timestamp
      ON sync_events(timestamp_time, timestamp_counter)
    `)

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sync_events_processed
      ON sync_events(processed)
    `)

    this.initialized = true
  }

  /**
   * Append a new event to the log
   */
  async append(event: SyncEvent): Promise<void> {
    const db = await getDatabase()

    await db.runAsync(
      `INSERT OR IGNORE INTO sync_events
       (id, type, timestamp_time, timestamp_counter, timestamp_node, device_id, version, data, received_at, processed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      event.id,
      event.type,
      event.timestamp.time,
      event.timestamp.counter,
      event.timestamp.node,
      event.deviceId,
      event.version,
      JSON.stringify(event.data),
      Date.now()
    )
  }

  /**
   * Get all events after a given timestamp
   */
  async getEventsAfter(timestamp: HLCTimestamp | null): Promise<SyncEvent[]> {
    const db = await getDatabase()

    let query: string
    let params: (number | string)[]

    if (timestamp) {
      query = `
        SELECT * FROM sync_events
        WHERE timestamp_time > ?
           OR (timestamp_time = ? AND timestamp_counter > ?)
           OR (timestamp_time = ? AND timestamp_counter = ? AND timestamp_node > ?)
        ORDER BY timestamp_time, timestamp_counter, timestamp_node
      `
      params = [
        timestamp.time,
        timestamp.time,
        timestamp.counter,
        timestamp.time,
        timestamp.counter,
        timestamp.node,
      ]
    } else {
      query = `SELECT * FROM sync_events ORDER BY timestamp_time, timestamp_counter, timestamp_node`
      params = []
    }

    const rows = (await db.getAllAsync(query, ...params)) as Record<string, unknown>[]

    return rows.map(this.rowToEvent)
  }

  /**
   * Get unprocessed events
   */
  async getUnprocessedEvents(): Promise<SyncEvent[]> {
    const db = await getDatabase()

    const rows = (await db.getAllAsync(
      `SELECT * FROM sync_events WHERE processed = 0
       ORDER BY timestamp_time, timestamp_counter, timestamp_node`
    )) as Record<string, unknown>[]

    return rows.map(this.rowToEvent)
  }

  /**
   * Mark an event as processed
   */
  async markProcessed(eventId: string): Promise<void> {
    const db = await getDatabase()
    await db.runAsync(`UPDATE sync_events SET processed = 1 WHERE id = ?`, eventId)
  }

  /**
   * Mark multiple events as processed
   */
  async markManyProcessed(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return

    const db = await getDatabase()
    const placeholders = eventIds.map(() => '?').join(',')
    await db.runAsync(
      `UPDATE sync_events SET processed = 1 WHERE id IN (${placeholders})`,
      ...eventIds
    )
  }

  /**
   * Get the latest timestamp in the log
   */
  async getLatestTimestamp(): Promise<HLCTimestamp | null> {
    const db = await getDatabase()

    const row = (await db.getFirstAsync(
      `SELECT timestamp_time, timestamp_counter, timestamp_node
       FROM sync_events
       ORDER BY timestamp_time DESC, timestamp_counter DESC
       LIMIT 1`
    )) as Record<string, unknown> | null

    if (!row) return null

    return {
      time: row.timestamp_time as number,
      counter: row.timestamp_counter as number,
      node: row.timestamp_node as string,
    }
  }

  /**
   * Get event count
   */
  async getCount(): Promise<number> {
    const db = await getDatabase()
    const result = (await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM sync_events`
    )) as { count: number }
    return result.count
  }

  /**
   * Check if an event exists
   */
  async hasEvent(eventId: string): Promise<boolean> {
    const db = await getDatabase()
    const result = (await db.getFirstAsync(
      `SELECT 1 FROM sync_events WHERE id = ? LIMIT 1`,
      eventId
    )) as { '1': number } | null
    return result !== null
  }

  /**
   * Convert database row to SyncEvent
   */
  private rowToEvent(row: Record<string, unknown>): SyncEvent {
    return {
      id: row.id as string,
      type: row.type as string,
      timestamp: {
        time: row.timestamp_time as number,
        counter: row.timestamp_counter as number,
        node: row.timestamp_node as string,
      },
      deviceId: row.device_id as string,
      version: row.version as number,
      data: JSON.parse(row.data as string),
    }
  }
}
