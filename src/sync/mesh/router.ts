/**
 * Mesh Router - Event routing and deduplication
 *
 * Handles:
 * - Broadcasting events to all connected peers
 * - Deduplicating received events (prevent infinite loops)
 * - Forwarding events through the mesh network
 * - Managing hop counts to prevent excessive forwarding
 */

import type { SyncEvent } from '../events'
import type { EventMessage, MeshMessage, PeerInfo } from './protocol'
import { createEventMessage, MAX_HOP_COUNT } from './protocol'

/**
 * LRU Cache for deduplication
 * Tracks seen event IDs to prevent processing duplicates
 */
class LRUCache<T> {
  private cache: Map<string, T> = new Map()
  private maxSize: number

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: string, value: T): void {
    // Delete first to ensure it goes to the end
    this.cache.delete(key)
    this.cache.set(key, value)

    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  size(): number {
    return this.cache.size
  }
}

export interface RouterOptions {
  deviceId: string
  maxSeenEvents?: number
  maxHopCount?: number
}

export interface RouteDecision {
  shouldProcess: boolean
  shouldForward: boolean
  forwardTo: string[] // Peer IDs to forward to
  reason?: string
}

/**
 * MeshRouter handles event routing decisions
 */
export class MeshRouter {
  private deviceId: string
  private seenEvents: LRUCache<number> // eventId -> timestamp seen
  private maxHopCount: number
  private connectedPeers: Map<string, PeerInfo> = new Map()

  constructor(options: RouterOptions) {
    this.deviceId = options.deviceId
    this.seenEvents = new LRUCache(options.maxSeenEvents || 10000)
    this.maxHopCount = options.maxHopCount || MAX_HOP_COUNT
  }

  /**
   * Register a connected peer (merges with existing info to preserve device name)
   */
  addPeer(peerId: string, info?: Partial<PeerInfo>): void {
    const existing = this.connectedPeers.get(peerId)
    this.connectedPeers.set(peerId, {
      peerId,
      deviceName: info?.deviceName ?? existing?.deviceName,
      lastSeen: Date.now(),
      isOnline: true
    })
  }

  /**
   * Remove a disconnected peer
   */
  removePeer(peerId: string): void {
    const peer = this.connectedPeers.get(peerId)
    if (peer) {
      peer.isOnline = false
      peer.lastSeen = Date.now()
    }
  }

  /**
   * Get all connected peers
   */
  getConnectedPeers(): PeerInfo[] {
    return Array.from(this.connectedPeers.values()).filter((p) => p.isOnline)
  }

  /**
   * Get all known peers (including offline)
   */
  getAllKnownPeers(): PeerInfo[] {
    return Array.from(this.connectedPeers.values())
  }

  /**
   * Decide how to handle a received event
   */
  routeIncomingEvent(message: EventMessage, fromPeer: string): RouteDecision {
    const eventId = message.event.id

    // Check if we've seen this event before
    if (this.seenEvents.has(eventId)) {
      return {
        shouldProcess: false,
        shouldForward: false,
        forwardTo: [],
        reason: 'duplicate'
      }
    }

    // Mark as seen
    this.seenEvents.set(eventId, Date.now())

    // Check hop count
    if (message.hopCount >= this.maxHopCount) {
      return {
        shouldProcess: true, // We should still process it
        shouldForward: false,
        forwardTo: [],
        reason: 'max_hops_reached'
      }
    }

    // Determine who to forward to
    // Forward to all connected peers except the sender and origin
    const forwardTo = this.getConnectedPeers()
      .filter((p) => p.peerId !== fromPeer && p.peerId !== message.originPeer)
      .map((p) => p.peerId)

    return {
      shouldProcess: true,
      shouldForward: forwardTo.length > 0,
      forwardTo
    }
  }

  /**
   * Create messages for broadcasting a local event to all peers
   */
  routeOutgoingEvent(event: SyncEvent): { peerId: string; message: EventMessage }[] {
    // Mark as seen (we created it)
    this.seenEvents.set(event.id, Date.now())

    const message = createEventMessage(event, this.deviceId, 0)

    return this.getConnectedPeers().map((peer) => ({
      peerId: peer.peerId,
      message
    }))
  }

  /**
   * Create a forwarded message with incremented hop count
   */
  createForwardMessage(original: EventMessage): EventMessage {
    return {
      ...original,
      hopCount: original.hopCount + 1
    }
  }

  /**
   * Check if an event has been seen
   */
  hasSeenEvent(eventId: string): boolean {
    return this.seenEvents.has(eventId)
  }

  /**
   * Mark an event as seen (for events we create locally)
   */
  markEventSeen(eventId: string): void {
    this.seenEvents.set(eventId, Date.now())
  }

  /**
   * Get stats about the router state
   */
  getStats(): { seenEventCount: number; connectedPeerCount: number } {
    return {
      seenEventCount: this.seenEvents.size(),
      connectedPeerCount: this.getConnectedPeers().length
    }
  }
}

/**
 * Create a mesh router
 */
export function createRouter(options: RouterOptions): MeshRouter {
  return new MeshRouter(options)
}
