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

// Fly.io signaling server URL
// This handles only device discovery and WebRTC connection setup
// All actual sync data flows P2P via WebRTC
export const SIGNALING_SERVER_URL =
  process.env.HOMESCHOOL_SIGNALING_URL || 'https://homeschool-signaling.fly.dev'

// Legacy alias (will be removed)
export const WORKER_URL = SIGNALING_SERVER_URL

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
