/**
 * Homeschool Sync Relay Server
 *
 * A simple WebSocket relay that forwards messages between family members.
 * Devices connect with their familyId and deviceId, and all messages
 * are forwarded to other devices in the same family.
 */

import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'

const PORT = parseInt(process.env.PORT || '8080', 10)

interface Client {
  ws: WebSocket
  familyId: string
  deviceId: string
  deviceName: string
  connectedAt: Date
  lastSeen: Date
}

interface JoinMessage {
  type: 'join'
  familyId: string
  deviceId: string
  deviceName: string
}

interface LeaveMessage {
  type: 'leave'
}

interface EventMessage {
  type: 'event'
  event: unknown
}

interface SyncRequestMessage {
  type: 'sync_request'
  afterTimestamp?: string
}

interface SyncResponseMessage {
  type: 'sync_response'
  events: unknown[]
  hasMore: boolean
}

interface PingMessage {
  type: 'ping'
}

interface PongMessage {
  type: 'pong'
}

type IncomingMessage = JoinMessage | LeaveMessage | EventMessage | SyncRequestMessage | SyncResponseMessage | PingMessage

// Map of familyId -> Map of deviceId -> Client
const families = new Map<string, Map<string, Client>>()

// Get all clients in a family except the sender
function getFamilyPeers(familyId: string, excludeDeviceId: string): Client[] {
  const family = families.get(familyId)
  if (!family) return []

  return Array.from(family.values()).filter(c => c.deviceId !== excludeDeviceId)
}

// Broadcast a message to all family members except sender
function broadcastToFamily(familyId: string, senderDeviceId: string, message: object) {
  const peers = getFamilyPeers(familyId, senderDeviceId)
  const payload = JSON.stringify(message)

  for (const peer of peers) {
    if (peer.ws.readyState === WebSocket.OPEN) {
      peer.ws.send(payload)
    }
  }
}

// Send a message to a specific client
function sendTo(client: Client, message: object) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message))
  }
}

// Notify all family members about peer list change
function notifyPeerListChange(familyId: string) {
  const family = families.get(familyId)
  if (!family) return

  const peerList = Array.from(family.values()).map(c => ({
    deviceId: c.deviceId,
    deviceName: c.deviceName,
    isOnline: c.ws.readyState === WebSocket.OPEN
  }))

  const message = {
    type: 'peers',
    peers: peerList
  }

  for (const client of family.values()) {
    sendTo(client, message)
  }
}

// Handle client connection
function handleConnection(ws: WebSocket) {
  let client: Client | null = null

  console.log('New connection')

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString()) as IncomingMessage

      switch (message.type) {
        case 'join': {
          // Register client in their family
          const { familyId, deviceId, deviceName } = message

          // Create family map if needed
          if (!families.has(familyId)) {
            families.set(familyId, new Map())
          }

          const family = families.get(familyId)!

          // Check if device is reconnecting
          const existing = family.get(deviceId)
          if (existing && existing.ws !== ws) {
            // Close old connection
            existing.ws.close()
          }

          // Register new client
          client = {
            ws,
            familyId,
            deviceId,
            deviceName,
            connectedAt: new Date(),
            lastSeen: new Date()
          }
          family.set(deviceId, client)

          console.log(`Device ${deviceName} (${deviceId}) joined family ${familyId.substring(0, 8)}...`)

          // Send welcome message with peer list
          const peers = getFamilyPeers(familyId, deviceId)
          sendTo(client, {
            type: 'welcome',
            peers: peers.map(p => ({
              deviceId: p.deviceId,
              deviceName: p.deviceName,
              isOnline: true
            }))
          })

          // Notify others about new peer
          broadcastToFamily(familyId, deviceId, {
            type: 'peer_joined',
            deviceId,
            deviceName
          })

          break
        }

        case 'leave': {
          if (client) {
            handleDisconnect(client)
            client = null
          }
          break
        }

        case 'event': {
          // Forward sync event to all family members
          if (client) {
            client.lastSeen = new Date()
            broadcastToFamily(client.familyId, client.deviceId, {
              type: 'event',
              from: client.deviceId,
              event: message.event
            })
          }
          break
        }

        case 'sync_request': {
          // Forward sync request to all peers (they'll respond with events)
          if (client) {
            client.lastSeen = new Date()
            broadcastToFamily(client.familyId, client.deviceId, {
              type: 'sync_request',
              from: client.deviceId,
              afterTimestamp: message.afterTimestamp
            })
          }
          break
        }

        case 'sync_response': {
          // This would be forwarded to a specific peer, but for simplicity
          // we broadcast and let clients filter
          if (client) {
            client.lastSeen = new Date()
            broadcastToFamily(client.familyId, client.deviceId, {
              type: 'sync_response',
              from: client.deviceId,
              events: message.events,
              hasMore: message.hasMore
            })
          }
          break
        }

        case 'ping': {
          if (client) {
            client.lastSeen = new Date()
            sendTo(client, { type: 'pong' })
          } else {
            ws.send(JSON.stringify({ type: 'pong' }))
          }
          break
        }
      }
    } catch (error) {
      console.error('Error processing message:', error)
    }
  })

  ws.on('close', () => {
    if (client) {
      handleDisconnect(client)
    }
    console.log('Connection closed')
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
}

function handleDisconnect(client: Client) {
  const family = families.get(client.familyId)
  if (family) {
    family.delete(client.deviceId)

    console.log(`Device ${client.deviceName} (${client.deviceId}) left family ${client.familyId.substring(0, 8)}...`)

    // Notify remaining family members
    broadcastToFamily(client.familyId, client.deviceId, {
      type: 'peer_left',
      deviceId: client.deviceId,
      deviceName: client.deviceName
    })

    // Clean up empty families
    if (family.size === 0) {
      families.delete(client.familyId)
    }
  }
}

// Create HTTP server for health checks
const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      families: families.size,
      clients: Array.from(families.values()).reduce((sum, f) => sum + f.size, 0)
    }))
  } else {
    res.writeHead(404)
    res.end()
  }
})

// Create WebSocket server
const wss = new WebSocketServer({ server })

wss.on('connection', handleConnection)

// Start server
server.listen(PORT, () => {
  console.log(`Homeschool Sync Relay Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...')
  wss.close()
  server.close()
  process.exit(0)
})
