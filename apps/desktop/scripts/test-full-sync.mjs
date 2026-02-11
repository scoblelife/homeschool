/**
 * Full Sync Test - Simulates a complete sync scenario
 *
 * This script:
 * 1. Connects as a "mobile" device to the relay
 * 2. Joins the existing family
 * 3. Requests and receives all historical events
 * 4. Creates a new student on the "mobile" device
 * 5. Verifies the desktop receives the event
 *
 * Usage: FAMILY_ID=<id> node scripts/test-full-sync.mjs
 *
 * Get the family ID from ~/.homeschool/sync/family.json
 */

import WebSocket from 'ws'
import crypto from 'crypto'

const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:9090'

const FAMILY_ID = process.env.FAMILY_ID
if (!FAMILY_ID) {
  console.error('Missing required FAMILY_ID environment variable')
  console.error('Get it from ~/.homeschool/sync/family.json')
  process.exit(1)
}

// Simulated mobile device
const mobileDevice = {
  deviceId: crypto.randomUUID(),
  deviceName: 'Simulated Mobile Device'
}

// Track state
let eventsReceived = []
let peersConnected = []
let syncCompleted = false

console.log('===========================================')
console.log('Full Sync Test')
console.log('===========================================')
console.log('')
console.log(`Relay: ${RELAY_URL}`)
console.log(`Family: ${FAMILY_ID.slice(0, 8)}...`)
console.log(`Device: ${mobileDevice.deviceName}`)
console.log(`Device ID: ${mobileDevice.deviceId.slice(0, 8)}...`)
console.log('')

const ws = new WebSocket(RELAY_URL)

ws.on('open', () => {
  console.log('[1] Connected to relay')

  // Join the family
  const joinMessage = {
    type: 'join',
    familyId: FAMILY_ID,
    deviceId: mobileDevice.deviceId,
    deviceName: mobileDevice.deviceName
  }
  ws.send(JSON.stringify(joinMessage))
  console.log('[2] Sent join request')
})

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString())

    switch (message.type) {
      case 'welcome':
        console.log('[3] Joined family successfully')
        if (message.familyMembers && message.familyMembers.length > 0) {
          console.log(`    Found ${message.familyMembers.length} existing member(s):`)
          message.familyMembers.forEach(m => {
            console.log(`    - ${m.deviceName} (${m.deviceId.slice(0, 8)}...)`)
            peersConnected.push(m)
          })
        }

        // Request sync
        console.log('[4] Requesting sync...')
        ws.send(JSON.stringify({
          type: 'sync_request',
          afterTimestamp: null
        }))
        break

      case 'sync_request':
        // Another peer is requesting sync from us - we're new so send empty
        console.log('    Peer requested sync - sending empty response')
        ws.send(JSON.stringify({
          type: 'sync_response',
          events: [],
          done: true
        }))
        break

      case 'sync_response':
        const events = message.events || []
        eventsReceived.push(...events)
        console.log(`[5] Received sync response: ${events.length} events`)

        // Always proceed after receiving events (don't wait for done flag)
        if (!syncCompleted) {
          syncCompleted = true
          console.log(`    Total events received: ${eventsReceived.length}`)

          // Summarize events by type
          const byType = {}
          eventsReceived.forEach(e => {
            byType[e.type] = (byType[e.type] || 0) + 1
          })
          console.log('    Event summary:')
          Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
            console.log(`      ${type}: ${count}`)
          })

          // Now create a new student to test sync back to desktop
          setTimeout(() => createStudent(), 1000)
        }
        break

      case 'peer_joined':
        console.log(`    Peer joined: ${message.deviceName}`)
        peersConnected.push({ deviceId: message.deviceId, deviceName: message.deviceName })
        break

      case 'peer_left':
        console.log(`    Peer left: ${message.deviceId.slice(0, 8)}...`)
        peersConnected = peersConnected.filter(p => p.deviceId !== message.deviceId)
        break

      case 'event':
        console.log(`    Event received: ${message.event?.type} from ${message.fromPeer?.slice(0, 8)}...`)
        eventsReceived.push(message.event)
        break

      default:
        console.log(`    Unknown message: ${message.type}`)
    }
  } catch (err) {
    console.log('    Parse error:', err.message)
  }
})

ws.on('close', () => {
  console.log('')
  console.log('[Done] Disconnected from relay')
})

ws.on('error', (err) => {
  console.error('[Error]', err.message)
})

function createStudent() {
  console.log('')
  console.log('[6] Creating new student event...')

  const studentId = crypto.randomUUID()
  const studentEvent = {
    id: crypto.randomUUID(),
    type: 'student.created',
    data: {
      id: studentId,
      name: 'Test Student (from mobile)',
      gradeLevel: 'K',
      color: 'blue',
      dateOfBirth: '2020-01-15'
    },
    timestamp: new Date().toISOString(),
    deviceId: mobileDevice.deviceId,
    version: 1
  }

  ws.send(JSON.stringify({
    type: 'event',
    event: studentEvent
  }))

  console.log(`    Sent student.created event`)
  console.log(`    Student ID: ${studentId.slice(0, 8)}...`)
  console.log(`    Event ID: ${studentEvent.id.slice(0, 8)}...`)
  console.log('')
  console.log('    Desktop app should now show this student!')
  console.log('    Check the desktop console for:')
  console.log('    [Sync] Event received via WebSocket: student.created')

  // Wait a bit then disconnect
  setTimeout(() => {
    console.log('')
    console.log('[7] Test complete. Closing connection.')
    ws.close()
  }, 3000)
}

// Timeout after 30 seconds
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('')
    console.log('[Timeout] Closing after 30 seconds')
    ws.close()
  }
}, 30000)
