/**
 * Sync Module - P2P Family Database Sync with Event Sourcing
 *
 * Enables families to sync their homeschool database across devices
 * without a central server using:
 * - Event Sourcing: All changes are immutable events
 * - WebRTC: Direct peer-to-peer connections
 * - Cloudflare Worker: Lightweight signaling service
 * - mDNS: Local network discovery
 * - QR Code Pairing: Easy device linking
 */

// Event system
export * from './events'
export * from './hlc'
export * from './eventLog'
export * from './projector'

// Family management
export * from './family'

// Crypto
export * from './crypto'

// Signaling
export * from './signalingClient'

// Configuration
export * from './config'
