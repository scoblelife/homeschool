/**
 * Connection Manager for P2P Sync
 *
 * Handles network connectivity and automatic reconnection:
 * - Detects network state changes
 * - Auto-reconnect with exponential backoff
 * - Resume sync from last known state
 * - Handle app wake from sleep
 */

import { EventEmitter } from 'events'

// Browser global type for cross-platform compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const document: any

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface ConnectionManagerOptions {
  // Initial reconnect delay in ms
  initialRetryDelay?: number
  // Maximum reconnect delay in ms
  maxRetryDelay?: number
  // Backoff multiplier
  backoffMultiplier?: number
  // Maximum number of retry attempts (0 = infinite)
  maxRetries?: number
  // Jitter factor (0-1) to randomize delays
  jitterFactor?: number
}

export interface ConnectionStats {
  state: ConnectionState
  lastConnected: Date | null
  lastDisconnected: Date | null
  reconnectAttempts: number
  totalReconnects: number
  currentRetryDelay: number
}

/**
 * Connection Manager
 * Manages connection lifecycle with automatic reconnection
 */
export class ConnectionManager extends EventEmitter {
  private state: ConnectionState = 'disconnected'
  private lastConnected: Date | null = null
  private lastDisconnected: Date | null = null
  private reconnectAttempts = 0
  private totalReconnects = 0
  private currentRetryDelay: number
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isReconnecting = false
  private shouldReconnect = true

  // Configuration
  private initialRetryDelay: number
  private maxRetryDelay: number
  private backoffMultiplier: number
  private maxRetries: number
  private jitterFactor: number

  // Callbacks
  private connectFn: (() => Promise<void>) | null = null
  private disconnectFn: (() => Promise<void>) | null = null
  private isConnectedFn: (() => boolean) | null = null

  constructor(options: ConnectionManagerOptions = {}) {
    super()
    this.initialRetryDelay = options.initialRetryDelay ?? 1000
    this.maxRetryDelay = options.maxRetryDelay ?? 30000
    this.backoffMultiplier = options.backoffMultiplier ?? 2
    this.maxRetries = options.maxRetries ?? 0
    this.jitterFactor = options.jitterFactor ?? 0.1
    this.currentRetryDelay = this.initialRetryDelay
  }

  /**
   * Set the connect/disconnect functions
   */
  setConnectionFunctions(
    connect: () => Promise<void>,
    disconnect: () => Promise<void>,
    isConnected: () => boolean
  ): void {
    this.connectFn = connect
    this.disconnectFn = disconnect
    this.isConnectedFn = isConnected
  }

  /**
   * Start the connection manager
   */
  async start(): Promise<void> {
    if (this.state !== 'disconnected') {
      return
    }

    this.shouldReconnect = true
    await this.connect()
  }

  /**
   * Stop the connection manager
   */
  async stop(): Promise<void> {
    this.shouldReconnect = false
    this.cancelReconnect()
    await this.disconnect()
  }

  /**
   * Attempt to connect
   */
  private async connect(): Promise<void> {
    if (!this.connectFn) {
      console.error('[ConnectionManager] No connect function set')
      return
    }

    this.setState('connecting')

    try {
      await this.connectFn()
      this.onConnected()
    } catch (error) {
      console.error('[ConnectionManager] Connection failed:', error)
      this.onConnectionFailed()
    }
  }

  /**
   * Disconnect
   */
  private async disconnect(): Promise<void> {
    if (!this.disconnectFn) {
      return
    }

    try {
      await this.disconnectFn()
    } catch (error) {
      console.error('[ConnectionManager] Disconnect error:', error)
    }

    this.onDisconnected()
  }

  /**
   * Handle successful connection
   */
  onConnected(): void {
    this.setState('connected')
    this.lastConnected = new Date()
    this.reconnectAttempts = 0
    this.currentRetryDelay = this.initialRetryDelay
    this.isReconnecting = false

    console.log('[ConnectionManager] Connected')
    this.emit('connected')
  }

  /**
   * Handle connection failure
   */
  private onConnectionFailed(): void {
    if (this.state === 'connecting') {
      this.onDisconnected()
    }
    this.scheduleReconnect()
  }

  /**
   * Handle disconnection
   */
  onDisconnected(): void {
    const wasConnected = this.state === 'connected'
    this.setState('disconnected')
    this.lastDisconnected = new Date()

    if (wasConnected) {
      console.log('[ConnectionManager] Disconnected')
      this.emit('disconnected')

      // Auto-reconnect if enabled
      if (this.shouldReconnect) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Notify connection lost (call this from transport)
   */
  notifyConnectionLost(): void {
    if (this.state === 'connected') {
      this.onDisconnected()
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (!this.shouldReconnect) {
      return
    }

    if (this.maxRetries > 0 && this.reconnectAttempts >= this.maxRetries) {
      console.log(
        `[ConnectionManager] Max retries (${this.maxRetries}) reached, giving up`
      )
      this.emit('maxRetriesReached')
      return
    }

    // Cancel any existing reconnect timer
    this.cancelReconnect()

    // Calculate delay with jitter
    const jitter = this.jitterFactor > 0
      ? this.currentRetryDelay * this.jitterFactor * Math.random()
      : 0
    const delay = Math.min(
      this.currentRetryDelay + jitter,
      this.maxRetryDelay
    )

    console.log(
      `[ConnectionManager] Scheduling reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts + 1})`
    )

    this.isReconnecting = true
    this.setState('reconnecting')

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++
      this.totalReconnects++

      // Increase delay for next attempt (exponential backoff)
      this.currentRetryDelay = Math.min(
        this.currentRetryDelay * this.backoffMultiplier,
        this.maxRetryDelay
      )

      this.emit('reconnecting', this.reconnectAttempts)
      await this.connect()
    }, delay)
  }

  /**
   * Cancel pending reconnection
   */
  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.isReconnecting = false
  }

  /**
   * Force an immediate reconnection attempt
   */
  async reconnectNow(): Promise<void> {
    this.cancelReconnect()
    this.currentRetryDelay = this.initialRetryDelay
    this.reconnectAttempts = 0

    if (this.state === 'connected') {
      await this.disconnect()
    }

    await this.connect()
  }

  /**
   * Reset reconnection state (after manual intervention)
   */
  resetReconnectState(): void {
    this.reconnectAttempts = 0
    this.currentRetryDelay = this.initialRetryDelay
  }

  /**
   * Set connection state
   */
  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      const previousState = this.state
      this.state = state
      this.emit('stateChanged', state, previousState)
    }
  }

  /**
   * Get current state
   */
  getState(): ConnectionState {
    return this.state
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return {
      state: this.state,
      lastConnected: this.lastConnected,
      lastDisconnected: this.lastDisconnected,
      reconnectAttempts: this.reconnectAttempts,
      totalReconnects: this.totalReconnects,
      currentRetryDelay: this.currentRetryDelay,
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    if (this.isConnectedFn) {
      return this.isConnectedFn()
    }
    return this.state === 'connected'
  }

  /**
   * Handle app resume from sleep/background
   */
  async onAppResume(): Promise<void> {
    console.log('[ConnectionManager] App resumed from sleep')

    // Check if we're still connected
    if (this.isConnectedFn && !this.isConnectedFn()) {
      console.log('[ConnectionManager] Connection lost during sleep, reconnecting')
      this.onDisconnected()
    } else if (this.state === 'connected') {
      // Emit event to trigger state refresh
      this.emit('resumed')
    }
  }

  /**
   * Handle app going to background/sleep
   */
  onAppSuspend(): void {
    console.log('[ConnectionManager] App going to sleep')
    this.emit('suspending')
  }

  /**
   * Handle network online event
   */
  onNetworkOnline(): void {
    console.log('[ConnectionManager] Network came online')
    this.emit('networkOnline')

    if (this.state === 'disconnected' && this.shouldReconnect) {
      // Reset backoff and try immediately
      this.currentRetryDelay = this.initialRetryDelay
      this.reconnectAttempts = 0
      this.scheduleReconnect()
    }
  }

  /**
   * Handle network offline event
   */
  onNetworkOffline(): void {
    console.log('[ConnectionManager] Network went offline')
    this.cancelReconnect()
    // Set state to disconnected so onNetworkOnline can trigger reconnect
    if (this.state === 'reconnecting') {
      this.setState('disconnected')
    }
    this.emit('networkOffline')
  }
}

/**
 * Create a connection manager with default options
 */
export function createConnectionManager(
  options?: ConnectionManagerOptions
): ConnectionManager {
  return new ConnectionManager(options)
}

/**
 * Setup network listeners for Electron/Browser
 */
export function setupNetworkListeners(manager: ConnectionManager): () => void {
  // Browser/Electron online/offline events
  const handleOnline = () => manager.onNetworkOnline()
  const handleOffline = () => manager.onNetworkOffline()

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Visibility change for app suspend/resume
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        manager.onAppResume()
      } else {
        manager.onAppSuspend()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  return () => {}
}
