/**
 * Connection Manager Tests
 *
 * Tests reconnection logic and state management.
 */

import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest'
import {
  ConnectionManager,
  createConnectionManager,
  type ConnectionState,
} from '../connectionManager'

describe('ConnectionManager', () => {
  let manager: ConnectionManager
  // Using any to allow mock method access while satisfying setConnectionFunctions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let connectFn: Mock<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let disconnectFn: Mock<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let isConnectedFn: Mock<any>

  beforeEach(() => {
    vi.useFakeTimers()
    connectFn = vi.fn().mockResolvedValue(undefined)
    disconnectFn = vi.fn().mockResolvedValue(undefined)
    isConnectedFn = vi.fn().mockReturnValue(true)

    manager = createConnectionManager({
      initialRetryDelay: 1000,
      maxRetryDelay: 10000,
      backoffMultiplier: 2,
      maxRetries: 5,
      jitterFactor: 0,
    })
    manager.setConnectionFunctions(
      connectFn as unknown as () => Promise<void>,
      disconnectFn as unknown as () => Promise<void>,
      isConnectedFn as unknown as () => boolean
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should start in disconnected state', () => {
      expect(manager.getState()).toBe('disconnected')
    })

    it('should have empty stats initially', () => {
      const stats = manager.getStats()
      expect(stats.state).toBe('disconnected')
      expect(stats.lastConnected).toBeNull()
      expect(stats.lastDisconnected).toBeNull()
      expect(stats.reconnectAttempts).toBe(0)
    })
  })

  describe('Connection Lifecycle', () => {
    it('should connect successfully', async () => {
      await manager.start()

      expect(connectFn).toHaveBeenCalledTimes(1)
      // Since the mock resolves immediately, state transitions to 'connected'
      expect(manager.getState()).toBe('connected')
    })

    it('should transition to connected state on success', async () => {
      await manager.start()
      manager.onConnected()

      expect(manager.getState()).toBe('connected')
      expect(manager.getStats().lastConnected).not.toBeNull()
    })

    it('should emit connected event', async () => {
      const connectedHandler = vi.fn()
      manager.on('connected', connectedHandler)

      await manager.start()
      manager.onConnected()

      expect(connectedHandler).toHaveBeenCalled()
    })

    it('should stop and disconnect', async () => {
      await manager.start()
      manager.onConnected()
      await manager.stop()

      expect(disconnectFn).toHaveBeenCalled()
      expect(manager.getState()).toBe('disconnected')
    })
  })

  describe('Reconnection with Exponential Backoff', () => {
    it('should schedule reconnect on disconnect', async () => {
      await manager.start()
      manager.onConnected()
      manager.onDisconnected()

      expect(manager.getState()).toBe('reconnecting')
    })

    it('should use exponential backoff', async () => {
      // Make connect fail after first successful connection to test backoff
      connectFn.mockResolvedValueOnce(undefined) // First connect succeeds
      connectFn.mockRejectedValue(new Error('Connection failed')) // Subsequent calls fail

      await manager.start()
      // First connect succeeded, now disconnect
      manager.onDisconnected()

      // First retry after 1000ms - fails due to mock
      await vi.advanceTimersByTimeAsync(1000)
      expect(connectFn).toHaveBeenCalledTimes(2)

      // Second retry should be 2000ms (exponential backoff)
      await vi.advanceTimersByTimeAsync(1500)
      expect(connectFn).toHaveBeenCalledTimes(2) // Not yet
      await vi.advanceTimersByTimeAsync(500)
      expect(connectFn).toHaveBeenCalledTimes(3)

      // Third retry should be 4000ms
      await vi.advanceTimersByTimeAsync(3500)
      expect(connectFn).toHaveBeenCalledTimes(3) // Not yet
      await vi.advanceTimersByTimeAsync(500)
      expect(connectFn).toHaveBeenCalledTimes(4)
    })

    it('should respect max retry delay', async () => {
      manager = createConnectionManager({
        initialRetryDelay: 1000,
        maxRetryDelay: 3000,
        backoffMultiplier: 10,
        maxRetries: 10,
        jitterFactor: 0,
      })
      manager.setConnectionFunctions(
        connectFn as unknown as () => Promise<void>,
        disconnectFn as unknown as () => Promise<void>,
        isConnectedFn as unknown as () => boolean
      )

      await manager.start()
      manager.onConnected()

      // First disconnect
      manager.onDisconnected()
      await vi.advanceTimersByTimeAsync(1000)
      expect(connectFn).toHaveBeenCalledTimes(2)

      // Second - would be 10000ms but capped at 3000ms
      manager.onDisconnected()
      await vi.advanceTimersByTimeAsync(3000)
      expect(connectFn).toHaveBeenCalledTimes(3)
    })

    it('should stop reconnecting after max retries', async () => {
      const maxRetriesHandler = vi.fn()
      manager.on('maxRetriesReached', maxRetriesHandler)

      connectFn.mockRejectedValue(new Error('Connection failed'))

      await manager.start()

      // Advance through all retries
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(10000)
      }

      // Should have stopped trying
      expect(maxRetriesHandler).toHaveBeenCalled()
    })

    it('should emit reconnecting event with attempt count', async () => {
      const reconnectingHandler = vi.fn()
      manager.on('reconnecting', reconnectingHandler)

      await manager.start()
      manager.onConnected()
      manager.onDisconnected()

      await vi.advanceTimersByTimeAsync(1000)

      expect(reconnectingHandler).toHaveBeenCalledWith(1)
    })
  })

  describe('Manual Reconnection', () => {
    it('should reconnect immediately when requested', async () => {
      await manager.start()
      manager.onConnected()

      connectFn.mockClear()
      await manager.reconnectNow()

      expect(disconnectFn).toHaveBeenCalled()
      expect(connectFn).toHaveBeenCalled()
    })

    it('should reset backoff on manual reconnect', async () => {
      await manager.start()
      manager.onConnected()
      manager.onDisconnected()

      // Simulate some failed retries to increase backoff
      await vi.advanceTimersByTimeAsync(1000)
      manager.onDisconnected()

      // Now manual reconnect
      await manager.reconnectNow()

      const stats = manager.getStats()
      expect(stats.reconnectAttempts).toBe(0)
    })
  })

  describe('Connection Lost Notification', () => {
    it('should handle connection lost notification', async () => {
      await manager.start()
      manager.onConnected()

      const disconnectedHandler = vi.fn()
      manager.on('disconnected', disconnectedHandler)

      manager.notifyConnectionLost()

      expect(disconnectedHandler).toHaveBeenCalled()
      expect(manager.getState()).toBe('reconnecting')
    })
  })

  describe('App Lifecycle', () => {
    it('should handle app resume', async () => {
      await manager.start()
      manager.onConnected()

      const resumedHandler = vi.fn()
      manager.on('resumed', resumedHandler)

      await manager.onAppResume()

      expect(resumedHandler).toHaveBeenCalled()
    })

    it('should reconnect if connection lost during sleep', async () => {
      await manager.start()
      manager.onConnected()

      // Simulate connection lost during sleep
      isConnectedFn.mockReturnValue(false)

      const disconnectedHandler = vi.fn()
      manager.on('disconnected', disconnectedHandler)

      await manager.onAppResume()

      expect(disconnectedHandler).toHaveBeenCalled()
    })

    it('should emit suspending event on app suspend', async () => {
      const suspendingHandler = vi.fn()
      manager.on('suspending', suspendingHandler)

      manager.onAppSuspend()

      expect(suspendingHandler).toHaveBeenCalled()
    })
  })

  describe('Network Events', () => {
    it('should handle network online', async () => {
      await manager.start()
      manager.onConnected()
      manager.onDisconnected()

      // Cancel pending reconnect
      manager.onNetworkOffline()

      // Now network comes back
      connectFn.mockClear()
      manager.onNetworkOnline()

      // Should schedule reconnect with reset backoff
      await vi.advanceTimersByTimeAsync(1000)
      expect(connectFn).toHaveBeenCalled()
    })

    it('should cancel reconnect on network offline', async () => {
      await manager.start()
      manager.onConnected()
      manager.onDisconnected()

      const networkOfflineHandler = vi.fn()
      manager.on('networkOffline', networkOfflineHandler)

      manager.onNetworkOffline()

      expect(networkOfflineHandler).toHaveBeenCalled()
    })

    it('should emit network events', async () => {
      const onlineHandler = vi.fn()
      const offlineHandler = vi.fn()

      manager.on('networkOnline', onlineHandler)
      manager.on('networkOffline', offlineHandler)

      manager.onNetworkOnline()
      manager.onNetworkOffline()

      expect(onlineHandler).toHaveBeenCalled()
      expect(offlineHandler).toHaveBeenCalled()
    })
  })

  describe('State Change Events', () => {
    it('should emit stateChanged events', async () => {
      const stateChanges: [ConnectionState, ConnectionState][] = []
      manager.on('stateChanged', (newState, prevState) => {
        stateChanges.push([newState, prevState])
      })

      await manager.start()
      manager.onConnected()
      manager.onDisconnected()

      expect(stateChanges).toContainEqual(['connecting', 'disconnected'])
      expect(stateChanges).toContainEqual(['connected', 'connecting'])
      expect(stateChanges).toContainEqual(['disconnected', 'connected'])
    })
  })

  describe('Statistics', () => {
    it('should track total reconnects', async () => {
      await manager.start()
      manager.onConnected()

      // First disconnect and reconnect
      manager.onDisconnected()
      await vi.advanceTimersByTimeAsync(1000)
      manager.onConnected()

      // Second disconnect and reconnect
      manager.onDisconnected()
      await vi.advanceTimersByTimeAsync(1000)
      manager.onConnected()

      const stats = manager.getStats()
      expect(stats.totalReconnects).toBe(2)
    })

    it('should reset attempt counter on successful connect', async () => {
      // First connect succeeds, then fails, then succeeds again
      connectFn.mockResolvedValueOnce(undefined) // Initial connect
      connectFn.mockRejectedValueOnce(new Error('fail')) // First retry fails
      connectFn.mockRejectedValueOnce(new Error('fail')) // Second retry fails
      connectFn.mockResolvedValueOnce(undefined) // Third retry succeeds

      await manager.start()
      // First connect succeeded, now disconnect
      manager.onDisconnected()

      // First retry after 1000ms - fails
      await vi.advanceTimersByTimeAsync(1000)
      expect(manager.getStats().reconnectAttempts).toBe(1)

      // Second retry after 2000ms - fails
      await vi.advanceTimersByTimeAsync(2000)
      expect(manager.getStats().reconnectAttempts).toBe(2)

      // Third retry after 4000ms - succeeds
      await vi.advanceTimersByTimeAsync(4000)
      expect(manager.getStats().reconnectAttempts).toBe(0)
    })
  })

  describe('Stop Behavior', () => {
    it('should not reconnect after stop', async () => {
      await manager.start()
      manager.onConnected()
      await manager.stop()

      connectFn.mockClear()

      // Advance time - should not try to reconnect
      await vi.advanceTimersByTimeAsync(5000)

      expect(connectFn).not.toHaveBeenCalled()
    })

    it('should cancel pending reconnect on stop', async () => {
      await manager.start()
      manager.onConnected()
      manager.onDisconnected()

      // Reconnect is scheduled
      expect(manager.getState()).toBe('reconnecting')

      await manager.stop()

      // Advance past the reconnect time
      connectFn.mockClear()
      await vi.advanceTimersByTimeAsync(5000)

      expect(connectFn).not.toHaveBeenCalled()
    })
  })
})
