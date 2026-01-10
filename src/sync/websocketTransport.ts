/**
 * WebSocket Transport for Desktop Sync
 *
 * Provides real-time sync via a WebSocket relay server.
 * Alternative to Hyperswarm P2P for simpler deployment.
 */

import WebSocket from 'ws'
import { EventEmitter } from 'events'
import type { SyncEvent } from './events'

export interface WSTransportOptions {
  deviceId: string
  deviceName: string
  familyId: string
  relayUrl: string
  onEvent: (event: SyncEvent, fromPeer: string) => Promise<void>
  onPeerConnected?: (peerId: string, deviceName: string) => void
  onPeerDisconnected?: (peerId: string) => void
}

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
 * WebSocket-based transport for sync relay (desktop version)
 */
export class WebSocketTransport extends EventEmitter {
  private ws: WebSocket | null = null
  private options: WSTransportOptions
  private peers: Map<string, PeerInfo> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectTimeout: NodeJS.Timeout | null = null
  private pingInterval: NodeJS.Timeout | null = null
  private isConnecting = false
  private shouldReconnect = true
  private isRunning = false

  constructor(options: WSTransportOptions) {
    super()
    this.options = options
  }

  /**
   * Start the WebSocket connection
   */
  async start(): Promise<void> {
    if (this.isRunning) return

    this.shouldReconnect = true
    await this.connect()
    this.isRunning = true
  }

  /**
   * Stop the WebSocket connection
   */
  async stop(): Promise<void> {
    this.shouldReconnect = false
    this.cleanup()
    this.isRunning = false
  }

  /**
   * Broadcast a sync event to all peers
   */
  async broadcast(event: SyncEvent): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[WSTransport] Cannot broadcast: not connected')
      return
    }

    this.sendMessage({
      type: 'event',
      event
    })
  }

  /**
   * Request sync from peers
   */
  async requestSync(afterTimestamp: string | null): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN) return

    this.sendMessage({
      type: 'sync_request',
      afterTimestamp
    })
  }

  /**
   * Send sync response to peers
   */
  async sendSyncResponse(events: SyncEvent[], hasMore: boolean): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN) return

    this.sendMessage({
      type: 'sync_response',
      events,
      hasMore
    })
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Get list of connected peers
   */
  getConnectedPeers(): PeerInfo[] {
    return Array.from(this.peers.values())
  }

  /**
   * Get connection stats
   */
  getStats(): { isRunning: boolean; connectedPeers: number } {
    return {
      isRunning: this.isRunning,
      connectedPeers: this.peers.size
    }
  }

  // Private methods

  private async connect(): Promise<void> {
    if (this.isConnecting) return

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        console.log('[WSTransport] Connecting to', this.options.relayUrl)

        this.ws = new WebSocket(this.options.relayUrl)

        this.ws.on('open', () => {
          console.log('[WSTransport] Connected to relay')
          this.isConnecting = false
          this.reconnectAttempts = 0

          // Join family
          this.sendMessage({
            type: 'join',
            familyId: this.options.familyId,
            deviceId: this.options.deviceId,
            deviceName: this.options.deviceName
          })

          // Start ping interval
          this.startPing()

          this.emit('connected')
          resolve()
        })

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data.toString())
        })

        this.ws.on('error', (error: Error) => {
          console.error('[WSTransport] WebSocket error:', error)
          this.emit('error', error)
        })

        this.ws.on('close', () => {
          console.log('[WSTransport] Connection closed')
          this.isConnecting = false
          this.stopPing()

          // Attempt reconnect
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }

          this.emit('disconnected')
        })

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
            this.options.onPeerConnected?.(peer.deviceId, peer.deviceName)
          }
          this.emit('peers:updated', this.getConnectedPeers())
          break
        }

        case 'peer_joined': {
          const { deviceId, deviceName } = message as { deviceId: string; deviceName: string }
          this.peers.set(deviceId, { deviceId, deviceName, isOnline: true })
          this.options.onPeerConnected?.(deviceId, deviceName)
          this.emit('peer:connected', deviceId, deviceName)

          // Request sync from new peer
          this.requestSync(null)
          break
        }

        case 'peer_left': {
          const { deviceId } = message as { deviceId: string }
          this.peers.delete(deviceId)
          this.options.onPeerDisconnected?.(deviceId)
          this.emit('peer:disconnected', deviceId)
          break
        }

        case 'peers': {
          // Full peer list update
          const peers = message.peers as PeerInfo[]
          this.peers.clear()
          for (const peer of peers) {
            if (peer.deviceId !== this.options.deviceId) {
              this.peers.set(peer.deviceId, peer)
            }
          }
          this.emit('peers:updated', this.getConnectedPeers())
          break
        }

        case 'event': {
          // Sync event from another device
          const { from, event } = message as { from: string; event: SyncEvent }
          this.options.onEvent(event, from).catch(err => {
            console.error('[WSTransport] Error processing event:', err)
          })
          break
        }

        case 'sync_request': {
          // Another device is requesting sync
          const { from, afterTimestamp } = message as { from: string; afterTimestamp?: string }
          this.emit('sync:request', from, afterTimestamp)
          break
        }

        case 'sync_response': {
          // Sync data from another device
          const { from, events, hasMore } = message as { from: string; events: SyncEvent[]; hasMore: boolean }
          for (const event of events) {
            this.options.onEvent(event, from).catch(err => {
              console.error('[WSTransport] Error processing synced event:', err)
            })
          }
          if (!hasMore) {
            this.emit('sync:completed', from, events.length)
          }
          break
        }

        case 'pong': {
          // Ping response, connection is alive
          break
        }
      }
    } catch (error) {
      console.error('[WSTransport] Error parsing message:', error)
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

    console.log(`[WSTransport] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.connect().catch((error) => {
        console.error('[WSTransport] Reconnect failed:', error)
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
      this.ws.removeAllListeners()
      this.ws.close()
      this.ws = null
    }

    this.peers.clear()
    this.isConnecting = false
  }
}

/**
 * Create a WebSocket transport
 */
export function createWebSocketTransport(options: WSTransportOptions): WebSocketTransport {
  return new WebSocketTransport(options)
}
