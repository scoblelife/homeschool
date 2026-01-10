/**
 * Test script to verify WebSocket sync between devices
 *
 * This script simulates a second device joining the family and verifies
 * that events sync correctly between devices.
 *
 * Usage: node scripts/test-sync.mjs
 */

import WebSocket from 'ws'
import crypto from 'crypto'

const RELAY_URL = 'ws://localhost:9090'

// Get family config from first instance
const familyConfig = {
  familyId: "2b2082df-d6d9-4f88-afdb-1af249750998",
  publicKey: "302a300506032b65700321008643436c95418b8ae3cbba2f6b515e94e7a111f465edba4ed4234352ffbdb924",
  secretKey: "302e020100300506032b657004220420b05de75dda8b12de65177b2b8e7b9cd2ca3d2ec6140bee1e1680aaa9dd446a2e"
}

// Simulated second device
const testDevice = {
  deviceId: crypto.randomUUID(),
  deviceName: 'Test Device (Script)'
}

console.log('Test Sync Script')
console.log('================')
console.log(`Connecting to relay: ${RELAY_URL}`)
console.log(`Family ID: ${familyConfig.familyId.slice(0, 8)}...`)
console.log(`Device: ${testDevice.deviceName} (${testDevice.deviceId.slice(0, 8)}...)`)
console.log('')

const ws = new WebSocket(RELAY_URL)

ws.on('open', () => {
  console.log('[WS] Connected to relay')

  // Join the family
  const joinMessage = {
    type: 'join',
    familyId: familyConfig.familyId,
    deviceId: testDevice.deviceId,
    deviceName: testDevice.deviceName
  }
  ws.send(JSON.stringify(joinMessage))
  console.log('[WS] Sent join message')
})

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString())
    console.log('[WS] Received:', message.type)

    if (message.type === 'welcome') {
      console.log(`[WS] Joined family! Current members: ${message.familyMembers?.length || 0}`)
      if (message.familyMembers) {
        message.familyMembers.forEach(m => {
          console.log(`  - ${m.deviceName} (${m.deviceId.slice(0, 8)}...)`)
        })
      }

      // Request sync from other devices
      console.log('[WS] Requesting sync...')
      ws.send(JSON.stringify({
        type: 'sync_request',
        afterTimestamp: null
      }))
    }

    if (message.type === 'peer_joined') {
      console.log(`[WS] Peer joined: ${message.deviceName} (${message.deviceId.slice(0, 8)}...)`)
    }

    if (message.type === 'peer_left') {
      console.log(`[WS] Peer left: ${message.deviceId.slice(0, 8)}...`)
    }

    if (message.type === 'event') {
      console.log(`[WS] Event received: ${message.event?.type}`)
      console.log(`     From: ${message.fromPeer?.slice(0, 8)}...`)
    }

    if (message.type === 'sync_response') {
      console.log(`[WS] Sync response: ${message.events?.length || 0} events`)
      if (message.events && message.events.length > 0) {
        message.events.forEach(e => {
          console.log(`  - ${e.type} (${e.id?.slice(0, 8)}...)`)
        })
      }
    }

  } catch (err) {
    console.log('[WS] Raw message:', data.toString())
  }
})

ws.on('close', () => {
  console.log('[WS] Disconnected')
})

ws.on('error', (err) => {
  console.error('[WS] Error:', err.message)
})

// Send a test event after 3 seconds
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    const testEvent = {
      id: crypto.randomUUID(),
      type: 'test.ping',
      data: { message: 'Hello from test script!', timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      deviceId: testDevice.deviceId,
      version: 1
    }

    console.log('[WS] Sending test event...')
    ws.send(JSON.stringify({
      type: 'event',
      event: testEvent
    }))
  }
}, 3000)

// Keep running for 10 seconds
setTimeout(() => {
  console.log('')
  console.log('Test complete. Closing connection.')
  ws.close()
  process.exit(0)
}, 10000)
