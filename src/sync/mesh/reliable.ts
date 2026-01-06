/**
 * Reliable Delivery - ACK handling and retry logic
 *
 * Ensures messages are delivered reliably with:
 * - ACK tracking for sent messages
 * - Automatic retry with exponential backoff
 * - Timeout detection
 */

import type { SyncEvent } from '../events'
import type { EventMessage, AckMessage, MeshMessage } from './protocol'
import { createAckMessage, MESSAGE_TIMEOUT } from './protocol'

export interface PendingAck {
  eventId: string
  sentTo: string
  sentAt: number
  retryCount: number
  message: EventMessage
}

export interface DeliveryResult {
  success: boolean
  eventId: string
  peerId: string
  retries: number
  error?: string
}

export type SendFunction = (peerId: string, message: MeshMessage) => Promise<void>

export interface ReliableDeliveryOptions {
  timeout?: number
  maxRetries?: number
  onDeliveryFailed?: (result: DeliveryResult) => void
  onDeliverySuccess?: (result: DeliveryResult) => void
}

/**
 * ReliableDelivery handles ACK tracking and retry logic
 */
export class ReliableDelivery {
  private pendingAcks: Map<string, PendingAck> = new Map() // eventId:peerId -> PendingAck
  private timeout: number
  private maxRetries: number
  private onDeliveryFailed?: (result: DeliveryResult) => void
  private onDeliverySuccess?: (result: DeliveryResult) => void
  private checkInterval: NodeJS.Timeout | null = null

  constructor(options: ReliableDeliveryOptions = {}) {
    this.timeout = options.timeout || MESSAGE_TIMEOUT
    this.maxRetries = options.maxRetries || 5
    this.onDeliveryFailed = options.onDeliveryFailed
    this.onDeliverySuccess = options.onDeliverySuccess
  }

  /**
   * Start the retry check interval
   */
  start(sendFn: SendFunction): void {
    if (this.checkInterval) return

    this.checkInterval = setInterval(() => {
      this.checkTimeouts(sendFn)
    }, 1000) // Check every second
  }

  /**
   * Stop the retry check interval
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Track a sent message for ACK
   */
  trackSent(message: EventMessage, peerId: string): void {
    const key = this.makeKey(message.event.id, peerId)

    this.pendingAcks.set(key, {
      eventId: message.event.id,
      sentTo: peerId,
      sentAt: Date.now(),
      retryCount: 0,
      message
    })
  }

  /**
   * Handle an incoming ACK
   */
  handleAck(ack: AckMessage, fromPeer: string): void {
    const key = this.makeKey(ack.eventId, fromPeer)
    const pending = this.pendingAcks.get(key)

    if (pending) {
      this.pendingAcks.delete(key)

      if (this.onDeliverySuccess) {
        this.onDeliverySuccess({
          success: true,
          eventId: ack.eventId,
          peerId: fromPeer,
          retries: pending.retryCount
        })
      }
    }
  }

  /**
   * Create an ACK message for a received event
   */
  createAck(eventId: string, receivedBy: string): AckMessage {
    return createAckMessage(eventId, receivedBy)
  }

  /**
   * Check for timed-out messages and retry or fail
   */
  private async checkTimeouts(sendFn: SendFunction): Promise<void> {
    const now = Date.now()

    const entries = Array.from(this.pendingAcks.entries())
    for (const [key, pending] of entries) {
      const elapsed = now - pending.sentAt

      if (elapsed >= this.timeout) {
        if (pending.retryCount >= this.maxRetries) {
          // Max retries exceeded - mark as failed
          this.pendingAcks.delete(key)

          if (this.onDeliveryFailed) {
            this.onDeliveryFailed({
              success: false,
              eventId: pending.eventId,
              peerId: pending.sentTo,
              retries: pending.retryCount,
              error: 'max_retries_exceeded'
            })
          }
        } else {
          // Retry
          pending.retryCount++
          pending.sentAt = now

          try {
            await sendFn(pending.sentTo, pending.message)
          } catch {
            // Send failed - will retry on next check
          }
        }
      }
    }
  }

  /**
   * Get pending ACKs for a specific peer
   */
  getPendingForPeer(peerId: string): PendingAck[] {
    const result: PendingAck[] = []

    const values = Array.from(this.pendingAcks.values())
    for (const pending of values) {
      if (pending.sentTo === peerId) {
        result.push(pending)
      }
    }

    return result
  }

  /**
   * Clear pending ACKs for a peer (e.g., when they disconnect)
   */
  clearPendingForPeer(peerId: string): void {
    const keysToDelete: string[] = []

    const entries = Array.from(this.pendingAcks.entries())
    for (const [key, pending] of entries) {
      if (pending.sentTo === peerId) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.pendingAcks.delete(key)
    }
  }

  /**
   * Get stats about pending deliveries
   */
  getStats(): { pendingCount: number; oldestPending: number | null } {
    let oldestPending: number | null = null

    const values = Array.from(this.pendingAcks.values())
    for (const pending of values) {
      if (oldestPending === null || pending.sentAt < oldestPending) {
        oldestPending = pending.sentAt
      }
    }

    return {
      pendingCount: this.pendingAcks.size,
      oldestPending
    }
  }

  /**
   * Check if we're waiting for an ACK for a specific event from a peer
   */
  isPendingAck(eventId: string, peerId: string): boolean {
    const key = this.makeKey(eventId, peerId)
    return this.pendingAcks.has(key)
  }

  /**
   * Create a unique key for tracking pending ACKs
   */
  private makeKey(eventId: string, peerId: string): string {
    return `${eventId}:${peerId}`
  }
}

/**
 * Create a reliable delivery manager
 */
export function createReliableDelivery(
  options: ReliableDeliveryOptions = {}
): ReliableDelivery {
  return new ReliableDelivery(options)
}
