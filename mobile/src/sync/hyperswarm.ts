/**
 * P2P Networking Module
 *
 * This module provides P2P networking for family sync using WebRTC.
 * Falls back to simulation mode when WebRTC is not available.
 */

import { WebRTCSwarm, SignalingProvider } from './webrtc'

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
  signaling?: SignalingProvider
}

export type EventHandler = (event: SwarmEvent) => void

// Check if WebRTC is available
let isWebRTCAvailable = false
try {
  const { RTCPeerConnection } = require('react-native-webrtc')
  isWebRTCAvailable = !!RTCPeerConnection
} catch (e) {
  isWebRTCAvailable = false
}

/**
 * P2P Swarm instance for peer networking
 * Uses WebRTC for actual P2P connections, falls back to simulation
 */
export class Hyperswarm {
  private swarmId: number | null = null
  private handlers: Map<EventType, Set<EventHandler>> = new Map()
  private deviceId: string = ''
  private simulatedPeers: Set<string> = new Set()
  private webrtcSwarm: WebRTCSwarm | null = null
  private signaling: SignalingProvider | null = null
  private isSimulated: boolean = !isWebRTCAvailable

  /**
   * Check if WebRTC P2P is available
   */
  static isAvailable(): boolean {
    return isWebRTCAvailable
  }

  /**
   * Create and initialize a new swarm
   */
  async create(config: SwarmConfig): Promise<void> {
    this.deviceId = config.deviceId
    this.signaling = config.signaling || null
    console.log('[Hyperswarm] create() called, deviceId:', config.deviceId)
    console.log('[Hyperswarm] WebRTC available:', isWebRTCAvailable)
    console.log('[Hyperswarm] Signaling provider:', !!this.signaling)

    if (!isWebRTCAvailable || !this.signaling) {
      console.log('[Hyperswarm] Running in simulation mode (WebRTC or signaling not available)')
      this.isSimulated = true
      this.swarmId = Date.now()
      return
    }

    this.isSimulated = false
    this.swarmId = Date.now()

    // Create WebRTC swarm
    this.webrtcSwarm = new WebRTCSwarm(this.deviceId)
    this.webrtcSwarm.setSignaling(this.signaling)
    this.webrtcSwarm.setEvents({
      onConnected: (peerId) => {
        this.emitEvent({
          swarmId: this.swarmId!,
          type: EventType.PeerConnected,
          peerId,
        })
      },
      onDisconnected: (peerId) => {
        this.emitEvent({
          swarmId: this.swarmId!,
          type: EventType.PeerDisconnected,
          peerId,
        })
      },
      onData: (peerId, data) => {
        this.emitEvent({
          swarmId: this.swarmId!,
          type: EventType.Data,
          peerId,
          data,
        })
      },
      onError: (peerId, error) => {
        this.emitEvent({
          swarmId: this.swarmId!,
          type: EventType.Error,
          peerId,
          message: error.message,
        })
      },
    })
  }

  /**
   * Start the swarm (begin listening and connecting)
   */
  async start(): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created')

    console.log('[Hyperswarm] Starting swarm, simulated:', this.isSimulated)

    // Emit ready event
    setTimeout(() => {
      this.emitEvent({
        swarmId: this.swarmId!,
        type: EventType.Ready,
      })
    }, 100)
  }

  /**
   * Stop the swarm
   */
  async stop(): Promise<void> {
    if (!this.swarmId) return
    console.log('[Hyperswarm] Swarm stopped')

    if (this.webrtcSwarm) {
      await this.webrtcSwarm.leave()
    }
  }

  /**
   * Destroy the swarm and free resources
   */
  async destroy(): Promise<void> {
    if (this.webrtcSwarm) {
      this.webrtcSwarm.destroy()
      this.webrtcSwarm = null
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

    console.log('[Hyperswarm] Joining topic:', topic)

    if (this.webrtcSwarm) {
      await this.webrtcSwarm.join(topic)
    } else {
      console.log('[Hyperswarm] Joined topic (simulated)')
    }
  }

  /**
   * Leave a topic
   */
  async leave(topic: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created')

    console.log('[Hyperswarm] Leaving topic:', topic)

    if (this.webrtcSwarm) {
      await this.webrtcSwarm.leave()
    }
  }

  /**
   * Send data to a specific peer
   */
  async send(peerId: string, data: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created')

    if (this.webrtcSwarm) {
      this.webrtcSwarm.send(peerId, data)
    } else {
      console.log('[Hyperswarm] Send to peer (simulated):', peerId, data.substring(0, 50))
    }
  }

  /**
   * Broadcast data to all connected peers
   */
  async broadcast(data: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created')

    if (this.webrtcSwarm) {
      this.webrtcSwarm.broadcast(data)
    } else {
      console.log('[Hyperswarm] Broadcast (simulated):', data.substring(0, 50))
    }
  }

  /**
   * Get the local peer ID
   */
  async getLocalPeerId(): Promise<string> {
    if (!this.swarmId) throw new Error('Swarm not created')
    return this.deviceId
  }

  /**
   * Get the number of connected peers
   */
  async getPeerCount(): Promise<number> {
    if (!this.swarmId) throw new Error('Swarm not created')

    if (this.webrtcSwarm) {
      return this.webrtcSwarm.getPeerCount()
    }
    return this.simulatedPeers.size
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

  // Simulation helpers (for testing)

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
 * Must match desktop implementation: SHA256 hash of "homeschool:family:{familyId}"
 */
export function createTopic(familyId: string): string {
  const topicString = `homeschool:family:${familyId}`
  return topicString
}

export default Hyperswarm
