/**
 * Offline Queue
 *
 * Queues all writes when offline and automatically syncs when connection is restored.
 * Ensures no data loss even with intermittent connectivity.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { SyncManager } from './syncManager'
import { EventType, generateUUID } from './events'

const OFFLINE_QUEUE_KEY = '@homeschool/offline_queue'
const OFFLINE_STATUS_KEY = '@homeschool/offline_status'

export interface QueuedWrite {
  id: string
  type: EventType
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
  lastRetryAt?: number
}

export interface OfflineStatus {
  isOnline: boolean
  lastOnlineAt: number | null
  queuedWriteCount: number
  failedSyncCount: number
}

type StatusChangeHandler = (status: OfflineStatus) => void

/**
 * OfflineQueue manages pending writes when the device is offline
 * and automatically syncs them when connectivity is restored.
 */
export class OfflineQueue {
  private static instance: OfflineQueue | null = null

  private queue: QueuedWrite[] = []
  private isOnline = true
  private lastOnlineAt: number | null = null
  private failedSyncCount = 0
  private isSyncing = false
  private initialized = false
  private unsubscribeNetInfo: (() => void) | null = null
  private statusHandlers: Set<StatusChangeHandler> = new Set()
  private syncManager: SyncManager

  private readonly MAX_RETRIES = 5
  private readonly RETRY_DELAY_MS = 1000 // Start with 1 second
  private readonly MAX_RETRY_DELAY_MS = 60000 // Max 1 minute

  private constructor() {
    this.syncManager = SyncManager.getInstance()
  }

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue()
    }
    return OfflineQueue.instance
  }

  /**
   * Initialize the offline queue
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    // Load persisted queue
    await this.loadQueue()

    // Load last known status
    const statusJson = await AsyncStorage.getItem(OFFLINE_STATUS_KEY)
    if (statusJson) {
      const status = JSON.parse(statusJson)
      this.lastOnlineAt = status.lastOnlineAt
      this.failedSyncCount = status.failedSyncCount || 0
    }

    // Subscribe to network state changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetworkChange.bind(this))

    // Check initial network state
    const initialState = await NetInfo.fetch()
    this.handleNetworkChange(initialState)

    this.initialized = true
    console.log('[OfflineQueue] Initialized with', this.queue.length, 'queued writes')
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo()
      this.unsubscribeNetInfo = null
    }
    this.statusHandlers.clear()
    this.initialized = false
  }

  /**
   * Get current offline status
   */
  getStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      lastOnlineAt: this.lastOnlineAt,
      queuedWriteCount: this.queue.length,
      failedSyncCount: this.failedSyncCount,
    }
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  /**
   * Queue a write operation
   * If online, attempts to sync immediately
   * If offline, queues for later
   */
  async queueWrite<T extends Record<string, unknown>>(type: EventType, data: T): Promise<void> {
    const write: QueuedWrite = {
      id: generateUUID(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    }

    if (this.isOnline && !this.isSyncing) {
      // Try to sync immediately
      const success = await this.syncWrite(write)
      if (success) {
        return
      }
      // If failed, fall through to queue
    }

    // Add to queue
    this.queue.push(write)
    await this.persistQueue()
    this.notifyStatusChange()

    console.log('[OfflineQueue] Write queued:', type, '- Queue size:', this.queue.length)
  }

  /**
   * Attempt to sync a single write
   */
  private async syncWrite(write: QueuedWrite): Promise<boolean> {
    try {
      await this.syncManager.emitEvent(write.type, write.data)
      return true
    } catch (error) {
      console.error('[OfflineQueue] Failed to sync write:', error)
      write.retryCount++
      write.lastRetryAt = Date.now()
      return false
    }
  }

  /**
   * Process the queue - attempt to sync all pending writes
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.queue.length === 0) {
      return
    }

    this.isSyncing = true
    console.log('[OfflineQueue] Processing queue with', this.queue.length, 'items')

    const processedIds: string[] = []
    const failedWrites: QueuedWrite[] = []

    for (const write of this.queue) {
      // Check if we should retry based on backoff
      if (write.lastRetryAt) {
        const backoffDelay = Math.min(
          this.RETRY_DELAY_MS * Math.pow(2, write.retryCount),
          this.MAX_RETRY_DELAY_MS
        )
        const timeSinceLastRetry = Date.now() - write.lastRetryAt

        if (timeSinceLastRetry < backoffDelay) {
          failedWrites.push(write)
          continue
        }
      }

      const success = await this.syncWrite(write)

      if (success) {
        processedIds.push(write.id)
        this.failedSyncCount = 0
      } else if (write.retryCount >= this.MAX_RETRIES) {
        // Exceeded max retries - log but still keep in queue
        console.warn('[OfflineQueue] Write exceeded max retries:', write.id)
        this.failedSyncCount++
        failedWrites.push(write)
      } else {
        failedWrites.push(write)
      }
    }

    // Remove successfully synced writes
    this.queue = this.queue.filter((w) => !processedIds.includes(w.id))
    await this.persistQueue()
    await this.persistStatus()

    this.isSyncing = false
    this.notifyStatusChange()

    console.log(
      '[OfflineQueue] Queue processed -',
      processedIds.length,
      'synced,',
      this.queue.length,
      'remaining'
    )
  }

  /**
   * Force retry all queued writes (reset retry counts)
   */
  async forceRetryAll(): Promise<void> {
    for (const write of this.queue) {
      write.retryCount = 0
      write.lastRetryAt = undefined
    }
    this.failedSyncCount = 0
    await this.persistQueue()
    await this.processQueue()
  }

  /**
   * Clear the queue (use with caution - data will be lost)
   */
  async clearQueue(): Promise<void> {
    console.warn('[OfflineQueue] Clearing queue with', this.queue.length, 'items')
    this.queue = []
    this.failedSyncCount = 0
    await this.persistQueue()
    await this.persistStatus()
    this.notifyStatusChange()
  }

  /**
   * Handle network state changes
   */
  private async handleNetworkChange(state: NetInfoState): Promise<void> {
    const wasOnline = this.isOnline
    this.isOnline = state.isConnected ?? false

    if (this.isOnline) {
      this.lastOnlineAt = Date.now()
      await this.persistStatus()
    }

    // If we came back online, process the queue
    if (!wasOnline && this.isOnline) {
      console.log('[OfflineQueue] Network restored - processing queue')
      // Small delay to let network stabilize
      setTimeout(() => this.processQueue(), 500)
    }

    this.notifyStatusChange()
  }

  /**
   * Load queue from persistent storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
      if (queueJson) {
        this.queue = JSON.parse(queueJson)
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error)
      this.queue = []
    }
  }

  /**
   * Persist queue to storage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue))
    } catch (error) {
      console.error('[OfflineQueue] Failed to persist queue:', error)
    }
  }

  /**
   * Persist status to storage
   */
  private async persistStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OFFLINE_STATUS_KEY,
        JSON.stringify({
          lastOnlineAt: this.lastOnlineAt,
          failedSyncCount: this.failedSyncCount,
        })
      )
    } catch (error) {
      console.error('[OfflineQueue] Failed to persist status:', error)
    }
  }

  /**
   * Notify all status change handlers
   */
  private notifyStatusChange(): void {
    const status = this.getStatus()
    for (const handler of this.statusHandlers) {
      try {
        handler(status)
      } catch (error) {
        console.error('[OfflineQueue] Error in status handler:', error)
      }
    }
  }
}

/**
 * Hook-friendly function to queue a write
 */
export async function queueOfflineWrite<T extends Record<string, unknown>>(
  type: EventType,
  data: T
): Promise<void> {
  const queue = OfflineQueue.getInstance()
  await queue.queueWrite(type, data)
}

/**
 * Get the singleton instance
 */
export function getOfflineQueue(): OfflineQueue {
  return OfflineQueue.getInstance()
}
