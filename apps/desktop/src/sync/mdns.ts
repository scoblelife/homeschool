/**
 * mDNS Local Discovery
 *
 * Uses Bonjour/mDNS for local network peer discovery.
 * When devices are on the same WiFi, they can find each other
 * without using the Cloudflare Worker.
 */

import Bonjour, { Service } from 'bonjour-service'
import { MDNS_SERVICE_TYPE } from './config'

export interface LocalPeer {
  deviceId: string
  host: string
  port: number
  pubKey?: string
}

export interface MDNSDiscoveryEvents {
  onPeerFound?: (peer: LocalPeer) => void
  onPeerLost?: (deviceId: string) => void
}

/**
 * mDNS Discovery for local network peer discovery
 */
export class MDNSDiscovery {
  private bonjour: Bonjour | null = null
  private published = false
  private browser: ReturnType<Bonjour['find']> | null = null
  private events: MDNSDiscoveryEvents = {}
  private knownPeers: Map<string, LocalPeer> = new Map()

  constructor(events: MDNSDiscoveryEvents = {}) {
    this.events = events
  }

  /**
   * Initialize Bonjour (lazy loading to avoid issues when not needed)
   */
  private ensureBonjour(): Bonjour {
    if (!this.bonjour) {
      this.bonjour = new Bonjour()
    }
    return this.bonjour
  }

  /**
   * Publish this device on the local network
   * @param deviceId - Unique identifier for this device
   * @param port - Port to advertise (for direct WebRTC signaling)
   * @param pubKey - Optional public key for encryption
   */
  publish(deviceId: string, port: number, pubKey?: string): void {
    if (this.published) {
      return
    }

    try {
      const bonjour = this.ensureBonjour()
      const txt: Record<string, string> = { deviceId }
      if (pubKey) {
        txt.pubKey = pubKey
      }

      bonjour.publish({
        name: `homeschool-${deviceId.substring(0, 8)}`,
        type: MDNS_SERVICE_TYPE,
        port,
        txt,
      })

      this.published = true
      console.log(`[mDNS] Published service: ${deviceId.substring(0, 8)}... on port ${port}`)
    } catch (error) {
      console.error('[mDNS] Failed to publish:', error)
    }
  }

  /**
   * Unpublish this device from the network
   */
  unpublish(): void {
    if (this.bonjour && this.published) {
      try {
        this.bonjour.unpublishAll()
        this.published = false
        console.log('[mDNS] Unpublished service')
      } catch (error) {
        console.error('[mDNS] Failed to unpublish:', error)
      }
    }
  }

  /**
   * Start discovering peers on the local network
   * @param ownDeviceId - This device's ID (to filter out self)
   */
  startDiscovery(ownDeviceId: string): void {
    if (this.browser) {
      return // Already discovering
    }

    try {
      const bonjour = this.ensureBonjour()
      this.browser = bonjour.find({ type: MDNS_SERVICE_TYPE })

      this.browser.on('up', (service: Service) => {
        const deviceId = service.txt?.deviceId
        if (!deviceId || deviceId === ownDeviceId) {
          return // Skip self or invalid
        }

        const peer: LocalPeer = {
          deviceId,
          host: service.host || service.addresses?.[0] || '',
          port: service.port,
          pubKey: service.txt?.pubKey,
        }

        if (peer.host) {
          this.knownPeers.set(deviceId, peer)
          console.log(`[mDNS] Found peer: ${deviceId.substring(0, 8)}... at ${peer.host}:${peer.port}`)
          this.events.onPeerFound?.(peer)
        }
      })

      this.browser.on('down', (service: Service) => {
        const deviceId = service.txt?.deviceId
        if (deviceId && this.knownPeers.has(deviceId)) {
          this.knownPeers.delete(deviceId)
          console.log(`[mDNS] Lost peer: ${deviceId.substring(0, 8)}...`)
          this.events.onPeerLost?.(deviceId)
        }
      })

      console.log('[mDNS] Started discovery')
    } catch (error) {
      console.error('[mDNS] Failed to start discovery:', error)
    }
  }

  /**
   * Stop discovering peers
   */
  stopDiscovery(): void {
    if (this.browser) {
      try {
        this.browser.stop()
        this.browser = null
        this.knownPeers.clear()
        console.log('[mDNS] Stopped discovery')
      } catch (error) {
        console.error('[mDNS] Failed to stop discovery:', error)
      }
    }
  }

  /**
   * Get currently known local peers
   */
  getLocalPeers(): LocalPeer[] {
    return Array.from(this.knownPeers.values())
  }

  /**
   * Check if a peer is available locally
   */
  isLocalPeer(deviceId: string): boolean {
    return this.knownPeers.has(deviceId)
  }

  /**
   * Get a specific local peer
   */
  getLocalPeer(deviceId: string): LocalPeer | undefined {
    return this.knownPeers.get(deviceId)
  }

  /**
   * Destroy the mDNS discovery instance
   */
  destroy(): void {
    this.stopDiscovery()
    this.unpublish()

    if (this.bonjour) {
      try {
        this.bonjour.destroy()
      } catch {
        // Ignore errors during cleanup
      }
      this.bonjour = null
    }
  }
}

// Singleton instance for the app
let discoveryInstance: MDNSDiscovery | null = null

export function getMDNSDiscovery(events?: MDNSDiscoveryEvents): MDNSDiscovery {
  if (!discoveryInstance) {
    discoveryInstance = new MDNSDiscovery(events)
  } else if (events) {
    // Update events if provided
    discoveryInstance = new MDNSDiscovery(events)
  }
  return discoveryInstance
}

export function destroyMDNSDiscovery(): void {
  if (discoveryInstance) {
    discoveryInstance.destroy()
    discoveryInstance = null
  }
}
