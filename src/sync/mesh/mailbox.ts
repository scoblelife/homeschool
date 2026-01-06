/**
 * Peer Mailbox - Store-and-forward message queue for offline peers
 *
 * Each device maintains a mailbox for every known family peer.
 * When a peer is offline, messages are queued in their mailbox.
 * When they reconnect, the mailbox is flushed to them.
 */

import type { SyncEvent } from '../events'
import path from 'path'
import fs from 'fs/promises'
import { getAppDataPath } from '../../database/connection'

export interface PendingMessage {
  eventId: string
  event: SyncEvent
  queuedAt: number
  retryCount: number
  lastRetryAt?: number
}

export interface PeerMailbox {
  peerId: string
  lastSeen: number
  lastAckedEventId: string | null
  pendingMessages: PendingMessage[]
}

export interface MailboxState {
  mailboxes: Map<string, PeerMailbox>
}

/**
 * MailboxManager handles storing and delivering messages to offline peers
 */
export class MailboxManager {
  private mailboxes: Map<string, PeerMailbox> = new Map()
  private storagePath: string
  private saveTimeout: NodeJS.Timeout | null = null
  private dirty: boolean = false

  constructor(storagePath?: string) {
    this.storagePath =
      storagePath || path.join(getAppDataPath(), 'sync', 'mailboxes.json')
  }

  /**
   * Initialize the mailbox manager and load persisted state
   */
  async initialize(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.storagePath), { recursive: true })

      // Load existing mailboxes
      const data = await fs.readFile(this.storagePath, 'utf-8')
      const state = JSON.parse(data)

      if (state.mailboxes && Array.isArray(state.mailboxes)) {
        for (const mb of state.mailboxes) {
          this.mailboxes.set(mb.peerId, mb)
        }
      }
    } catch (err) {
      // No existing mailboxes or parse error - start fresh
      this.mailboxes = new Map()
    }
  }

  /**
   * Get or create a mailbox for a peer
   */
  getMailbox(peerId: string): PeerMailbox {
    let mailbox = this.mailboxes.get(peerId)

    if (!mailbox) {
      mailbox = {
        peerId,
        lastSeen: 0,
        lastAckedEventId: null,
        pendingMessages: []
      }
      this.mailboxes.set(peerId, mailbox)
      this.markDirty()
    }

    return mailbox
  }

  /**
   * Queue a message for delivery to a peer
   */
  queueMessage(peerId: string, event: SyncEvent): void {
    const mailbox = this.getMailbox(peerId)

    // Check if already queued
    if (mailbox.pendingMessages.some((m) => m.eventId === event.id)) {
      return
    }

    mailbox.pendingMessages.push({
      eventId: event.id,
      event,
      queuedAt: Date.now(),
      retryCount: 0
    })

    this.markDirty()
  }

  /**
   * Get all pending messages for a peer
   */
  getPendingMessages(peerId: string): PendingMessage[] {
    const mailbox = this.mailboxes.get(peerId)
    return mailbox?.pendingMessages || []
  }

  /**
   * Get count of pending messages for a peer
   */
  getPendingCount(peerId: string): number {
    const mailbox = this.mailboxes.get(peerId)
    return mailbox?.pendingMessages.length || 0
  }

  /**
   * Acknowledge receipt of a message
   */
  acknowledgeMessage(peerId: string, eventId: string): void {
    const mailbox = this.mailboxes.get(peerId)
    if (!mailbox) return

    const initialLength = mailbox.pendingMessages.length
    mailbox.pendingMessages = mailbox.pendingMessages.filter(
      (m) => m.eventId !== eventId
    )

    if (mailbox.pendingMessages.length < initialLength) {
      mailbox.lastAckedEventId = eventId
      this.markDirty()
    }
  }

  /**
   * Update last seen time for a peer
   */
  updateLastSeen(peerId: string): void {
    const mailbox = this.getMailbox(peerId)
    mailbox.lastSeen = Date.now()
    this.markDirty()
  }

  /**
   * Mark a message as retried
   */
  markRetry(peerId: string, eventId: string): void {
    const mailbox = this.mailboxes.get(peerId)
    if (!mailbox) return

    const message = mailbox.pendingMessages.find((m) => m.eventId === eventId)
    if (message) {
      message.retryCount++
      message.lastRetryAt = Date.now()
      this.markDirty()
    }
  }

  /**
   * Get messages that need retry (based on exponential backoff)
   */
  getMessagesForRetry(peerId: string): PendingMessage[] {
    const mailbox = this.mailboxes.get(peerId)
    if (!mailbox) return []

    const now = Date.now()

    return mailbox.pendingMessages.filter((m) => {
      if (m.retryCount >= 10) {
        // Max retries exceeded - give up on this message
        return false
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s
      const backoffMs = Math.pow(2, m.retryCount) * 1000
      const nextRetryTime = (m.lastRetryAt || m.queuedAt) + backoffMs

      return now >= nextRetryTime
    })
  }

  /**
   * Clear all pending messages for a peer (on successful full sync)
   */
  clearMailbox(peerId: string): void {
    const mailbox = this.mailboxes.get(peerId)
    if (mailbox) {
      mailbox.pendingMessages = []
      this.markDirty()
    }
  }

  /**
   * Get all known peer IDs
   */
  getAllPeerIds(): string[] {
    return Array.from(this.mailboxes.keys())
  }

  /**
   * Get mailbox statistics
   */
  getStats(): { totalPeers: number; totalPending: number; oldestMessage: number | null } {
    let totalPending = 0
    let oldestMessage: number | null = null

    const mailboxArray = Array.from(this.mailboxes.values())
    for (const mailbox of mailboxArray) {
      totalPending += mailbox.pendingMessages.length

      for (const msg of mailbox.pendingMessages) {
        if (oldestMessage === null || msg.queuedAt < oldestMessage) {
          oldestMessage = msg.queuedAt
        }
      }
    }

    return {
      totalPeers: this.mailboxes.size,
      totalPending,
      oldestMessage
    }
  }

  /**
   * Remove old messages that have exceeded max age (default 30 days)
   */
  pruneOldMessages(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): number {
    let pruned = 0
    const now = Date.now()

    const mailboxArray = Array.from(this.mailboxes.values())
    for (const mailbox of mailboxArray) {
      const initialLength = mailbox.pendingMessages.length
      mailbox.pendingMessages = mailbox.pendingMessages.filter(
        (m: PendingMessage) => now - m.queuedAt < maxAgeMs
      )
      pruned += initialLength - mailbox.pendingMessages.length
    }

    if (pruned > 0) {
      this.markDirty()
    }

    return pruned
  }

  /**
   * Mark state as dirty and schedule save
   */
  private markDirty(): void {
    this.dirty = true
    this.scheduleSave()
  }

  /**
   * Schedule a save operation (debounced)
   */
  private scheduleSave(): void {
    if (this.saveTimeout) return

    this.saveTimeout = setTimeout(async () => {
      this.saveTimeout = null
      if (this.dirty) {
        await this.save()
        this.dirty = false
      }
    }, 1000)
  }

  /**
   * Persist mailbox state to disk
   */
  async save(): Promise<void> {
    const state = {
      mailboxes: Array.from(this.mailboxes.values())
    }

    await fs.writeFile(this.storagePath, JSON.stringify(state, null, 2))
  }

  /**
   * Force immediate save
   */
  async flush(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
      this.saveTimeout = null
    }
    await this.save()
    this.dirty = false
  }
}

/**
 * Create and initialize a mailbox manager
 */
export async function createMailboxManager(
  storagePath?: string
): Promise<MailboxManager> {
  const manager = new MailboxManager(storagePath)
  await manager.initialize()
  return manager
}
