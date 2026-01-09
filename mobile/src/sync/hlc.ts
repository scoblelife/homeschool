/**
 * Hybrid Logical Clock (HLC) implementation
 * Provides causal ordering across distributed devices without synchronized clocks
 */

import { HLCTimestamp, generateUUID } from './events'

export class HybridLogicalClock {
  private time: number
  private counter: number
  private node: string

  constructor(nodeId?: string) {
    this.time = Date.now()
    this.counter = 0
    this.node = nodeId || generateUUID().substring(0, 8)
  }

  /**
   * Generate a new timestamp for a local event
   */
  now(): HLCTimestamp {
    const physicalTime = Date.now()

    if (physicalTime > this.time) {
      this.time = physicalTime
      this.counter = 0
    } else {
      this.counter++
    }

    return {
      time: this.time,
      counter: this.counter,
      node: this.node,
    }
  }

  /**
   * Update clock based on a received timestamp (for incoming sync events)
   */
  receive(remote: HLCTimestamp): HLCTimestamp {
    const physicalTime = Date.now()

    if (physicalTime > this.time && physicalTime > remote.time) {
      this.time = physicalTime
      this.counter = 0
    } else if (this.time === remote.time) {
      this.counter = Math.max(this.counter, remote.counter) + 1
    } else if (remote.time > this.time) {
      this.time = remote.time
      this.counter = remote.counter + 1
    } else {
      this.counter++
    }

    return {
      time: this.time,
      counter: this.counter,
      node: this.node,
    }
  }

  /**
   * Compare two timestamps for ordering
   * Returns negative if a < b, positive if a > b, 0 if equal
   */
  static compare(a: HLCTimestamp, b: HLCTimestamp): number {
    if (a.time !== b.time) {
      return a.time - b.time
    }
    if (a.counter !== b.counter) {
      return a.counter - b.counter
    }
    return a.node.localeCompare(b.node)
  }

  /**
   * Check if timestamp a happened before timestamp b
   */
  static happenedBefore(a: HLCTimestamp, b: HLCTimestamp): boolean {
    return HybridLogicalClock.compare(a, b) < 0
  }

  /**
   * Get the node ID
   */
  getNodeId(): string {
    return this.node
  }

  /**
   * Serialize clock state for persistence
   */
  toJSON(): { time: number; counter: number; node: string } {
    return {
      time: this.time,
      counter: this.counter,
      node: this.node,
    }
  }

  /**
   * Restore clock from persisted state
   */
  static fromJSON(data: { time: number; counter: number; node: string }): HybridLogicalClock {
    const clock = new HybridLogicalClock(data.node)
    clock.time = data.time
    clock.counter = data.counter
    return clock
  }
}
