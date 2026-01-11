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

    // Send a signaling message
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
  console.log(`  GET  /health                    - Health check`)
  console.log(`  POST /room/{roomId}/join        - Join a room (body: { peerId })`)
  console.log(`  POST /room/{roomId}/leave       - Leave a room (body: { peerId })`)
  console.log(`  GET  /room/{roomId}/messages    - Poll for messages (?peerId=...&after=...)`)
  console.log(`  POST /signal                    - Send signaling message`)
  console.log(``)
  console.log(`WebRTC data flows peer-to-peer after connection is established.`)
})

process.on('SIGTERM', () => {
  console.log('Shutting down...')
  server.close()
  process.exit(0)
})
