/**
 * SyncSettings - Family sync configuration and status
 *
 * Shows:
 * - Family sync status (enabled/disabled)
 * - Create/join family options
 * - QR code for sharing
 * - Connected peers (mesh members)
 * - Device info
 */

import { useState, useEffect, useCallback } from 'react'
import { Dialog } from '@headlessui/react'
import { QRCodeSVG } from 'qrcode.react'
import type { SyncStatus, SyncPeerInfo } from '../../../../shared/types'

export default function SyncSettings(): JSX.Element {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isManager, setIsManager] = useState(false)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)

  // Form state
  const [deviceName, setDeviceName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [qrData, setQrData] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load sync status
  const loadStatus = useCallback(async () => {
    try {
      await window.api.syncInitialize()
      const status = await window.api.syncGetStatus()
      setSyncStatus(status)
      setError(null)

      // Check if we're the manager
      if (status.isEnabled) {
        const managerStatus = await window.api.syncIsManager()
        setIsManager(managerStatus)
      }
    } catch (err) {
      setError('Failed to load sync status')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
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

  // Create family
  const handleCreateFamily = async (): Promise<void> => {
    if (!deviceName.trim()) return
    setIsProcessing(true)
    setError(null)

    try {
      const result = await window.api.syncCreateFamily(deviceName.trim())
      if (result.success) {
        setShowCreateModal(false)
        setDeviceName('')
        await loadStatus()
      } else {
        setError(result.error || 'Failed to create family')
      }
    } catch (err) {
      setError('Failed to create family')
    } finally {
      setIsProcessing(false)
    }
  }

  // Join family
  const handleJoinFamily = async (): Promise<void> => {
    if (!deviceName.trim() || !joinCode.trim()) return
    setIsProcessing(true)
    setError(null)

    try {
      const result = await window.api.syncJoinFamily(joinCode.trim(), deviceName.trim())
      if (result.success) {
        setShowJoinModal(false)
        setDeviceName('')
        setJoinCode('')
        await loadStatus()
      } else {
        setError(result.error || 'Failed to join family')
      }
    } catch (err) {
      setError('Failed to join family')
    } finally {
      setIsProcessing(false)
    }
  }

  // Leave family
  const handleLeaveFamily = async (): Promise<void> => {
    if (!confirm('Are you sure you want to leave this family? You will need to rejoin using a QR code.')) {
      return
    }

    setIsProcessing(true)
    try {
      const result = await window.api.syncLeaveFamily()
      if (result.success) {
        await loadStatus()
      } else {
        setError(result.error || 'Failed to leave family')
      }
    } catch (err) {
      setError('Failed to leave family')
    } finally {
      setIsProcessing(false)
    }
  }

  // Show QR code
  const handleShowQR = async (): Promise<void> => {
    try {
      const result = await window.api.syncGetQRCode()
      if (result.success && result.qrData) {
        setQrData(result.qrData)
        setShowQRModal(true)
      } else {
        setError('Failed to generate QR code')
      }
    } catch (err) {
      setError('Failed to generate QR code')
    }
  }

  // Kick a member (manager only)
  const handleKickMember = async (deviceId: string, deviceName: string): Promise<void> => {
    if (!confirm(`Are you sure you want to remove "${deviceName}" from this family? They will not be able to reconnect without a new invite.`)) {
      return
    }

    setIsProcessing(true)
    try {
      const result = await window.api.syncKickMember(deviceId, deviceName)
      if (result.success) {
        await loadStatus()
      } else {
        setError(result.error || 'Failed to kick member')
      }
    } catch (err) {
      setError('Failed to kick member')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Family Sync</h2>
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Family Sync</h2>
          <p className="text-sm text-gray-500">
            Sync your data across family devices without any servers
          </p>
        </div>
        {syncStatus?.isEnabled && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            syncStatus.isConnected
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              syncStatus.isConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            {syncStatus.isConnected ? 'Connected' : 'Waiting for peers'}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-600 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {!syncStatus?.isEnabled ? (
        // Not in a family yet
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔐</div>
              <div>
                <p className="font-medium text-indigo-900">Private P2P Sync</p>
                <p className="text-sm text-indigo-700 mt-1">
                  Your data syncs directly between family devices using encrypted peer-to-peer connections.
                  No servers, no cloud storage - your data stays yours.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">✨</div>
              <div className="font-medium text-gray-900">Create Family</div>
              <p className="text-sm text-gray-500 mt-1">
                Start a new family sync group and invite others
              </p>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🔗</div>
              <div className="font-medium text-gray-900">Join Family</div>
              <p className="text-sm text-gray-500 mt-1">
                Enter a code from another family device
              </p>
            </button>
          </div>
        </div>
      ) : (
        // In a family
        <div className="space-y-6">
          {/* Device Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500">This Device</div>
                  {isManager && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                      Manager
                    </span>
                  )}
                </div>
                <div className="font-medium text-gray-900">
                  {syncStatus.familyStatus.deviceName || 'Unnamed Device'}
                </div>
                <div className="text-xs text-gray-400 font-mono mt-1">
                  ID: {syncStatus.familyStatus.deviceId?.slice(0, 8)}...
                </div>
              </div>
              <button
                onClick={handleShowQR}
                className="btn btn-primary flex items-center gap-2"
              >
                <span>👋</span>
                Invite Family
              </button>
            </div>
          </div>

          {/* Mesh Network Status */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Family Mesh Network</h3>
              <div className="text-sm text-gray-500">
                {syncStatus.connectedPeers.length} device{syncStatus.connectedPeers.length !== 1 ? 's' : ''} online
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <span className="text-lg">🛡️</span>
                <div>
                  <p className="text-sm text-blue-900 font-medium">
                    Your data never touches our servers
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    All connections below are direct device-to-device using end-to-end encryption.
                    Only devices in this list can see your data.
                  </p>
                </div>
              </div>
            </div>

            <PeerList
              peers={syncStatus.connectedPeers}
              currentDeviceId={syncStatus.familyStatus.deviceId}
              isManager={isManager}
              onKickMember={handleKickMember}
              isProcessing={isProcessing}
            />

            {syncStatus.pendingEvents > 0 && (
              <div className="mt-3 text-sm text-amber-600 flex items-center gap-2">
                <span className="animate-pulse">●</span>
                {syncStatus.pendingEvents} event{syncStatus.pendingEvents !== 1 ? 's' : ''} waiting to sync
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleLeaveFamily}
              disabled={isProcessing}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Leave Family Sync
            </button>
          </div>
        </div>
      )}

      {/* Create Family Modal */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Create Family Sync
            </Dialog.Title>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Create a new family sync group. You'll get a QR code to share with other family devices.
              </p>

              <div>
                <label className="label">Device Name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="input"
                  placeholder="e.g., Mom's MacBook, Kitchen iPad"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps identify this device in the family network
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFamily}
                  className="btn btn-primary"
                  disabled={!deviceName.trim() || isProcessing}
                >
                  {isProcessing ? 'Creating...' : 'Create Family'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Join Family Modal */}
      <Dialog open={showJoinModal} onClose={() => setShowJoinModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Join Family
            </Dialog.Title>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the sync code from another family device. You can find it by clicking "Show QR Code" on that device.
              </p>

              <div>
                <label className="label">Device Name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="input"
                  placeholder="e.g., Dad's Laptop, School Computer"
                />
              </div>

              <div>
                <label className="label">Sync Code</label>
                <textarea
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="input font-mono text-xs"
                  placeholder="Paste the sync code here..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Copy the code shown below the QR code on the other device
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="btn btn-secondary"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinFamily}
                  className="btn btn-primary"
                  disabled={!deviceName.trim() || !joinCode.trim() || isProcessing}
                >
                  {isProcessing ? 'Joining...' : 'Join Family'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onClose={() => setShowQRModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Invite Family Member
            </Dialog.Title>

            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <span>⚠️</span>
                  Only share this code with trusted family members
                </p>
              </div>

              {qrData && (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <QRCodeSVG
                      value={qrData}
                      size={180}
                      level="M"
                      includeMargin
                    />
                  </div>

                  {/* Share Buttons */}
                  <div className="w-full space-y-3">
                    <p className="text-sm text-gray-600 text-center">Send invite via:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={async () => {
                          await window.api.syncShareInvite('email', qrData)
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                      >
                        <span className="text-xl">📧</span>
                        <span className="font-medium">Email</span>
                      </button>
                      <button
                        onClick={async () => {
                          await window.api.syncShareInvite('sms', qrData)
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                      >
                        <span className="text-xl">💬</span>
                        <span className="font-medium">Text</span>
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or copy code</span>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        readOnly
                        value={qrData}
                        className="input font-mono text-xs pr-16"
                        rows={2}
                      />
                      <button
                        onClick={async () => {
                          const result = await window.api.syncGetInviteMessage(qrData)
                          if (result.success) {
                            await navigator.clipboard.writeText(result.message)
                            // Show brief feedback
                            const btn = document.activeElement as HTMLButtonElement
                            const originalText = btn.textContent
                            btn.textContent = 'Copied!'
                            setTimeout(() => { btn.textContent = originalText }, 1500)
                          }
                        }}
                        className="absolute top-2 right-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                      >
                        Copy All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="btn btn-secondary"
                >
                  Done
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}

/**
 * PeerList - Shows all devices in the mesh network
 */
function PeerList({
  peers,
  currentDeviceId,
  isManager,
  onKickMember,
  isProcessing
}: {
  peers: SyncPeerInfo[]
  currentDeviceId: string | null
  isManager: boolean
  onKickMember: (deviceId: string, deviceName: string) => Promise<void>
  isProcessing: boolean
}): JSX.Element {
  if (peers.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <div className="text-3xl mb-2">📡</div>
        <p>No other devices connected yet</p>
        <p className="text-sm mt-1">Share your QR code to add family devices</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {peers.map((peer) => {
        const isCurrentDevice = peer.peerId === currentDeviceId
        return (
          <div
            key={peer.peerId}
            className="flex items-center gap-3 p-3 bg-white border rounded-lg"
          >
            <div className={`w-3 h-3 rounded-full ${
              peer.isOnline ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {peer.deviceName || 'Unknown Device'}
                {isCurrentDevice && (
                  <span className="ml-2 text-xs text-gray-400">(This device)</span>
                )}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {peer.peerId.slice(0, 16)}...
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                {peer.isOnline ? (
                  <span className="text-green-600">Online</span>
                ) : (
                  <span>Last seen {formatLastSeen(peer.lastSeen)}</span>
                )}
              </div>
              {isManager && !isCurrentDevice && (
                <button
                  onClick={() => onKickMember(peer.peerId, peer.deviceName || 'Unknown Device')}
                  disabled={isProcessing}
                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Remove from family"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Format last seen timestamp
 */
function formatLastSeen(timestamp: number): string {
  if (!timestamp) return 'Never'

  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}
