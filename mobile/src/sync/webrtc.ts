/**
 * WebRTC P2P Module
 *
 * Provides peer-to-peer connectivity using WebRTC data channels.
 * Uses public STUN servers for NAT traversal.
 *
 * NOTE: react-native-webrtc requires native code. If the native module
 * is not available (e.g., in Expo Go), WebRTC will be disabled and
 * the app will fall back to simulation mode.
 */

// Dynamically import WebRTC to handle cases where native module isn't available
let RTCPeerConnection: any = null;
let RTCSessionDescription: any = null;
let RTCIceCandidate: any = null;
let webrtcAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const webrtc = require("react-native-webrtc");
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  webrtcAvailable = !!RTCPeerConnection;
  console.log("[WebRTC] Native module loaded successfully");
} catch {
  console.log("[WebRTC] Native module not available, WebRTC disabled");
  webrtcAvailable = false;
}

export const isWebRTCAvailable = webrtcAvailable;

// Public STUN servers for NAT traversal
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

export interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate";
  from: string;
  to: string;
  payload: any;
}

export interface PeerConnectionEvents {
  onConnected?: (peerId: string) => void;
  onDisconnected?: (peerId: string) => void;
  onData?: (peerId: string, data: string) => void;
  onError?: (peerId: string, error: Error) => void;
}

/**
 * Manages a single WebRTC peer connection
 */
export class PeerConnection {
  private pc: any;
  private dataChannel: any = null; // RTCDataChannel type not properly exported
  private peerId: string;
  private localId: string;
  private events: PeerConnectionEvents;
  private collectedCandidates: any[] = [];
  private iceGatheringComplete = false;
  private iceGatheringResolvers: Array<(candidates: any[]) => void> = [];
  private isConnected = false;

  constructor(localId: string, peerId: string, events: PeerConnectionEvents) {
    if (!webrtcAvailable || !RTCPeerConnection) {
      throw new Error("WebRTC is not available");
    }

    this.localId = localId;
    this.peerId = peerId;
    this.events = events;

    this.pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // @ts-expect-error - react-native-webrtc has different event handler types
    this.pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        console.log("[WebRTC] ICE candidate generated");
        this.collectedCandidates.push(event.candidate);
      } else {
        // ICE gathering complete (null candidate signals end)
        console.log(
          "[WebRTC] ICE gathering complete with",
          this.collectedCandidates.length,
          "candidates",
        );
        this.iceGatheringComplete = true;
        // Resolve all pending promises
        for (const resolve of this.iceGatheringResolvers) {
          resolve([...this.collectedCandidates]);
        }
        this.iceGatheringResolvers = [];
      }
    };

    // @ts-expect-error - react-native-webrtc has different event handler types
    this.pc.onconnectionstatechange = () => {
      // @ts-expect-error - connectionState not in RTCPeerConnection type
      const state = this.pc.connectionState;
      console.log("[WebRTC] Connection state:", state);

      if (state === "connected" && !this.isConnected) {
        this.isConnected = true;
        this.events.onConnected?.(this.peerId);
      } else if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        if (this.isConnected) {
          this.isConnected = false;
          this.events.onDisconnected?.(this.peerId);
        }
      }
    };

    // @ts-expect-error - react-native-webrtc has different event handler types
    this.pc.ondatachannel = (event: any) => {
      console.log("[WebRTC] Received data channel");
      this.setupDataChannel(event.channel);
    };
  }

  private setupDataChannel(channel: any): void {
    this.dataChannel = channel;

    channel.onopen = () => {
      console.log("[WebRTC] Data channel opened");
    };

    channel.onclose = () => {
      console.log("[WebRTC] Data channel closed");
    };

    channel.onmessage = (event: any) => {
      console.log(
        "[WebRTC] Received message:",
        event.data?.substring?.(0, 100) || event.data,
      );
      this.events.onData?.(this.peerId, event.data);
    };

    channel.onerror = (error: any) => {
      console.error("[WebRTC] Data channel error:", error);
      this.events.onError?.(this.peerId, new Error("Data channel error"));
    };
  }

  /**
   * Create an offer to initiate connection
   */
  async createOffer(): Promise<{ offer: any; iceCandidates: any[] }> {
    // Create data channel before creating offer
    // @ts-expect-error - createDataChannel not in RTCPeerConnection type
    const channel = this.pc.createDataChannel("data", {
      ordered: true,
    });
    this.setupDataChannel(channel);

    const offer = await this.pc.createOffer({});
    await this.pc.setLocalDescription(offer);

    // Wait for ICE gathering to complete
    const iceCandidates = await this.gatherIceCandidates();

    return {
      offer: this.pc.localDescription,
      iceCandidates,
    };
  }

  /**
   * Handle an incoming offer and create an answer
   */
  async handleOffer(
    offer: any,
    iceCandidates: any[],
  ): Promise<{ answer: any; iceCandidates: any[] }> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Add ICE candidates from offer
    for (const candidate of iceCandidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    // Wait for ICE gathering to complete
    const localCandidates = await this.gatherIceCandidates();

    return {
      answer: this.pc.localDescription,
      iceCandidates: localCandidates,
    };
  }

  /**
   * Handle an incoming answer
   */
  async handleAnswer(answer: any, iceCandidates: any[]): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));

    // Add ICE candidates from answer
    for (const candidate of iceCandidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  /**
   * Wait for ICE gathering to complete
   */
  private gatherIceCandidates(): Promise<any[]> {
    return new Promise((resolve) => {
      // If already complete, resolve immediately with collected candidates
      if (this.iceGatheringComplete) {
        resolve([...this.collectedCandidates]);
        return;
      }

      // @ts-expect-error - iceGatheringState not in RTCPeerConnection type
      if (this.pc.iceGatheringState === "complete") {
        this.iceGatheringComplete = true;
        resolve([...this.collectedCandidates]);
        return;
      }

      // Set a timeout in case gathering takes too long
      const timeout = setTimeout(() => {
        console.log(
          "[WebRTC] ICE gathering timed out with",
          this.collectedCandidates.length,
          "candidates",
        );
        // Remove this resolver from the list
        const index = this.iceGatheringResolvers.indexOf(resolveWithCandidates);
        if (index > -1) {
          this.iceGatheringResolvers.splice(index, 1);
        }
        resolve([...this.collectedCandidates]);
      }, 5000); // 5 second timeout

      const resolveWithCandidates = (candidates: any[]) => {
        clearTimeout(timeout);
        resolve(candidates);
      };

      // Register resolver to be called when gathering completes
      this.iceGatheringResolvers.push(resolveWithCandidates);
    });
  }

  /**
   * Send data to the peer
   */
  send(data: string): boolean {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      console.warn("[WebRTC] Cannot send: data channel not open");
      return false;
    }

    try {
      this.dataChannel.send(data);
      return true;
    } catch (error) {
      console.error("[WebRTC] Send error:", error);
      return false;
    }
  }

  /**
   * Close the connection
   */
  close(): void {
    this.dataChannel?.close?.();
    this.pc.close();
    this.isConnected = false;
  }

  /**
   * Get connection state
   */
  getState(): string {
    // @ts-expect-error - connectionState not in RTCPeerConnection type
    return this.pc.connectionState || "unknown";
  }
}

/**
 * Signaling interface for exchanging WebRTC offers/answers
 */
export interface SignalingProvider {
  // Send a signaling message to a peer
  send(message: SignalingMessage): Promise<void>;

  // Subscribe to signaling messages for this peer
  subscribe(
    localId: string,
    onMessage: (message: SignalingMessage) => void,
  ): () => void;

  // Join a room/topic for peer discovery
  joinRoom(roomId: string, localId: string): Promise<string[]>; // Returns list of peer IDs

  // Leave a room
  leaveRoom(roomId: string): Promise<void>;
}

/**
 * WebRTC P2P Swarm
 * Manages multiple peer connections
 */
export class WebRTCSwarm {
  private localId: string;
  private signaling: SignalingProvider | null = null;
  private peers: Map<string, PeerConnection> = new Map();
  private events: PeerConnectionEvents = {};
  private currentRoom: string | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(localId: string) {
    this.localId = localId;
  }

  /**
   * Set the signaling provider
   */
  setSignaling(signaling: SignalingProvider): void {
    this.signaling = signaling;

    // Subscribe to signaling messages
    this.unsubscribe = signaling.subscribe(this.localId, (message) => {
      this.handleSignalingMessage(message);
    });
  }

  /**
   * Set event handlers
   */
  setEvents(events: PeerConnectionEvents): void {
    this.events = events;
  }

  /**
   * Join a room/topic
   */
  async join(roomId: string): Promise<void> {
    if (!this.signaling) {
      console.log(
        "[WebRTCSwarm] No signaling provider, running in simulation mode",
      );
      return;
    }

    this.currentRoom = roomId;

    // Join the room and get list of existing peers
    const peerIds = await this.signaling.joinRoom(roomId, this.localId);

    // Connect to each existing peer
    for (const peerId of peerIds) {
      if (peerId !== this.localId) {
        await this.connectToPeer(peerId);
      }
    }
  }

  /**
   * Leave the current room
   */
  async leave(): Promise<void> {
    if (this.currentRoom && this.signaling) {
      await this.signaling.leaveRoom(this.currentRoom);
    }

    // Close all peer connections
    for (const [, peer] of this.peers) {
      peer.close();
    }
    this.peers.clear();
    this.currentRoom = null;
  }

  /**
   * Connect to a specific peer
   */
  private async connectToPeer(peerId: string): Promise<void> {
    if (this.peers.has(peerId)) {
      return; // Already connected
    }

    console.log("[WebRTCSwarm] Connecting to peer:", peerId);

    const peer = new PeerConnection(this.localId, peerId, this.events);
    this.peers.set(peerId, peer);

    // Create and send offer
    const { offer, iceCandidates } = await peer.createOffer();

    await this.signaling?.send({
      type: "offer",
      from: this.localId,
      to: peerId,
      payload: { offer, iceCandidates },
    });
  }

  /**
   * Handle incoming signaling message
   */
  private async handleSignalingMessage(
    message: SignalingMessage,
  ): Promise<void> {
    console.log(
      "[WebRTCSwarm] Received signaling:",
      message.type,
      "from:",
      message.from,
    );

    if (message.type === "offer") {
      // Handle WebRTC glare: both devices sent offers simultaneously
      // The device with the smaller ID is "polite" and accepts the remote offer
      // The device with the larger ID is "impolite" and ignores the remote offer
      const existingPeer = this.peers.get(message.from);
      const isPolite = this.localId < message.from;

      if (existingPeer && existingPeer.getState() !== "connected") {
        // We have an existing connection attempt (we sent an offer)
        if (!isPolite) {
          // We're impolite - ignore this offer, wait for answer to our offer
          console.log("[WebRTCSwarm] Glare: ignoring offer (we are impolite)");
          return;
        }
        // We're polite - close our attempt and accept their offer
        console.log("[WebRTCSwarm] Glare: accepting offer (we are polite)");
        existingPeer.close();
        this.peers.delete(message.from);
      }

      // Create new peer connection and respond with answer
      const peer = new PeerConnection(this.localId, message.from, this.events);
      this.peers.set(message.from, peer);

      const { answer, iceCandidates } = await peer.handleOffer(
        message.payload.offer,
        message.payload.iceCandidates,
      );

      await this.signaling?.send({
        type: "answer",
        from: this.localId,
        to: message.from,
        payload: { answer, iceCandidates },
      });
    } else if (message.type === "answer") {
      // Received an answer, complete connection
      const peer = this.peers.get(message.from);
      if (peer) {
        await peer.handleAnswer(
          message.payload.answer,
          message.payload.iceCandidates,
        );
      }
    }
  }

  /**
   * Send data to a specific peer
   */
  send(peerId: string, data: string): boolean {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.warn("[WebRTCSwarm] Peer not found:", peerId);
      return false;
    }
    return peer.send(data);
  }

  /**
   * Broadcast data to all connected peers
   */
  broadcast(data: string): void {
    for (const [, peer] of this.peers) {
      peer.send(data);
    }
  }

  /**
   * Get connected peer count
   */
  getPeerCount(): number {
    let count = 0;
    for (const [, peer] of this.peers) {
      if (peer.getState() === "connected") {
        count++;
      }
    }
    return count;
  }

  /**
   * Destroy the swarm
   */
  destroy(): void {
    this.unsubscribe?.();
    this.leave();
  }
}

export default WebRTCSwarm;
