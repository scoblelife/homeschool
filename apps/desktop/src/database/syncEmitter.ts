/**
 * Sync Event Emitter - Helper for repositories to emit sync events
 *
 * This module provides a way for database repositories to emit sync events
 * that will be broadcast to connected peers.
 */

import type { SyncEvent } from '../sync/events'
import { createEventId } from '../sync/events'

// This will be set by the main process when sync is initialized
let emitEventFn: ((event: Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>) => Promise<void>) | null = null

/**
 * Set the emit function (called from sync-ipc when sync is initialized)
 */
export function setSyncEmitter(
  fn: (event: Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>) => Promise<void>
): void {
  emitEventFn = fn
}

/**
 * Emit a sync event if sync is enabled
 * Returns silently if sync is not configured
 */
export async function emitSyncEvent(
  event: Omit<SyncEvent, 'id' | 'timestamp' | 'deviceId' | 'version'>
): Promise<void> {
  if (!emitEventFn) return

  try {
    await emitEventFn({
      ...event,
      id: createEventId()
    } as Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>)
  } catch (err) {
    console.error('[SyncEmitter] Failed to emit event:', err)
    // Don't throw - sync failures shouldn't break local operations
  }
}

/**
 * Check if sync is enabled
 */
export function isSyncEnabled(): boolean {
  return emitEventFn !== null
}
