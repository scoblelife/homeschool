/**
 * SyncStatusIndicator - Header indicator showing sync status
 *
 * Shows:
 * - Sync state (synced/syncing/offline/error)
 * - Connection status with visual indicator
 * - Number of connected peers
 * - Last sync timestamp
 * - Click to see detailed sync status modal
 */

import { useState, useEffect, useCallback } from 'react'
import { Dialog } from '@headlessui/react'
import type { SyncStatus, SyncState } from '../../../../shared/types'

interface Props {
  onClick?: () => void
}

// Format relative time (e.g., "2 min ago")
function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never'

  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHour < 24) return `${diffHour} hr ago`
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
}

// Get status display info
function getStatusInfo(state: SyncState): {
  label: string
  color: string
  bgColor: string
  icon: 'check' | 'sync' | 'offline' | 'error'
} {
  switch (state) {
    case 'synced':
      return { label: 'Synced', color: 'text-green-500', bgColor: 'bg-green-100', icon: 'check' }
    case 'syncing':
      return { label: 'Syncing', color: 'text-blue-500', bgColor: 'bg-blue-100', icon: 'sync' }
    case 'offline':
      return { label: 'Offline', color: 'text-gray-400', bgColor: 'bg-gray-100', icon: 'offline' }
    case 'error':
      return { label: 'Error', color: 'text-red-500', bgColor: 'bg-red-100', icon: 'error' }
    default:
      return { label: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-100', icon: 'offline' }
  }
}

// Status icon component
function StatusIcon({ type, className }: { type: 'check' | 'sync' | 'offline' | 'error'; className?: string }) {
  const baseClass = `w-5 h-5 ${className || ''}`

  switch (type) {
    case 'check':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    case 'sync':
      return (
        <svg className={`${baseClass} animate-spin`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    case 'offline':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656M6.343 17.657a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656" />
          <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        </svg>
      )
    case 'error':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
  }
}

export default function SyncStatusIndicator({ onClick }: Props): JSX.Element | null {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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
  const statusInfo = getStatusInfo(status.syncState)
  const hasPending = status.pendingEvents > 0

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setShowModal(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors ${statusInfo.color}`}
        title={`Family Sync: ${statusInfo.label} - ${peerCount} device${peerCount !== 1 ? 's' : ''} connected`}
      >
        {/* Status indicator */}
        <div className="relative">
          <StatusIcon type={statusInfo.icon} className={statusInfo.color} />

          {/* Pending indicator */}
          {hasPending && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Peer count */}
        <span className="text-sm text-gray-600">{peerCount}</span>
      </button>

      {/* Detailed Status Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="relative z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              Sync Status
            </Dialog.Title>

            <div className="space-y-4">
              {/* Status Row */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <span className="text-gray-600">Status</span>
                <span className={`flex items-center gap-2 px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color} text-sm font-medium`}>
                  <StatusIcon type={statusInfo.icon} className="w-4 h-4" />
                  {statusInfo.label}
                </span>
              </div>

              {/* Last Synced */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <span className="text-gray-600">Last Synced</span>
                <span className="text-gray-900 font-medium">
                  {formatRelativeTime(status.lastSyncTime)}
                </span>
              </div>

              {/* Connected Devices */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <span className="text-gray-600">Connected Devices</span>
                <span className="text-gray-900 font-medium">{peerCount}</span>
              </div>

              {/* Device List */}
              {status.connectedPeers.length > 0 && (
                <div className="p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-600 text-sm block mb-2">Connected Peers</span>
                  <ul className="space-y-2">
                    {status.connectedPeers.map((peer) => (
                      <li key={peer.deviceId} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-gray-900">{peer.deviceName || peer.deviceId.slice(0, 8)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Error Message */}
              {status.errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  <span className="font-medium">Error: </span>
                  {status.errorMessage}
                </div>
              )}

              {/* Pending Events */}
              {status.pendingEvents > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                  <span className="text-amber-700">Pending Changes</span>
                  <span className="text-amber-900 font-medium">{status.pendingEvents}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
              {onClick && (
                <button
                  onClick={() => {
                    setShowModal(false)
                    onClick()
                  }}
                  className="btn btn-primary"
                >
                  Settings
                </button>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}
