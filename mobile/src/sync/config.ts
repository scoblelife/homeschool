/**
 * Sync Configuration
 */

// Relay server URL - use environment variable or default
// For iOS Simulator: localhost works (same machine)
// For Android Emulator: use 10.0.2.2 (special alias for host machine)
// For real devices: use machine's IP or ngrok tunnel
import { Platform } from 'react-native'

const getDefaultRelayUrl = (): string => {
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to reach host machine
    return 'ws://10.0.2.2:9090'
  }
  // iOS simulator can use localhost
  return 'ws://localhost:9090'
}

export const RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL || getDefaultRelayUrl()

// Use WebSocket transport by default (native Hyperswarm is disabled)
export const USE_WEBSOCKET = true
