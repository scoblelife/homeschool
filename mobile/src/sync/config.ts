/**
 * Sync Configuration
 *
 * WebRTC transport settings for P2P sync
 */

import { Platform } from 'react-native'

/**
 * Get the base URL for the legacy signaling server (will be removed)
 * - For iOS Simulator: localhost works (same machine)
 * - For Android Emulator: use 10.0.2.2 (special alias for host machine)
 * - For real devices: use machine's IP or deploy to cloud
 */
const getDefaultServerUrl = (): string => {
  if (Platform.OS === 'android') {
    return '10.0.2.2'
  }
  return 'localhost'
}

const SERVER_HOST = process.env.EXPO_PUBLIC_SERVER_HOST || getDefaultServerUrl()
const SERVER_PORT = process.env.EXPO_PUBLIC_SERVER_PORT || '8080'

// Fly.io signaling server URL
// This handles only device discovery and WebRTC connection setup
// All actual sync data flows P2P via WebRTC
export const SIGNALING_SERVER_URL =
  process.env.EXPO_PUBLIC_SIGNALING_URL || 'https://homeschool-signaling.fly.dev'

// Legacy alias (will be removed)
export const WORKER_URL = SIGNALING_SERVER_URL

// Legacy signaling server (will be removed)
export const SIGNALING_URL = `http://${SERVER_HOST}:${SERVER_PORT}`

// ICE servers for NAT traversal
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

// Presence heartbeat interval (30 seconds)
export const PRESENCE_INTERVAL = 30000

// Signal polling interval during connection (1 second)
export const SIGNAL_POLL_INTERVAL = 1000

// Check if WebRTC is available
let isWebRTCAvailable = false
try {
  const { RTCPeerConnection } = require('react-native-webrtc')
  isWebRTCAvailable = !!RTCPeerConnection
} catch (e) {
  isWebRTCAvailable = false
}

// WebRTC is the primary transport for P2P sync
export const USE_WEBRTC = true
export const WEBRTC_AVAILABLE = isWebRTCAvailable

console.log(`[Sync Config] Signaling Server: ${SIGNALING_SERVER_URL}`)
console.log(`[Sync Config] Legacy Server: ${SERVER_HOST}:${SERVER_PORT}`)
console.log(`[Sync Config] WebRTC available: ${isWebRTCAvailable}`)
console.log(`[Sync Config] Using: WebRTC P2P`)
