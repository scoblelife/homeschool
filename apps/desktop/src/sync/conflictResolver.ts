/**
 * Conflict Resolver for P2P Sync
 *
 * Handles conflicts that arise when the same entity is modified
 * on multiple devices while offline. Uses Last-Write-Wins (LWW)
 * based on HLC timestamps with field-level conflict detection.
 *
 * Strategies:
 * - LWW: Last-Write-Wins based on HLC timestamp (default)
 * - Field-merge: Merge non-conflicting field changes
 * - Log-only: Detect conflicts but don't auto-resolve
 */

import { HLC, type HLCTimestamp } from './hlc'
import type { SyncEvent } from './events'

export type ConflictStrategy = 'lww' | 'field-merge' | 'log-only'

export interface ConflictInfo {
  entityType: string
  entityId: string
  localEvent: SyncEvent
  remoteEvent: SyncEvent
  conflictingFields: string[]
  resolution: 'local' | 'remote' | 'merged' | 'unresolved'
  timestamp: string
}

export interface FieldChange {
  field: string
  localValue: unknown
  remoteValue: unknown
  resolvedValue: unknown
  winner: 'local' | 'remote'
}

export interface ConflictResolution {
  shouldApply: boolean
  mergedChanges?: Record<string, unknown>
  conflicts: FieldChange[]
  info: ConflictInfo
}

// Track recent events per entity for conflict detection
interface EntityEventTracker {
  entityId: string
  entityType: string
  lastEventId: string
  lastTimestamp: HLCTimestamp
  lastDeviceId: string
}

export class ConflictResolver {
  private strategy: ConflictStrategy
  private entityTrackers: Map<string, EntityEventTracker> = new Map()
  private conflictLog: ConflictInfo[] = []
  private onConflict?: (info: ConflictInfo) => void

  // Time window to consider events as concurrent (5 seconds)
  private concurrencyWindow = 5000

  constructor(
    strategy: ConflictStrategy = 'lww',
    onConflict?: (info: ConflictInfo) => void
  ) {
    this.strategy = strategy
    this.onConflict = onConflict
  }

  /**
   * Get the entity key for tracking (type:id)
   */
  private getEntityKey(event: SyncEvent): string | null {
    const data = event.data as Record<string, unknown>
    const id = data.id as string | undefined

    if (!id) return null

    // Map event types to entity types
    const entityType = this.getEntityType(event.type)
    if (!entityType) return null

    return `${entityType}:${id}`
  }

  /**
   * Extract entity type from event type
   */
  private getEntityType(eventType: string): string | null {
    const parts = eventType.split('.')
    if (parts.length < 2) return null
    return parts[0]
  }

  /**
   * Check if an incoming event conflicts with tracked state
   */
  checkConflict(
    incomingEvent: SyncEvent,
    localEvent?: SyncEvent
  ): ConflictResolution | null {
    const entityKey = this.getEntityKey(incomingEvent)
    if (!entityKey) return null

    const tracker = this.entityTrackers.get(entityKey)

    // No prior event for this entity - no conflict possible
    if (!tracker) {
      this.trackEvent(incomingEvent)
      return null
    }

    // Same device - no conflict (just a newer event)
    if (tracker.lastDeviceId === incomingEvent.deviceId) {
      this.trackEvent(incomingEvent)
      return null
    }

    // Check if events are within concurrency window
    const timeDiff = Math.abs(
      incomingEvent.timestamp.time - tracker.lastTimestamp.time
    )
    const isConcurrent = timeDiff < this.concurrencyWindow

    // If not concurrent, just a normal sequential update
    if (!isConcurrent) {
      this.trackEvent(incomingEvent)
      return null
    }

    // Concurrent modification detected - resolve conflict
    console.log(
      `[ConflictResolver] Concurrent modification detected for ${entityKey}`
    )

    // If we have the local event, do field-level analysis
    if (localEvent) {
      return this.resolveConflict(localEvent, incomingEvent, entityKey)
    }

    // No local event available - use LWW
    const compare = HLC.compare(incomingEvent.timestamp, tracker.lastTimestamp)
    const shouldApply = compare > 0 // Remote wins if newer

    const info: ConflictInfo = {
      entityType: this.getEntityType(incomingEvent.type) || 'unknown',
      entityId: (incomingEvent.data as Record<string, unknown>).id as string,
      localEvent: incomingEvent, // We don't have local event
      remoteEvent: incomingEvent,
      conflictingFields: [],
      resolution: shouldApply ? 'remote' : 'local',
      timestamp: new Date().toISOString(),
    }

    this.logConflict(info)

    if (shouldApply) {
      this.trackEvent(incomingEvent)
    }

    return {
      shouldApply,
      conflicts: [],
      info,
    }
  }

  /**
   * Resolve conflict between local and remote events
   */
  private resolveConflict(
    localEvent: SyncEvent,
    remoteEvent: SyncEvent,
    entityKey: string
  ): ConflictResolution {
    const localData = localEvent.data as Record<string, unknown>
    const remoteData = remoteEvent.data as Record<string, unknown>

    // Get changes objects if this is an update event
    const localChanges = (localData.changes || localData) as Record<
      string,
      unknown
    >
    const remoteChanges = (remoteData.changes || remoteData) as Record<
      string,
      unknown
    >

    // Find conflicting fields
    const conflicts: FieldChange[] = []
    const mergedChanges: Record<string, unknown> = {}
    const conflictingFields: string[] = []

    // Get all fields from both events
    const allFields = new Set([
      ...Object.keys(localChanges),
      ...Object.keys(remoteChanges),
    ])

    for (const field of Array.from(allFields)) {
      // Skip non-change fields
      if (field === 'id' || field === 'changes') continue

      const localValue = localChanges[field]
      const remoteValue = remoteChanges[field]

      // Only one side modified this field - no conflict
      if (localValue === undefined && remoteValue !== undefined) {
        mergedChanges[field] = remoteValue
        continue
      }
      if (remoteValue === undefined && localValue !== undefined) {
        mergedChanges[field] = localValue
        continue
      }

      // Both sides modified the same field
      if (localValue !== undefined && remoteValue !== undefined) {
        // Check if values are the same (no real conflict)
        if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
          mergedChanges[field] = localValue
          continue
        }

        // Real conflict - use HLC to determine winner
        conflictingFields.push(field)
        const compare = HLC.compare(remoteEvent.timestamp, localEvent.timestamp)
        const winner = compare >= 0 ? 'remote' : 'local'
        const resolvedValue = winner === 'remote' ? remoteValue : localValue

        conflicts.push({
          field,
          localValue,
          remoteValue,
          resolvedValue,
          winner,
        })

        mergedChanges[field] = resolvedValue
      }
    }

    // Determine overall resolution
    let resolution: 'local' | 'remote' | 'merged' | 'unresolved'
    let shouldApply: boolean

    switch (this.strategy) {
      case 'lww':
        // Simple LWW - compare overall event timestamps
        const compare = HLC.compare(remoteEvent.timestamp, localEvent.timestamp)
        shouldApply = compare >= 0
        resolution = shouldApply ? 'remote' : 'local'
        break

      case 'field-merge':
        // Merge non-conflicting fields, LWW for conflicts
        shouldApply = true
        resolution =
          conflictingFields.length > 0
            ? 'merged'
            : conflicts.length > 0
              ? 'merged'
              : 'remote'
        break

      case 'log-only':
        // Don't auto-resolve, just log
        shouldApply = false
        resolution = 'unresolved'
        break

      default:
        shouldApply = true
        resolution = 'remote'
    }

    const info: ConflictInfo = {
      entityType: this.getEntityType(remoteEvent.type) || 'unknown',
      entityId: (remoteData.id || localData.id) as string,
      localEvent,
      remoteEvent,
      conflictingFields,
      resolution,
      timestamp: new Date().toISOString(),
    }

    this.logConflict(info)

    if (shouldApply) {
      this.trackEvent(remoteEvent)
    }

    return {
      shouldApply,
      mergedChanges: this.strategy === 'field-merge' ? mergedChanges : undefined,
      conflicts,
      info,
    }
  }

  /**
   * Track an event for future conflict detection
   */
  trackEvent(event: SyncEvent): void {
    const entityKey = this.getEntityKey(event)
    if (!entityKey) return

    const tracker = this.entityTrackers.get(entityKey)

    // Only update if this event is newer
    if (tracker) {
      const compare = HLC.compare(event.timestamp, tracker.lastTimestamp)
      if (compare <= 0) return
    }

    this.entityTrackers.set(entityKey, {
      entityId: (event.data as Record<string, unknown>).id as string,
      entityType: this.getEntityType(event.type) || 'unknown',
      lastEventId: event.id,
      lastTimestamp: event.timestamp,
      lastDeviceId: event.deviceId,
    })
  }

  /**
   * Log a conflict for debugging/analytics
   */
  private logConflict(info: ConflictInfo): void {
    this.conflictLog.push(info)

    // Keep only last 100 conflicts
    if (this.conflictLog.length > 100) {
      this.conflictLog.shift()
    }

    // Notify callback
    this.onConflict?.(info)

    // Console log for debugging
    console.log('[ConflictResolver] Conflict:', {
      entity: `${info.entityType}:${info.entityId}`,
      fields: info.conflictingFields,
      resolution: info.resolution,
    })
  }

  /**
   * Get recent conflict log
   */
  getConflictLog(): ConflictInfo[] {
    return [...this.conflictLog]
  }

  /**
   * Clear conflict log
   */
  clearConflictLog(): void {
    this.conflictLog = []
  }

  /**
   * Set conflict resolution strategy
   */
  setStrategy(strategy: ConflictStrategy): void {
    this.strategy = strategy
  }

  /**
   * Get current strategy
   */
  getStrategy(): ConflictStrategy {
    return this.strategy
  }

  /**
   * Clear all tracked entities (useful for testing)
   */
  clear(): void {
    this.entityTrackers.clear()
    this.conflictLog = []
  }

  /**
   * Get stats about tracked entities
   */
  getStats(): { trackedEntities: number; conflicts: number } {
    return {
      trackedEntities: this.entityTrackers.size,
      conflicts: this.conflictLog.length,
    }
  }
}

// Singleton instance
let resolver: ConflictResolver | null = null

export function getConflictResolver(): ConflictResolver {
  if (!resolver) {
    resolver = new ConflictResolver('lww', (info) => {
      // Default conflict logging
      console.warn(
        `[Sync Conflict] ${info.entityType}:${info.entityId} - ${info.conflictingFields.length} fields, resolved: ${info.resolution}`
      )
    })
  }
  return resolver
}

export function createConflictResolver(
  strategy: ConflictStrategy = 'lww',
  onConflict?: (info: ConflictInfo) => void
): ConflictResolver {
  return new ConflictResolver(strategy, onConflict)
}
