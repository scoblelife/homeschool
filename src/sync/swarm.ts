/**
 * Hyperswarm Connection Manager
 *
 * Handles P2P peer discovery and connections using Hyperswarm.
 * Provides NAT traversal and encrypted connections without central servers.
 */

import Hyperswarm from 'hyperswarm'
import crypto from 'crypto'
import b4a from 'b4a'
import { EventEmitter } from 'events'
import type { SyncEvent } from './events'
import type {
  MeshMessage,
  EventMessage,
  AckMessage,
  SyncRequestMessage,
  SyncResponseMessage,
  HeartbeatMessage,
  PeerInfo
} from './mesh/protocol'
import {
  serializeMessage,
  deserializeMessage,
  createHeartbeatMessage,
  createEventMessage,
  createSyncRequestMessage,
  createSyncResponseMessage,
  createHelloMessage,
  HEARTBEAT_INTERVAL,
  SYNC_BATCH_SIZE
} from './mesh/protocol'
import type { HelloMessage } from './mesh/protocol'
import { MeshRouter, createRouter } from './mesh/router'
import { MailboxManager, createMailboxManager } from './mesh/mailbox'
import { ReliableDelivery, createReliableDelivery } from './mesh/reliable'
import type { EventLog } from './eventLog'
import type { EventProjector } from './projector'

export interface SwarmOptions {
  deviceId: string
  deviceName: string
  familyId: string
  eventLog: EventLog
  projector: EventProjector
}

export interface PeerConnection {
  peerId: string
  socket: NodeJS.ReadWriteStream
  isInitiator: boolean
  connectedAt: number
}

type SwarmEvents = {
  'peer:connected': (peerId: string) => void
  'peer:disconnected': (peerId: string) => void
  'event:received': (event: SyncEvent, fromPeer: string) => void
  'sync:started': (peerId: string) => void
  'sync:completed': (peerId: string, eventsReceived: number) => void
  'error': (error: Error) => void
}

/**
 * SwarmManager handles P2P connections and message routing
 */
export class SwarmManager extends EventEmitter {
  private swarm: Hyperswarm | null = null
  private deviceId: string
  private deviceName: string
  private familyId: string
  private topic: Buffer | null = null
  private connections: Map<string, PeerConnection> = new Map()
  private router: MeshRouter
  private mailbox: MailboxManager | null = null
  private reliable: ReliableDelivery
  private eventLog: EventLog
  private projector: EventProjector
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isRunning: boolean = false

  constructor(options: SwarmOptions) {
    super()
    this.deviceId = options.deviceId
    this.deviceName = options.deviceName
    this.familyId = options.familyId
    this.eventLog = options.eventLog
    this.projector = options.projector

    this.router = createRouter({ deviceId: this.deviceId })

    this.reliable = createReliableDelivery({
      onDeliveryFailed: (result) => {
        // Queue for mailbox delivery
        const pending = this.reliable.getPendingForPeer(result.peerId)
        if (pending.length > 0 && this.mailbox) {
          this.mailbox.queueMessage(result.peerId, pending[0].message.event)
        }
      }
    })
  }

  /**
   * Initialize and start the swarm
   */
  async start(): Promise<void> {
    if (this.isRunning) return

    // Initialize mailbox
    this.mailbox = await createMailboxManager()

    // Create swarm
    this.swarm = new Hyperswarm()

    // Generate topic from family ID
    this.topic = crypto
      .createHash('sha256')
      .update(`homeschool:family:${this.familyId}`)
      .digest()

    // Set up connection handler BEFORE joining (important!)
    console.log('[Swarm] Setting up connection handler')
    this.swarm.on('connection', (socket: NodeJS.ReadWriteStream, info: { publicKey: Buffer; client: boolean }) => {
      console.log('[Swarm] Connection event fired, publicKey:', b4a.toString(info.publicKey, 'hex').slice(0, 8))
      this.handleConnection(socket, info).catch((err) => {
        console.error('[Swarm] Error handling connection:', err)
      })
    })
    console.log('[Swarm] Connection handler registered')

    // Join the swarm topic
    console.log('[Swarm] Joining family sync topic')
    const discovery = this.swarm.join(this.topic, { server: true, client: true })
    await discovery.flushed()
    console.log('[Swarm] Discovery flushed')

    // Start heartbeat
    this.startHeartbeat()

    // Start reliable delivery checker
    this.reliable.start((peerId, message) => this.sendToPeer(peerId, message))

    this.isRunning = true
  }

  /**
   * Stop the swarm and close all connections
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Stop reliable delivery
    this.reliable.stop()

    // Close all connections
    const connArray = Array.from(this.connections.values())
    for (const conn of connArray) {
      try {
        (conn.socket as any).destroy?.()
      } catch {
        // Ignore close errors
      }
    }
    this.connections.clear()

    // Leave swarm
    if (this.swarm && this.topic) {
      await this.swarm.leave(this.topic)
      await this.swarm.destroy()
      this.swarm = null
    }

    // Save mailbox state
    if (this.mailbox) {
      await this.mailbox.flush()
    }

    this.isRunning = false
  }

  /**
   * Handle a new peer connection
   */
  private async handleConnection(socket: NodeJS.ReadWriteStream, info: { publicKey: Buffer; client: boolean }): Promise<void> {
    const peerId = b4a.toString(info.publicKey, 'hex')
    console.log('[Swarm] handleConnection called for peer:', peerId.slice(0, 8) + '...', 'isClient:', info.client)

    // Check if peer is on blocklist (Note: peerId is Hyperswarm pubkey, not device ID)
    if (this.projector.isBlocked(peerId)) {
      console.log('[Swarm] Rejecting blocked peer:', peerId.slice(0, 8) + '...')
      ;(socket as any).destroy?.()
      return
    }

    // Store connection
    const connection: PeerConnection = {
      peerId,
      socket,
      isInitiator: info.client,
      connectedAt: Date.now()
    }
    this.connections.set(peerId, connection)

    // Register with router
    this.router.addPeer(peerId)

    // Update mailbox
    if (this.mailbox) {
      this.mailbox.updateLastSeen(peerId)
    }

    // Set up message handling
    let buffer = Buffer.alloc(0)

    socket.on('data', (data: Buffer) => {
      // Accumulate data (messages might be split across chunks)
      buffer = Buffer.concat([buffer, data])

      // Try to parse complete messages (newline delimited)
      while (true) {
        const newlineIndex = buffer.indexOf('\n')
        if (newlineIndex === -1) break

        const messageData = buffer.slice(0, newlineIndex)
        buffer = buffer.slice(newlineIndex + 1)

        const message = deserializeMessage(messageData)
        if (message) {
          this.handleMessage(message, peerId)
        }
      }
    })

    socket.on('error', (err: Error) => {
      console.error(`Peer ${peerId} error:`, err)
    })

    socket.on('close', () => {
      this.handleDisconnection(peerId)
    })

    // Emit connected event
    this.emit('peer:connected', peerId)

    // Send HELLO message and initiate sync
    try {
      const hello = createHelloMessage(this.deviceId, this.deviceName, this.familyId)
      await this.sendToPeer(peerId, hello)
      await this.flushMailbox(peerId)
      await this.requestSync(peerId)
    } catch (err) {
      console.error('[Swarm] Error during peer initialization:', peerId.slice(0, 8), err)
    }
  }

  /**
   * Handle peer disconnection
   */
  private handleDisconnection(peerId: string): void {
    this.connections.delete(peerId)
    this.router.removePeer(peerId)
    this.reliable.clearPendingForPeer(peerId)

    this.emit('peer:disconnected', peerId)
  }

  /**
   * Handle an incoming message
   */
  private async handleMessage(message: MeshMessage, fromPeer: string): Promise<void> {
    try {
      switch (message.type) {
        case 'EVENT':
          await this.handleEventMessage(message, fromPeer)
          break
        case 'ACK':
          this.handleAckMessage(message, fromPeer)
          break
        case 'SYNC_REQUEST':
          await this.handleSyncRequest(message, fromPeer)
          break
        case 'SYNC_RESPONSE':
          await this.handleSyncResponse(message, fromPeer)
          break
        case 'HEARTBEAT':
          this.handleHeartbeat(message, fromPeer)
          break
        case 'PEER_LIST':
          // Could be used for peer discovery
          break
        case 'MAILBOX_FLUSH':
          await this.flushMailbox(fromPeer)
          break
        case 'HELLO':
          this.handleHello(message, fromPeer)
          break
      }
    } catch (err) {
      console.error('[Swarm] Error handling message:', message.type, err)
    }
  }

  /**
   * Handle a HELLO message - update peer info
   */
  private handleHello(message: HelloMessage, fromPeer: string): void {
    console.log('[Swarm] Received HELLO from', message.deviceName, '(' + fromPeer.slice(0, 8) + '...)')

    // Update router with device name
    this.router.addPeer(fromPeer, { deviceName: message.deviceName })

    // Update mailbox
    if (this.mailbox) {
      this.mailbox.updateLastSeen(fromPeer)
    }

    // Re-emit connected event with updated info
    this.emit('peer:connected', fromPeer)
  }

  /**
   * Handle an incoming event message
   */
  private async handleEventMessage(message: EventMessage, fromPeer: string): Promise<void> {
    const decision = this.router.routeIncomingEvent(message, fromPeer)

    if (decision.shouldProcess) {
      // Apply event to our log and database
      try {
        await this.eventLog.appendReceived(message.event)
        const index = (await this.eventLog.length()) - 1
        await this.projector.apply(message.event, index)

        this.emit('event:received', message.event, fromPeer)
      } catch (err) {
        console.error('Failed to process event:', err)
      }
    }

    // Send ACK
    const ack = this.reliable.createAck(message.event.id, this.deviceId)
    await this.sendToPeer(fromPeer, ack)

    // Forward if needed
    if (decision.shouldForward) {
      const forwardMessage = this.router.createForwardMessage(message)
      for (const peerId of decision.forwardTo) {
        await this.sendToPeer(peerId, forwardMessage)
      }
    }
  }

  /**
   * Handle an ACK message
   */
  private handleAckMessage(message: AckMessage, fromPeer: string): void {
    this.reliable.handleAck(message, fromPeer)

    // Also acknowledge in mailbox
    if (this.mailbox) {
      this.mailbox.acknowledgeMessage(fromPeer, message.eventId)
    }
  }

  /**
   * Handle a sync request
   */
  private async handleSyncRequest(message: SyncRequestMessage, fromPeer: string): Promise<void> {
    const startIndex = message.lastKnownIndex + 1
    const events = await this.eventLog.getFrom(startIndex)

    if (events.length > 0) {
      console.log('[Swarm] Sending', events.length, 'events to', fromPeer.slice(0, 8))
    }

    // Send in batches
    for (let i = 0; i < events.length; i += SYNC_BATCH_SIZE) {
      const batch = events.slice(i, i + SYNC_BATCH_SIZE)
      const hasMore = i + SYNC_BATCH_SIZE < events.length

      const response = createSyncResponseMessage(batch, startIndex + i, hasMore)
      await this.sendToPeer(fromPeer, response)
    }

    // Send empty response if no events
    if (events.length === 0) {
      const response = createSyncResponseMessage([], startIndex, false)
      await this.sendToPeer(fromPeer, response)
    }
  }

  /**
   * Handle a sync response
   */
  private async handleSyncResponse(message: SyncResponseMessage, fromPeer: string): Promise<void> {
    let eventsProcessed = 0

    for (const event of message.events) {
      // Skip if we've seen this event
      if (this.router.hasSeenEvent(event.id)) {
        continue
      }

      this.router.markEventSeen(event.id)

      try {
        await this.eventLog.appendReceived(event)
        const index = (await this.eventLog.length()) - 1
        await this.projector.apply(event, index)
        eventsProcessed++
      } catch (err) {
        console.error('[Swarm] Failed to apply synced event:', event.type, event.id, err)
      }
    }

    if (!message.hasMore) {
      this.emit('sync:completed', fromPeer, eventsProcessed)
      if (eventsProcessed > 0) {
        console.log('[Swarm] Sync completed:', eventsProcessed, 'events received from', fromPeer.slice(0, 8))
      }
    }
  }

  /**
   * Handle a heartbeat message
   */
  private handleHeartbeat(message: HeartbeatMessage, fromPeer: string): void {
    this.router.addPeer(fromPeer)
    if (this.mailbox) {
      this.mailbox.updateLastSeen(fromPeer)
    }
  }

  /**
   * Request sync from a peer
   */
  private async requestSync(peerId: string): Promise<void> {
    const state = this.projector.getState()
    this.emit('sync:started', peerId)

    const request = createSyncRequestMessage(
      this.deviceId,
      state.lastProcessedEventId,
      state.lastProcessedIndex
    )

    await this.sendToPeer(peerId, request)
  }

  /**
   * Flush mailbox messages to a peer
   */
  private async flushMailbox(peerId: string): Promise<void> {
    if (!this.mailbox) return

    const pending = this.mailbox.getPendingMessages(peerId)
    if (pending.length > 0) {
      console.log('[Swarm] Flushing', pending.length, 'queued messages to', peerId.slice(0, 8))
    }

    for (const msg of pending) {
      const eventMessage = createEventMessage(msg.event, this.deviceId, 0)
      await this.sendToPeer(peerId, eventMessage)
      this.reliable.trackSent(eventMessage, peerId)
    }
  }

  /**
   * Broadcast a local event to all peers
   */
  async broadcast(event: SyncEvent): Promise<void> {
    const targets = this.router.routeOutgoingEvent(event)

    for (const { peerId, message } of targets) {
      await this.sendToPeer(peerId, message)
      this.reliable.trackSent(message, peerId)
    }

    // Queue for offline peers that we know from this session
    // Only queue for peers from the router (recently connected), not stale mailbox entries
    if (this.mailbox) {
      const knownPeers = this.router.getAllKnownPeers()
      const offlinePeers = knownPeers
        .filter((p) => !p.isOnline && !this.connections.has(p.peerId))
        .map((p) => p.peerId)

      for (const peerId of offlinePeers) {
        this.mailbox.queueMessage(peerId, event)
      }
    }
  }

  /**
   * Send a message to a specific peer
   */
  private async sendToPeer(peerId: string, message: MeshMessage): Promise<void> {
    const conn = this.connections.get(peerId)
    if (!conn) return

    const data = serializeMessage(message)
    // Newline delimiter for message framing
    const framedData = Buffer.concat([data, Buffer.from('\n')])

    // Note: socket.write callback may not fire immediately with Hyperswarm streams,
    // but data is still transmitted. We use a timeout to avoid blocking.
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000)

      conn.socket.write(framedData, (err?: Error | null) => {
        clearTimeout(timeout)
        if (err) {
          console.error('[Swarm] Failed to send', message.type, 'to', peerId.slice(0, 8), err)
        }
        resolve()
      })
    })
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      const state = await this.eventLog.getState()

      const heartbeat = createHeartbeatMessage(
        this.deviceId,
        state.length,
        state.lastEventId
      )

      const connArray = Array.from(this.connections.values())
      for (const conn of connArray) {
        try {
          await this.sendToPeer(conn.peerId, heartbeat)
        } catch {
          // Ignore heartbeat send errors
        }
      }
    }, HEARTBEAT_INTERVAL)
  }

  /**
   * Get connection stats
   */
  getStats(): {
    isRunning: boolean
    connectedPeers: number
    mailboxStats: { totalPeers: number; totalPending: number; oldestMessage: number | null } | null
    reliableStats: { pendingCount: number; oldestPending: number | null }
  } {
    return {
      isRunning: this.isRunning,
      connectedPeers: this.connections.size,
      mailboxStats: this.mailbox?.getStats() || null,
      reliableStats: this.reliable.getStats()
    }
  }

  /**
   * Get list of connected peers
   */
  getConnectedPeers(): PeerInfo[] {
    return this.router.getConnectedPeers()
  }

  /**
   * Disconnect a peer (used when kicking a member)
   */
  disconnectPeer(peerId: string): void {
    const conn = this.connections.get(peerId)
    if (conn) {
      console.log('[Swarm] Disconnecting peer:', peerId.slice(0, 8) + '...')
      try {
        ;(conn.socket as any).destroy?.()
      } catch {
        // Ignore close errors
      }
      this.handleDisconnection(peerId)
    }
  }
}

/**
 * Create and start a swarm manager
 */
export async function createSwarmManager(options: SwarmOptions): Promise<SwarmManager> {
  const manager = new SwarmManager(options)
  await manager.start()
  return manager
}
