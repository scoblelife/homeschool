/**
 * WebRTC Transport for Desktop (Electron)
 *
 * Provides peer-to-peer connectivity using WebRTC data channels.
 * Uses public STUN servers for NAT traversal and HTTP signaling for
 * the initial connection handshake.
 *
 * NOTE: This module runs in the Electron main process where
 * browser WebRTC APIs are not available. We use @roamhq/wrtc
 * to provide WebRTC support in Node.js.
 */

// Import WebRTC from @roamhq/wrtc for Node.js support
// eslint-disable-next-line @typescript-eslint/no-require-imports
const wrtc = require('@roamhq/wrtc')
const RTCPeerConnection = wrtc.RTCPeerConnection
const RTCSessionDescription = wrtc.RTCSessionDescription
const RTCIceCandidate = wrtc.RTCIceCandidate

// Type declarations for wrtc
interface RTCConfiguration {
  iceServers?: Array<{ urls: string | string[]; username?: string; credential?: string }>
}

interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback'
  sdp?: string
}

interface RTCIceCandidateInit {
  candidate?: string
  sdpMLineIndex?: number | null
  sdpMid?: string | null
}

interface RTCDataChannelInit {
  ordered?: boolean
  maxRetransmits?: number
}

type RTCPeerConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed'

// Runtime types - these are instances from @roamhq/wrtc
interface RTCDataChannelLike {
  readyState: string
  send(data: string): void
  close(): void
  onopen: (() => void) | null
  onclose: (() => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onerror: ((error: unknown) => void) | null
}

interface RTCIceCandidateLike {
  candidate?: string
  sdpMLineIndex?: number | null
  sdpMid?: string | null
}

interface RTCIceEvent {
  candidate: RTCIceCandidateLike | null
}

interface RTCDataChannelEvent {
  channel: RTCDataChannelLike
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RTCPeerConnectionLike = any

import { EventEmitter } from 'events'
import type { SyncEvent } from './events'
import { SignalingClient, type SignalingMessage } from './signalingClient'
import { WORKER_URL, ICE_SERVERS, PRESENCE_INTERVAL, SIGNAL_POLL_INTERVAL } from './config'

export interface PeerInfo {
  peerId: string
  deviceId: string
  deviceName: string
  isOnline: boolean
}

export interface WebRTCTransportOptions {
  deviceId: string
  deviceName: string
  familyId: string
  pubKey: string
  workerUrl?: string
  onEvent?: (event: SyncEvent, fromPeer: string) => Promise<void>
  onPeerConnected?: (peerId: string, deviceName: string) => void
  onPeerDisconnected?: (peerId: string) => void
}


/**
 * Manages a single WebRTC peer connection
 */
class PeerConnection {
  private pc: RTCPeerConnectionLike
  private dataChannel: RTCDataChannelLike | null = null
  private peerId: string
  private localId: string
  private peerDeviceName: string = 'Unknown'
  private isConnected = false
  private onConnected?: (peerId: string, deviceName: string) => void
  private onDisconnected?: (peerId: string) => void
  private onData?: (peerId: string, data: string) => void
  private onError?: (peerId: string, error: Error) => void

  constructor(
    localId: string,
    peerId: string,
    events: {
      onConnected?: (peerId: string, deviceName: string) => void
      onDisconnected?: (peerId: string) => void
      onData?: (peerId: string, data: string) => void
      onError?: (peerId: string, error: Error) => void
    }
  ) {
    this.localId = localId
    this.peerId = peerId
    this.onConnected = events.onConnected
    this.onDisconnected = events.onDisconnected
    this.onData = events.onData
    this.onError = events.onError

    this.pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.pc.onicecandidate = (event: RTCIceEvent) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate generated')
      }
    }

    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState as RTCPeerConnectionState
      console.log('[WebRTC] Connection state:', state)

      if (state === 'connected' && !this.isConnected) {
        this.isConnected = true
        this.onConnected?.(this.peerId, this.peerDeviceName)
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        if (this.isConnected) {
          this.isConnected = false
          this.onDisconnected?.(this.peerId)
        }
      }
    }

    this.pc.ondatachannel = (event: RTCDataChannelEvent) => {
      console.log('[WebRTC] Received data channel')
      this.setupDataChannel(event.channel)
    }
  }

  private setupDataChannel(channel: RTCDataChannelLike): void {
    this.dataChannel = channel

    channel.onopen = () => {
      console.log('[WebRTC] Data channel opened')
      // Send hello message with device info
      this.send(JSON.stringify({
        type: 'hello',
        deviceId: this.localId,
        deviceName: 'Desktop' // Will be overridden by actual name
      }))
    }

    channel.onclose = () => {
      console.log('[WebRTC] Data channel closed')
      if (this.isConnected) {
        this.isConnected = false
        this.onDisconnected?.(this.peerId)
      }
    }

    channel.onmessage = (event: { data: unknown }) => {
      const data = event.data as string
      console.log('[WebRTC] Received message:', data.substring(0, 100))

      // Check if it's a hello message
      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'hello') {
          this.peerDeviceName = parsed.deviceName || 'Unknown'
          console.log('[WebRTC] Peer identified as:', this.peerDeviceName)
          return
        }
      } catch {
        // Not JSON or not hello, treat as regular data
      }

      this.onData?.(this.peerId, data)
    }

    channel.onerror = (error: unknown) => {
      console.error('[WebRTC] Data channel error:', error)
      this.onError?.(this.peerId, new Error('Data channel error'))
    }
  }

  /**
   * Create an offer to initiate connection
   */
  async createOffer(localDeviceName: string): Promise<{ offer: RTCSessionDescriptionInit; iceCandidates: RTCIceCandidateLike[] }> {
    // Create data channel before creating offer
    const channel = this.pc.createDataChannel('data', {
      ordered: true,
    })
    this.setupDataChannel(channel)

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    // Wait for ICE gathering to complete
    const iceCandidates = await this.gatherIceCandidates()

    return {
      offer: this.pc.localDescription!,
      iceCandidates,
    }
  }

  /**
   * Handle an incoming offer and create an answer
   */
  async handleOffer(
    offer: RTCSessionDescriptionInit,
    iceCandidates: RTCIceCandidateInit[]
  ): Promise<{ answer: RTCSessionDescriptionInit; iceCandidates: RTCIceCandidateLike[] }> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer))

    // Add ICE candidates from offer
    for (const candidate of iceCandidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    }

    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)

    // Wait for ICE gathering to complete
    const localCandidates = await this.gatherIceCandidates()

    return {
      answer: this.pc.localDescription!,
      iceCandidates: localCandidates,
    }
  }

  /**
   * Handle an incoming answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit, iceCandidates: RTCIceCandidateInit[]): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer))

    // Add ICE candidates from answer
    for (const candidate of iceCandidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  /**
   * Wait for ICE gathering to complete
   */
  private gatherIceCandidates(): Promise<RTCIceCandidateLike[]> {
    return new Promise((resolve) => {
      const candidates: RTCIceCandidateLike[] = []
      const timeout = setTimeout(() => {
        console.log('[WebRTC] ICE gathering timed out with', candidates.length, 'candidates')
        resolve(candidates)
      }, 5000)

      this.pc.onicecandidate = (event: RTCIceEvent) => {
        if (event.candidate) {
          candidates.push(event.candidate)
        } else {
          // ICE gathering complete
          clearTimeout(timeout)
          console.log('[WebRTC] ICE gathering complete with', candidates.length, 'candidates')
          resolve(candidates)
        }
      }

      // If already complete, resolve immediately
      if (this.pc.iceGatheringState === 'complete') {
        clearTimeout(timeout)
        resolve(candidates)
      }
    })
  }

  /**
   * Send data to the peer
   */
  send(data: string): boolean {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('[WebRTC] Cannot send: data channel not open, state:', this.dataChannel?.readyState)
      return false
    }

    try {
      this.dataChannel.send(data)
      return true
    } catch (error) {
      console.error('[WebRTC] Send error:', error)
      return false
    }
  }

  /**
   * Close the connection
   */
  close(): void {
    this.dataChannel?.close()
    this.pc.close()
    this.isConnected = false
  }

  /**
   * Get connection state
   */
  getState(): RTCPeerConnectionState {
    return this.pc.connectionState
  }

  /**
   * Get peer device name
   */
  getDeviceName(): string {
    return this.peerDeviceName
  }

  /**
   * Set peer device name
   */
  setDeviceName(name: string): void {
    this.peerDeviceName = name
  }
}

/**
 * WebRTC Transport
 * Manages P2P connections via WebRTC with Cloudflare Worker signaling
 */
export class WebRTCTransport extends EventEmitter {
  private deviceId: string
  private deviceName: string
  private familyId: string
  private pubKey: string
  private workerUrl: string
  private signaling: SignalingClient | null = null
  private peers: Map<string, PeerConnection> = new Map()
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private started = false
  private onEvent?: (event: SyncEvent, fromPeer: string) => Promise<void>
  private onPeerConnected?: (peerId: string, deviceName: string) => void
  private onPeerDisconnected?: (peerId: string) => void

  constructor(options: WebRTCTransportOptions) {
    super()
    this.deviceId = options.deviceId
    this.deviceName = options.deviceName
    this.familyId = options.familyId
    this.pubKey = options.pubKey
    this.workerUrl = options.workerUrl || WORKER_URL
    this.onEvent = options.onEvent
    this.onPeerConnected = options.onPeerConnected
    this.onPeerDisconnected = options.onPeerDisconnected
  }

  /**
   * Start the transport
   */
  async start(): Promise<void> {
    if (this.started) return

    console.log('[WebRTCTransport] Starting with Cloudflare Worker:', this.workerUrl)

    // Create signaling client
    this.signaling = new SignalingClient(this.workerUrl)

    // Send initial presence heartbeat
    try {
      await this.signaling.heartbeat(this.familyId, this.deviceId, this.pubKey)
      console.log('[WebRTCTransport] Sent initial heartbeat')
    } catch (err) {
      console.error('[WebRTCTransport] Failed to send initial heartbeat:', err)
    }

    // Get online peers and connect to them
    try {
      const onlinePeers = await this.signaling.getOnlinePeers(this.familyId)
      console.log('[WebRTCTransport] Online peers:', onlinePeers.length)

      for (const peer of onlinePeers) {
        if (peer.deviceId !== this.deviceId) {
          await this.connectToPeer(peer.deviceId)
        }
      }
    } catch (err) {
      console.error('[WebRTCTransport] Failed to get online peers:', err)
    }

    // Start polling for incoming signals
    this.pollInterval = setInterval(async () => {
      await this.pollForSignals()
    }, SIGNAL_POLL_INTERVAL)

    // Start presence heartbeat
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.signaling?.heartbeat(this.familyId, this.deviceId, this.pubKey)
      } catch (err) {
        console.error('[WebRTCTransport] Heartbeat failed:', err)
      }
    }, PRESENCE_INTERVAL)

    this.started = true
    this.emit('started')
  }

  /**
   * Poll for incoming signaling messages
   */
  private async pollForSignals(): Promise<void> {
    if (!this.signaling) return

    try {
      const messages = await this.signaling.pollSignals(this.familyId, this.deviceId)
      for (const message of messages) {
        await this.handleSignalingMessage(message)
      }
    } catch (err) {
      // Ignore poll errors silently to avoid spam
    }
  }

  /**
   * Stop the transport
   */
  async stop(): Promise<void> {
    if (!this.started) return

    console.log('[WebRTCTransport] Stopping')

    // Clear polling and heartbeat intervals
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Remove presence from worker
    if (this.signaling) {
      try {
        await this.signaling.removePresence(this.familyId, this.deviceId)
      } catch (err) {
        console.error('[WebRTCTransport] Failed to remove presence:', err)
      }
    }

    // Close all peer connections
    for (const [, peer] of Array.from(this.peers.entries())) {
      peer.close()
    }
    this.peers.clear()

    this.signaling = null
    this.started = false
    this.emit('stopped')
  }

  /**
   * Connect to a specific peer
   */
  private async connectToPeer(peerId: string): Promise<void> {
    if (this.peers.has(peerId)) {
      return // Already connected or connecting
    }

    console.log('[WebRTCTransport] Initiating connection to peer:', peerId)

    const peer = this.createPeerConnection(peerId)
    this.peers.set(peerId, peer)

    // Create and send offer
    const { offer, iceCandidates } = await peer.createOffer(this.deviceName)

    await this.signaling?.sendSignal(this.familyId, peerId, {
      type: 'offer',
      from: this.deviceId,
      to: peerId,
      payload: { offer, iceCandidates, deviceName: this.deviceName },
    })
  }

  /**
   * Create a new peer connection with event handlers
   */
  private createPeerConnection(peerId: string): PeerConnection {
    return new PeerConnection(this.deviceId, peerId, {
      onConnected: (id, name) => {
        console.log('[WebRTCTransport] Peer connected:', name, id)
        this.onPeerConnected?.(id, name)
        this.emit('peer:connected', id)
      },
      onDisconnected: (id) => {
        console.log('[WebRTCTransport] Peer disconnected:', id)
        this.peers.delete(id)
        this.onPeerDisconnected?.(id)
        this.emit('peer:disconnected', id)
      },
      onData: async (id, data) => {
        try {
          const message = JSON.parse(data)

          if (message.type === 'event') {
            // Received a sync event
            const event = message.event as SyncEvent
            await this.onEvent?.(event, id)
            this.emit('event:received', event, id)
          } else if (message.type === 'sync_request') {
            // Handle sync request
            this.emit('sync:request', id, message.afterTimestamp || null)
          } else if (message.type === 'sync_response') {
            // Handle sync response
            for (const event of message.events || []) {
              await this.onEvent?.(event, id)
            }
            this.emit('sync:completed', id, message.events?.length || 0)
          }
        } catch (err) {
          console.error('[WebRTCTransport] Failed to parse message:', err)
        }
      },
      onError: (id, error) => {
        console.error('[WebRTCTransport] Peer error:', id, error)
        this.emit('error', error)
      },
    })
  }

  /**
   * Handle incoming signaling message
   */
  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    console.log('[WebRTCTransport] Received signaling:', message.type, 'from:', message.from)

    const payload = message.payload as {
      offer?: RTCSessionDescriptionInit
      answer?: RTCSessionDescriptionInit
      iceCandidates?: RTCIceCandidateInit[]
      deviceName?: string
    }

    if (message.type === 'offer') {
      // Handle WebRTC glare: both devices sent offers simultaneously
      // The device with the smaller ID is "polite" and accepts the remote offer
      // The device with the larger ID is "impolite" and ignores the remote offer
      const existingPeer = this.peers.get(message.from)
      const isPolite = this.deviceId < message.from

      if (existingPeer && existingPeer.getState() !== 'connected') {
        // We have an existing connection attempt (we sent an offer)
        if (!isPolite) {
          // We're impolite - ignore this offer, wait for answer to our offer
          console.log('[WebRTCTransport] Glare: ignoring offer (we are impolite)')
          return
        }
        // We're polite - close our attempt and accept their offer
        console.log('[WebRTCTransport] Glare: accepting offer (we are polite)')
        existingPeer.close()
        this.peers.delete(message.from)
      }

      // Create new peer connection and respond with answer
      const peer = this.createPeerConnection(message.from)
      this.peers.set(message.from, peer)

      // Set peer device name from offer
      if (payload.deviceName) {
        peer.setDeviceName(payload.deviceName)
      }

      const { answer, iceCandidates } = await peer.handleOffer(
        payload.offer!,
        payload.iceCandidates || []
      )

      await this.signaling?.sendSignal(this.familyId, message.from, {
        type: 'answer',
        from: this.deviceId,
        to: message.from,
        payload: { answer, iceCandidates, deviceName: this.deviceName },
      })
    } else if (message.type === 'answer') {
      // Received an answer, complete connection
      const peer = this.peers.get(message.from)
      if (peer) {
        // Set peer device name from answer
        if (payload.deviceName) {
          peer.setDeviceName(payload.deviceName)
        }

        await peer.handleAnswer(payload.answer!, payload.iceCandidates || [])
      }
    }
  }

  /**
   * Broadcast an event to all connected peers
   */
  async broadcast(event: SyncEvent): Promise<void> {
    const message = JSON.stringify({ type: 'event', event })

    for (const [peerId, peer] of Array.from(this.peers.entries())) {
      if (peer.getState() === 'connected') {
        peer.send(message)
      }
    }
  }

  /**
   * Request sync from peers
   */
  async requestSync(afterTimestamp?: string): Promise<void> {
    const message = JSON.stringify({
      type: 'sync_request',
      afterTimestamp: afterTimestamp || null,
    })

    for (const [, peer] of Array.from(this.peers.entries())) {
      if (peer.getState() === 'connected') {
        peer.send(message)
        break // Only request from first connected peer
      }
    }
  }

  /**
   * Send sync response to a peer in chunks
   * WebRTC data channels have message size limits (~256KB typically)
   * so we chunk large responses to avoid buffer overflow
   */
  async sendSyncResponse(events: SyncEvent[], done: boolean): Promise<void> {
    // Chunk events to keep message size reasonable (target ~50KB per message)
    const CHUNK_SIZE = 50 // events per chunk
    const chunks: SyncEvent[][] = []

    for (let i = 0; i < events.length; i += CHUNK_SIZE) {
      chunks.push(events.slice(i, i + CHUNK_SIZE))
    }

    if (chunks.length === 0) {
      chunks.push([]) // Send empty response if no events
    }

    console.log('[WebRTCTransport] Sending sync response:', events.length, 'events in', chunks.length, 'chunks')

    // Send each chunk with a small delay to avoid overwhelming the channel
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const isLastChunk = i === chunks.length - 1

      const message = JSON.stringify({
        type: 'sync_response',
        events: chunk,
        chunkIndex: i,
        totalChunks: chunks.length,
        done: isLastChunk && done,
      })

      // Send to all connected peers
      for (const [peerId, peer] of Array.from(this.peers.entries())) {
        if (peer.getState() === 'connected') {
          const sent = peer.send(message)
          if (!sent) {
            console.error('[WebRTCTransport] Failed to send chunk', i, 'to', peerId.slice(0, 8))
          }
        }
      }

      // Small delay between chunks to prevent buffer overflow
      if (!isLastChunk) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
  }

  /**
   * Check if connected to any peer
   */
  isConnected(): boolean {
    for (const [, peer] of Array.from(this.peers.entries())) {
      if (peer.getState() === 'connected') {
        return true
      }
    }
    return false
  }

  /**
   * Get list of connected peers
   */
  getConnectedPeers(): PeerInfo[] {
    const result: PeerInfo[] = []
    for (const [peerId, peer] of Array.from(this.peers.entries())) {
      result.push({
        peerId,
        deviceId: peerId,
        deviceName: peer.getDeviceName(),
        isOnline: peer.getState() === 'connected',
      })
    }
    return result
  }

  /**
   * Get transport statistics
   */
  getStats(): { connectedPeers: number; totalPeers: number } {
    let connectedCount = 0
    for (const [, peer] of Array.from(this.peers.entries())) {
      if (peer.getState() === 'connected') {
        connectedCount++
      }
    }
    return {
      connectedPeers: connectedCount,
      totalPeers: this.peers.size,
    }
  }

  /**
   * Disconnect a specific peer
   */
  disconnectPeer(peerId: string): void {
    const peer = this.peers.get(peerId)
    if (peer) {
      peer.close()
      this.peers.delete(peerId)
    }
  }
}

/**
 * Factory function to create WebRTC transport
 */
export function createWebRTCTransport(options: WebRTCTransportOptions): WebRTCTransport {
  return new WebRTCTransport(options)
}
