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
import { SwarmManager, createSwarmManager } from '../sync/swarm'
import { WebSocketTransport, createWebSocketTransport } from '../sync/websocketTransport'
import { USE_WEBSOCKET, RELAY_URL } from '../sync/config'
import { createEventId, type SyncEvent } from '../sync/events'
import type { PeerInfo } from '../sync/mesh/protocol'
import { setSyncEmitter } from '../database/syncEmitter'
import { needsMigration, migrateExistingData } from '../sync/migration'

// Singleton instances
let familyManager: FamilyManager | null = null
let eventLog: EventLog | null = null
let projector: EventProjector | null = null
let swarmManager: SwarmManager | null = null
let wsTransport: WebSocketTransport | null = null
let initPromise: Promise<void> | null = null

export interface SyncStatus {
  isEnabled: boolean
  isConnected: boolean
  familyStatus: FamilyStatus
  connectedPeers: PeerInfo[]
  pendingEvents: number
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

  // Initialize family manager
  familyManager = await createFamilyManager()
  console.log('[Sync] FamilyManager created, isConfigured:', familyManager.isConfigured())

  // Initialize projector (this also ensures sync_state table exists)
  projector = await createProjector()

  // If we're part of a family, initialize event log and transport
  if (familyManager.isConfigured()) {
    const config = familyManager.getConfig()!
    console.log('[Sync] Initializing for family:', config.familyId.slice(0, 8) + '...')
    console.log('[Sync] Device:', config.deviceName, '(' + config.deviceId.slice(0, 8) + '...)')
    console.log('[Sync] Transport mode:', USE_WEBSOCKET ? 'WebSocket' : 'Hyperswarm P2P')

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

      // Use WebSocket transport or Hyperswarm based on config
      if (USE_WEBSOCKET) {
        await initializeWebSocket(config)
      } else {
        await initializeHyperswarm(config)
      }
    } catch (err) {
      console.error('[Sync] Failed to initialize:', err)
      // Don't throw - allow app to work without sync
    }
  }
}

/**
 * Initialize WebSocket transport
 */
async function initializeWebSocket(config: { deviceId: string; deviceName: string; familyId: string }): Promise<void> {
  wsTransport = createWebSocketTransport({
    deviceId: config.deviceId,
    deviceName: config.deviceName,
    familyId: config.familyId,
    relayUrl: RELAY_URL,
    onEvent: async (event, fromPeer) => {
      if (!eventLog || !projector) return

      try {
        await eventLog.appendReceived(event)
        const index = (await eventLog.length()) - 1
        await projector.apply(event, index)

        // Notify renderer
        broadcastToWindows('sync:event-received', { event, fromPeer })
        console.log('[Sync] Event received via WebSocket:', event.type, 'from', fromPeer.slice(0, 8))
      } catch (err) {
        console.error('[Sync] Failed to process WS event:', err)
      }
    },
    onPeerConnected: (peerId, deviceName) => {
      console.log('[Sync] Peer connected via WebSocket:', deviceName, peerId.slice(0, 8))
      broadcastToWindows('sync:peer-connected', peerId)
    },
    onPeerDisconnected: (peerId) => {
      console.log('[Sync] Peer disconnected:', peerId.slice(0, 8))
      broadcastToWindows('sync:peer-disconnected', peerId)
    }
  })

  // Handle sync requests
  wsTransport.on('sync:request', async (fromPeer: string, afterTimestamp: string | null) => {
    if (!eventLog) return

    // Get events after the timestamp and send back
    const events = afterTimestamp
      ? await eventLog.getAfterTimestamp(afterTimestamp)
      : await eventLog.getAll()

    await wsTransport!.sendSyncResponse(events, false)
  })

  wsTransport.on('sync:completed', (peerId: string, eventsReceived: number) => {
    console.log('[Sync] Sync completed with', peerId.slice(0, 8), '-', eventsReceived, 'events')
    broadcastToWindows('sync:completed', { peerId, eventsReceived })
  })

  await wsTransport.start()
  console.log('[Sync] WebSocket transport initialized, connected to', RELAY_URL)

  // Enable sync emitter for repositories
  setSyncEmitter(async (eventData) => {
    if (!eventLog || !wsTransport) return

    const fullEvent = await eventLog.append(eventData)
    const index = (await eventLog.length()) - 1
    projector!.updateStateOnly(fullEvent.id, index)
    await wsTransport.broadcast(fullEvent)
    console.log('[Sync] Broadcast event via WebSocket:', fullEvent.type)
  })
}

/**
 * Initialize Hyperswarm P2P transport
 */
async function initializeHyperswarm(config: { deviceId: string; deviceName: string; familyId: string }): Promise<void> {
  swarmManager = await createSwarmManager({
    deviceId: config.deviceId,
    deviceName: config.deviceName,
    familyId: config.familyId,
    eventLog: eventLog!,
    projector: projector!
  })
  console.log('[Sync] SwarmManager initialized')

  // Set up event forwarding to renderer
  setupSwarmEventForwarding()

  // Enable sync emitter for repositories
  setSyncEmitter(async (eventData) => {
    if (!eventLog || !swarmManager) return

    const fullEvent = await eventLog.append(eventData)
    const index = (await eventLog.length()) - 1
    projector!.updateStateOnly(fullEvent.id, index)
    await swarmManager.broadcast(fullEvent)
    console.log('[Sync] Broadcast event:', fullEvent.type)
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
 * Set up event forwarding from swarm to renderer
 */
function setupSwarmEventForwarding(): void {
  if (!swarmManager) return

  swarmManager.on('peer:connected', (peerId) => {
    console.log('[Sync] Peer connected:', peerId)
    broadcastToWindows('sync:peer-connected', peerId)
  })

  swarmManager.on('peer:disconnected', (peerId) => {
    console.log('[Sync] Peer disconnected:', peerId)
    broadcastToWindows('sync:peer-disconnected', peerId)
  })

  swarmManager.on('event:received', (event: SyncEvent, fromPeer: string) => {
    console.log('[Sync] Event received:', event.type, 'from', fromPeer)
    broadcastToWindows('sync:event-received', { event, fromPeer })
  })

  swarmManager.on('sync:completed', (peerId, eventsReceived) => {
    console.log('[Sync] Sync completed with', peerId, '-', eventsReceived, 'events')
    broadcastToWindows('sync:completed', { peerId, eventsReceived })
  })
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

    // Get stats from whichever transport is active
    if (wsTransport) {
      const wsStats = wsTransport.getStats()
      return {
        isEnabled: familyStatus.isConfigured,
        isConnected: wsTransport.isConnected(),
        familyStatus,
        connectedPeers: wsTransport.getConnectedPeers().map(p => ({
          peerId: p.deviceId,
          deviceName: p.deviceName,
          isOnline: p.isOnline
        })),
        pendingEvents: 0
      }
    }

    const stats = swarmManager?.getStats()
    return {
      isEnabled: familyStatus.isConfigured,
      isConnected: (stats?.connectedPeers || 0) > 0,
      familyStatus,
      connectedPeers: swarmManager?.getConnectedPeers() || [],
      pendingEvents: stats?.mailboxStats?.totalPending || 0
    }
  })

  // Create a new family
  ipcMain.handle('sync:create-family', async (_, deviceName: string) => {
    await initializeSync()

    try {
      const config = await familyManager!.createFamily(deviceName)

      // Initialize event log for new family
      eventLog = await createEventLog(config.deviceId)

      // Use WebSocket transport or Hyperswarm based on config
      if (USE_WEBSOCKET) {
        await initializeWebSocket(config)
      } else {
        swarmManager = await createSwarmManager({
          deviceId: config.deviceId,
          deviceName: config.deviceName,
          familyId: config.familyId,
          eventLog,
          projector: projector!
        })
        setupSwarmEventForwarding()
      }

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

      // Use WebSocket transport or Hyperswarm based on config
      if (USE_WEBSOCKET) {
        await initializeWebSocket(config)
      } else {
        swarmManager = await createSwarmManager({
          deviceId: config.deviceId,
          deviceName: config.deviceName,
          familyId: config.familyId,
          eventLog,
          projector: projector!
        })
        setupSwarmEventForwarding()
      }

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
      if (wsTransport) {
        await wsTransport.stop()
        wsTransport = null
      }
      if (swarmManager) {
        await swarmManager.stop()
        swarmManager = null
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

    // Return peers from active transport
    if (wsTransport) {
      return wsTransport.getConnectedPeers().map(p => ({
        peerId: p.deviceId,
        deviceName: p.deviceName,
        isOnline: p.isOnline
      }))
    }
    return swarmManager?.getConnectedPeers() || []
  })

  // Broadcast an event (called when data changes)
  ipcMain.handle('sync:broadcast-event', async (_, event: SyncEvent) => {
    if ((!swarmManager && !wsTransport) || !eventLog) {
      return { success: false, error: 'Sync not enabled' }
    }

    try {
      // Append to local log
      const fullEvent = await eventLog.append(event)

      // Apply to projector
      const index = (await eventLog.length()) - 1
      await projector!.apply(fullEvent, index)

      // Broadcast to peers via active transport
      if (wsTransport) {
        await wsTransport.broadcast(fullEvent)
      } else if (swarmManager) {
        await swarmManager.broadcast(fullEvent)
      }

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

    if (!eventLog || !swarmManager || !projector) {
      return { success: false, error: 'Sync not enabled' }
    }

    try {
      // Create and append the kick event
      const kickEvent = await eventLog.append({
        id: createEventId(),
        type: 'member.kicked',
        data: {
          kickedDeviceId: deviceId,
          kickedDeviceName: deviceName,
          reason
        }
      })

      // Apply to projector (adds to blocklist)
      const index = (await eventLog.length()) - 1
      await projector.apply(kickEvent, index)

      // Disconnect the kicked peer if connected
      swarmManager.disconnectPeer(deviceId)

      // Broadcast to other peers
      await swarmManager.broadcast(kickEvent)

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
}

/**
 * Create an event and optionally broadcast it
 * Called from repositories when data changes
 */
export async function createAndBroadcastEvent(
  eventData: Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>
): Promise<SyncEvent | null> {
  if (!eventLog || (!swarmManager && !wsTransport)) {
    return null // Sync not enabled
  }

  try {
    // Append to local log
    const fullEvent = await eventLog.append(eventData)

    // Apply to projector
    const index = (await eventLog.length()) - 1
    await projector!.apply(fullEvent, index)

    // Broadcast to peers via active transport
    if (wsTransport) {
      await wsTransport.broadcast(fullEvent)
    } else if (swarmManager) {
      await swarmManager.broadcast(fullEvent)
    }

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
  if (wsTransport) {
    await wsTransport.stop()
    wsTransport = null
  }

  if (swarmManager) {
    await swarmManager.stop()
    swarmManager = null
  }

  if (eventLog) {
    await eventLog.close()
    eventLog = null
  }
}
