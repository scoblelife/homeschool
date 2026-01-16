/**
 * Sync IPC Handlers - Expose sync functionality to renderer process
 *
 * Provides IPC handlers for:
 * - Family management (create, join, leave)
 * - Sync status monitoring
 * - QR code generation
 * - Peer information
 */

import { ipcMain, BrowserWindow, shell } from 'electron'
import { FamilyManager, createFamilyManager, type FamilyStatus, type QRCodePayload } from '../sync/family'
import { EventLog, createEventLog } from '../sync/eventLog'
import { EventProjector, createProjector } from '../sync/projector'
import { WebRTCTransport, createWebRTCTransport, type PeerInfo } from '../sync/webrtcTransport'
import { createEventId, type SyncEvent } from '../sync/events'
import { setSyncEmitter } from '../database/syncEmitter'
import { needsMigration, migrateExistingData } from '../sync/migration'

import type { SyncStatus, SyncState, SyncPeerInfo } from '../shared/types'

// Helper to convert PeerInfo to SyncPeerInfo
function toSyncPeerInfo(peers: PeerInfo[]): SyncPeerInfo[] {
  return peers.map(p => ({
    peerId: p.peerId,
    deviceId: p.deviceId,
    deviceName: p.deviceName,
    isOnline: p.isOnline
  }))
}

// Singleton instances
let familyManager: FamilyManager | null = null
let eventLog: EventLog | null = null
let projector: EventProjector | null = null
let webrtcTransport: WebRTCTransport | null = null
let initPromise: Promise<void> | null = null

// Sync state tracking
let currentSyncState: SyncState = 'offline'
let lastSyncTime: string | null = null
let syncErrorMessage: string | undefined = undefined

// Helper to update sync state
function updateSyncState(state: SyncState, error?: string): void {
  currentSyncState = state
  syncErrorMessage = error
  if (state === 'synced') {
    lastSyncTime = new Date().toISOString()
  }
}

/**
 * Initialize sync infrastructure (with mutex to prevent double init)
 */
async function initializeSync(): Promise<void> {
  // Return existing promise if initialization is in progress
  if (initPromise) return initPromise

  // Start initialization
  initPromise = doInitializeSync()
  return initPromise
}

async function doInitializeSync(): Promise<void> {
  console.log('[Sync] doInitializeSync called, familyManager:', !!familyManager)
  if (familyManager) return // Already initialized

  try {
    // Initialize family manager
    familyManager = await createFamilyManager()
    console.log('[Sync] FamilyManager created, isConfigured:', familyManager.isConfigured())

    // Initialize projector (this also ensures sync_state table exists)
    projector = await createProjector()
  } catch (err) {
    console.error('[Sync] Failed to initialize core sync components:', err)
    updateSyncState('error', 'Failed to initialize sync')
    return // Allow app to work without sync
  }

  // If we're part of a family, initialize event log and transport
  if (familyManager.isConfigured()) {
    const config = familyManager.getConfig()!
    console.log('[Sync] Initializing for family:', config.familyId.slice(0, 8) + '...')
    console.log('[Sync] Device:', config.deviceName, '(' + config.deviceId.slice(0, 8) + '...)')
    console.log('[Sync] Transport mode: WebRTC P2P')

    try {
      eventLog = await createEventLog(config.deviceId)
      console.log('[Sync] EventLog initialized')

      // Run migration if needed (generates events for existing data)
      if (await needsMigration()) {
        const count = await migrateExistingData(eventLog, config.deviceId)
        console.log(`[Sync] Migration complete: ${count} events generated`)
        // Reload projector state since migration updated sync_state in DB
        await projector.reloadState()
        console.log(`[Sync] Projector state reloaded: lastIndex=${projector.getState().lastProcessedIndex}`)
      }

      // Initialize WebRTC transport (non-blocking - failures are logged, not thrown)
      await initializeWebRTC(config)
    } catch (err) {
      console.error('[Sync] Failed to initialize event log or transport:', err)
      updateSyncState('error', 'Sync unavailable - working offline')
      // Don't throw - allow app to work without sync
    }
  }
}

/**
 * Initialize WebRTC transport
 */
async function initializeWebRTC(config: { deviceId: string; deviceName: string; familyId: string; keyPair: { publicKey: string } }): Promise<void> {
  webrtcTransport = createWebRTCTransport({
    deviceId: config.deviceId,
    deviceName: config.deviceName,
    familyId: config.familyId,
    pubKey: config.keyPair.publicKey,
    onEvent: async (event, fromPeer) => {
      if (!eventLog || !projector) return

      try {
        await eventLog.appendReceived(event)
        const index = (await eventLog.length()) - 1
        await projector.apply(event, index)

        // Notify renderer
        broadcastToWindows('sync:event-received', { event, fromPeer })
        console.log('[Sync] Event received via WebRTC:', event.type, 'from', fromPeer.slice(0, 8))
      } catch (err) {
        console.error('[Sync] Failed to process WebRTC event:', err)
      }
    },
    onPeerConnected: (peerId, deviceName) => {
      console.log('[Sync] Peer connected via WebRTC:', deviceName, peerId.slice(0, 8))
      updateSyncState('syncing') // Starting sync with new peer
      broadcastToWindows('sync:peer-connected', peerId)
    },
    onPeerDisconnected: (peerId) => {
      console.log('[Sync] Peer disconnected:', peerId.slice(0, 8))
      // If no more peers connected, mark as offline
      const remainingPeers = webrtcTransport?.getConnectedPeers() || []
      if (remainingPeers.length === 0) {
        updateSyncState('offline')
      }
      broadcastToWindows('sync:peer-disconnected', peerId)
    }
  })

  // Handle sync requests from peers
  webrtcTransport.on('sync:request', async (fromPeer: string, afterTimestamp: string | null) => {
    console.log('[Sync] Sync request from', fromPeer.slice(0, 8))
    if (!eventLog) {
      console.log('[Sync] No event log, ignoring sync request')
      return
    }

    updateSyncState('syncing')

    try {
      // Get events after the timestamp and send back
      const events = afterTimestamp
        ? await eventLog.getAfterTimestamp(afterTimestamp)
        : await eventLog.getAll()

      await webrtcTransport!.sendSyncResponse(events, false)
    } catch (error) {
      console.error('[Sync] Error handling sync request:', error)
    }
  })

  webrtcTransport.on('sync:completed', (peerId: string, eventsReceived: number) => {
    console.log('[Sync] Sync completed with', peerId.slice(0, 8), '-', eventsReceived, 'events')
    updateSyncState('synced') // Mark as synced after completion
    broadcastToWindows('sync:completed', { peerId, eventsReceived })
  })

  await webrtcTransport.start()
  console.log('[Sync] WebRTC transport initialized')

  // Enable sync emitter for repositories
  setSyncEmitter(async (eventData) => {
    if (!eventLog || !webrtcTransport) return

    const fullEvent = await eventLog.append(eventData)
    const index = (await eventLog.length()) - 1
    projector!.updateStateOnly(fullEvent.id, index)
    await webrtcTransport.broadcast(fullEvent)
    console.log('[Sync] Broadcast event via WebRTC:', fullEvent.type)
  })
}

/**
 * Broadcast a message to all renderer windows
 */
function broadcastToWindows(channel: string, data: unknown): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data)
    }
  }
}

/**
 * Register all sync IPC handlers
 */
export function registerSyncIPC(): void {
  // Initialize sync on startup
  ipcMain.handle('sync:initialize', async () => {
    await initializeSync()
    return { success: true }
  })

  // Get current sync status
  ipcMain.handle('sync:get-status', async (): Promise<SyncStatus> => {
    await initializeSync()

    const familyStatus = familyManager!.getStatus()
    const isConnected = webrtcTransport?.isConnected() || false

    // Determine sync state based on connection status
    let state: SyncState = currentSyncState
    if (!familyStatus.isConfigured) {
      state = 'offline'
    } else if (syncErrorMessage) {
      state = 'error'
    } else if (!isConnected) {
      state = 'offline'
    } else {
      // Connected - check if we have pending events or just synced
      state = currentSyncState === 'syncing' ? 'syncing' : 'synced'
    }

    return {
      isEnabled: familyStatus.isConfigured,
      isConnected,
      familyStatus,
      connectedPeers: toSyncPeerInfo(webrtcTransport?.getConnectedPeers() || []),
      pendingEvents: 0,
      syncState: state,
      lastSyncTime,
      errorMessage: syncErrorMessage
    }
  })

  // Create a new family
  ipcMain.handle('sync:create-family', async (_, deviceName: string) => {
    await initializeSync()

    try {
      const config = await familyManager!.createFamily(deviceName)

      // Initialize event log for new family
      eventLog = await createEventLog(config.deviceId)

      // Initialize WebRTC transport
      await initializeWebRTC(config)

      return { success: true, config }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Join an existing family
  ipcMain.handle('sync:join-family', async (_, qrData: string, deviceName: string) => {
    await initializeSync()

    try {
      const payload = FamilyManager.parseQRCodeData(qrData)
      const config = await familyManager!.joinFamily(payload, deviceName)

      // Initialize event log for joined family
      eventLog = await createEventLog(config.deviceId)

      // Initialize WebRTC transport
      await initializeWebRTC(config)

      return { success: true, config }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Leave current family
  ipcMain.handle('sync:leave-family', async () => {
    await initializeSync()

    try {
      // Stop active transport first
      if (webrtcTransport) {
        await webrtcTransport.stop()
        webrtcTransport = null
      }

      // Close event log
      if (eventLog) {
        await eventLog.close()
        eventLog = null
      }

      // Leave family
      await familyManager!.leaveFamily()

      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Get QR code data for sharing
  ipcMain.handle('sync:get-qr-code', async () => {
    await initializeSync()

    const qrData = familyManager!.getQRCodeData()
    return { success: qrData !== null, qrData }
  })

  // Update device name
  ipcMain.handle('sync:update-device-name', async (_, name: string) => {
    await initializeSync()

    try {
      await familyManager!.updateDeviceName(name)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Get connected peers
  ipcMain.handle('sync:get-peers', async (): Promise<PeerInfo[]> => {
    await initializeSync()

    return webrtcTransport?.getConnectedPeers() || []
  })

  // Broadcast an event (called when data changes)
  ipcMain.handle('sync:broadcast-event', async (_, event: SyncEvent) => {
    if (!webrtcTransport || !eventLog) {
      return { success: false, error: 'Sync not enabled' }
    }

    try {
      // Append to local log
      const fullEvent = await eventLog.append(event)

      // Apply to projector
      const index = (await eventLog.length()) - 1
      await projector!.apply(fullEvent, index)

      // Broadcast to peers via WebRTC
      await webrtcTransport.broadcast(fullEvent)

      return { success: true, event: fullEvent }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Get event log stats
  ipcMain.handle('sync:get-log-stats', async () => {
    if (!eventLog) {
      return { length: 0, lastEventId: null }
    }

    const state = await eventLog.getState()
    return state
  })

  // Check if current device is manager
  ipcMain.handle('sync:is-manager', async (): Promise<boolean> => {
    await initializeSync()
    return familyManager?.isManager() ?? false
  })

  // Kick a member (manager only)
  ipcMain.handle('sync:kick-member', async (_, deviceId: string, deviceName: string, reason?: string) => {
    await initializeSync()

    // Check if we're the manager
    if (!familyManager?.isManager()) {
      return { success: false, error: 'Only the family manager can kick members' }
    }

    if (!eventLog || !webrtcTransport || !projector) {
      return { success: false, error: 'Sync not enabled' }
    }

    try {
      // Get the kicked member's public key from the family members
      const members = familyManager?.getMembers() || []
      const kickedMember = members.find((m: { deviceId: string }) => m.deviceId === deviceId)
      const kickedPubKey = kickedMember?.pubKey || ''

      // Get our device ID (the one doing the kicking)
      const ourDeviceId = familyManager?.getDeviceId() || ''

      // Create and append the kick event
      const kickEvent = await eventLog.append({
        id: createEventId(),
        type: 'member.kicked',
        data: {
          kickedDeviceId: deviceId,
          kickedPubKey,
          kickedDeviceName: deviceName,
          kickedBy: ourDeviceId,
          reason
        }
      })

      // Apply to projector (adds to blocklist)
      const index = (await eventLog.length()) - 1
      await projector.apply(kickEvent, index)

      // Disconnect the kicked peer if connected
      webrtcTransport.disconnectPeer(deviceId)

      // Broadcast to other peers
      await webrtcTransport.broadcast(kickEvent)

      console.log('[Sync] Kicked member:', deviceName, '(' + deviceId.slice(0, 8) + '...)')

      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Get kicked members list
  ipcMain.handle('sync:get-kicked-members', async () => {
    await initializeSync()

    if (!projector) {
      return { success: true, members: [] }
    }

    try {
      const members = await projector.getKickedMembers()
      return { success: true, members }
    } catch (err) {
      return { success: false, error: (err as Error).message, members: [] }
    }
  })

  // Share invite via email or SMS
  ipcMain.handle('sync:share-invite', async (_, method: 'email' | 'sms', inviteCode: string) => {
    const downloadUrl = 'https://github.com/sscoble/homeschool/releases'

    const subject = 'Join our Homeschool Family Sync'
    const body = `Hi!

I'd like to invite you to sync our homeschool data together. Here's how to join:

1. Download the Homeschool app: ${downloadUrl}

2. Open the app and go to Settings > Family Sync

3. Click "Join Family" and paste this code:

${inviteCode}

That's it! Once you join, our homeschool records will automatically sync between our devices.

- Sent from Homeschool App`

    try {
      if (method === 'email') {
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        await shell.openExternal(mailtoUrl)
      } else {
        // SMS - body only, no subject
        const smsBody = `Join our Homeschool Family Sync!\n\n1. Download: ${downloadUrl}\n2. Go to Settings > Family Sync > Join Family\n3. Paste this code:\n\n${inviteCode}`
        const smsUrl = `sms:?&body=${encodeURIComponent(smsBody)}`
        await shell.openExternal(smsUrl)
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Copy invite to clipboard (with formatted message)
  ipcMain.handle('sync:get-invite-message', async (_, inviteCode: string) => {
    const downloadUrl = 'https://github.com/sscoble/homeschool/releases'

    return {
      success: true,
      message: `Join our Homeschool Family Sync!

1. Download the app: ${downloadUrl}
2. Go to Settings > Family Sync > Join Family
3. Paste this code:

${inviteCode}`,
      downloadUrl
    }
  })

  // Check sync health
  ipcMain.handle('sync:check-health', async () => {
    const { checkEventLogHealth } = await import('../sync/recovery')

    if (!eventLog) {
      return {
        isCorrupted: false,
        eventLogLength: 0,
        lastEventId: null,
        canRecover: false
      }
    }

    return await checkEventLogHealth(eventLog)
  })

  // Reset sync (full reset)
  ipcMain.handle('sync:reset', async () => {
    const { resetSync } = await import('../sync/recovery')

    // Stop active transport first
    if (webrtcTransport) {
      await webrtcTransport.stop()
      webrtcTransport = null
    }

    // Close event log
    if (eventLog) {
      await eventLog.close()
      eventLog = null
    }

    // Clear projector
    projector = null

    // Reset family manager
    if (familyManager) {
      await familyManager.leaveFamily()
    }

    // Reset sync state
    updateSyncState('offline')
    syncErrorMessage = undefined

    // Delete all sync data
    const result = await resetSync()

    // Reset init promise so next access reinitializes
    initPromise = null

    return result
  })

  // Recover corrupted event log
  ipcMain.handle('sync:recover', async () => {
    const { recoverEventLog } = await import('../sync/recovery')

    if (!familyManager?.isConfigured()) {
      return { success: false, message: 'No family configured' }
    }

    const deviceId = familyManager.getDeviceId()
    if (!deviceId) {
      return { success: false, message: 'No device ID' }
    }

    // Close existing event log
    if (eventLog) {
      await eventLog.close()
      eventLog = null
    }

    // Attempt recovery
    const result = await recoverEventLog(deviceId)

    // Reinitialize if recovery succeeded
    if (result.success) {
      const { createEventLog } = await import('../sync/eventLog')
      eventLog = await createEventLog(deviceId)
    }

    return result
  })

  // List available backups
  ipcMain.handle('sync:list-backups', async () => {
    const { listBackups } = await import('../sync/recovery')
    return await listBackups()
  })

  // Restore from backup
  ipcMain.handle('sync:restore-backup', async (_, backupName: string) => {
    const { restoreFromBackup } = await import('../sync/recovery')

    // Close existing event log
    if (eventLog) {
      await eventLog.close()
      eventLog = null
    }

    const result = await restoreFromBackup(backupName)

    // Reinitialize event log if restore succeeded
    if (result.success && familyManager?.isConfigured()) {
      const deviceId = familyManager.getDeviceId()
      if (deviceId) {
        const { createEventLog } = await import('../sync/eventLog')
        eventLog = await createEventLog(deviceId)
      }
    }

    return result
  })
}

/**
 * Create an event and optionally broadcast it
 * Called from repositories when data changes
 */
export async function createAndBroadcastEvent(
  eventData: Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>
): Promise<SyncEvent | null> {
  if (!eventLog || !webrtcTransport) {
    return null // Sync not enabled
  }

  try {
    // Append to local log
    const fullEvent = await eventLog.append(eventData)

    // Apply to projector
    const index = (await eventLog.length()) - 1
    await projector!.apply(fullEvent, index)

    // Broadcast to peers via WebRTC
    await webrtcTransport.broadcast(fullEvent)

    return fullEvent
  } catch (err) {
    console.error('Failed to create/broadcast event:', err)
    return null
  }
}

/**
 * Shutdown sync infrastructure
 */
export async function shutdownSync(): Promise<void> {
  if (webrtcTransport) {
    await webrtcTransport.stop()
    webrtcTransport = null
  }

  if (eventLog) {
    await eventLog.close()
    eventLog = null
  }
}
