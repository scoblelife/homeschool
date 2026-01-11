/**
 * Sync Configuration
 *
 * WebRTC transport settings for P2P sync
 */

// RTCIceServer type for Node.js context
export interface RTCIceServer {
  urls: string | string[]
  username?: string
  credential?: string
}

// Cloudflare Worker URL for signaling
// Deploy your own or use the default (when deployed)
export const WORKER_URL =
  process.env.HOMESCHOOL_WORKER_URL || 'https://homeschool-sync.scott4717.workers.dev'

// Legacy signaling server (will be removed)
export const SIGNALING_URL = process.env.HOMESCHOOL_SIGNALING_URL || 'http://localhost:8080'

// ICE servers for NAT traversal
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

// Presence heartbeat interval (30 seconds)
export const PRESENCE_INTERVAL = 30000

// Signal polling interval during connection (1 second)
export const SIGNAL_POLL_INTERVAL = 1000

// mDNS service type for local discovery
export const MDNS_SERVICE_TYPE = 'homeschool-sync'
