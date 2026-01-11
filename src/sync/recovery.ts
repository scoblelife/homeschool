/**
 * Sync Recovery Module
 *
 * Handles error detection and recovery for the sync system:
 * - Detect corrupted event log
 * - Rebuild event log from database state
 * - Reset sync option
 * - Graceful degradation when sync fails
 */

import { EventLog, createEventLog, type EventLogState } from './eventLog'
import type { SyncEvent } from './events'
import path from 'path'
import fs from 'fs/promises'
import { getAppDataPath } from '../database/connection'

export interface RecoveryStatus {
  isCorrupted: boolean
  corruptionDetails?: string
  eventLogLength: number
  lastEventId: string | null
  canRecover: boolean
}

export interface RecoveryResult {
  success: boolean
  message: string
  eventsRecovered?: number
  backupPath?: string
}

/**
 * Check if the event log is corrupted
 */
export async function checkEventLogHealth(eventLog: EventLog): Promise<RecoveryStatus> {
  try {
    const state = await eventLog.getState()

    // Try to read the last few events to verify integrity
    const length = state.length
    let corruptedIndex = -1
    let corruptionDetails: string | undefined

    if (length > 0) {
      // Check the last 10 events or all if less than 10
      const checkCount = Math.min(10, length)
      const startIndex = length - checkCount

      for (let i = startIndex; i < length; i++) {
        try {
          const event = await eventLog.get(i)
          if (!event) {
            corruptedIndex = i
            corruptionDetails = `Event at index ${i} returned null`
            break
          }

          // Verify event structure
          if (!event.id || !event.type || !event.timestamp || !event.deviceId) {
            corruptedIndex = i
            corruptionDetails = `Event at index ${i} has missing required fields`
            break
          }
        } catch (err) {
          corruptedIndex = i
          corruptionDetails = `Error reading event at index ${i}: ${(err as Error).message}`
          break
        }
      }
    }

    return {
      isCorrupted: corruptedIndex >= 0,
      corruptionDetails,
      eventLogLength: length,
      lastEventId: state.lastEventId,
      canRecover: true // We can always try to recover
    }
  } catch (err) {
    return {
      isCorrupted: true,
      corruptionDetails: `Failed to check event log: ${(err as Error).message}`,
      eventLogLength: 0,
      lastEventId: null,
      canRecover: true
    }
  }
}

/**
 * Backup the current event log directory
 */
export async function backupEventLog(): Promise<string | null> {
  const syncPath = path.join(getAppDataPath(), 'sync')
  const eventLogPath = path.join(syncPath, 'eventlog')
  const backupPath = path.join(syncPath, `eventlog-backup-${Date.now()}`)

  try {
    // Check if source exists
    await fs.access(eventLogPath)

    // Copy recursively
    await fs.cp(eventLogPath, backupPath, { recursive: true })
    console.log(`[Recovery] Event log backed up to: ${backupPath}`)

    return backupPath
  } catch (err) {
    console.error('[Recovery] Failed to backup event log:', err)
    return null
  }
}

/**
 * Delete the event log directory (for full reset)
 */
export async function deleteEventLog(): Promise<boolean> {
  const eventLogPath = path.join(getAppDataPath(), 'sync', 'eventlog')

  try {
    await fs.rm(eventLogPath, { recursive: true, force: true })
    console.log('[Recovery] Event log deleted')
    return true
  } catch (err) {
    console.error('[Recovery] Failed to delete event log:', err)
    return false
  }
}

/**
 * Delete all sync data (full reset)
 */
export async function deleteAllSyncData(): Promise<boolean> {
  const syncPath = path.join(getAppDataPath(), 'sync')
  const familyConfigPath = path.join(getAppDataPath(), 'family.json')

  try {
    // Delete sync directory
    await fs.rm(syncPath, { recursive: true, force: true })
    console.log('[Recovery] Sync directory deleted')

    // Delete family config
    try {
      await fs.unlink(familyConfigPath)
      console.log('[Recovery] Family config deleted')
    } catch {
      // File may not exist, that's ok
    }

    return true
  } catch (err) {
    console.error('[Recovery] Failed to delete sync data:', err)
    return false
  }
}

/**
 * Attempt to recover a corrupted event log by rebuilding from valid events
 */
export async function recoverEventLog(
  deviceId: string,
  onProgress?: (message: string) => void
): Promise<RecoveryResult> {
  const progress = (msg: string) => {
    console.log(`[Recovery] ${msg}`)
    onProgress?.(msg)
  }

  try {
    // Backup first
    progress('Backing up current event log...')
    const backupPath = await backupEventLog()

    if (!backupPath) {
      progress('Backup failed, but continuing with recovery...')
    }

    // Try to read all valid events from the old log
    progress('Reading valid events from corrupted log...')
    const validEvents: SyncEvent[] = []

    try {
      const oldLog = await createEventLog(deviceId)
      const length = await oldLog.length()

      for (let i = 0; i < length; i++) {
        try {
          const event = await oldLog.get(i)
          if (event && event.id && event.type && event.timestamp && event.deviceId) {
            validEvents.push(event)
          } else {
            progress(`Skipping corrupted event at index ${i}`)
          }
        } catch (err) {
          progress(`Error reading event ${i}: ${(err as Error).message}`)
          break // Stop on first error
        }
      }

      await oldLog.close()
    } catch (err) {
      progress(`Could not open old log: ${(err as Error).message}`)
    }

    progress(`Found ${validEvents.length} valid events`)

    // Delete the old log
    progress('Deleting corrupted event log...')
    await deleteEventLog()

    // Create new log and replay valid events
    progress('Creating new event log...')
    const newLog = await createEventLog(deviceId)

    let eventsRecovered = 0
    for (const event of validEvents) {
      try {
        await newLog.appendReceived(event)
        eventsRecovered++
      } catch (err) {
        progress(`Failed to replay event ${event.id}: ${(err as Error).message}`)
      }
    }

    await newLog.close()

    progress(`Recovery complete: ${eventsRecovered} events recovered`)

    return {
      success: true,
      message: `Recovered ${eventsRecovered} events from ${validEvents.length} valid events`,
      eventsRecovered,
      backupPath: backupPath || undefined
    }
  } catch (err) {
    return {
      success: false,
      message: `Recovery failed: ${(err as Error).message}`
    }
  }
}

/**
 * Full sync reset - deletes all sync data and allows rejoining family
 */
export async function resetSync(
  onProgress?: (message: string) => void
): Promise<RecoveryResult> {
  const progress = (msg: string) => {
    console.log(`[Recovery] ${msg}`)
    onProgress?.(msg)
  }

  try {
    // Backup first
    progress('Backing up sync data...')
    const backupPath = await backupEventLog()

    // Delete all sync data
    progress('Deleting all sync data...')
    const deleted = await deleteAllSyncData()

    if (!deleted) {
      return {
        success: false,
        message: 'Failed to delete sync data'
      }
    }

    progress('Sync reset complete')

    return {
      success: true,
      message: 'Sync data has been reset. You can now create or join a family again.',
      backupPath: backupPath || undefined
    }
  } catch (err) {
    return {
      success: false,
      message: `Reset failed: ${(err as Error).message}`
    }
  }
}

/**
 * Clean up old backups, keeping only the most recent N
 */
export async function cleanupOldBackups(keepCount: number = 3): Promise<number> {
  const syncPath = path.join(getAppDataPath(), 'sync')

  try {
    const entries = await fs.readdir(syncPath, { withFileTypes: true })

    // Find backup directories
    const backups = entries
      .filter(e => e.isDirectory() && e.name.startsWith('eventlog-backup-'))
      .map(e => ({
        name: e.name,
        timestamp: parseInt(e.name.replace('eventlog-backup-', ''), 10)
      }))
      .filter(b => !isNaN(b.timestamp))
      .sort((a, b) => b.timestamp - a.timestamp) // Newest first

    // Delete old backups
    let deletedCount = 0
    for (let i = keepCount; i < backups.length; i++) {
      const backupPath = path.join(syncPath, backups[i].name)
      try {
        await fs.rm(backupPath, { recursive: true, force: true })
        deletedCount++
        console.log(`[Recovery] Deleted old backup: ${backups[i].name}`)
      } catch (err) {
        console.error(`[Recovery] Failed to delete backup ${backups[i].name}:`, err)
      }
    }

    return deletedCount
  } catch {
    return 0
  }
}

/**
 * Get list of available backups
 */
export async function listBackups(): Promise<Array<{ name: string; timestamp: number; path: string }>> {
  const syncPath = path.join(getAppDataPath(), 'sync')

  try {
    const entries = await fs.readdir(syncPath, { withFileTypes: true })

    return entries
      .filter(e => e.isDirectory() && e.name.startsWith('eventlog-backup-'))
      .map(e => ({
        name: e.name,
        timestamp: parseInt(e.name.replace('eventlog-backup-', ''), 10),
        path: path.join(syncPath, e.name)
      }))
      .filter(b => !isNaN(b.timestamp))
      .sort((a, b) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

/**
 * Restore from a backup
 */
export async function restoreFromBackup(backupName: string): Promise<RecoveryResult> {
  const syncPath = path.join(getAppDataPath(), 'sync')
  const backupPath = path.join(syncPath, backupName)
  const eventLogPath = path.join(syncPath, 'eventlog')

  try {
    // Verify backup exists
    await fs.access(backupPath)

    // Delete current event log
    await fs.rm(eventLogPath, { recursive: true, force: true })

    // Copy backup to event log
    await fs.cp(backupPath, eventLogPath, { recursive: true })

    console.log(`[Recovery] Restored from backup: ${backupName}`)

    return {
      success: true,
      message: `Restored from backup: ${backupName}`
    }
  } catch (err) {
    return {
      success: false,
      message: `Failed to restore from backup: ${(err as Error).message}`
    }
  }
}

/**
 * SyncErrorHandler - Wraps sync operations with error handling
 */
export class SyncErrorHandler {
  private errorCount = 0
  private lastError: Error | null = null
  private onError?: (error: Error, context: string) => void

  constructor(onError?: (error: Error, context: string) => void) {
    this.onError = onError
  }

  /**
   * Wrap an async operation with error handling
   */
  async wrap<T>(
    operation: () => Promise<T>,
    context: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation()
    } catch (err) {
      this.errorCount++
      this.lastError = err as Error

      console.error(`[SyncError] ${context}:`, err)
      this.onError?.(err as Error, context)

      return fallback
    }
  }

  /**
   * Get error statistics
   */
  getStats(): { errorCount: number; lastError: string | null } {
    return {
      errorCount: this.errorCount,
      lastError: this.lastError?.message || null
    }
  }

  /**
   * Reset error statistics
   */
  reset(): void {
    this.errorCount = 0
    this.lastError = null
  }
}
