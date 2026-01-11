/**
 * Homeschool Sync Cloudflare Worker
 *
 * Minimal signaling server for WebRTC peer discovery.
 * Data transfer happens peer-to-peer via WebRTC data channels.
 */

interface Env {
  KV: KVNamespace
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
      // Health check
      if (path === '/health' && method === 'GET') {
        return json({ status: 'ok', timestamp: Date.now() })
      }

      // ============= Join Offers (TTL 48h) =============
      // Store a join offer for a one-time topic
      const offerMatch = path.match(/^\/offer\/([^/]+)$/)
      if (offerMatch) {
        const topic = decodeURIComponent(offerMatch[1])

        if (method === 'POST') {
          const body = await request.text()
          await env.KV.put(`offer:${topic}`, body, { expirationTtl: 172800 }) // 48 hours
          console.log(`[Offer] Stored for topic: ${topic.substring(0, 8)}...`)
          return json({ ok: true })
        }

        if (method === 'GET') {
          const offer = await env.KV.get(`offer:${topic}`)
          if (offer) {
            // One-time use: delete after retrieval
            await env.KV.delete(`offer:${topic}`)
            console.log(`[Offer] Retrieved and deleted for topic: ${topic.substring(0, 8)}...`)
          }
          return json({ offer: offer ? JSON.parse(offer) : null })
        }
      }

      // ============= Answers (TTL 5min) =============
      // Store answer back to joiner
      const answerMatch = path.match(/^\/answer\/([^/]+)$/)
      if (answerMatch) {
        const topic = decodeURIComponent(answerMatch[1])

        if (method === 'POST') {
          const body = await request.text()
          await env.KV.put(`answer:${topic}`, body, { expirationTtl: 300 }) // 5 minutes
          console.log(`[Answer] Stored for topic: ${topic.substring(0, 8)}...`)
          return json({ ok: true })
        }

        if (method === 'GET') {
          const answer = await env.KV.get(`answer:${topic}`)
          if (answer) {
            await env.KV.delete(`answer:${topic}`)
            console.log(`[Answer] Retrieved and deleted for topic: ${topic.substring(0, 8)}...`)
          }
          return json({ answer: answer ? JSON.parse(answer) : null })
        }
      }

      // ============= Presence Heartbeat (TTL 60s) =============
      // Register device presence for a family
      const presenceMatch = path.match(/^\/presence\/([^/]+)\/([^/]+)$/)
      if (presenceMatch) {
        const familyId = decodeURIComponent(presenceMatch[1])
        const deviceId = decodeURIComponent(presenceMatch[2])

        if (method === 'POST') {
          const body = (await request.json()) as { pubKey: string }
          await env.KV.put(
            `presence:${familyId}:${deviceId}`,
            JSON.stringify({ pubKey: body.pubKey, ts: Date.now() }),
            { expirationTtl: 60 }
          )
          return json({ ok: true })
        }

        if (method === 'DELETE') {
          await env.KV.delete(`presence:${familyId}:${deviceId}`)
          return json({ ok: true })
        }
      }

      // ============= Get Online Peers =============
      // List all online devices for a family
      const onlineMatch = path.match(/^\/presence\/([^/]+)$/)
      if (onlineMatch && method === 'GET') {
        const familyId = decodeURIComponent(onlineMatch[1])
        const list = await env.KV.list({ prefix: `presence:${familyId}:` })

        const peers = await Promise.all(
          list.keys.map(async (k) => {
            const data = await env.KV.get(k.name)
            // Extract deviceId from key: "presence:familyId:deviceId"
            const parts = k.name.split(':')
            const deviceId = parts.slice(2).join(':') // Handle deviceIds with colons
            if (data) {
              const parsed = JSON.parse(data)
              return { deviceId, pubKey: parsed.pubKey, ts: parsed.ts }
            }
            return null
          })
        )

        return json({ peers: peers.filter(Boolean) })
      }

      // ============= Signaling Messages (TTL 5min) =============
      // Generic signaling for WebRTC SDP/ICE exchange
      const sigMatch = path.match(/^\/signal\/([^/]+)\/([^/]+)$/)
      if (sigMatch) {
        const topic = decodeURIComponent(sigMatch[1])
        const peerId = decodeURIComponent(sigMatch[2])

        if (method === 'POST') {
          const body = await request.text()
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
          await env.KV.put(`sig:${topic}:${peerId}:${id}`, body, { expirationTtl: 300 })
          return json({ ok: true, id })
        }

        if (method === 'GET') {
          const list = await env.KV.list({ prefix: `sig:${topic}:${peerId}:` })
          const messages = await Promise.all(
            list.keys.map(async (k) => {
              const msg = await env.KV.get(k.name)
              // One-time read: delete after retrieval
              await env.KV.delete(k.name)
              return msg ? JSON.parse(msg) : null
            })
          )
          return json({ messages: messages.filter(Boolean) })
        }
      }

      // 404 for unknown routes
      return json({ error: 'Not found' }, 404)
    } catch (error) {
      console.error('Worker error:', error)
      return json({ error: 'Internal error' }, 500)
    }
  },
}
