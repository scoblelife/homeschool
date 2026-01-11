/**
 * WebRTC Transport for Desktop (Electron)
 *
 * Provides peer-to-peer connectivity using WebRTC data channels.
 * Uses public STUN servers for NAT traversal and HTTP signaling for
 * the initial connection handshake.
 *
 * NOTE: This module runs in the Electron renderer process where
 * browser WebRTC APIs are available natively.
 */

// WebRTC type declarations for Electron renderer context
// These are available in the browser/renderer but not in Node.js type context
declare const RTCPeerConnection: {
  new (config?: RTCConfiguration): RTCPeerConnection
  prototype: RTCPeerConnection
}

declare interface RTCPeerConnection {
  createOffer(): Promise<RTCSessionDescriptionInit>
  createAnswer(): Promise<RTCSessionDescriptionInit>
  setLocalDescription(desc: RTCSessionDescriptionInit): Promise<void>
  setRemoteDescription(desc: RTCSessionDescriptionInit): Promise<void>
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>
  createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel
  close(): void
  connectionState: RTCPeerConnectionState
  iceConnectionState: string
  iceGatheringState: 'new' | 'gathering' | 'complete'
  localDescription: RTCSessionDescription | null
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null
  ondatachannel: ((event: RTCDataChannelEvent) => void) | null
  onconnectionstatechange: (() => void) | null
}

declare interface RTCConfiguration {
  iceServers?: RTCIceServer[]
}

declare interface RTCIceServer {
  urls: string | string[]
  username?: string
  credential?: string
}

declare interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback'
  sdp?: string
}

declare const RTCSessionDescription: {
  new (init: RTCSessionDescriptionInit): RTCSessionDescription
  prototype: RTCSessionDescription
}

declare interface RTCSessionDescription {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback'
  sdp: string
}

declare interface RTCIceCandidateInit {
  candidate?: string
  sdpMLineIndex?: number | null
  sdpMid?: string | null
}

declare const RTCIceCandidate: {
  new (init: RTCIceCandidateInit): RTCIceCandidate
  prototype: RTCIceCandidate
}

declare interface RTCIceCandidate {
  candidate: string
  sdpMLineIndex: number | null
  sdpMid: string | null
  toJSON(): RTCIceCandidateInit
}

declare interface RTCPeerConnectionIceEvent {
  candidate: RTCIceCandidate | null
}

declare interface RTCDataChannelEvent {
  channel: RTCDataChannel
}

declare interface RTCDataChannelInit {
  ordered?: boolean
  maxRetransmits?: number
}

declare interface RTCDataChannel {
  label: string
  readyState: 'connecting' | 'open' | 'closing' | 'closed'
  send(data: string | ArrayBuffer): void
  close(): void
  onopen: (() => void) | null
  onclose: (() => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  onerror: ((error: Event) => void) | null
}

declare type RTCPeerConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed'

import { EventEmitter } from 'events'
import type { SyncEvent } from './events'
import { HttpSignalingProvider } from './httpSignaling'
import { SIGNALING_URL, ICE_SERVERS } from './config'

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
  signalingUrl?: string
  onEvent?: (event: SyncEvent, fromPeer: string) => Promise<void>
  onPeerConnected?: (peerId: string, deviceName: string) => void
  onPeerDisconnected?: (peerId: string) => void
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  from: string
  to: string
  payload: any
}

/**
 * Manages a single WebRTC peer connection
 */
class PeerConnection {
  private pc: RTCPeerConnection
  private dataChannel: RTCDataChannel | null = null
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
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate generated')
      }
    }

    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState
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

    this.pc.ondatachannel = (event) => {
      console.log('[WebRTC] Received data channel')
      this.setupDataChannel(event.channel)
    }
  }

  private setupDataChannel(channel: RTCDataChannel): void {
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

    channel.onmessage = (event) => {
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

    channel.onerror = (error) => {
      console.error('[WebRTC] Data channel error:', error)
      this.onError?.(this.peerId, new Error('Data channel error'))
    }
  }

  /**
   * Create an offer to initiate connection
   */
  async createOffer(localDeviceName: string): Promise<{ offer: RTCSessionDescriptionInit; iceCandidates: RTCIceCandidate[] }> {
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
  ): Promise<{ answer: RTCSessionDescriptionInit; iceCandidates: RTCIceCandidate[] }> {
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
  private gatherIceCandidates(): Promise<RTCIceCandidate[]> {
    return new Promise((resolve) => {
      const candidates: RTCIceCandidate[] = []
      const timeout = setTimeout(() => {
        console.log('[WebRTC] ICE gathering timed out with', candidates.length, 'candidates')
        resolve(candidates)
      }, 5000)

      this.pc.onicecandidate = (event) => {
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
 * Manages P2P connections via WebRTC with HTTP signaling
 */
export class WebRTCTransport extends EventEmitter {
  private deviceId: string
  private deviceName: string
  private familyId: string
  private signalingUrl: string
  private signaling: HttpSignalingProvider | null = null
  private peers: Map<string, PeerConnection> = new Map()
  private unsubscribe: (() => void) | null = null
  private started = false
  private onEvent?: (event: SyncEvent, fromPeer: string) => Promise<void>
  private onPeerConnected?: (peerId: string, deviceName: string) => void
  private onPeerDisconnected?: (peerId: string) => void

  constructor(options: WebRTCTransportOptions) {
    super()
    this.deviceId = options.deviceId
    this.deviceName = options.deviceName
    this.familyId = options.familyId
    this.signalingUrl = options.signalingUrl || SIGNALING_URL
    this.onEvent = options.onEvent
    this.onPeerConnected = options.onPeerConnected
    this.onPeerDisconnected = options.onPeerDisconnected
  }

  /**
   * Start the transport
   */
  async start(): Promise<void> {
    if (this.started) return

    console.log('[WebRTCTransport] Starting with signaling server:', this.signalingUrl)

    // Create signaling provider
    this.signaling = new HttpSignalingProvider({
      serverUrl: this.signalingUrl,
      pollIntervalMs: 1000,
    })

    // Subscribe to signaling messages
    this.unsubscribe = this.signaling.subscribe(this.deviceId, (message) => {
      this.handleSignalingMessage(message)
    })

    // Join the family room
    const existingPeers = await this.signaling.joinRoom(this.familyId, this.deviceId)
    console.log('[WebRTCTransport] Joined room, existing peers:', existingPeers)

    // Connect to each existing peer
    for (const peerId of existingPeers) {
      if (peerId !== this.deviceId) {
        await this.connectToPeer(peerId)
      }
    }

    this.started = true
    this.emit('started')
  }

  /**
   * Stop the transport
   */
  async stop(): Promise<void> {
    if (!this.started) return

    console.log('[WebRTCTransport] Stopping')

    // Leave the room
    if (this.signaling) {
      await this.signaling.leaveRoom(this.familyId)
    }

    // Unsubscribe from signaling
    this.unsubscribe?.()
    this.unsubscribe = null

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

    await this.signaling?.send({
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

    if (message.type === 'offer') {
      // Received an offer, create answer
      let peer = this.peers.get(message.from)
      if (!peer) {
        peer = this.createPeerConnection(message.from)
        this.peers.set(message.from, peer)
      }

      // Set peer device name from offer
      if (message.payload.deviceName) {
        peer.setDeviceName(message.payload.deviceName)
      }

      const { answer, iceCandidates } = await peer.handleOffer(
        message.payload.offer,
        message.payload.iceCandidates
      )

      await this.signaling?.send({
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
        if (message.payload.deviceName) {
          peer.setDeviceName(message.payload.deviceName)
        }

        await peer.handleAnswer(message.payload.answer, message.payload.iceCandidates)
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
   * Send sync response to a peer
   */
  async sendSyncResponse(events: SyncEvent[], done: boolean): Promise<void> {
    const message = JSON.stringify({
      type: 'sync_response',
      events,
      done,
    })

    // Send to all connected peers (the one that requested will receive it)
    for (const [, peer] of Array.from(this.peers.entries())) {
      if (peer.getState() === 'connected') {
        peer.send(message)
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
