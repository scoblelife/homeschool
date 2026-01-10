/**
 * WebSocket Transport for Sync
 *
 * Provides real-time sync via a WebSocket relay server.
 * Same interface as Hyperswarm for easy swapping.
 */

// Note: React Native includes a WebSocket implementation in the global scope

export enum EventType {
  Ready = 0,
  PeerConnected = 1,
  PeerDisconnected = 2,
  Data = 3,
  Error = 4,
}

export interface TransportEvent {
  type: EventType
  peerId?: string
  deviceName?: string
  data?: string
  message?: string
}

export interface TransportConfig {
  deviceId: string
  deviceName: string
  relayUrl: string
}

export type EventHandler = (event: TransportEvent) => void

interface PeerInfo {
  deviceId: string
  deviceName: string
  isOnline: boolean
}

interface RelayMessage {
  type: string
  [key: string]: unknown
}

/**
 * WebSocket-based transport for sync relay
 */
export class WebSocketTransport {
  private ws: WebSocket | null = null
  private config: TransportConfig | null = null
  private familyId: string | null = null
  private handlers: Map<EventType, Set<EventHandler>> = new Map()
  private peers: Map<string, PeerInfo> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private isConnecting = false
  private shouldReconnect = true

  /**
   * Check if WebSocket transport is available (always true)
   */
  static isAvailable(): boolean {
    return true
  }

  /**
   * Create the transport with configuration
   */
  async create(config: TransportConfig): Promise<void> {
    this.config = config
    console.log('[WebSocketTransport] Created with config:', {
      deviceId: config.deviceId.substring(0, 8),
      deviceName: config.deviceName,
      relayUrl: config.relayUrl
    })
  }

  /**
   * Connect to the relay server
   */
  async start(): Promise<void> {
    if (!this.config) throw new Error('Transport not created')
    if (this.isConnecting) return

    this.shouldReconnect = true
    await this.connect()
  }

  /**
   * Stop the transport
   */
  async stop(): Promise<void> {
    this.shouldReconnect = false
    this.cleanup()
  }

  /**
   * Destroy the transport and free resources
   */
  destroy(): void {
    this.shouldReconnect = false
    this.cleanup()
    this.handlers.clear()
    this.peers.clear()
    this.config = null
    this.familyId = null
  }

  /**
   * Join a family topic
   */
  async join(familyId: string): Promise<void> {
    this.familyId = familyId

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'join',
        familyId,
        deviceId: this.config!.deviceId,
        deviceName: this.config!.deviceName
      })
    }
  }

  /**
   * Leave the current family
   */
  async leave(_familyId: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'leave' })
    }
    this.familyId = null
    this.peers.clear()
  }

  /**
   * Send data to a specific peer (via relay)
   */
  async send(_peerId: string, data: string): Promise<void> {
    // For now, all messages go through broadcast
    await this.broadcast(data)
  }

  /**
   * Broadcast data to all peers
   */
  async broadcast(data: string): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocketTransport] Cannot broadcast: not connected')
      return
    }

    this.sendMessage({
      type: 'event',
      event: JSON.parse(data)
    })
  }

  /**
   * Get the local device ID
   */
  async getLocalPeerId(): Promise<string> {
    if (!this.config) throw new Error('Transport not created')
    return this.config.deviceId
  }

  /**
   * Get number of connected peers
   */
  async getPeerCount(): Promise<number> {
    return this.peers.size
  }

  /**
   * Check if using simulation mode
   */
  isSimulationMode(): boolean {
    return false
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Get list of peers
   */
  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values())
  }

  /**
   * Subscribe to events
   */
  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)

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

  private async connect(): Promise<void> {
    if (!this.config || this.isConnecting) return

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        console.log('[WebSocketTransport] Connecting to', this.config!.relayUrl)

        this.ws = new WebSocket(this.config!.relayUrl)

        this.ws.onopen = () => {
          console.log('[WebSocketTransport] Connected to relay')
          this.isConnecting = false
          this.reconnectAttempts = 0

          // Join family if we have one
          if (this.familyId) {
            this.sendMessage({
              type: 'join',
              familyId: this.familyId,
              deviceId: this.config!.deviceId,
              deviceName: this.config!.deviceName
            })
          }

          // Start ping interval
          this.startPing()

          // Emit ready event
          this.emitEvent({ type: EventType.Ready })

          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data as string)
        }

        this.ws.onerror = (error) => {
          console.error('[WebSocketTransport] WebSocket error:', error)
          this.emitEvent({
            type: EventType.Error,
            message: 'WebSocket error'
          })
        }

        this.ws.onclose = () => {
          console.log('[WebSocketTransport] Connection closed')
          this.isConnecting = false
          this.stopPing()

          // Attempt reconnect
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        // Timeout connection attempt
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false
            this.ws?.close()
            reject(new Error('Connection timeout'))
          }
        }, 10000)

      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  private handleMessage(rawData: string): void {
    try {
      const message = JSON.parse(rawData) as RelayMessage

      switch (message.type) {
        case 'welcome': {
          // Initial peer list from server
          const peers = message.peers as PeerInfo[]
          for (const peer of peers) {
            this.peers.set(peer.deviceId, peer)
            this.emitEvent({
              type: EventType.PeerConnected,
              peerId: peer.deviceId,
              deviceName: peer.deviceName
            })
          }
          break
        }

        case 'peer_joined': {
          const { deviceId, deviceName } = message as { deviceId: string; deviceName: string }
          this.peers.set(deviceId, { deviceId, deviceName, isOnline: true })
          this.emitEvent({
            type: EventType.PeerConnected,
            peerId: deviceId,
            deviceName
          })
          break
        }

        case 'peer_left': {
          const { deviceId, deviceName } = message as { deviceId: string; deviceName: string }
          this.peers.delete(deviceId)
          this.emitEvent({
            type: EventType.PeerDisconnected,
            peerId: deviceId,
            deviceName
          })
          break
        }

        case 'peers': {
          // Full peer list update
          const peers = message.peers as PeerInfo[]
          this.peers.clear()
          for (const peer of peers) {
            if (peer.deviceId !== this.config?.deviceId) {
              this.peers.set(peer.deviceId, peer)
            }
          }
          break
        }

        case 'event': {
          // Sync event from another device
          const { from, event } = message as { from: string; event: unknown }
          this.emitEvent({
            type: EventType.Data,
            peerId: from,
            data: JSON.stringify(event)
          })
          break
        }

        case 'sync_request': {
          // Another device is requesting sync
          const { from, afterTimestamp } = message as { from: string; afterTimestamp?: string }
          this.emitEvent({
            type: EventType.Data,
            peerId: from,
            data: JSON.stringify({ type: 'sync_request', afterTimestamp })
          })
          break
        }

        case 'sync_response': {
          // Sync data from another device
          const { from, events, hasMore } = message as { from: string; events: unknown[]; hasMore: boolean }
          this.emitEvent({
            type: EventType.Data,
            peerId: from,
            data: JSON.stringify({ type: 'sync_response', events, hasMore })
          })
          break
        }

        case 'pong': {
          // Ping response, connection is alive
          break
        }
      }
    } catch (error) {
      console.error('[WebSocketTransport] Error parsing message:', error)
    }
  }

  private sendMessage(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private startPing(): void {
    this.stopPing()
    this.pingInterval = setInterval(() => {
      this.sendMessage({ type: 'ping' })
    }, 30000)
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++

    console.log(`[WebSocketTransport] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.connect().catch((error) => {
        console.error('[WebSocketTransport] Reconnect failed:', error)
      })
    }, delay)
  }

  private cleanup(): void {
    this.stopPing()

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onerror = null
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }

    this.isConnecting = false
  }

  private emitEvent(event: TransportEvent): void {
    const handlers = this.handlers.get(event.type)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event)
        } catch (e) {
          console.error('[WebSocketTransport] Error in event handler:', e)
        }
      })
    }
  }
}

export default WebSocketTransport
