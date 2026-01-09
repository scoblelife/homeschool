/**
 * Sync Manager - orchestrates sync operations and manages connections
 */

import { SyncEvent, createSyncEvent, EventType, generateUUID } from './events'
import { HybridLogicalClock } from './hlc'
import { EventLog } from './eventLog'
import { FamilyManager } from './family'
import { EventProjector } from './projector'
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

  private peers: Map<string, SyncPeer> = new Map()
  private connected = false
  private lastSyncTime: number | null = null

  private eventHandlers: Set<SyncEventHandler> = new Set()
  private peerConnectedHandlers: Set<PeerEventHandler> = new Set()
  private peerDisconnectedHandlers: Set<PeerEventHandler> = new Set()

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
   * Connect to sync network (placeholder - would use WebSocket/P2P in production)
   */
  connect(): void {
    if (!this.familyManager.isSyncEnabled()) {
      console.log('Sync not enabled')
      return
    }

    // In a real implementation, this would:
    // 1. Connect to a relay server or use WebRTC
    // 2. Discover other family members
    // 3. Exchange events

    this.connected = true
    console.log('Sync connected (simulated)')
  }

  /**
   * Disconnect from sync network
   */
  disconnect(): void {
    this.connected = false
    this.peers.clear()
    console.log('Sync disconnected')
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

  private broadcastEvent(event: SyncEvent): void {
    // In production, would send event to all connected peers
    console.log('Broadcasting event:', event.type)
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
