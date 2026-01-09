/**
 * React Native Hyperswarm
 *
 * Native P2P networking for React Native using Hyperswarm protocol
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { HyperswarmModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(HyperswarmModule);

export enum EventType {
  Ready = 0,
  PeerConnected = 1,
  PeerDisconnected = 2,
  Data = 3,
  Error = 4,
}

export interface SwarmEvent {
  swarmId: number;
  type: EventType;
  peerId?: string;
  data?: string;
  address?: string;
  message?: string;
}

export interface SwarmConfig {
  deviceId: string;
}

export type EventHandler = (event: SwarmEvent) => void;

/**
 * Hyperswarm instance for P2P networking
 */
export class Hyperswarm {
  private swarmId: number | null = null;
  private eventSubscription: any = null;
  private handlers: Map<EventType, Set<EventHandler>> = new Map();

  /**
   * Create and initialize a new swarm
   */
  async create(config: SwarmConfig): Promise<void> {
    this.swarmId = await HyperswarmModule.create(config.deviceId);
    this.setupEventListener();
  }

  /**
   * Start the swarm (begin listening and connecting)
   */
  async start(): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created');
    await HyperswarmModule.start(this.swarmId);
  }

  /**
   * Stop the swarm
   */
  async stop(): Promise<void> {
    if (!this.swarmId) return;
    await HyperswarmModule.stop(this.swarmId);
  }

  /**
   * Destroy the swarm and free resources
   */
  destroy(): void {
    if (this.eventSubscription) {
      this.eventSubscription.remove();
      this.eventSubscription = null;
    }
    if (this.swarmId) {
      HyperswarmModule.destroy(this.swarmId);
      this.swarmId = null;
    }
    this.handlers.clear();
  }

  /**
   * Join a topic for peer discovery
   */
  async join(topic: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created');
    await HyperswarmModule.join(this.swarmId, topic);
  }

  /**
   * Leave a topic
   */
  async leave(topic: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created');
    await HyperswarmModule.leave(this.swarmId, topic);
  }

  /**
   * Send data to a specific peer
   */
  async send(peerId: string, data: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created');
    await HyperswarmModule.send(this.swarmId, peerId, data);
  }

  /**
   * Broadcast data to all connected peers
   */
  async broadcast(data: string): Promise<void> {
    if (!this.swarmId) throw new Error('Swarm not created');
    await HyperswarmModule.broadcast(this.swarmId, data);
  }

  /**
   * Get the local peer ID
   */
  async getLocalPeerId(): Promise<string> {
    if (!this.swarmId) throw new Error('Swarm not created');
    return await HyperswarmModule.getLocalPeerId(this.swarmId);
  }

  /**
   * Get the number of connected peers
   */
  async getPeerCount(): Promise<number> {
    if (!this.swarmId) throw new Error('Swarm not created');
    return await HyperswarmModule.getPeerCount(this.swarmId);
  }

  /**
   * Subscribe to swarm events
   */
  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler): () => void {
    const unsubscribers = [
      this.on(EventType.Ready, handler),
      this.on(EventType.PeerConnected, handler),
      this.on(EventType.PeerDisconnected, handler),
      this.on(EventType.Data, handler),
      this.on(EventType.Error, handler),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }

  // Private methods

  private setupEventListener(): void {
    this.eventSubscription = eventEmitter.addListener(
      'hyperswarmEvent',
      (event: SwarmEvent) => {
        if (event.swarmId !== this.swarmId) return;

        const handlers = this.handlers.get(event.type);
        if (handlers) {
          handlers.forEach((handler) => {
            try {
              handler(event);
            } catch (e) {
              console.error('Error in event handler:', e);
            }
          });
        }
      }
    );
  }
}

/**
 * Create a topic hash from a string
 * (Topics are hashed to 32 bytes, but you can pass the string directly)
 */
export function createTopic(familyId: string): string {
  return `homeschool:family:${familyId}`;
}

export default Hyperswarm;
