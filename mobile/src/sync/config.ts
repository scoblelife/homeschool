/**
 * Sync Configuration
 */

// Relay server URL - use environment variable or default
// For local development on simulator, use the machine's IP
// For production, set via EXPO_PUBLIC_RELAY_URL
// Note: localhost won't work from simulator - need actual IP or ngrok tunnel
export const RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL || 'ws://localhost:8080'

// Use WebSocket transport by default (native Hyperswarm is disabled)
export const USE_WEBSOCKET = true
