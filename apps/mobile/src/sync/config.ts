/**
 * Sync Configuration
 *
 * WebRTC transport settings for P2P sync
 */

import { Platform } from "react-native";

/**
 * Get the base URL for the legacy signaling server (will be removed)
 * - For iOS Simulator: localhost works (same machine)
 * - For Android Emulator: use 10.0.2.2 (special alias for host machine)
 * - For real devices: use machine's IP or deploy to cloud
 */
const getDefaultServerUrl = (): string => {
  if (Platform.OS === "android") {
    return "10.0.2.2";
  }
  return "localhost";
};

const SERVER_HOST =
  process.env.EXPO_PUBLIC_SERVER_HOST || getDefaultServerUrl();
const SERVER_PORT = process.env.EXPO_PUBLIC_SERVER_PORT || "8080";

// Signaling server URL
// For local development: http://localhost:8080 (iOS) or http://10.0.2.2:8080 (Android)
// For production: https://homeschool-signaling.fly.dev
const getSignalingUrl = (): string => {
  if (process.env.EXPO_PUBLIC_SIGNALING_URL) {
    return process.env.EXPO_PUBLIC_SIGNALING_URL;
  }
  // Use local server for development
  return `http://${SERVER_HOST}:${SERVER_PORT}`;
};

export const SIGNALING_SERVER_URL = getSignalingUrl();

// Alias for signaling server
export const WORKER_URL = SIGNALING_SERVER_URL;

// Legacy signaling server URL (same as above)
export const SIGNALING_URL = SIGNALING_SERVER_URL;

// ICE servers for NAT traversal
export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

// Presence heartbeat interval (30 seconds)
export const PRESENCE_INTERVAL = 30000;

// Signal polling interval during connection (1 second)
export const SIGNAL_POLL_INTERVAL = 1000;

// WebRTC is the primary transport for P2P sync
// Actual availability is determined at runtime in webrtc.ts
export const USE_WEBRTC = true;

console.log(`[Sync Config] Signaling Server: ${SIGNALING_SERVER_URL}`);
console.log(
  `[Sync Config] Using: WebRTC P2P (availability checked at runtime)`,
);
