/**
 * Mesh Protocol - Message types and serialization
 *
 * Meshtastic-inspired protocol for store-and-forward messaging over WAN.
 * All messages are typed and serializable for transmission over Hyperswarm connections.
 */

import type { SyncEvent } from '../events'
import type { HLCTimestamp } from '../hlc'

// ============ Peer Information ============

export interface PeerInfo {
  peerId: string
  deviceName?: string
  lastSeen: number
  isOnline: boolean
}

// ============ Message Types ============

/**
 * EVENT - Broadcast a new event to peers
 */
export interface EventMessage {
  type: 'EVENT'
  event: SyncEvent
  hopCount: number // For loop prevention
  originPeer: string // Original sender
}

/**
 * ACK - Acknowledge receipt of an event
 */
export interface AckMessage {
  type: 'ACK'
  eventId: string
  receivedBy: string
}

/**
 * SYNC_REQUEST - Request events after a given point
 */
export interface SyncRequestMessage {
  type: 'SYNC_REQUEST'
  lastKnownEventId: string | null
  lastKnownIndex: number
  requestingPeer: string
}

/**
 * SYNC_RESPONSE - Send requested events
 */
export interface SyncResponseMessage {
  type: 'SYNC_RESPONSE'
  events: SyncEvent[]
  hasMore: boolean
  startIndex: number
}

/**
 * PEER_LIST - Share known peers
 */
export interface PeerListMessage {
  type: 'PEER_LIST'
  peers: PeerInfo[]
}

/**
 * HEARTBEAT - Keep connection alive and share status
 */
export interface HeartbeatMessage {
  type: 'HEARTBEAT'
  timestamp: number
  peerId: string
  eventCount: number // How many events this peer has
  lastEventId: string | null
}

/**
 * MAILBOX_FLUSH - Request to receive queued messages
 */
export interface MailboxFlushMessage {
  type: 'MAILBOX_FLUSH'
  peerId: string
}

/**
 * HELLO - Exchange device info when connecting
 */
export interface HelloMessage {
  type: 'HELLO'
  peerId: string
  deviceName: string
  familyId: string
}

/**
 * Union of all message types
 */
export type MeshMessage =
  | EventMessage
  | AckMessage
  | SyncRequestMessage
  | SyncResponseMessage
  | PeerListMessage
  | HeartbeatMessage
  | MailboxFlushMessage
  | HelloMessage

// ============ Serialization ============

/**
 * Serialize a message for transmission
 */
export function serializeMessage(message: MeshMessage): Buffer {
  return Buffer.from(JSON.stringify(message))
}

/**
 * Deserialize a message from received data
 */
export function deserializeMessage(data: Buffer): MeshMessage | null {
  try {
    const str = data.toString('utf8')
    const parsed = JSON.parse(str)

    // Validate message has a type
    if (!parsed || typeof parsed.type !== 'string') {
      return null
    }

    return parsed as MeshMessage
  } catch {
    return null
  }
}

/**
 * Check if a value is a valid MeshMessage
 */
export function isValidMessage(value: unknown): value is MeshMessage {
  if (!value || typeof value !== 'object') return false
  const msg = value as Record<string, unknown>

  const validTypes = [
    'EVENT',
    'ACK',
    'SYNC_REQUEST',
    'SYNC_RESPONSE',
    'PEER_LIST',
    'HEARTBEAT',
    'MAILBOX_FLUSH',
    'HELLO'
  ]

  return typeof msg.type === 'string' && validTypes.includes(msg.type)
}

// ============ Message Builders ============

/**
 * Create an EVENT message
 */
export function createEventMessage(
  event: SyncEvent,
  originPeer: string,
  hopCount: number = 0
): EventMessage {
  return {
    type: 'EVENT',
    event,
    hopCount,
    originPeer
  }
}

/**
 * Create an ACK message
 */
export function createAckMessage(eventId: string, receivedBy: string): AckMessage {
  return {
    type: 'ACK',
    eventId,
    receivedBy
  }
}

/**
 * Create a SYNC_REQUEST message
 */
export function createSyncRequestMessage(
  requestingPeer: string,
  lastKnownEventId: string | null,
  lastKnownIndex: number
): SyncRequestMessage {
  return {
    type: 'SYNC_REQUEST',
    lastKnownEventId,
    lastKnownIndex,
    requestingPeer
  }
}

/**
 * Create a SYNC_RESPONSE message
 */
export function createSyncResponseMessage(
  events: SyncEvent[],
  startIndex: number,
  hasMore: boolean
): SyncResponseMessage {
  return {
    type: 'SYNC_RESPONSE',
    events,
    startIndex,
    hasMore
  }
}

/**
 * Create a PEER_LIST message
 */
export function createPeerListMessage(peers: PeerInfo[]): PeerListMessage {
  return {
    type: 'PEER_LIST',
    peers
  }
}

/**
 * Create a HEARTBEAT message
 */
export function createHeartbeatMessage(
  peerId: string,
  eventCount: number,
  lastEventId: string | null
): HeartbeatMessage {
  return {
    type: 'HEARTBEAT',
    timestamp: Date.now(),
    peerId,
    eventCount,
    lastEventId
  }
}

/**
 * Create a MAILBOX_FLUSH message
 */
export function createMailboxFlushMessage(peerId: string): MailboxFlushMessage {
  return {
    type: 'MAILBOX_FLUSH',
    peerId
  }
}

/**
 * Create a HELLO message
 */
export function createHelloMessage(
  peerId: string,
  deviceName: string,
  familyId: string
): HelloMessage {
  return {
    type: 'HELLO',
    peerId,
    deviceName,
    familyId
  }
}

// ============ Constants ============

export const MAX_HOP_COUNT = 5 // Maximum times an event can be forwarded
export const HEARTBEAT_INTERVAL = 30000 // 30 seconds
export const SYNC_BATCH_SIZE = 100 // Events per sync response
export const MESSAGE_TIMEOUT = 10000 // 10 seconds for ACK
