/**
 * Sync Manager - orchestrates sync operations and manages connections
 */

import { SyncEvent, createSyncEvent, EventType, HLCTimestamp } from "./events";
import { HybridLogicalClock } from "./hlc";
import { EventLog } from "./eventLog";
import { FamilyManager, type InvitePayload, type FamilyMember } from "./family";
import { EventProjector } from "./projector";
import {
  Hyperswarm,
  createTopic,
  EventType as SwarmEventType,
} from "./hyperswarm";
import { WorkerSignalingProvider } from "./workerSignaling";
import { getSignalingClient } from "./signalingClient";
import { WORKER_URL } from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HLC_STATE_KEY = "@homeschool/hlc_state";
const SYNC_STATE_KEY = "@homeschool/sync_state";

const JOIN_POLL_INTERVAL_MS = 1000;
const JOIN_POLL_ATTEMPTS_MAX = 120;
const INVITE_POLL_INTERVAL_MS = 2000;
const INVITE_POLL_ATTEMPTS_MAX = 900; // 30 minutes

export interface SyncPeer {
  deviceId: string;
  deviceName: string;
  isOnline: boolean;
  lastSeen: number;
}

export interface SyncStatus {
  enabled: boolean;
  connected: boolean;
  peerCount: number;
  pendingEvents: number;
  lastSyncTime: number | null;
}

type SyncEventHandler = (event: SyncEvent) => void;
type PeerEventHandler = (peer: SyncPeer) => void;
type PeerUpdateHandler = (peers: SyncPeer[]) => void;

export class SyncManager {
  private static instance: SyncManager | null = null;

  private hlc: HybridLogicalClock | null = null;
  private eventLog: EventLog;
  private familyManager: FamilyManager;
  private projector: EventProjector;
  private swarm: Hyperswarm | null = null;

  private peers: Map<string, SyncPeer> = new Map();
  private connected = false;
  private lastSyncTime: number | null = null;
  private currentTopic: string | null = null;

  private eventHandlers: Set<SyncEventHandler> = new Set();
  private peerConnectedHandlers: Set<PeerEventHandler> = new Set();
  private peerDisconnectedHandlers: Set<PeerEventHandler> = new Set();
  private peerUpdateHandlers: Set<PeerUpdateHandler> = new Set();
  private swarmEventCleanup: (() => void) | null = null;

  private initialized = false;
  private invitePollingAbort: AbortController | null = null;

  // Accumulator for chunked sync responses
  private syncChunks: Map<
    string,
    { events: SyncEvent[]; receivedChunks: number; totalChunks: number }
  > = new Map();

  private constructor() {
    this.eventLog = EventLog.getInstance();
    this.familyManager = FamilyManager.getInstance();
    this.projector = EventProjector.getInstance();
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize the sync manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize dependencies
    await this.eventLog.initialize();
    await this.familyManager.initialize();

    // Load or create HLC
    const hlcJson = await AsyncStorage.getItem(HLC_STATE_KEY);
    if (hlcJson) {
      this.hlc = HybridLogicalClock.fromJSON(JSON.parse(hlcJson));
    } else {
      this.hlc = new HybridLogicalClock();
      await this.saveHLCState();
    }

    // Load last sync time
    const syncState = await AsyncStorage.getItem(SYNC_STATE_KEY);
    if (syncState) {
      const state = JSON.parse(syncState);
      this.lastSyncTime = state.lastSyncTime;
    }

    // Process any pending events
    await this.projector.processEvents();

    this.initialized = true;
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      enabled: this.familyManager.isSyncEnabled(),
      connected: this.connected,
      peerCount: this.peers.size,
      pendingEvents: 0,
      lastSyncTime: this.lastSyncTime,
    };
  }

  /**
   * Get list of connected peers
   */
  getPeers(): SyncPeer[] {
    return Array.from(this.peers.values());
  }

  /**
   * Create a new family
   */
  async createFamily(deviceName: string): Promise<void> {
    await this.familyManager.createFamily(deviceName);

    this.hlc = new HybridLogicalClock(
      this.familyManager.getDeviceId() || undefined,
    );
    await this.saveHLCState();
  }

  /**
   * Create invite and start polling for join requests (v2 OAuth flow)
   *
   * Returns the invite payload. Starts a background polling loop
   * that auto-approves incoming join requests via the signaling server.
   */
  async createInvite(): Promise<{
    invite: InvitePayload;
    qrData: string;
  }> {
    const invite = await this.familyManager.createInvite();
    const qrData = this.familyManager.getInviteQRData(invite);

    // Start polling for join requests in background
    this.startInvitePolling(invite);

    return { invite, qrData };
  }

  /**
   * Stop invite polling (e.g., when user closes QR screen)
   */
  stopInvitePolling(): void {
    if (this.invitePollingAbort) {
      this.invitePollingAbort.abort();
      this.invitePollingAbort = null;
    }
  }

  /**
   * Join an existing family via v2 invite QR data (async OAuth flow)
   */
  async joinFamily(
    qrData: string,
    deviceName: string,
    onProgress?: (status: string) => void,
  ): Promise<void> {
    onProgress?.("Parsing invite...");

    const invite = FamilyManager.parseInviteQRData(qrData);
    const validation = this.familyManager.validateInvite(invite);
    if (!validation.valid) {
      throw new Error(`[SyncManager] Invalid invite: ${validation.error}`);
    }

    onProgress?.("Creating join request...");

    const { request, keyPair, deviceId } = this.familyManager.createJoinRequest(
      invite,
      deviceName,
    );

    // Post offer to signaling server
    onProgress?.("Sending join request...");
    const signalingClient = getSignalingClient();

    await signalingClient.postOffer(invite.topic, {
      nonce: request.nonce,
      newPubKey: request.newPubKey,
      newDeviceId: request.newDeviceId,
      newDeviceName: request.newDeviceName,
      offer: request.encryptedOffer,
      iceCandidates: request.encryptedIceCandidates,
    });

    // Poll for answer from inviting device
    onProgress?.("Waiting for approval...");

    let answer = null;
    for (let attempt = 0; attempt < JOIN_POLL_ATTEMPTS_MAX; attempt++) {
      answer = await signalingClient.getAnswer(invite.topic);
      if (answer) break;

      await this.delay(JOIN_POLL_INTERVAL_MS);
    }

    if (!answer) {
      throw new Error(
        "[SyncManager] Join timed out: no response from inviting device",
      );
    }

    // Complete the join
    onProgress?.("Completing join...");

    const joinResponse = {
      approved: true,
      encryptedAnswer: answer.answer,
      encryptedIceCandidates: answer.iceCandidates,
      encryptedFamilyData: answer.familyData,
      trustedPubKey: answer.trustedPubKey,
      trustedDeviceId: answer.trustedDeviceId,
    };

    await this.familyManager.completeJoin(
      invite,
      joinResponse,
      keyPair,
      deviceId,
      deviceName,
    );

    // Reset HLC with new node ID
    this.hlc = new HybridLogicalClock(
      this.familyManager.getDeviceId() || undefined,
    );
    await this.saveHLCState();

    onProgress?.("Joined successfully!");
  }

  /**
   * Leave the current family
   */
  async leaveFamily(): Promise<void> {
    this.stopInvitePolling();
    this.disconnect();
    await this.familyManager.leaveFamily();
    this.peers.clear();
    this.lastSyncTime = null;
  }

  /**
   * Check if this device is the family manager
   */
  isManager(): boolean {
    return this.familyManager.isManager();
  }

  /**
   * Get device name
   */
  getDeviceName(): string | null {
    return this.familyManager.getDeviceName();
  }

  /**
   * Update device name
   */
  async updateDeviceName(name: string): Promise<void> {
    await this.familyManager.updateDeviceName(name);
  }

  /**
   * Emit a sync event for a local change
   */
  async emitEvent<T extends Record<string, unknown>>(
    type: EventType,
    data: T,
  ): Promise<void> {
    if (!this.familyManager.isSyncEnabled() || !this.hlc) {
      return;
    }

    const deviceId = this.familyManager.getDeviceId();
    if (!deviceId) return;

    const timestamp = this.hlc.now();
    const event = createSyncEvent(type, data, deviceId, timestamp);

    await this.eventLog.append(event);
    await this.saveHLCState();

    this.broadcastEvent(event);
    this.notifyEventHandlers(event);
  }

  /**
   * Receive an event from a peer
   */
  async receiveEvent(event: SyncEvent): Promise<void> {
    if (!this.hlc) return;

    if (await this.eventLog.hasEvent(event.id)) {
      return;
    }

    this.hlc.receive(event.timestamp);
    await this.saveHLCState();

    await this.eventLog.append(event);
    await this.projector.applyEvent(event);
    await this.eventLog.markProcessed(event.id);

    this.notifyEventHandlers(event);

    this.lastSyncTime = Date.now();
    await this.saveSyncState();
  }

  /**
   * Connect to sync network
   */
  async connect(): Promise<void> {
    if (!this.familyManager.isSyncEnabled()) {
      console.log("[SyncManager] Sync not enabled");
      return;
    }

    const deviceId = this.familyManager.getDeviceId();
    const familyId = this.familyManager.getFamilyId();

    if (!deviceId || !familyId) {
      console.log("[SyncManager] Missing device or family ID");
      return;
    }

    await this.connectWebRTC(deviceId, familyId);
  }

  /**
   * Connect via P2P network (WebRTC with Cloudflare Worker signaling)
   */
  private async connectWebRTC(
    deviceId: string,
    familyId: string,
  ): Promise<void> {
    console.log("[SyncManager] connectWebRTC called");
    console.log("[SyncManager] deviceId:", deviceId);
    console.log("[SyncManager] familyId:", familyId);
    console.log("[SyncManager] WORKER_URL:", WORKER_URL);

    const pubKey = this.familyManager.getPubKey();
    if (!pubKey) {
      console.error("[SyncManager] No public key available");
      return;
    }

    try {
      console.log("[SyncManager] Creating Hyperswarm instance");
      this.swarm = new Hyperswarm();

      const signaling = new WorkerSignalingProvider({
        pubKey,
        workerUrl: WORKER_URL,
      });

      console.log("[SyncManager] Calling swarm.create()");
      await this.swarm.create({ deviceId, signaling });
      console.log("[SyncManager] swarm.create() completed");

      this.swarmEventCleanup = this.swarm.onAny((event) => {
        this.handleSwarmEvent(event);
      });

      console.log("[SyncManager] Calling swarm.start()");
      await this.swarm.start();
      console.log("[SyncManager] swarm.start() completed");

      this.currentTopic = createTopic(familyId);
      console.log(
        "[SyncManager] Calling swarm.join() with topic:",
        this.currentTopic,
      );
      await this.swarm.join(this.currentTopic);
      console.log("[SyncManager] swarm.join() completed");

      this.connected = true;
      const mode = this.swarm.isSimulationMode()
        ? "(simulation mode)"
        : "(native)";
      console.log(`[SyncManager] Connected to P2P network ${mode}`);
    } catch (error) {
      console.error("[SyncManager] Failed to connect:", error);
      this.connected = false;
    }
  }

  /**
   * Disconnect from sync network
   */
  async disconnect(): Promise<void> {
    if (this.swarmEventCleanup) {
      this.swarmEventCleanup();
      this.swarmEventCleanup = null;
    }

    if (this.swarm) {
      if (this.currentTopic) {
        try {
          await this.swarm.leave(this.currentTopic);
        } catch {
          // Ignore leave errors during disconnect
        }
        this.currentTopic = null;
      }
      await this.swarm.stop();
      this.swarm.destroy();
      this.swarm = null;
    }

    this.connected = false;
    this.peers.clear();
    console.log("[SyncManager] Disconnected from sync network");
  }

  // ============= Invite Polling (Inviting Device) =============

  private startInvitePolling(invite: InvitePayload): void {
    this.stopInvitePolling();
    this.invitePollingAbort = new AbortController();
    const signal = this.invitePollingAbort.signal;

    const poll = async (): Promise<void> => {
      const signalingClient = getSignalingClient();

      for (let attempt = 0; attempt < INVITE_POLL_ATTEMPTS_MAX; attempt++) {
        if (signal.aborted) return;

        try {
          const offer = await signalingClient.getOffer(invite.topic);
          if (!offer) {
            await this.delay(INVITE_POLL_INTERVAL_MS);
            continue;
          }

          // Convert signaling offer to JoinRequest
          const joinRequest = {
            nonce: offer.nonce,
            newPubKey: offer.newPubKey,
            newDeviceId: offer.newDeviceId,
            newDeviceName: offer.newDeviceName,
            encryptedOffer: offer.offer,
            encryptedIceCandidates: offer.iceCandidates,
          };

          // Validate the join request
          const validation = this.familyManager.validateJoinRequest(
            joinRequest,
            invite,
          );

          if (!validation.valid) {
            console.log(
              "[SyncManager] Invalid join request:",
              validation.error,
            );
            continue;
          }

          // Auto-approve: create and post response
          const response = this.familyManager.createJoinResponse(joinRequest);

          await signalingClient.postAnswer(invite.topic, {
            trustedPubKey: response.trustedPubKey,
            trustedDeviceId: response.trustedDeviceId,
            answer: response.encryptedAnswer ?? "",
            iceCandidates: response.encryptedIceCandidates ?? "",
            familyData: response.encryptedFamilyData,
          });

          // Add new member to our family config
          const newMember: FamilyMember = {
            deviceId: offer.newDeviceId,
            deviceName: offer.newDeviceName,
            pubKey: offer.newPubKey,
            addedAt: new Date().toISOString(),
            addedBy: this.familyManager.getDeviceId() ?? "unknown",
            isManager: false,
          };
          await this.familyManager.addMember(newMember);

          console.log("[SyncManager] Approved join for:", offer.newDeviceName);

          // Clean up invite
          this.familyManager.removePendingInvite(invite.topic);
          return;
        } catch (error) {
          console.error("[SyncManager] Invite polling error:", error);
          await this.delay(INVITE_POLL_INTERVAL_MS);
        }
      }

      console.log("[SyncManager] Invite polling timed out");
    };

    poll().catch((error) => {
      if (!signal.aborted) {
        console.error("[SyncManager] Invite polling failed:", error);
      }
    });
  }

  // ============= Swarm Event Handling =============

  private handleSwarmEvent(event: {
    type: SwarmEventType;
    peerId?: string;
    data?: string;
  }): void {
    switch (event.type) {
      case SwarmEventType.Ready:
        console.log("[SyncManager] Swarm ready");
        this.requestSync();
        break;

      case SwarmEventType.PeerConnected:
        if (event.peerId) {
          const peer: SyncPeer = {
            deviceId: event.peerId,
            deviceName: `Device ${event.peerId.substring(0, 8)}`,
            isOnline: true,
            lastSeen: Date.now(),
          };
          this.peers.set(event.peerId, peer);
          this.notifyPeerConnected(peer);
          console.log("[SyncManager] Peer connected:", event.peerId);
          this.sendSyncRequest(event.peerId);
        }
        break;

      case SwarmEventType.PeerDisconnected:
        if (event.peerId) {
          const peer = this.peers.get(event.peerId);
          if (peer) {
            peer.isOnline = false;
            this.peers.delete(event.peerId);
            this.notifyPeerDisconnected(peer);
            console.log("[SyncManager] Peer disconnected:", event.peerId);
          }
        }
        break;

      case SwarmEventType.Data:
        if (event.data && event.peerId) {
          let decodedData = event.data;
          try {
            if (!event.data.startsWith("{")) {
              decodedData = Buffer.from(event.data, "base64").toString("utf-8");
            }
          } catch (e) {
            console.error("[SyncManager] Failed to decode base64 data:", e);
          }
          this.handlePeerData(event.peerId, decodedData);
        }
        break;

      case SwarmEventType.Error:
        console.error("[SyncManager] Swarm error");
        break;
    }
  }

  /**
   * Handle data received from a peer
   */
  private async handlePeerData(peerId: string, data: string): Promise<void> {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case "sync_request":
          await this.handleSyncRequest(peerId, message.afterTimestamp);
          break;

        case "sync_response":
          await this.handleSyncResponse(peerId, message);
          break;

        case "event":
          await this.receiveEvent(message.event);
          break;

        case "device_info": {
          const peer = this.peers.get(peerId);
          if (peer) {
            peer.deviceName = message.deviceName;
            console.log(
              "[SyncManager] Received device_info, peer name updated:",
              peerId,
              message.deviceName,
            );
            this.notifyPeersUpdate();
          }
          break;
        }
      }
    } catch (error) {
      console.error("[SyncManager] Failed to parse peer data:", error);
    }
  }

  /**
   * Send sync request to a specific peer
   */
  private async sendSyncRequest(peerId: string): Promise<void> {
    if (!this.swarm) {
      console.log("[SyncManager] sendSyncRequest: no swarm");
      return;
    }

    try {
      console.log("[SyncManager] sendSyncRequest: sending to peer", peerId);
      const latestTimestamp = await this.eventLog.getLatestTimestamp();
      const message = {
        type: "sync_request",
        afterTimestamp: latestTimestamp,
      };

      await this.swarm.send(peerId, JSON.stringify(message));
      console.log(
        "[SyncManager] sendSyncRequest: sync_request sent successfully",
      );

      const deviceName = this.familyManager.getDeviceName();
      if (deviceName) {
        await this.swarm.send(
          peerId,
          JSON.stringify({
            type: "device_info",
            deviceName,
          }),
        );
        console.log(
          "[SyncManager] sendSyncRequest: device_info sent successfully",
        );
      }
    } catch (error) {
      console.error("[SyncManager] sendSyncRequest error:", error);
    }
  }

  /**
   * Handle sync response (possibly chunked) from a peer
   */
  private async handleSyncResponse(
    peerId: string,
    message: {
      events: SyncEvent[];
      chunkIndex?: number;
      totalChunks?: number;
      done?: boolean;
    },
  ): Promise<void> {
    const { events, chunkIndex, totalChunks, done } = message;

    if (chunkIndex === undefined || totalChunks === undefined) {
      console.log(
        "[SyncManager] Received sync response:",
        events.length,
        "events",
      );
      for (const event of events) {
        await this.receiveEvent(event);
      }
      return;
    }

    let accumulator = this.syncChunks.get(peerId);
    if (!accumulator || chunkIndex === 0) {
      accumulator = { events: [], receivedChunks: 0, totalChunks };
      this.syncChunks.set(peerId, accumulator);
      console.log("[SyncManager] Receiving sync in", totalChunks, "chunks");
    }

    accumulator.events.push(...events);
    accumulator.receivedChunks++;

    if (accumulator.receivedChunks >= totalChunks || done) {
      console.log(
        "[SyncManager] Sync complete:",
        accumulator.events.length,
        "events from",
        peerId.substring(0, 8),
      );

      for (const event of accumulator.events) {
        await this.receiveEvent(event);
      }

      this.syncChunks.delete(peerId);
    }
  }

  /**
   * Handle sync request from a peer
   */
  private async handleSyncRequest(
    peerId: string,
    afterTimestamp: HLCTimestamp | null,
  ): Promise<void> {
    if (!this.swarm) return;

    const events = await this.eventLog.getEventsAfter(afterTimestamp);

    const message = {
      type: "sync_response",
      events,
    };

    await this.swarm.send(peerId, JSON.stringify(message));

    const deviceName = this.familyManager.getDeviceName();
    if (deviceName) {
      await this.swarm.send(
        peerId,
        JSON.stringify({
          type: "device_info",
          deviceName,
        }),
      );
    }
  }

  /**
   * Request sync from peers
   */
  async requestSync(): Promise<void> {
    if (!this.connected) return;

    const latestTimestamp = await this.eventLog.getLatestTimestamp();
    console.log("Requesting sync after timestamp:", latestTimestamp);
  }

  // Event subscription methods

  onEventReceived(handler: SyncEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onPeerConnected(handler: PeerEventHandler): () => void {
    this.peerConnectedHandlers.add(handler);
    return () => this.peerConnectedHandlers.delete(handler);
  }

  onPeerDisconnected(handler: PeerEventHandler): () => void {
    this.peerDisconnectedHandlers.add(handler);
    return () => this.peerDisconnectedHandlers.delete(handler);
  }

  onPeersUpdate(handler: PeerUpdateHandler): () => void {
    this.peerUpdateHandlers.add(handler);
    return () => this.peerUpdateHandlers.delete(handler);
  }

  // Private methods

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async saveHLCState(): Promise<void> {
    if (this.hlc) {
      await AsyncStorage.setItem(
        HLC_STATE_KEY,
        JSON.stringify(this.hlc.toJSON()),
      );
    }
  }

  private async saveSyncState(): Promise<void> {
    await AsyncStorage.setItem(
      SYNC_STATE_KEY,
      JSON.stringify({ lastSyncTime: this.lastSyncTime }),
    );
  }

  private async broadcastEvent(event: SyncEvent): Promise<void> {
    if (!this.connected) {
      console.log("[SyncManager] Cannot broadcast - not connected");
      return;
    }

    const message = {
      type: "event",
      event,
    };

    try {
      if (this.swarm) {
        await this.swarm.broadcast(JSON.stringify(message));
        console.log("[SyncManager] Broadcast event via WebRTC:", event.type);
      }
    } catch (error) {
      console.error("[SyncManager] Failed to broadcast:", error);
    }
  }

  private notifyEventHandlers(event: SyncEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error("Error in event handler:", error);
      }
    }
  }

  private notifyPeerConnected(peer: SyncPeer): void {
    for (const handler of this.peerConnectedHandlers) {
      try {
        handler(peer);
      } catch (error) {
        console.error("Error in peer connected handler:", error);
      }
    }
  }

  private notifyPeerDisconnected(peer: SyncPeer): void {
    for (const handler of this.peerDisconnectedHandlers) {
      try {
        handler(peer);
      } catch (error) {
        console.error("Error in peer disconnected handler:", error);
      }
    }
  }

  private notifyPeersUpdate(): void {
    const peers = this.getPeers();
    for (const handler of this.peerUpdateHandlers) {
      try {
        handler(peers);
      } catch (error) {
        console.error("Error in peers update handler:", error);
      }
    }
  }
}
