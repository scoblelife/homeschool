/**
 * Homeschool Sync Signaling Server
 *
 * HTTP-based signaling server for WebRTC peer discovery and
 * offer/answer/ICE candidate exchange. The actual data transfer
 * happens peer-to-peer through WebRTC data channels.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { db } from './db/index.js'
import { families, devices, syncEvents } from './db/schema.js'
import { eq, and, gt } from 'drizzle-orm'

// ============= Constants =============

const PORT = parseInt(process.env.PORT || '8080', 10)
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`[Server] Invalid PORT: ${process.env.PORT}`)
  process.exit(1)
}

const BODY_SIZE_LIMIT_BYTES = 1024 * 256
const ROOM_AGE_LIMIT_MS = 60 * 60 * 1000
const PRESENCE_AGE_LIMIT_MS = 2 * 60 * 1000
const CLEANUP_ROOMS_INTERVAL_MS = 5 * 60 * 1000
const CLEANUP_PRESENCE_INTERVAL_MS = 60 * 1000
const ROOM_MESSAGES_COUNT_LIMIT = 100
const SIGNAL_QUEUE_MESSAGES_COUNT_LIMIT = 50

const SIGNAL_TYPES = new Set(['offer', 'answer', 'ice-candidate'])

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const

// ============= Types =============

type SignalType = 'offer' | 'answer' | 'ice-candidate'

interface SignalingMessage {
  id: number
  type: SignalType
  source: string
  target: string
  payload: unknown
  room: string
  timestampMs: number
}

interface Room {
  peers: Set<string>
  messages: SignalingMessage[]
  activityTimestampMs: number
}

interface PresenceEntry {
  publicKey: string
  timestampMs: number
}

interface RouteContext {
  request: IncomingMessage
  response: ServerResponse
  url: URL
  path: string
  method: string
}

// ============= State =============

const rooms = new Map<string, Room>()
let messageIdNext = 0
const presence = new Map<string, Map<string, PresenceEntry>>()
const signalQueues = new Map<string, SignalingMessage[]>()

// ============= Helpers =============

function parseBodyData(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    let sizeBytes = 0

    request.on('data', (chunk: Buffer | string) => {
      sizeBytes += typeof chunk === 'string' ? chunk.length : chunk.byteLength
      if (sizeBytes > BODY_SIZE_LIMIT_BYTES) {
        reject(new Error(`Body exceeds ${BODY_SIZE_LIMIT_BYTES} bytes`))
        request.destroy()
        return
      }
      body += chunk
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

function parseJsonObject(raw: string): Record<string, unknown> {
  if (!raw) return {}

  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Body must be a JSON object')
  }
  return parsed as Record<string, unknown>
}

async function parseBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const raw = await parseBodyData(request)
  return parseJsonObject(raw)
}

function isSignalType(value: unknown): value is SignalType {
  return typeof value === 'string' && SIGNAL_TYPES.has(value)
}

function sendJson(response: ServerResponse, data: object, statusCode = 200): void {
  response.writeHead(statusCode, { 'Content-Type': 'application/json', ...CORS_HEADERS })
  response.end(JSON.stringify(data))
}

function sendError(response: ServerResponse, message: string, statusCode: number): void {
  sendJson(response, { error: message }, statusCode)
}

function truncateId(value: string): string {
  return `${value.substring(0, 8)}...`
}

function getOrCreateRoom(roomId: string): Room {
  const existing = rooms.get(roomId)
  if (existing) {
    existing.activityTimestampMs = Date.now()
    return existing
  }
  const room: Room = { peers: new Set(), messages: [], activityTimestampMs: Date.now() }
  rooms.set(roomId, room)
  return room
}

function requireDb(response: ServerResponse): boolean {
  if (db) return true
  sendError(response, 'Database not configured', 503)
  return false
}

// ============= Cleanup =============

function cleanupRooms(): void {
  const nowMs = Date.now()
  for (const [roomId, room] of rooms) {
    if (nowMs - room.activityTimestampMs <= ROOM_AGE_LIMIT_MS) continue
    rooms.delete(roomId)
    console.log(`[Cleanup] Removed stale room: ${truncateId(roomId)}`)
  }
}

function cleanupPresence(): void {
  const nowMs = Date.now()
  for (const [familyId, deviceMap] of presence) {
    for (const [deviceId, entry] of deviceMap) {
      if (nowMs - entry.timestampMs <= PRESENCE_AGE_LIMIT_MS) continue
      deviceMap.delete(deviceId)
      console.log(`[Cleanup] Removed stale presence: ${truncateId(deviceId)} from ${truncateId(familyId)}`)
    }
    if (deviceMap.size === 0) presence.delete(familyId)
  }
}

setInterval(cleanupRooms, CLEANUP_ROOMS_INTERVAL_MS)
setInterval(cleanupPresence, CLEANUP_PRESENCE_INTERVAL_MS)

// ============= Route Handlers =============

function handleHealthCheck(context: RouteContext): void {
  let peerCountTotal = 0
  for (const room of rooms.values()) {
    peerCountTotal += room.peers.size
  }
  sendJson(context.response, {
    status: 'ok',
    roomCount: rooms.size,
    peerCountTotal,
    databaseConnected: db !== null,
  })
}

async function handleRoomJoin(context: RouteContext, roomId: string): Promise<void> {
  const body = await parseBody(context.request)
  const peerId = body.peerId

  if (typeof peerId !== 'string' || peerId.length === 0) {
    sendError(context.response, 'peerId required (string)', 400)
    return
  }

  const room = getOrCreateRoom(roomId)
  const peersExisting: string[] = []
  for (const peer of room.peers) {
    if (peer !== peerId) peersExisting.push(peer)
  }
  room.peers.add(peerId)

  console.log(`[Room] Peer ${truncateId(peerId)} joined ${truncateId(roomId)} (${room.peers.size} peers)`)
  sendJson(context.response, { peers: peersExisting })
}

async function handleRoomLeave(context: RouteContext, roomId: string): Promise<void> {
  const body = await parseBody(context.request)
  const peerId = body.peerId

  if (typeof peerId !== 'string' || peerId.length === 0) {
    sendError(context.response, 'peerId required (string)', 400)
    return
  }

  const room = rooms.get(roomId)
  if (room) {
    room.peers.delete(peerId)
    console.log(`[Room] Peer ${truncateId(peerId)} left ${truncateId(roomId)} (${room.peers.size} peers)`)
    if (room.peers.size === 0) rooms.delete(roomId)
  }

  sendJson(context.response, { success: true })
}

function handleRoomMessages(context: RouteContext, roomId: string): void {
  const peerId = context.url.searchParams.get('peerId')
  const afterIdRaw = context.url.searchParams.get('after') || '0'
  const afterId = parseInt(afterIdRaw, 10)

  if (isNaN(afterId)) {
    sendError(context.response, 'after must be a number', 400)
    return
  }

  const room = rooms.get(roomId)
  if (!room) {
    sendJson(context.response, { messages: [] })
    return
  }

  const messages = room.messages.filter(
    message => message.target === peerId && message.id > afterId,
  )
  sendJson(context.response, { messages })
}

async function handleSignalLegacy(context: RouteContext): Promise<void> {
  const body = await parseBody(context.request)
  const { room: roomId, from: source, to: target } = body

  if (typeof roomId !== 'string' || typeof source !== 'string' || typeof target !== 'string') {
    sendError(context.response, 'room, type, from, to required (strings)', 400)
    return
  }
  if (!isSignalType(body.type)) {
    sendError(context.response, 'type must be offer, answer, or ice-candidate', 400)
    return
  }

  const room = getOrCreateRoom(roomId)
  const message: SignalingMessage = {
    id: ++messageIdNext, type: body.type, source, target,
    payload: body.payload, room: roomId, timestampMs: Date.now(),
  }
  room.messages.push(message)

  if (room.messages.length > ROOM_MESSAGES_COUNT_LIMIT) {
    room.messages = room.messages.slice(-ROOM_MESSAGES_COUNT_LIMIT)
  }

  console.log(`[Signal] ${body.type} from ${truncateId(source)} to ${truncateId(target)}`)
  sendJson(context.response, { success: true, messageId: message.id })
}

async function handlePresenceHeartbeat(
  context: RouteContext, familyId: string, deviceId: string,
): Promise<void> {
  const body = await parseBody(context.request)
  const publicKey = typeof body.publicKey === 'string' ? body.publicKey : ''
  const deviceName = typeof body.deviceName === 'string' ? body.deviceName : 'Unknown Device'

  if (!presence.has(familyId)) presence.set(familyId, new Map())
  presence.get(familyId)!.set(deviceId, { publicKey, timestampMs: Date.now() })

  if (!db) {
    console.log(`[Presence] Heartbeat from ${truncateId(deviceId)} in ${truncateId(familyId)}`)
    sendJson(context.response, { success: true })
    return
  }

  try {
    await db.insert(devices).values({
      id: deviceId, familyId, deviceName, publicKey: publicKey || null, lastSeenAt: new Date(),
    }).onConflictDoUpdate({
      target: devices.id,
      set: { lastSeenAt: new Date(), publicKey: publicKey || null, deviceName },
    })
  } catch (error) {
    console.error(`[Presence] DB upsert failed for ${truncateId(deviceId)}:`, error)
  }

  console.log(`[Presence] Heartbeat from ${truncateId(deviceId)} in ${truncateId(familyId)}`)
  sendJson(context.response, { success: true })
}

function handlePresenceRemove(
  context: RouteContext, familyId: string, deviceId: string,
): void {
  const familyPresence = presence.get(familyId)
  if (familyPresence) {
    familyPresence.delete(deviceId)
    if (familyPresence.size === 0) presence.delete(familyId)
  }

  console.log(`[Presence] Removed ${truncateId(deviceId)} from ${truncateId(familyId)}`)
  sendJson(context.response, { success: true })
}

function handlePresenceList(context: RouteContext, familyId: string): void {
  const familyPresence = presence.get(familyId)
  if (!familyPresence) {
    sendJson(context.response, { peers: [] })
    return
  }

  const peers: Array<{ deviceId: string; publicKey: string; timestampMs: number }> = []
  for (const [deviceId, entry] of familyPresence) {
    peers.push({ deviceId, publicKey: entry.publicKey, timestampMs: entry.timestampMs })
  }
  sendJson(context.response, { peers })
}

async function handleFamilyRegister(context: RouteContext): Promise<void> {
  const body = await parseBody(context.request)

  if (typeof body.id !== 'string' || body.id.length === 0) {
    sendError(context.response, 'id required (string)', 400)
    return
  }
  if (typeof body.publicKey !== 'string' || body.publicKey.length === 0) {
    sendError(context.response, 'publicKey required (string)', 400)
    return
  }
  if (!requireDb(context.response)) return

  try {
    await db!.insert(families)
      .values({ id: body.id, publicKey: body.publicKey })
      .onConflictDoUpdate({ target: families.id, set: { publicKey: body.publicKey } })

    console.log(`[Family] Registered/updated ${truncateId(body.id)}`)
    sendJson(context.response, { success: true, familyId: body.id })
  } catch (error) {
    console.error(`[Family] DB insert failed for ${truncateId(body.id)}:`, error)
    sendError(context.response, 'Database operation failed', 500)
  }
}

async function handleFamilyDevices(context: RouteContext, familyId: string): Promise<void> {
  if (!requireDb(context.response)) return

  try {
    const deviceList = await db!.select().from(devices).where(eq(devices.familyId, familyId))
    sendJson(context.response, { devices: deviceList })
  } catch (error) {
    console.error(`[Family] DB query failed for devices in ${truncateId(familyId)}:`, error)
    sendError(context.response, 'Database operation failed', 500)
  }
}

async function handleSyncStore(context: RouteContext, familyId: string): Promise<void> {
  const body = await parseBody(context.request)

  if (typeof body.deviceId !== 'string' || body.deviceId.length === 0) {
    sendError(context.response, 'deviceId required (string)', 400)
    return
  }
  if (typeof body.eventType !== 'string' || body.eventType.length === 0) {
    sendError(context.response, 'eventType required (string)', 400)
    return
  }
  if (body.payload === undefined || body.payload === null) {
    sendError(context.response, 'payload required', 400)
    return
  }
  if (!requireDb(context.response)) return

  try {
    const result = await db!.insert(syncEvents)
      .values({ familyId, deviceId: body.deviceId, eventType: body.eventType, payload: body.payload })
      .returning({ id: syncEvents.id })

    if (result.length === 0) {
      sendError(context.response, 'Failed to store sync event', 500)
      return
    }
    console.log(`[Sync] Stored ${body.eventType} from ${truncateId(body.deviceId)} in ${truncateId(familyId)}`)
    sendJson(context.response, { success: true, eventId: result[0].id })
  } catch (error) {
    console.error(`[Sync] DB insert failed in ${truncateId(familyId)}:`, error)
    sendError(context.response, 'Database operation failed', 500)
  }
}

async function handleSyncFetch(context: RouteContext, familyId: string): Promise<void> {
  if (!requireDb(context.response)) return

  const afterParam = context.url.searchParams.get('after')
  const afterDate = afterParam ? new Date(afterParam) : new Date(0)

  if (isNaN(afterDate.getTime())) {
    sendError(context.response, 'Invalid after timestamp', 400)
    return
  }

  try {
    const events = await db!.select().from(syncEvents)
      .where(and(eq(syncEvents.familyId, familyId), gt(syncEvents.createdAt, afterDate)))
    sendJson(context.response, { events })
  } catch (error) {
    console.error(`[Sync] DB query failed in ${truncateId(familyId)}:`, error)
    sendError(context.response, 'Database operation failed', 500)
  }
}

async function handleSignalSend(
  context: RouteContext, topic: string, peerId: string,
): Promise<void> {
  const body = await parseBody(context.request)

  if (!isSignalType(body.type)) {
    sendError(context.response, 'type must be offer, answer, or ice-candidate', 400)
    return
  }
  if (typeof body.from !== 'string' || body.from.length === 0) {
    sendError(context.response, 'from required (string)', 400)
    return
  }

  const queueKey = `${topic}:${peerId}`
  if (!signalQueues.has(queueKey)) signalQueues.set(queueKey, [])

  const message: SignalingMessage = {
    id: ++messageIdNext, type: body.type, source: body.from, target: peerId,
    payload: body.payload, room: topic, timestampMs: Date.now(),
  }
  signalQueues.get(queueKey)!.push(message)

  const queue = signalQueues.get(queueKey)!
  if (queue.length > SIGNAL_QUEUE_MESSAGES_COUNT_LIMIT) {
    signalQueues.set(queueKey, queue.slice(-SIGNAL_QUEUE_MESSAGES_COUNT_LIMIT))
  }

  console.log(`[Signal] ${body.type} from ${truncateId(body.from)} to ${truncateId(peerId)}`)
  sendJson(context.response, { success: true })
}

function handleSignalPoll(context: RouteContext, topic: string, peerId: string): void {
  const queueKey = `${topic}:${peerId}`
  const messages = signalQueues.get(queueKey) || []
  signalQueues.delete(queueKey)
  sendJson(context.response, { messages })
}

// ============= Router =============

const ROUTE_ROOM_JOIN = /^\/room\/([^/]+)\/join$/
const ROUTE_ROOM_LEAVE = /^\/room\/([^/]+)\/leave$/
const ROUTE_ROOM_MESSAGES = /^\/room\/([^/]+)\/messages$/
const ROUTE_PRESENCE_DEVICE = /^\/presence\/([^/]+)\/([^/]+)$/
const ROUTE_PRESENCE_LIST = /^\/presence\/([^/]+)$/
const ROUTE_FAMILY_DEVICES = /^\/family\/([^/]+)\/devices$/
const ROUTE_SYNC = /^\/sync\/([^/]+)$/
const ROUTE_SIGNAL_QUEUE = /^\/signal\/([^/]+)\/([^/]+)$/

async function routeStaticPaths(context: RouteContext): Promise<boolean> {
  if (context.path === '/health' && context.method === 'GET') {
    handleHealthCheck(context)
    return true
  }
  if (context.path === '/family' && context.method === 'POST') {
    await handleFamilyRegister(context)
    return true
  }
  if (context.path === '/signal' && context.method === 'POST') {
    await handleSignalLegacy(context)
    return true
  }
  return false
}

async function routeRoomPaths(context: RouteContext): Promise<boolean> {
  let match = context.path.match(ROUTE_ROOM_JOIN)
  if (match && context.method === 'POST') {
    await handleRoomJoin(context, decodeURIComponent(match[1]))
    return true
  }

  match = context.path.match(ROUTE_ROOM_LEAVE)
  if (match && context.method === 'POST') {
    await handleRoomLeave(context, decodeURIComponent(match[1]))
    return true
  }

  match = context.path.match(ROUTE_ROOM_MESSAGES)
  if (match && context.method === 'GET') {
    handleRoomMessages(context, decodeURIComponent(match[1]))
    return true
  }
  return false
}

async function routePresencePaths(context: RouteContext): Promise<boolean> {
  const deviceMatch = context.path.match(ROUTE_PRESENCE_DEVICE)
  if (deviceMatch && context.method === 'POST') {
    await handlePresenceHeartbeat(context, decodeURIComponent(deviceMatch[1]), decodeURIComponent(deviceMatch[2]))
    return true
  }
  if (deviceMatch && context.method === 'DELETE') {
    handlePresenceRemove(context, decodeURIComponent(deviceMatch[1]), decodeURIComponent(deviceMatch[2]))
    return true
  }

  const listMatch = context.path.match(ROUTE_PRESENCE_LIST)
  if (listMatch && context.method === 'GET') {
    handlePresenceList(context, decodeURIComponent(listMatch[1]))
    return true
  }
  return false
}

async function routeDataPaths(context: RouteContext): Promise<boolean> {
  const familyMatch = context.path.match(ROUTE_FAMILY_DEVICES)
  if (familyMatch && context.method === 'GET') {
    await handleFamilyDevices(context, decodeURIComponent(familyMatch[1]))
    return true
  }

  const syncMatch = context.path.match(ROUTE_SYNC)
  if (syncMatch && context.method === 'POST') {
    await handleSyncStore(context, decodeURIComponent(syncMatch[1]))
    return true
  }
  if (syncMatch && context.method === 'GET') {
    await handleSyncFetch(context, decodeURIComponent(syncMatch[1]))
    return true
  }

  const signalMatch = context.path.match(ROUTE_SIGNAL_QUEUE)
  if (signalMatch && context.method === 'POST') {
    await handleSignalSend(context, decodeURIComponent(signalMatch[1]), decodeURIComponent(signalMatch[2]))
    return true
  }
  if (signalMatch && context.method === 'GET') {
    handleSignalPoll(context, decodeURIComponent(signalMatch[1]), decodeURIComponent(signalMatch[2]))
    return true
  }
  return false
}

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url || '/', `http://localhost:${PORT}`)
  const context: RouteContext = {
    request, response, url, path: url.pathname, method: request.method || 'GET',
  }

  if (context.method === 'OPTIONS') {
    response.writeHead(204, CORS_HEADERS)
    response.end()
    return
  }

  try {
    const handled = await routeStaticPaths(context)
      || await routeRoomPaths(context)
      || await routePresencePaths(context)
      || await routeDataPaths(context)

    if (!handled) sendError(response, 'Not found', 404)
  } catch (error) {
    const isBodyError = error instanceof Error && error.message.includes('Body')
    const statusCode = isBodyError ? 400 : 500
    const label = isBodyError ? 'Bad request' : 'Internal server error'
    console.error(`[Server] ${context.method} ${context.path} failed:`, error)
    sendError(response, `${label}: ${error instanceof Error ? error.message : 'unknown'}`, statusCode)
  }
}

// ============= Server Setup =============

const server = createServer(handleRequest)

server.on('error', (error: Error) => {
  console.error(`[Server] Fatal server error:`, error)
  process.exit(1)
})

server.listen(PORT, () => {
  console.log(`Homeschool Sync Signaling Server running on port ${PORT}`)
  console.log(`Database: ${db ? 'connected' : 'not configured (DATABASE_URL missing)'}`)
  console.log(``)
  console.log(`Endpoints:`)
  console.log(`  GET  /health                          - Health check`)
  console.log(`  POST /family                          - Register/upsert family`)
  console.log(`  GET  /family/{familyId}/devices        - List devices`)
  console.log(`  POST /sync/{familyId}                 - Store sync event`)
  console.log(`  GET  /sync/{familyId}?after=<ts>      - Catch-up sync`)
  console.log(`  POST /presence/{familyId}/{deviceId}  - Heartbeat`)
  console.log(`  DELETE /presence/{familyId}/{deviceId} - Remove presence`)
  console.log(`  GET  /presence/{familyId}             - Online peers`)
  console.log(`  POST /signal/{topic}/{peerId}         - Send signal`)
  console.log(`  GET  /signal/{topic}/{peerId}         - Poll signals`)
  console.log(`  POST /room/{roomId}/join              - Join room`)
  console.log(`  POST /room/{roomId}/leave             - Leave room`)
  console.log(`  GET  /room/{roomId}/messages           - Room messages`)
  console.log(`  POST /signal                          - Legacy signal`)
})

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down...')
  server.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down...')
  server.close()
  process.exit(0)
})
