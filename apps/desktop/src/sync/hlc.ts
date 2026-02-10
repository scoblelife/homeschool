/**
 * Hybrid Logical Clock (HLC) implementation
 *
 * Combines wall clock time with a logical counter to provide:
 * - Monotonically increasing timestamps
 * - Causal ordering across distributed devices
 * - Clock drift tolerance
 *
 * Based on "Logical Physical Clocks and Consistent Snapshots in Globally
 * Distributed Databases" by Kulkarni et al.
 */

export interface HLCTimestamp {
  // Wall clock time in milliseconds since epoch
  time: number
  // Logical counter to order events within same millisecond
  counter: number
  // Node/device identifier for tie-breaking
  node: string
}

export class HLC {
  private lastTime: number = 0
  private counter: number = 0
  private readonly nodeId: string
  // Maximum allowed clock drift (15 minutes)
  private readonly maxDrift: number = 15 * 60 * 1000

  constructor(nodeId: string) {
    this.nodeId = nodeId
  }

  /**
   * Generate a new timestamp for a local event
   */
  now(): HLCTimestamp {
    const physicalTime = Date.now()

    if (physicalTime > this.lastTime) {
      // Physical clock advanced - use new time, reset counter
      this.lastTime = physicalTime
      this.counter = 0
    } else {
      // Physical clock hasn't advanced - increment logical counter
      this.counter++
    }

    return {
      time: this.lastTime,
      counter: this.counter,
      node: this.nodeId
    }
  }

  /**
   * Update clock based on received timestamp from another node
   * Returns a new timestamp that is guaranteed to be > both current and received
   */
  receive(received: HLCTimestamp): HLCTimestamp {
    const physicalTime = Date.now()

    // Check for excessive clock drift
    if (received.time - physicalTime > this.maxDrift) {
      throw new Error(
        `Received timestamp ${received.time} is too far in the future ` +
          `(current time: ${physicalTime}, max drift: ${this.maxDrift}ms)`
      )
    }

    const maxTime = Math.max(physicalTime, this.lastTime, received.time)

    if (maxTime === this.lastTime && maxTime === received.time) {
      // All three are equal - use max counter + 1
      this.counter = Math.max(this.counter, received.counter) + 1
    } else if (maxTime === this.lastTime) {
      // Our time is highest - increment our counter
      this.counter++
    } else if (maxTime === received.time) {
      // Received time is highest - use their counter + 1
      this.counter = received.counter + 1
    } else {
      // Physical time is highest - reset counter
      this.counter = 0
    }

    this.lastTime = maxTime

    return {
      time: this.lastTime,
      counter: this.counter,
      node: this.nodeId
    }
  }

  /**
   * Get current clock state without advancing it
   */
  peek(): HLCTimestamp {
    return {
      time: this.lastTime || Date.now(),
      counter: this.counter,
      node: this.nodeId
    }
  }

  /**
   * Compare two HLC timestamps
   * Returns: -1 if a < b, 0 if a == b, 1 if a > b
   */
  static compare(a: HLCTimestamp, b: HLCTimestamp): -1 | 0 | 1 {
    // First compare wall clock time
    if (a.time < b.time) return -1
    if (a.time > b.time) return 1

    // Same time - compare logical counter
    if (a.counter < b.counter) return -1
    if (a.counter > b.counter) return 1

    // Same time and counter - compare node ID for deterministic ordering
    if (a.node < b.node) return -1
    if (a.node > b.node) return 1

    return 0
  }

  /**
   * Check if timestamp a is before timestamp b
   */
  static isBefore(a: HLCTimestamp, b: HLCTimestamp): boolean {
    return HLC.compare(a, b) === -1
  }

  /**
   * Check if timestamp a is after timestamp b
   */
  static isAfter(a: HLCTimestamp, b: HLCTimestamp): boolean {
    return HLC.compare(a, b) === 1
  }

  /**
   * Serialize timestamp to string for storage/transmission
   */
  static serialize(ts: HLCTimestamp): string {
    // Format: TIME-COUNTER-NODE
    // Pad counter to 8 digits for lexicographic sorting
    return `${ts.time}-${ts.counter.toString().padStart(8, '0')}-${ts.node}`
  }

  /**
   * Parse timestamp from serialized string
   */
  static parse(str: string): HLCTimestamp {
    const parts = str.split('-')
    if (parts.length < 3) {
      throw new Error(`Invalid HLC timestamp: ${str}`)
    }
    return {
      time: parseInt(parts[0], 10),
      counter: parseInt(parts[1], 10),
      node: parts.slice(2).join('-') // Node ID might contain dashes
    }
  }

  /**
   * Get a human-readable string for debugging
   */
  static toDebugString(ts: HLCTimestamp): string {
    const date = new Date(ts.time)
    return `${date.toISOString()} [${ts.counter}] @${ts.node.slice(0, 8)}`
  }
}

/**
 * Generate a unique device/node ID
 * Uses crypto.randomUUID for guaranteed uniqueness
 */
export function generateDeviceId(): string {
  return crypto.randomUUID()
}
