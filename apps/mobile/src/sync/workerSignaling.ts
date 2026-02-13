/**
 * Worker Signaling Provider
 *
 * Implements the SignalingProvider interface using the Cloudflare Worker
 * SignalingClient for WebRTC signaling.
 */

import { SignalingClient, type SignalingMessage } from "./signalingClient";
import { PRESENCE_INTERVAL, SIGNAL_POLL_INTERVAL } from "./config";
import type {
  SignalingProvider,
  SignalingMessage as WebRTCSignalingMessage,
} from "./webrtc";

export interface WorkerSignalingOptions {
  pubKey: string;
  workerUrl?: string;
}

/**
 * Signaling provider that uses Cloudflare Worker for presence and signaling
 */
export class WorkerSignalingProvider implements SignalingProvider {
  private client: SignalingClient;
  private pubKey: string;
  private currentRoom: string | null = null;
  private localId: string | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private messageCallback: ((message: WebRTCSignalingMessage) => void) | null =
    null;
  private heartbeatFailureLogged = false;

  constructor(options: WorkerSignalingOptions) {
    this.pubKey = options.pubKey;
    this.client = new SignalingClient(options.workerUrl);
  }

  /**
   * Send a signaling message to a peer
   */
  async send(message: WebRTCSignalingMessage): Promise<void> {
    if (!this.currentRoom) {
      throw new Error("Not joined to a room");
    }

    await this.client.sendSignal(
      this.currentRoom,
      message.to,
      message as SignalingMessage,
    );
  }

  /**
   * Subscribe to signaling messages for this peer
   */
  subscribe(
    localId: string,
    onMessage: (message: WebRTCSignalingMessage) => void,
  ): () => void {
    this.localId = localId;
    this.messageCallback = onMessage;

    // Start polling for messages (polling will only happen after joinRoom is called)
    // The actual polling loop is started in joinRoom

    return () => {
      this.messageCallback = null;
    };
  }

  /**
   * Join a room for peer discovery
   * Returns list of existing peer IDs
   */
  async joinRoom(roomId: string, localId: string): Promise<string[]> {
    this.currentRoom = roomId;
    this.localId = localId;

    console.log("[WorkerSignaling] Joining room:", roomId);

    // Send initial heartbeat
    try {
      await this.client.heartbeat(roomId, localId, this.pubKey);
      console.log("[WorkerSignaling] Sent initial heartbeat");
    } catch (err) {
      console.error("[WorkerSignaling] Failed to send initial heartbeat:", err);
    }

    // Get online peers
    let peerIds: string[] = [];
    try {
      const peers = await this.client.getOnlinePeers(roomId);
      peerIds = peers
        .filter((p) => p.deviceId !== localId)
        .map((p) => p.deviceId);
      console.log("[WorkerSignaling] Online peers:", peerIds.length);
    } catch (err) {
      console.error("[WorkerSignaling] Failed to get online peers:", err);
    }

    // Start polling for signals
    this.startPolling();

    // Start heartbeat interval
    this.heartbeatInterval = setInterval(async () => {
      if (this.currentRoom && this.localId) {
        try {
          await this.client.heartbeat(
            this.currentRoom,
            this.localId,
            this.pubKey,
          );
          this.heartbeatFailureLogged = false;
        } catch (err) {
          if (!this.heartbeatFailureLogged) {
            console.warn(
              "[WorkerSignaling] Heartbeat failed (suppressing further):",
              err,
            );
            this.heartbeatFailureLogged = true;
          }
        }
      }
    }, PRESENCE_INTERVAL);

    return peerIds;
  }

  /**
   * Leave the current room
   */
  async leaveRoom(roomId: string): Promise<void> {
    console.log("[WorkerSignaling] Leaving room:", roomId);

    // Stop polling and heartbeat
    this.stopPolling();

    // Remove presence
    if (this.localId) {
      try {
        await this.client.removePresence(roomId, this.localId);
      } catch (err) {
        console.error("[WorkerSignaling] Failed to remove presence:", err);
      }
    }

    this.currentRoom = null;
  }

  /**
   * Start polling for signaling messages
   */
  private startPolling(): void {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(async () => {
      if (!this.currentRoom || !this.localId || !this.messageCallback) return;

      try {
        const messages = await this.client.pollSignals(
          this.currentRoom,
          this.localId,
        );
        for (const message of messages) {
          this.messageCallback(message as WebRTCSignalingMessage);
        }
      } catch {
        // Ignore poll errors silently
      }
    }, SIGNAL_POLL_INTERVAL);
  }

  /**
   * Stop polling and heartbeat
   */
  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Destroy the provider and clean up resources
   */
  destroy(): void {
    this.stopPolling();
    this.messageCallback = null;
    this.currentRoom = null;
    this.localId = null;
  }
}
