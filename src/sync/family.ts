/**
 * Family Management - Create and join family sync groups
 *
 * Handles:
 * - Creating new families (generates keypair)
 * - Joining existing families (via QR code data)
 * - Storing family configuration
 * - Generating QR code data for sharing
 */

import crypto from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import { generateDeviceId } from './hlc'
import { getAppDataPath } from '../database/connection'

export interface FamilyConfig {
  familyId: string
  deviceId: string
  deviceName: string
  publicKey: string // Hex encoded
  secretKey?: string // Hex encoded (only on creating device)
  createdAt: string
  joinedAt: string
  isCreator: boolean
  isManager: boolean // Manager can kick members (creator by default)
}

export interface QRCodePayload {
  familyId: string
  publicKey: string
  secretKey: string // Only included during initial setup
  version: 1
}

export interface FamilyStatus {
  isConfigured: boolean
  isCreator: boolean
  isManager: boolean
  familyId: string | null
  deviceId: string | null
  deviceName: string | null
}

/**
 * FamilyManager handles family creation and joining
 */
export class FamilyManager {
  private config: FamilyConfig | null = null
  private configPath: string

  constructor(configPath?: string) {
    this.configPath =
      configPath || path.join(getAppDataPath(), 'sync', 'family.json')
  }

  /**
   * Initialize and load existing config
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true })

      const data = await fs.readFile(this.configPath, 'utf-8')
      this.config = JSON.parse(data)
    } catch {
      // No existing config
      this.config = null
    }
  }

  /**
   * Check if a family is configured
   */
  isConfigured(): boolean {
    return this.config !== null
  }

  /**
   * Get current family status
   */
  getStatus(): FamilyStatus {
    if (!this.config) {
      return {
        isConfigured: false,
        isCreator: false,
        isManager: false,
        familyId: null,
        deviceId: null,
        deviceName: null
      }
    }

    return {
      isConfigured: true,
      isCreator: this.config.isCreator,
      isManager: this.config.isManager,
      familyId: this.config.familyId,
      deviceId: this.config.deviceId,
      deviceName: this.config.deviceName
    }
  }

  /**
   * Get the current config (if configured)
   */
  getConfig(): FamilyConfig | null {
    return this.config
  }

  /**
   * Create a new family
   */
  async createFamily(deviceName: string): Promise<FamilyConfig> {
    if (this.config) {
      throw new Error('Already part of a family. Leave first to create a new one.')
    }

    // Generate family ID
    const familyId = crypto.randomUUID()

    // Generate device ID
    const deviceId = generateDeviceId()

    // Generate keypair for the family
    // Using Ed25519 for signatures (Hypercore compatible)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')

    const publicKeyHex = publicKey.export({ type: 'spki', format: 'der' }).toString('hex')
    const secretKeyHex = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex')

    const now = new Date().toISOString()

    this.config = {
      familyId,
      deviceId,
      deviceName,
      publicKey: publicKeyHex,
      secretKey: secretKeyHex,
      createdAt: now,
      joinedAt: now,
      isCreator: true,
      isManager: true // Creator is automatically the manager
    }

    await this.saveConfig()

    return this.config
  }

  /**
   * Join an existing family using QR code payload
   */
  async joinFamily(payload: QRCodePayload, deviceName: string): Promise<FamilyConfig> {
    if (this.config) {
      throw new Error('Already part of a family. Leave first to join a new one.')
    }

    // Validate payload
    if (!payload.familyId || !payload.publicKey || !payload.secretKey) {
      throw new Error('Invalid QR code data')
    }

    if (payload.version !== 1) {
      throw new Error('Unsupported QR code version')
    }

    // Generate device ID for this device
    const deviceId = generateDeviceId()
    const now = new Date().toISOString()

    this.config = {
      familyId: payload.familyId,
      deviceId,
      deviceName,
      publicKey: payload.publicKey,
      secretKey: payload.secretKey,
      createdAt: now, // We don't know when family was created
      joinedAt: now,
      isCreator: false,
      isManager: false // Joining devices are not managers by default
    }

    await this.saveConfig()

    return this.config
  }

  /**
   * Generate QR code payload for sharing
   */
  getQRCodePayload(): QRCodePayload | null {
    if (!this.config || !this.config.secretKey) {
      return null
    }

    return {
      familyId: this.config.familyId,
      publicKey: this.config.publicKey,
      secretKey: this.config.secretKey,
      version: 1
    }
  }

  /**
   * Generate QR code data string
   */
  getQRCodeData(): string | null {
    const payload = this.getQRCodePayload()
    if (!payload) return null

    // Base64 encode the JSON payload
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  /**
   * Parse QR code data string
   */
  static parseQRCodeData(data: string): QRCodePayload {
    try {
      const json = Buffer.from(data, 'base64').toString('utf-8')
      const payload = JSON.parse(json)

      // Validate required fields
      if (!payload.familyId || !payload.publicKey || !payload.secretKey) {
        throw new Error('Invalid QR code data: missing required fields')
      }

      return payload as QRCodePayload
    } catch (err) {
      if (err instanceof Error && err.message.includes('Invalid QR code')) {
        throw err
      }
      throw new Error('Invalid QR code data: failed to parse')
    }
  }

  /**
   * Update device name
   */
  async updateDeviceName(name: string): Promise<void> {
    if (!this.config) {
      throw new Error('Not part of a family')
    }

    this.config.deviceName = name
    await this.saveConfig()
  }

  /**
   * Check if this device is the manager
   */
  isManager(): boolean {
    return this.config?.isManager ?? false
  }

  /**
   * Leave the current family
   */
  async leaveFamily(): Promise<void> {
    if (!this.config) {
      throw new Error('Not part of a family')
    }

    // Delete config file
    try {
      await fs.unlink(this.configPath)
    } catch {
      // Ignore if file doesn't exist
    }

    this.config = null
  }

  /**
   * Save config to disk
   */
  private async saveConfig(): Promise<void> {
    if (!this.config) return

    await fs.mkdir(path.dirname(this.configPath), { recursive: true })
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2))
  }

  /**
   * Get the family ID (for swarm topic generation)
   */
  getFamilyId(): string | null {
    return this.config?.familyId || null
  }

  /**
   * Get the device ID
   */
  getDeviceId(): string | null {
    return this.config?.deviceId || null
  }
}

/**
 * Create and initialize a family manager
 */
export async function createFamilyManager(configPath?: string): Promise<FamilyManager> {
  const manager = new FamilyManager(configPath)
  await manager.initialize()
  return manager
}
