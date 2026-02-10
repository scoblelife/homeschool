/**
 * Hypercore-based event log for storing and replicating sync events
 *
 * This wraps Hypercore to provide:
 * - Append-only event storage with cryptographic verification
 * - Sparse replication for efficient sync
 * - Event iteration and streaming
 */

import Hypercore from 'hypercore'
import b4a from 'b4a'
import path from 'path'
import type { SyncEvent } from './events'
import { HLC, type HLCTimestamp } from './hlc'
import { getAppDataPath } from '../database/connection'

export interface EventLogOptions {
  // Directory to store the hypercore data
  storagePath?: string
  // Existing keypair for joining a family
  keyPair?: {
    publicKey: Buffer
    secretKey: Buffer
  }
}

export interface EventLogState {
  length: number
  lastEventId: string | null
  lastTimestamp: HLCTimestamp | null
}

export class EventLog {
  private core: Hypercore | null = null
  private hlc: HLC
  private deviceId: string
  private storagePath: string
  private keyPair?: { publicKey: Buffer; secretKey: Buffer }
  private ready: Promise<void>
  private resolveReady!: () => void

  constructor(deviceId: string, options: EventLogOptions = {}) {
    this.deviceId = deviceId
    this.hlc = new HLC(deviceId)

    // Default storage in user data directory
    this.storagePath =
      options.storagePath || path.join(getAppDataPath(), 'sync', 'eventlog')

    this.keyPair = options.keyPair

    // Create a promise that resolves when the core is ready
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve
    })
  }

  /**
   * Initialize the Hypercore
   */
  async initialize(): Promise<void> {
    console.log('[EventLog] Initializing at path:', this.storagePath)

    // Create directory if needed
    const fs = await import('fs/promises')
    await fs.mkdir(this.storagePath, { recursive: true })

    // Initialize Hypercore with optional keypair
    if (this.keyPair) {
      this.core = new Hypercore(this.storagePath, this.keyPair.publicKey, {
        keyPair: this.keyPair
      })
    } else {
      this.core = new Hypercore(this.storagePath)
    }

    await this.core.ready()
    this.resolveReady()
  }

  /**
   * Wait for the event log to be ready
   */
  async waitReady(): Promise<void> {
    await this.ready
  }

  /**
   * Get the public key for this event log (used for family sharing)
   */
  async getPublicKey(): Promise<Buffer> {
    await this.ready
    return this.core!.key
  }

  /**
   * Get the discovery key for finding peers
   */
  async getDiscoveryKey(): Promise<Buffer> {
    await this.ready
    return this.core!.discoveryKey
  }

  /**
   * Get the secret key (only available if we created this log)
   */
  async getSecretKey(): Promise<Buffer | null> {
    await this.ready
    return this.core!.keyPair?.secretKey || null
  }

  /**
   * Append a new event to the log
   */
  async append(event: Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>): Promise<SyncEvent> {
    await this.ready

    // Add metadata to the event
    const fullEvent: SyncEvent = {
      ...event,
      timestamp: this.hlc.now(),
      deviceId: this.deviceId,
      version: 1
    } as SyncEvent

    // Serialize and append to Hypercore
    const data = b4a.from(JSON.stringify(fullEvent))
    await this.core!.append(data)

    return fullEvent
  }

  /**
   * Append a received event (from another peer) to the log
   * Updates HLC based on received timestamp
   */
  async appendReceived(event: SyncEvent): Promise<void> {
    await this.ready

    // Update our HLC based on the received timestamp
    this.hlc.receive(event.timestamp)

    // Append to our log
    const data = b4a.from(JSON.stringify(event))
    await this.core!.append(data)
  }

  /**
   * Get an event by index
   */
  async get(index: number): Promise<SyncEvent | null> {
    await this.ready

    if (index < 0 || index >= this.core!.length) {
      return null
    }

    const data = await this.core!.get(index)
    if (!data) return null

    return JSON.parse(b4a.toString(data))
  }

  /**
   * Get the current length of the log
   */
  async length(): Promise<number> {
    await this.ready
    return this.core!.length
  }

  /**
   * Get all events from a starting index
   */
  async getFrom(startIndex: number = 0): Promise<SyncEvent[]> {
    await this.ready

    const events: SyncEvent[] = []
    const len = this.core!.length

    for (let i = startIndex; i < len; i++) {
      const event = await this.get(i)
      if (event) events.push(event)
    }

    return events
  }

  /**
   * Create a read stream for events
   */
  createReadStream(options: { start?: number; end?: number; live?: boolean } = {}): AsyncIterable<SyncEvent> {
    const core = this.core!
    const start = options.start ?? 0
    const end = options.end ?? -1

    return {
      async *[Symbol.asyncIterator]() {
        const stream = core.createReadStream({
          start,
          end: end === -1 ? undefined : end,
          live: options.live
        })

        for await (const data of stream) {
          yield JSON.parse(b4a.toString(data))
        }
      }
    }
  }

  /**
   * Get a replication stream for syncing with peers
   */
  replicate(isInitiator: boolean): NodeJS.ReadWriteStream {
    return this.core!.replicate(isInitiator)
  }

  /**
   * Get the current state of the event log
   */
  async getState(): Promise<EventLogState> {
    await this.ready

    const len = this.core!.length
    let lastEvent: SyncEvent | null = null

    if (len > 0) {
      lastEvent = await this.get(len - 1)
    }

    return {
      length: len,
      lastEventId: lastEvent?.id || null,
      lastTimestamp: lastEvent?.timestamp || null
    }
  }

  /**
   * Get all events in the log
   */
  async getAll(): Promise<SyncEvent[]> {
    return this.getFrom(0)
  }

  /**
   * Get events after a specific HLC timestamp
   */
  async getAfterTimestamp(timestampStr: string | null): Promise<SyncEvent[]> {
    if (!timestampStr) {
      return this.getAll()
    }

    await this.ready

    const events: SyncEvent[] = []
    const len = this.core!.length

    for (let i = 0; i < len; i++) {
      const event = await this.get(i)
      if (event) {
        // Compare timestamps - simple string comparison works for HLC format
        const eventTs = typeof event.timestamp === 'string'
          ? event.timestamp
          : JSON.stringify(event.timestamp)
        if (eventTs > timestampStr) {
          events.push(event)
        }
      }
    }

    return events
  }

  /**
   * Close the event log
   */
  async close(): Promise<void> {
    if (this.core) {
      await this.core.close()
    }
  }

  /**
   * Get raw Hypercore instance for advanced operations
   */
  getCore(): Hypercore {
    return this.core!
  }
}

/**
 * Create or load an event log for a device
 */
export async function createEventLog(
  deviceId: string,
  options: EventLogOptions = {}
): Promise<EventLog> {
  const log = new EventLog(deviceId, options)
  await log.initialize()
  return log
}
