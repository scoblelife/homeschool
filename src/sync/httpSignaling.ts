/**
 * HTTP-based Signaling Provider for WebRTC
 *
 * Uses HTTP polling for signaling (exchanging SDP offers/answers and ICE candidates).
 * This is used only for the initial WebRTC handshake - all actual data
 * goes through peer-to-peer WebRTC data channels.
 */

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  from: string
  to: string
  payload: any
}

export interface HttpSignalingConfig {
  serverUrl: string
  pollIntervalMs?: number
}

/**
 * HTTP-based signaling provider
 * Uses simple HTTP POST/GET for signaling messages
 */
export class HttpSignalingProvider {
  private serverUrl: string
  private pollIntervalMs: number
  private localId: string = ''
  private currentRoom: string = ''
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private messageHandler: ((message: SignalingMessage) => void) | null = null
  private lastMessageId: number = 0

  constructor(config: HttpSignalingConfig) {
    this.serverUrl = config.serverUrl.replace(/\/$/, '') // Remove trailing slash
    this.pollIntervalMs = config.pollIntervalMs || 1000
  }

  /**
   * Send a signaling message to a peer
   */
  async send(message: SignalingMessage): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/signal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: this.currentRoom,
          ...message,
        }),
      })

      if (!response.ok) {
        throw new Error(`Signaling send failed: ${response.status}`)
      }
    } catch (error) {
      console.error('[HttpSignaling] Send error:', error)
      throw error
    }
  }

  /**
   * Subscribe to signaling messages
   */
  subscribe(localId: string, onMessage: (message: SignalingMessage) => void): () => void {
    this.localId = localId
    this.messageHandler = onMessage

    // Start polling if in a room
    if (this.currentRoom) {
      this.startPolling()
    }

    return () => {
      this.messageHandler = null
      this.stopPolling()
    }
  }

  /**
   * Join a room for peer discovery
   * Returns list of existing peer IDs in the room
   */
  async joinRoom(roomId: string, localId: string): Promise<string[]> {
    this.localId = localId
    this.currentRoom = roomId
    this.lastMessageId = 0

    try {
      const response = await fetch(`${this.serverUrl}/room/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          peerId: localId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Join room failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('[HttpSignaling] Joined room:', roomId, 'peers:', data.peers)

      // Start polling for messages
      this.startPolling()

      return data.peers || []
    } catch (error) {
      console.error('[HttpSignaling] Join room error:', error)
      return []
    }
  }

  /**
   * Leave the current room
   */
  async leaveRoom(roomId: string): Promise<void> {
    this.stopPolling()

    try {
      await fetch(`${this.serverUrl}/room/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          peerId: this.localId,
        }),
      })
    } catch (error) {
      console.error('[HttpSignaling] Leave room error:', error)
    }

    this.currentRoom = ''
  }

  /**
   * Start polling for signaling messages
   */
  private startPolling(): void {
    if (this.pollTimer) return

    this.pollTimer = setInterval(() => {
      this.pollMessages()
    }, this.pollIntervalMs)

    // Also poll immediately
    this.pollMessages()
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  /**
   * Poll for new signaling messages
   */
  private async pollMessages(): Promise<void> {
    if (!this.currentRoom || !this.messageHandler) return

    try {
      const response = await fetch(
        `${this.serverUrl}/room/${this.currentRoom}/messages?peerId=${this.localId}&after=${this.lastMessageId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        return
      }

      const data = await response.json()
      const messages: (SignalingMessage & { id: number })[] = data.messages || []

      for (const message of messages) {
        // Only process messages addressed to us
        if (message.to === this.localId) {
          this.lastMessageId = Math.max(this.lastMessageId, message.id)
          this.messageHandler({
            type: message.type,
            from: message.from,
            to: message.to,
            payload: message.payload,
          })
        }
      }
    } catch (error) {
      // Ignore polling errors (server might be temporarily unavailable)
    }
  }
}

export default HttpSignalingProvider
