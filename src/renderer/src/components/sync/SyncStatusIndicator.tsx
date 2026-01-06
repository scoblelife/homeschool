/**
 * SyncStatusIndicator - Header indicator showing sync status
 *
 * Shows:
 * - Sync enabled/disabled
 * - Connection status
 * - Number of connected peers
 * - Pending events indicator
 */

import { useState, useEffect, useCallback } from 'react'
import type { SyncStatus } from '../../../../shared/types'

interface Props {
  onClick?: () => void
}

export default function SyncStatusIndicator({ onClick }: Props): JSX.Element | null {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadStatus = useCallback(async () => {
    try {
      await window.api.syncInitialize()
      const syncStatus = await window.api.syncGetStatus()
      setStatus(syncStatus)
    } catch (err) {
      console.error('Failed to load sync status:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()

    // Poll for status updates every 10 seconds
    const interval = setInterval(loadStatus, 10000)
    return () => clearInterval(interval)
  }, [loadStatus])

  // Listen for peer events
  useEffect(() => {
    const cleanupConnected = window.api.onSyncPeerConnected(() => {
      loadStatus()
    })
    const cleanupDisconnected = window.api.onSyncPeerDisconnected(() => {
      loadStatus()
    })
    const cleanupCompleted = window.api.onSyncCompleted(() => {
      loadStatus()
    })

    return () => {
      cleanupConnected()
      cleanupDisconnected()
      cleanupCompleted()
    }
  }, [loadStatus])

  if (isLoading) {
    return null
  }

  // Don't show if sync is not enabled
  if (!status?.isEnabled) {
    return null
  }

  const peerCount = status.connectedPeers.length
  const hasPending = status.pendingEvents > 0

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      title={`Family Sync: ${peerCount} device${peerCount !== 1 ? 's' : ''} connected`}
    >
      {/* Status indicator */}
      <div className="relative">
        <svg
          className={`w-5 h-5 ${status.isConnected ? 'text-green-500' : 'text-yellow-500'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>

        {/* Pending indicator */}
        {hasPending && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Peer count */}
      <span className="text-sm text-gray-600">
        {peerCount}
      </span>
    </button>
  )
}
