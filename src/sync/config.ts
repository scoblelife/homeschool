/**
 * Sync Configuration
 *
 * Controls which transport to use for sync (WebSocket relay or Hyperswarm P2P)
 */

// Environment variable to control transport mode
// Set HOMESCHOOL_USE_WEBSOCKET=1 to use WebSocket relay instead of Hyperswarm
export const USE_WEBSOCKET = process.env.HOMESCHOOL_USE_WEBSOCKET === '1'

// Relay server URL for WebSocket transport
export const RELAY_URL = process.env.HOMESCHOOL_RELAY_URL || 'ws://localhost:8080'
