/**
 * Conflict Resolver Tests
 *
 * Tests the conflict resolution logic for concurrent edits.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ConflictResolver,
  createConflictResolver,
  type ConflictInfo,
} from '../conflictResolver'
import type { SyncEvent, StudentUpdatedEvent } from '../events'
import type { HLCTimestamp } from '../hlc'

// Helper to create a mock event
function createMockEvent(
  type: string,
  id: string,
  deviceId: string,
  timestamp: HLCTimestamp,
  data: Record<string, unknown>
): SyncEvent {
  return {
    id: `event-${Math.random().toString(36).slice(2)}`,
    type,
    timestamp,
    deviceId,
    version: 1,
    data: { id, ...data },
  } as SyncEvent
}

function createTimestamp(time: number, counter: number, node: string): HLCTimestamp {
  return { time, counter, node }
}

describe('ConflictResolver', () => {
  let resolver: ConflictResolver
  let conflicts: ConflictInfo[]

  beforeEach(() => {
    conflicts = []
    resolver = createConflictResolver('lww', (info) => {
      conflicts.push(info)
    })
  })

  describe('trackEvent', () => {
    it('should track events by entity', () => {
      const event = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )

      resolver.trackEvent(event)

      const stats = resolver.getStats()
      expect(stats.trackedEntities).toBe(1)
    })

    it('should update tracker when newer event arrives', () => {
      const event1 = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const event2 = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(2000, 0, 'device-A'),
        { changes: { name: 'Alicia' } }
      )

      resolver.trackEvent(event1)
      resolver.trackEvent(event2)

      const stats = resolver.getStats()
      expect(stats.trackedEntities).toBe(1)
    })

    it('should not update tracker when older event arrives', () => {
      const event1 = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(2000, 0, 'device-A'),
        { changes: { name: 'Alicia' } }
      )
      const event2 = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )

      resolver.trackEvent(event1)
      resolver.trackEvent(event2)

      // Check that the conflict log shows the first (newer) event is still tracked
      const stats = resolver.getStats()
      expect(stats.trackedEntities).toBe(1)
    })
  })

  describe('checkConflict', () => {
    it('should return null for first event on entity', () => {
      const event = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )

      const result = resolver.checkConflict(event)
      expect(result).toBeNull()
    })

    it('should return null for same device events', () => {
      const event1 = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const event2 = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1500, 0, 'device-A'),
        { changes: { name: 'Alicia' } }
      )

      resolver.trackEvent(event1)
      const result = resolver.checkConflict(event2)

      expect(result).toBeNull()
    })

    it('should return null for non-concurrent events', () => {
      const event1 = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      // 10 seconds later (outside 5s concurrency window)
      const event2 = createMockEvent(
        'student.updated',
        'student-1',
        'device-B',
        createTimestamp(11000, 0, 'device-B'),
        { changes: { name: 'Bob' } }
      )

      resolver.trackEvent(event1)
      const result = resolver.checkConflict(event2)

      expect(result).toBeNull()
    })

    it('should detect concurrent modifications', () => {
      const event1 = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      // 2 seconds later (within 5s concurrency window)
      const event2 = createMockEvent(
        'student.updated',
        'student-1',
        'device-B',
        createTimestamp(3000, 0, 'device-B'),
        { changes: { name: 'Bob' } }
      )

      resolver.trackEvent(event1)
      const result = resolver.checkConflict(event2)

      expect(result).not.toBeNull()
      expect(result!.info.entityType).toBe('student')
      expect(result!.info.entityId).toBe('student-1')
    })
  })

  describe('LWW Strategy', () => {
    it('should apply remote event when newer', () => {
      const localEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const remoteEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-B',
        createTimestamp(2000, 0, 'device-B'),
        { changes: { name: 'Bob' } }
      )

      resolver.trackEvent(localEvent)
      const result = resolver.checkConflict(remoteEvent, localEvent)

      expect(result).not.toBeNull()
      expect(result!.shouldApply).toBe(true)
      expect(result!.info.resolution).toBe('remote')
    })

    it('should not apply remote event when older', () => {
      const localEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(2000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const remoteEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-B',
        createTimestamp(1000, 0, 'device-B'),
        { changes: { name: 'Bob' } }
      )

      resolver.trackEvent(localEvent)
      const result = resolver.checkConflict(remoteEvent, localEvent)

      expect(result).not.toBeNull()
      expect(result!.shouldApply).toBe(false)
      expect(result!.info.resolution).toBe('local')
    })
  })

  describe('Field-Merge Strategy', () => {
    beforeEach(() => {
      resolver = createConflictResolver('field-merge', (info) => {
        conflicts.push(info)
      })
    })

    it('should merge non-conflicting field changes', () => {
      const localEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const remoteEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-B',
        createTimestamp(2000, 0, 'device-B'),
        { changes: { gradeLevel: '2nd' } }
      )

      resolver.trackEvent(localEvent)
      const result = resolver.checkConflict(remoteEvent, localEvent)

      expect(result).not.toBeNull()
      expect(result!.shouldApply).toBe(true)
      expect(result!.mergedChanges).toEqual({
        name: 'Alice',
        gradeLevel: '2nd',
      })
      expect(result!.conflicts).toHaveLength(0)
    })

    it('should use LWW for conflicting fields', () => {
      const localEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice', color: 'blue' } }
      )
      const remoteEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-B',
        createTimestamp(2000, 0, 'device-B'),
        { changes: { name: 'Bob', gradeLevel: '2nd' } }
      )

      resolver.trackEvent(localEvent)
      const result = resolver.checkConflict(remoteEvent, localEvent)

      expect(result).not.toBeNull()
      expect(result!.shouldApply).toBe(true)
      expect(result!.info.resolution).toBe('merged')
      expect(result!.info.conflictingFields).toContain('name')
      expect(result!.mergedChanges?.name).toBe('Bob') // Remote wins (newer)
      expect(result!.mergedChanges?.color).toBe('blue') // Only local
      expect(result!.mergedChanges?.gradeLevel).toBe('2nd') // Only remote
    })

    it('should not conflict when values are the same', () => {
      const localEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const remoteEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-B',
        createTimestamp(2000, 0, 'device-B'),
        { changes: { name: 'Alice' } } // Same value
      )

      resolver.trackEvent(localEvent)
      const result = resolver.checkConflict(remoteEvent, localEvent)

      expect(result).not.toBeNull()
      expect(result!.conflicts).toHaveLength(0)
      expect(result!.info.conflictingFields).toHaveLength(0)
    })
  })

  describe('Log-Only Strategy', () => {
    beforeEach(() => {
      resolver = createConflictResolver('log-only', (info) => {
        conflicts.push(info)
      })
    })

    it('should detect but not resolve conflicts', () => {
      const localEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const remoteEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-B',
        createTimestamp(2000, 0, 'device-B'),
        { changes: { name: 'Bob' } }
      )

      resolver.trackEvent(localEvent)
      const result = resolver.checkConflict(remoteEvent, localEvent)

      expect(result).not.toBeNull()
      expect(result!.shouldApply).toBe(false)
      expect(result!.info.resolution).toBe('unresolved')
    })
  })

  describe('Conflict Logging', () => {
    it('should log conflicts', () => {
      const localEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const remoteEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-B',
        createTimestamp(2000, 0, 'device-B'),
        { changes: { name: 'Bob' } }
      )

      resolver.trackEvent(localEvent)
      resolver.checkConflict(remoteEvent, localEvent)

      const log = resolver.getConflictLog()
      expect(log).toHaveLength(1)
      expect(log[0].entityType).toBe('student')
      expect(log[0].entityId).toBe('student-1')
    })

    it('should call onConflict callback', () => {
      const localEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const remoteEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-B',
        createTimestamp(2000, 0, 'device-B'),
        { changes: { name: 'Bob' } }
      )

      resolver.trackEvent(localEvent)
      resolver.checkConflict(remoteEvent, localEvent)

      expect(conflicts).toHaveLength(1)
    })

    it('should limit conflict log to 100 entries', () => {
      // Track initial event
      const baseEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      resolver.trackEvent(baseEvent)

      // Create 150 conflicts
      for (let i = 0; i < 150; i++) {
        const remoteEvent = createMockEvent(
          'student.updated',
          'student-1',
          'device-B',
          createTimestamp(2000 + i, 0, 'device-B'),
          { changes: { name: `Name${i}` } }
        )
        resolver.checkConflict(remoteEvent, baseEvent)
      }

      const log = resolver.getConflictLog()
      expect(log.length).toBeLessThanOrEqual(100)
    })
  })

  describe('Different Entity Types', () => {
    it('should track different entity types separately', () => {
      const studentEvent = createMockEvent(
        'student.updated',
        'student-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const activityEvent = createMockEvent(
        'activity.updated',
        'activity-1',
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { title: 'Math' } }
      )

      resolver.trackEvent(studentEvent)
      resolver.trackEvent(activityEvent)

      const stats = resolver.getStats()
      expect(stats.trackedEntities).toBe(2)
    })

    it('should not conflict across different entity types', () => {
      const studentEvent = createMockEvent(
        'student.updated',
        'entity-1', // Same ID
        'device-A',
        createTimestamp(1000, 0, 'device-A'),
        { changes: { name: 'Alice' } }
      )
      const activityEvent = createMockEvent(
        'activity.updated',
        'entity-1', // Same ID but different type
        'device-B',
        createTimestamp(2000, 0, 'device-B'),
        { changes: { title: 'Math' } }
      )

      resolver.trackEvent(studentEvent)
      const result = resolver.checkConflict(activityEvent)

      // Should return null because they're different entity types
      expect(result).toBeNull()
    })
  })
})
