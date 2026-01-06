/**
 * Sync Module - P2P Family Database Sync with Event Sourcing
 *
 * Enables families to sync their homeschool database across devices
 * without a central server using:
 * - Event Sourcing: All changes are immutable events
 * - Mesh Protocol: Store-and-forward over WAN (Meshtastic-inspired)
 * - P2P Networking: Hyperswarm for NAT traversal
 * - QR Code Pairing: Easy device linking
 */

// Event system
export * from './events'
export * from './hlc'
export * from './eventLog'
export * from './projector'

// Family management
export * from './family'

// P2P networking
export * from './swarm'

// Mesh protocol
export * from './mesh'
