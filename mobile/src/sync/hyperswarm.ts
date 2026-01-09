/**
 * Hyperswarm Native Module Integration
 *
 * This module provides P2P networking via the native Hyperswarm Rust library.
 * Falls back to simulation mode when native module is not available.
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native'

// Check if native module is available
const HyperswarmModule = NativeModules.HyperswarmModule
const isNativeAvailable = !!HyperswarmModule

let eventEmitter: NativeEventEmitter | null = null
if (isNativeAvailable) {
  eventEmitter = new NativeEventEmitter(HyperswarmModule)
}

export enum EventType {
  Ready = 0,
  PeerConnected = 1,
  PeerDisconnected = 2,
  Data = 3,
  Error = 4,
}

export interface SwarmEvent {
  swarmId: number
  type: EventType
  peerId?: string
  data?: string
  address?: string
  message?: string
}

export interface SwarmConfig {
  deviceId: string
}

export type EventHandler = (event: SwarmEvent) => void

/**
 * Hyperswarm instance for P2P networking
 */
export class Hyperswarm {
  private swarmId: number | null = null
  private eventSubscription: any = null
  private handlers: Map<EventType, Set<EventHandler>> = new Map()
  private deviceId: string = ''
  private simulatedPeers: Set<string> = new Set()
  private isSimulated: boolean = !isNativeAvailable

  /**
   * Check if native Hyperswarm is available
   */
  static isAvailable(): boolean {
    return isNativeAvailable
  }

  /**
   * Create and initialize a new swarm
   */
  async create(config: SwarmConfig): Promise<void> {
    this.deviceId = config.deviceId

    if (this.isSimulated) {
      console.log('[Hyperswarm] Running in simulation mode (native module not available)')
      this.swarmId = Date.now()
      return
    }

    try {
      this.swarmId = await HyperswarmModule.create(config.deviceId)
      this.setupEventListener()
    } catch (error) {
      console.error('[Hyperswarm] Failed to create native swarm:', error)
      // Fall back to simulation
      this.isSimulated = true
      this.swarmId = Date.now()
    }
  }

  /**
   * Start the swarm (begin listening and connecting)
   */
  async start(): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created')

    if (this.isSimulated) {
      console.log('[Hyperswarm] Simulated swarm started')
      // Emit ready event
      setTimeout(() => {
        this.emitEvent({
          swarmId: this.swarmId!,
          type: EventType.Ready,
        })
      }, 100)
      return
    }

    await HyperswarmModule.start(this.swarmId)
  }

  /**
   * Stop the swarm
   */
  async stop(): Promise<void> {
    if (!this.swarmId) return

    if (this.isSimulated) {
      console.log('[Hyperswarm] Simulated swarm stopped')
      return
    }

    await HyperswarmModule.stop(this.swarmId)
  }

  /**
   * Destroy the swarm and free resources
   */
  destroy(): void {
    if (this.eventSubscription) {
      this.eventSubscription.remove()
      this.eventSubscription = null
    }

    if (this.swarmId && !this.isSimulated) {
      HyperswarmModule.destroy(this.swarmId)
    }

    this.swarmId = null
    this.handlers.clear()
    this.simulatedPeers.clear()
  }

  /**
   * Join a topic for peer discovery
   */
  async join(topic: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created')

    if (this.isSimulated) {
      console.log('[Hyperswarm] Joined topic (simulated):', topic)
      return
    }

    await HyperswarmModule.join(this.swarmId, topic)
  }

  /**
   * Leave a topic
   */
  async leave(topic: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created')

    if (this.isSimulated) {
      console.log('[Hyperswarm] Left topic (simulated):', topic)
      return
    }

    await HyperswarmModule.leave(this.swarmId, topic)
  }

  /**
   * Send data to a specific peer
   */
  async send(peerId: string, data: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created')

    if (this.isSimulated) {
      console.log('[Hyperswarm] Send to peer (simulated):', peerId, data.substring(0, 50))
      return
    }

    await HyperswarmModule.send(this.swarmId, peerId, data)
  }

  /**
   * Broadcast data to all connected peers
   */
  async broadcast(data: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created')

    if (this.isSimulated) {
      console.log('[Hyperswarm] Broadcast (simulated):', data.substring(0, 50))
      return
    }

    await HyperswarmModule.broadcast(this.swarmId, data)
  }

  /**
   * Get the local peer ID
   */
  async getLocalPeerId(): Promise<string> {
    if (!this.swarmId) throw new Error('Swarm not created')

    if (this.isSimulated) {
      return this.deviceId
    }

    return await HyperswarmModule.getLocalPeerId(this.swarmId)
  }

  /**
   * Get the number of connected peers
   */
  async getPeerCount(): Promise<number> {
    if (!this.swarmId) throw new Error('Swarm not created')

    if (this.isSimulated) {
      return this.simulatedPeers.size
    }

    return await HyperswarmModule.getPeerCount(this.swarmId)
  }

  /**
   * Check if running in simulation mode
   */
  isSimulationMode(): boolean {
    return this.isSimulated
  }

  /**
   * Subscribe to swarm events
   */
  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler)
    }
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler): () => void {
    const unsubscribers = [
      this.on(EventType.Ready, handler),
      this.on(EventType.PeerConnected, handler),
      this.on(EventType.PeerDisconnected, handler),
      this.on(EventType.Data, handler),
      this.on(EventType.Error, handler),
    ]

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }

  // Private methods

  private setupEventListener(): void {
    if (!eventEmitter) return

    this.eventSubscription = eventEmitter.addListener(
      'hyperswarmEvent',
      (event: SwarmEvent) => {
        if (event.swarmId !== this.swarmId) return
        this.emitEvent(event)
      }
    )
  }

  private emitEvent(event: SwarmEvent): void {
    const handlers = this.handlers.get(event.type)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event)
        } catch (e) {
          console.error('[Hyperswarm] Error in event handler:', e)
        }
      })
    }
  }

  // Simulation helpers (for testing without native module)

  /**
   * Simulate a peer connection (for testing)
   */
  simulatePeerConnect(peerId: string): void {
    if (!this.isSimulated) return

    this.simulatedPeers.add(peerId)
    this.emitEvent({
      swarmId: this.swarmId!,
      type: EventType.PeerConnected,
      peerId,
    })
  }

  /**
   * Simulate a peer disconnection (for testing)
   */
  simulatePeerDisconnect(peerId: string): void {
    if (!this.isSimulated) return

    this.simulatedPeers.delete(peerId)
    this.emitEvent({
      swarmId: this.swarmId!,
      type: EventType.PeerDisconnected,
      peerId,
    })
  }

  /**
   * Simulate receiving data (for testing)
   */
  simulateData(peerId: string, data: string): void {
    if (!this.isSimulated) return

    this.emitEvent({
      swarmId: this.swarmId!,
      type: EventType.Data,
      peerId,
      data,
    })
  }
}

/**
 * Create a topic hash from a family ID
 */
export function createTopic(familyId: string): string {
  return `homeschool:family:${familyId}`
}

export default Hyperswarm
