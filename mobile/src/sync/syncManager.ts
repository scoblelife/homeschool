/**
 * Sync Manager - orchestrates sync operations and manages connections
 */

import { SyncEvent, createSyncEvent, EventType, generateUUID } from './events'
import { HybridLogicalClock } from './hlc'
import { EventLog } from './eventLog'
import { FamilyManager } from './family'
import { EventProjector } from './projector'
import { Hyperswarm, createTopic, EventType as SwarmEventType } from './hyperswarm'
import AsyncStorage from '@react-native-async-storage/async-storage'

const HLC_STATE_KEY = '@homeschool/hlc_state'
const SYNC_STATE_KEY = '@homeschool/sync_state'

export interface SyncPeer {
  deviceId: string
  deviceName: string
  isOnline: boolean
  lastSeen: number
}

export interface SyncStatus {
  enabled: boolean
  connected: boolean
  peerCount: number
  pendingEvents: number
  lastSyncTime: number | null
}

type SyncEventHandler = (event: SyncEvent) => void
type PeerEventHandler = (peer: SyncPeer) => void

export class SyncManager {
  private static instance: SyncManager | null = null

  private hlc: HybridLogicalClock | null = null
  private eventLog: EventLog
  private familyManager: FamilyManager
  private projector: EventProjector
  private swarm: Hyperswarm | null = null

  private peers: Map<string, SyncPeer> = new Map()
  private connected = false
  private lastSyncTime: number | null = null
  private currentTopic: string | null = null

  private eventHandlers: Set<SyncEventHandler> = new Set()
  private peerConnectedHandlers: Set<PeerEventHandler> = new Set()
  private peerDisconnectedHandlers: Set<PeerEventHandler> = new Set()
  private swarmEventCleanup: (() => void) | null = null

  private initialized = false

  private constructor() {
    this.eventLog = EventLog.getInstance()
    this.familyManager = FamilyManager.getInstance()
    this.projector = EventProjector.getInstance()
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  /**
   * Initialize the sync manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    // Initialize dependencies
    await this.eventLog.initialize()
    await this.familyManager.initialize()

    // Load or create HLC
    const hlcJson = await AsyncStorage.getItem(HLC_STATE_KEY)
    if (hlcJson) {
      this.hlc = HybridLogicalClock.fromJSON(JSON.parse(hlcJson))
    } else {
      this.hlc = new HybridLogicalClock()
      await this.saveHLCState()
    }

    // Load last sync time
    const syncState = await AsyncStorage.getItem(SYNC_STATE_KEY)
    if (syncState) {
      const state = JSON.parse(syncState)
      this.lastSyncTime = state.lastSyncTime
    }

    // Process any pending events
    await this.projector.processEvents()

    this.initialized = true
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      enabled: this.familyManager.isSyncEnabled(),
      connected: this.connected,
      peerCount: this.peers.size,
      pendingEvents: 0, // Will be calculated
      lastSyncTime: this.lastSyncTime,
    }
  }

  /**
   * Get list of connected peers
   */
  getPeers(): SyncPeer[] {
    return Array.from(this.peers.values())
  }

  /**
   * Create a new family
   */
  async createFamily(deviceName: string): Promise<void> {
    await this.familyManager.createFamily(deviceName)

    // Reset HLC with new node ID
    this.hlc = new HybridLogicalClock(this.familyManager.getDeviceId() || undefined)
    await this.saveHLCState()
  }

  /**
   * Join an existing family
   */
  async joinFamily(qrData: string, deviceName: string): Promise<void> {
    await this.familyManager.joinFamily(qrData, deviceName)

    // Reset HLC with new node ID
    this.hlc = new HybridLogicalClock(this.familyManager.getDeviceId() || undefined)
    await this.saveHLCState()
  }

  /**
   * Leave the current family
   */
  async leaveFamily(): Promise<void> {
    this.disconnect()
    await this.familyManager.leaveFamily()
    this.peers.clear()
    this.lastSyncTime = null
  }

  /**
   * Get invite code for sharing
   */
  getInviteCode(): string {
    return this.familyManager.getInviteCode()
  }

  /**
   * Get invite message for sharing
   */
  getInviteMessage(): string {
    return this.familyManager.getInviteMessage()
  }

  /**
   * Check if this device is the family manager
   */
  isManager(): boolean {
    return this.familyManager.isManager()
  }

  /**
   * Get device name
   */
  getDeviceName(): string | null {
    return this.familyManager.getDeviceName()
  }

  /**
   * Update device name
   */
  async updateDeviceName(name: string): Promise<void> {
    await this.familyManager.updateDeviceName(name)
  }

  /**
   * Emit a sync event for a local change
   */
  async emitEvent<T extends Record<string, unknown>>(type: EventType, data: T): Promise<void> {
    if (!this.familyManager.isSyncEnabled() || !this.hlc) {
      return
    }

    const deviceId = this.familyManager.getDeviceId()
    if (!deviceId) return

    const timestamp = this.hlc.now()
    const event = createSyncEvent(type, data, deviceId, timestamp)

    // Store in event log
    await this.eventLog.append(event)
    await this.saveHLCState()

    // Broadcast to peers (if connected)
    this.broadcastEvent(event)

    // Notify local handlers
    this.notifyEventHandlers(event)
  }

  /**
   * Receive an event from a peer
   */
  async receiveEvent(event: SyncEvent): Promise<void> {
    if (!this.hlc) return

    // Check if we already have this event
    if (await this.eventLog.hasEvent(event.id)) {
      return
    }

    // Update HLC
    this.hlc.receive(event.timestamp)
    await this.saveHLCState()

    // Store event
    await this.eventLog.append(event)

    // Process event
    await this.projector.applyEvent(event)
    await this.eventLog.markProcessed(event.id)

    // Notify handlers
    this.notifyEventHandlers(event)

    // Update last sync time
    this.lastSyncTime = Date.now()
    await this.saveSyncState()
  }

  /**
   * Connect to sync network via Hyperswarm P2P
   */
  async connect(): Promise<void> {
    if (!this.familyManager.isSyncEnabled()) {
      console.log('[SyncManager] Sync not enabled')
      return
    }

    const deviceId = this.familyManager.getDeviceId()
    const familyId = this.familyManager.getFamilyId()

    if (!deviceId || !familyId) {
      console.log('[SyncManager] Missing device or family ID')
      return
    }

    // Create and start swarm
    try {
      this.swarm = new Hyperswarm()
      await this.swarm.create({ deviceId })

      // Set up event handlers
      this.swarmEventCleanup = this.swarm.onAny((event) => {
        this.handleSwarmEvent(event)
      })

      await this.swarm.start()

      // Join the family topic
      this.currentTopic = createTopic(familyId)
      await this.swarm.join(this.currentTopic)

      this.connected = true
      const mode = this.swarm.isSimulationMode() ? '(simulation mode)' : '(native)'
      console.log(`[SyncManager] Connected to P2P network ${mode}`)
    } catch (error) {
      console.error('[SyncManager] Failed to connect:', error)
      this.connected = false
    }
  }

  /**
   * Disconnect from sync network
   */
  async disconnect(): Promise<void> {
    if (this.swarmEventCleanup) {
      this.swarmEventCleanup()
      this.swarmEventCleanup = null
    }

    if (this.swarm) {
      if (this.currentTopic) {
        try {
          await this.swarm.leave(this.currentTopic)
        } catch (e) {
          // Ignore leave errors during disconnect
        }
        this.currentTopic = null
      }
      await this.swarm.stop()
      this.swarm.destroy()
      this.swarm = null
    }

    this.connected = false
    this.peers.clear()
    console.log('[SyncManager] Disconnected from P2P network')
  }

  /**
   * Handle events from the Hyperswarm network
   */
  private handleSwarmEvent(event: { type: SwarmEventType; peerId?: string; data?: string }): void {
    switch (event.type) {
      case SwarmEventType.Ready:
        console.log('[SyncManager] Swarm ready')
        // Request sync from any existing peers
        this.requestSync()
        break

      case SwarmEventType.PeerConnected:
        if (event.peerId) {
          const peer: SyncPeer = {
            deviceId: event.peerId,
            deviceName: `Device ${event.peerId.substring(0, 8)}`,
            isOnline: true,
            lastSeen: Date.now(),
          }
          this.peers.set(event.peerId, peer)
          this.notifyPeerConnected(peer)
          console.log('[SyncManager] Peer connected:', event.peerId)

          // Request sync from new peer
          this.sendSyncRequest(event.peerId)
        }
        break

      case SwarmEventType.PeerDisconnected:
        if (event.peerId) {
          const peer = this.peers.get(event.peerId)
          if (peer) {
            peer.isOnline = false
            this.peers.delete(event.peerId)
            this.notifyPeerDisconnected(peer)
            console.log('[SyncManager] Peer disconnected:', event.peerId)
          }
        }
        break

      case SwarmEventType.Data:
        if (event.data && event.peerId) {
          this.handlePeerData(event.peerId, event.data)
        }
        break

      case SwarmEventType.Error:
        console.error('[SyncManager] Swarm error')
        break
    }
  }

  /**
   * Handle data received from a peer
   */
  private async handlePeerData(peerId: string, data: string): Promise<void> {
    try {
      const message = JSON.parse(data)

      switch (message.type) {
        case 'sync_request':
          // Peer is requesting events after a certain timestamp
          await this.handleSyncRequest(peerId, message.afterTimestamp)
          break

        case 'sync_response':
          // Peer is sending events in response to our request
          for (const event of message.events) {
            await this.receiveEvent(event)
          }
          break

        case 'event':
          // Single event from peer
          await this.receiveEvent(message.event)
          break

        case 'device_info':
          // Update peer device name
          const peer = this.peers.get(peerId)
          if (peer) {
            peer.deviceName = message.deviceName
          }
          break
      }
    } catch (error) {
      console.error('[SyncManager] Failed to parse peer data:', error)
    }
  }

  /**
   * Send sync request to a specific peer
   */
  private async sendSyncRequest(peerId: string): Promise<void> {
    if (!this.swarm) return

    const latestTimestamp = await this.eventLog.getLatestTimestamp()
    const message = {
      type: 'sync_request',
      afterTimestamp: latestTimestamp,
    }

    await this.swarm.send(peerId, JSON.stringify(message))

    // Also send our device info
    const deviceName = this.familyManager.getDeviceName()
    if (deviceName) {
      await this.swarm.send(peerId, JSON.stringify({
        type: 'device_info',
        deviceName,
      }))
    }
  }

  /**
   * Handle sync request from a peer
   */
  private async handleSyncRequest(peerId: string, afterTimestamp: string | null): Promise<void> {
    if (!this.swarm) return

    // Get events after the requested timestamp
    const events = await this.eventLog.getEventsAfter(afterTimestamp)

    const message = {
      type: 'sync_response',
      events,
    }

    await this.swarm.send(peerId, JSON.stringify(message))
  }

  /**
   * Request sync from peers
   */
  async requestSync(): Promise<void> {
    if (!this.connected) return

    const latestTimestamp = await this.eventLog.getLatestTimestamp()

    // In production, would send SYNC_REQUEST to peers
    console.log('Requesting sync after timestamp:', latestTimestamp)
  }

  // Event subscription methods

  onEventReceived(handler: SyncEventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => this.eventHandlers.delete(handler)
  }

  onPeerConnected(handler: PeerEventHandler): () => void {
    this.peerConnectedHandlers.add(handler)
    return () => this.peerConnectedHandlers.delete(handler)
  }

  onPeerDisconnected(handler: PeerEventHandler): () => void {
    this.peerDisconnectedHandlers.add(handler)
    return () => this.peerDisconnectedHandlers.delete(handler)
  }

  // Private methods

  private async saveHLCState(): Promise<void> {
    if (this.hlc) {
      await AsyncStorage.setItem(HLC_STATE_KEY, JSON.stringify(this.hlc.toJSON()))
    }
  }

  private async saveSyncState(): Promise<void> {
    await AsyncStorage.setItem(
      SYNC_STATE_KEY,
      JSON.stringify({ lastSyncTime: this.lastSyncTime })
    )
  }

  private async broadcastEvent(event: SyncEvent): Promise<void> {
    if (!this.swarm || !this.connected) {
      console.log('[SyncManager] Cannot broadcast - not connected')
      return
    }

    const message = {
      type: 'event',
      event,
    }

    try {
      await this.swarm.broadcast(JSON.stringify(message))
      console.log('[SyncManager] Broadcast event:', event.type)
    } catch (error) {
      console.error('[SyncManager] Failed to broadcast:', error)
    }
  }

  private notifyEventHandlers(event: SyncEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event)
      } catch (error) {
        console.error('Error in event handler:', error)
      }
    }
  }

  private notifyPeerConnected(peer: SyncPeer): void {
    for (const handler of this.peerConnectedHandlers) {
      try {
        handler(peer)
      } catch (error) {
        console.error('Error in peer connected handler:', error)
      }
    }
  }

  private notifyPeerDisconnected(peer: SyncPeer): void {
    for (const handler of this.peerDisconnectedHandlers) {
      try {
        handler(peer)
      } catch (error) {
        console.error('Error in peer disconnected handler:', error)
      }
    }
  }
}
