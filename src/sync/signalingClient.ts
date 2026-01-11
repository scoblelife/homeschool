/**
 * Cloudflare Worker Signaling Client
 *
 * HTTP client for the Cloudflare Worker signaling server.
 * Handles join offers, answers, presence heartbeats, and generic signaling.
 */

import { WORKER_URL } from './config'

export interface JoinOffer {
  nonce: string
  newPubKey: string
  newDeviceId: string
  newDeviceName: string
  offer: string // Encrypted WebRTC offer
  iceCandidates: string // Encrypted ICE candidates
}

export interface JoinAnswer {
  trustedPubKey: string
  trustedDeviceId: string
  answer: string // Encrypted WebRTC answer
  iceCandidates: string // Encrypted ICE candidates
  familyData?: string // Encrypted initial family data
}

export interface OnlinePeer {
  deviceId: string
  pubKey: string
  ts: number
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  from: string
  to: string
  payload: unknown
}

export class SignalingClient {
  private workerUrl: string

  constructor(workerUrl: string = WORKER_URL) {
    this.workerUrl = workerUrl
  }

  // ============= Join Flow =============

  /**
   * Post a join offer for a one-time topic (new device joining)
   */
  async postOffer(topic: string, offer: JoinOffer): Promise<void> {
    const res = await fetch(`${this.workerUrl}/offer/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer),
    })
    if (!res.ok) {
      throw new Error(`Failed to post offer: ${res.status}`)
    }
  }

  /**
   * Get a pending join offer (trusted device polling)
   * Returns null if no offer available
   * Note: Offer is deleted after retrieval (one-time use)
   */
  async getOffer(topic: string): Promise<JoinOffer | null> {
    const res = await fetch(`${this.workerUrl}/offer/${encodeURIComponent(topic)}`)
    if (!res.ok) {
      throw new Error(`Failed to get offer: ${res.status}`)
    }
    const data = await res.json()
    return data.offer || null
  }

  /**
   * Post a join answer (trusted device accepting join)
   */
  async postAnswer(topic: string, answer: JoinAnswer): Promise<void> {
    const res = await fetch(`${this.workerUrl}/answer/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answer),
    })
    if (!res.ok) {
      throw new Error(`Failed to post answer: ${res.status}`)
    }
  }

  /**
   * Get a join answer (new device polling after posting offer)
   * Returns null if no answer available
   * Note: Answer is deleted after retrieval (one-time use)
   */
  async getAnswer(topic: string): Promise<JoinAnswer | null> {
    const res = await fetch(`${this.workerUrl}/answer/${encodeURIComponent(topic)}`)
    if (!res.ok) {
      throw new Error(`Failed to get answer: ${res.status}`)
    }
    const data = await res.json()
    return data.answer || null
  }

  // ============= Presence =============

  /**
   * Send presence heartbeat (called every ~30 seconds)
   */
  async heartbeat(familyId: string, deviceId: string, pubKey: string): Promise<void> {
    const res = await fetch(
      `${this.workerUrl}/presence/${encodeURIComponent(familyId)}/${encodeURIComponent(deviceId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubKey }),
      }
    )
    if (!res.ok) {
      throw new Error(`Failed to send heartbeat: ${res.status}`)
    }
  }

  /**
   * Remove presence (called when leaving family or app closing)
   */
  async removePresence(familyId: string, deviceId: string): Promise<void> {
    const res = await fetch(
      `${this.workerUrl}/presence/${encodeURIComponent(familyId)}/${encodeURIComponent(deviceId)}`,
      {
        method: 'DELETE',
      }
    )
    if (!res.ok) {
      throw new Error(`Failed to remove presence: ${res.status}`)
    }
  }

  /**
   * Get list of online peers for a family
   */
  async getOnlinePeers(familyId: string): Promise<OnlinePeer[]> {
    const res = await fetch(`${this.workerUrl}/presence/${encodeURIComponent(familyId)}`)
    if (!res.ok) {
      throw new Error(`Failed to get online peers: ${res.status}`)
    }
    const data = await res.json()
    return data.peers || []
  }

  // ============= Generic Signaling =============

  /**
   * Send a signaling message to a specific peer
   */
  async sendSignal(topic: string, peerId: string, message: SignalingMessage): Promise<void> {
    const res = await fetch(
      `${this.workerUrl}/signal/${encodeURIComponent(topic)}/${encodeURIComponent(peerId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      }
    )
    if (!res.ok) {
      throw new Error(`Failed to send signal: ${res.status}`)
    }
  }

  /**
   * Poll for signaling messages addressed to this peer
   * Messages are deleted after retrieval (one-time read)
   */
  async pollSignals(topic: string, peerId: string): Promise<SignalingMessage[]> {
    const res = await fetch(
      `${this.workerUrl}/signal/${encodeURIComponent(topic)}/${encodeURIComponent(peerId)}`
    )
    if (!res.ok) {
      throw new Error(`Failed to poll signals: ${res.status}`)
    }
    const data = await res.json()
    return data.messages || []
  }

  // ============= Health =============

  /**
   * Check if the worker is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.workerUrl}/health`)
      return res.ok
    } catch {
      return false
    }
  }
}

// Singleton instance
let client: SignalingClient | null = null

export function getSignalingClient(): SignalingClient {
  if (!client) {
    client = new SignalingClient()
  }
  return client
}
