/**
 * Homeschool Sync Signaling Server
 *
 * HTTP-based signaling server for WebRTC peer discovery and
 * offer/answer/ICE candidate exchange. The actual data transfer
 * happens peer-to-peer through WebRTC data channels.
 */

import { createServer, IncomingMessage as HttpIncomingMessage, ServerResponse } from 'http'

const PORT = parseInt(process.env.PORT || '8080', 10)

// ============= Types =============

interface SignalingMessage {
  id: number
  type: 'offer' | 'answer' | 'ice-candidate'
  from: string
  to: string
  payload: unknown
  room: string
  timestamp: number
}

interface Room {
  peers: Set<string>
  messages: SignalingMessage[]
  lastActivity: number
}

// ============= State =============

// Signaling rooms: roomId -> Room
const rooms = new Map<string, Room>()
let messageIdCounter = 0

// Presence state: familyId -> Map<deviceId, { pubKey, ts }>
interface PresenceEntry {
  pubKey: string
  ts: number
}
const presence = new Map<string, Map<string, PresenceEntry>>()

// Signal queues: topic:peerId -> SignalingMessage[]
const signalQueues = new Map<string, SignalingMessage[]>()

// ============= Helpers =============

function parseBody(req: HttpIncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, data: object, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(data))
}

function getRoom(roomId: string): Room {
  let room = rooms.get(roomId)
  if (!room) {
    room = { peers: new Set(), messages: [], lastActivity: Date.now() }
    rooms.set(roomId, room)
  }
  room.lastActivity = Date.now()
  return room
}

// Clean up old rooms (older than 1 hour)
function cleanupRooms() {
  const now = Date.now()
  const maxAge = 60 * 60 * 1000 // 1 hour
  for (const [roomId, room] of rooms) {
    if (now - room.lastActivity > maxAge) {
      rooms.delete(roomId)
      console.log(`Cleaned up room: ${roomId.substring(0, 8)}...`)
    }
  }
}
setInterval(cleanupRooms, 5 * 60 * 1000) // Every 5 minutes

// Clean up stale presence (older than 2 minutes)
function cleanupPresence() {
  const now = Date.now()
  const maxAge = 2 * 60 * 1000 // 2 minutes
  for (const [familyId, devices] of presence) {
    for (const [deviceId, entry] of devices) {
      if (now - entry.ts > maxAge) {
        devices.delete(deviceId)
        console.log(`Cleaned up stale presence: ${deviceId.substring(0, 8)}... from family ${familyId.substring(0, 8)}...`)
      }
    }
    if (devices.size === 0) {
      presence.delete(familyId)
    }
  }
}
setInterval(cleanupPresence, 60 * 1000) // Every minute

// ============= HTTP Routes =============

async function handleHttpRequest(req: HttpIncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const path = url.pathname
  const method = req.method || 'GET'

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  try {
    // Health check
    if (path === '/health' && method === 'GET') {
      sendJson(res, {
        status: 'ok',
        rooms: rooms.size,
        totalPeers: Array.from(rooms.values()).reduce((sum, r) => sum + r.peers.size, 0),
      })
      return
    }

    // Join a room
    const joinMatch = path.match(/^\/room\/([^/]+)\/join$/)
    if (joinMatch && method === 'POST') {
      const roomId = decodeURIComponent(joinMatch[1])
      const body = await parseBody(req)
      const peerId = body.peerId

      if (!peerId) {
        sendJson(res, { error: 'peerId required' }, 400)
        return
      }

      const room = getRoom(roomId)
      const existingPeers = Array.from(room.peers).filter(p => p !== peerId)
      room.peers.add(peerId)

      console.log(`[Signaling] Peer ${peerId.substring(0, 8)}... joined room ${roomId.substring(0, 8)}... (${room.peers.size} peers)`)

      sendJson(res, { peers: existingPeers })
      return
    }

    // Leave a room
    const leaveMatch = path.match(/^\/room\/([^/]+)\/leave$/)
    if (leaveMatch && method === 'POST') {
      const roomId = decodeURIComponent(leaveMatch[1])
      const body = await parseBody(req)
      const peerId = body.peerId

      const room = rooms.get(roomId)
      if (room) {
        room.peers.delete(peerId)
        console.log(`[Signaling] Peer ${peerId?.substring(0, 8)}... left room ${roomId.substring(0, 8)}... (${room.peers.size} peers)`)

        // Clean up empty rooms
        if (room.peers.size === 0) {
          rooms.delete(roomId)
        }
      }

      sendJson(res, { success: true })
      return
    }

    // Get messages for a room (for a specific peer)
    const messagesMatch = path.match(/^\/room\/([^/]+)\/messages$/)
    if (messagesMatch && method === 'GET') {
      const roomId = decodeURIComponent(messagesMatch[1])
      const peerId = url.searchParams.get('peerId')
      const afterId = parseInt(url.searchParams.get('after') || '0', 10)

      const room = rooms.get(roomId)
      if (!room) {
        sendJson(res, { messages: [] })
        return
      }

      // Get messages addressed to this peer, after the given ID
      const messages = room.messages.filter(m =>
        m.to === peerId && m.id > afterId
      )

      sendJson(res, { messages })
      return
    }

    // Send a signaling message (legacy room-based)
    if (path === '/signal' && method === 'POST') {
      const body = await parseBody(req)
      const { room: roomId, type, from, to, payload } = body

      if (!roomId || !type || !from || !to) {
        sendJson(res, { error: 'room, type, from, to required' }, 400)
        return
      }

      const room = getRoom(roomId)
      const message: SignalingMessage = {
        id: ++messageIdCounter,
        type,
        from,
        to,
        payload,
        room: roomId,
        timestamp: Date.now(),
      }
      room.messages.push(message)

      // Keep only last 100 messages per room
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100)
      }

      console.log(`[Signaling] ${type} from ${from.substring(0, 8)}... to ${to.substring(0, 8)}...`)

      sendJson(res, { success: true, messageId: message.id })
      return
    }

    // ============= Presence API =============

    // POST /presence/{familyId}/{deviceId} - heartbeat
    const presenceMatch = path.match(/^\/presence\/([^/]+)\/([^/]+)$/)
    if (presenceMatch && method === 'POST') {
      const familyId = decodeURIComponent(presenceMatch[1])
      const deviceId = decodeURIComponent(presenceMatch[2])
      const body = await parseBody(req)
      const { pubKey } = body

      if (!presence.has(familyId)) {
        presence.set(familyId, new Map())
      }
      presence.get(familyId)!.set(deviceId, { pubKey: pubKey || '', ts: Date.now() })

      console.log(`[Presence] Heartbeat from ${deviceId.substring(0, 8)}... in family ${familyId.substring(0, 8)}...`)
      sendJson(res, { success: true })
      return
    }

    // DELETE /presence/{familyId}/{deviceId} - remove presence
    if (presenceMatch && method === 'DELETE') {
      const familyId = decodeURIComponent(presenceMatch[1])
      const deviceId = decodeURIComponent(presenceMatch[2])

      const familyPresence = presence.get(familyId)
      if (familyPresence) {
        familyPresence.delete(deviceId)
        if (familyPresence.size === 0) {
          presence.delete(familyId)
        }
      }

      console.log(`[Presence] Removed ${deviceId.substring(0, 8)}... from family ${familyId.substring(0, 8)}...`)
      sendJson(res, { success: true })
      return
    }

    // GET /presence/{familyId} - get online peers
    const presenceListMatch = path.match(/^\/presence\/([^/]+)$/)
    if (presenceListMatch && method === 'GET') {
      const familyId = decodeURIComponent(presenceListMatch[1])

      const familyPresence = presence.get(familyId)
      const peers: Array<{ deviceId: string; pubKey: string; ts: number }> = []

      if (familyPresence) {
        for (const [deviceId, entry] of familyPresence) {
          peers.push({ deviceId, pubKey: entry.pubKey, ts: entry.ts })
        }
      }

      sendJson(res, { peers })
      return
    }

    // ============= Signal Queue API =============

    // POST /signal/{topic}/{peerId} - send signal to peer
    const signalSendMatch = path.match(/^\/signal\/([^/]+)\/([^/]+)$/)
    if (signalSendMatch && method === 'POST') {
      const topic = decodeURIComponent(signalSendMatch[1])
      const peerId = decodeURIComponent(signalSendMatch[2])
      const body = await parseBody(req)

      const queueKey = `${topic}:${peerId}`
      if (!signalQueues.has(queueKey)) {
        signalQueues.set(queueKey, [])
      }

      const message: SignalingMessage = {
        id: ++messageIdCounter,
        type: body.type,
        from: body.from,
        to: peerId,
        payload: body.payload,
        room: topic,
        timestamp: Date.now(),
      }
      signalQueues.get(queueKey)!.push(message)

      // Keep only last 50 messages per queue
      const queue = signalQueues.get(queueKey)!
      if (queue.length > 50) {
        signalQueues.set(queueKey, queue.slice(-50))
      }

      console.log(`[Signal] ${body.type} from ${body.from?.substring(0, 8) || 'unknown'}... to ${peerId.substring(0, 8)}...`)
      sendJson(res, { success: true })
      return
    }

    // GET /signal/{topic}/{peerId} - poll signals for peer
    if (signalSendMatch && method === 'GET') {
      const topic = decodeURIComponent(signalSendMatch[1])
      const peerId = decodeURIComponent(signalSendMatch[2])

      const queueKey = `${topic}:${peerId}`
      const messages = signalQueues.get(queueKey) || []

      // Clear the queue after reading (one-time delivery)
      signalQueues.delete(queueKey)

      sendJson(res, { messages })
      return
    }

    // 404 for unknown routes
    sendJson(res, { error: 'Not found' }, 404)
  } catch (error) {
    console.error('HTTP error:', error)
    sendJson(res, { error: 'Internal server error' }, 500)
  }
}

// ============= Server Setup =============

const server = createServer(handleHttpRequest)

server.listen(PORT, () => {
  console.log(`Homeschool Sync Signaling Server running on port ${PORT}`)
  console.log(``)
  console.log(`Endpoints:`)
  console.log(`  GET  /health                         - Health check`)
  console.log(``)
  console.log(`  Presence API:`)
  console.log(`  POST /presence/{familyId}/{deviceId} - Heartbeat (body: { pubKey })`)
  console.log(`  DELETE /presence/{familyId}/{deviceId} - Remove presence`)
  console.log(`  GET  /presence/{familyId}            - Get online peers`)
  console.log(``)
  console.log(`  Signal Queue API:`)
  console.log(`  POST /signal/{topic}/{peerId}        - Send signal to peer`)
  console.log(`  GET  /signal/{topic}/{peerId}        - Poll signals for peer`)
  console.log(``)
  console.log(`  Legacy Room API:`)
  console.log(`  POST /room/{roomId}/join             - Join a room (body: { peerId })`)
  console.log(`  POST /room/{roomId}/leave            - Leave a room (body: { peerId })`)
  console.log(`  GET  /room/{roomId}/messages         - Poll for messages`)
  console.log(`  POST /signal                         - Send signaling message`)
  console.log(``)
  console.log(`WebRTC data flows peer-to-peer after connection is established.`)
})

process.on('SIGTERM', () => {
  console.log('Shutting down...')
  server.close()
  process.exit(0)
})
