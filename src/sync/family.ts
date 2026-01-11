/**
 * Family Management - Create and join family sync groups
 *
 * Implements OAuth-style secure device joining:
 * 1. Each device has its own keypair (no shared family secret)
 * 2. QR code contains: nonce, one-time topic, inviter's public key
 * 3. New device posts encrypted offer to Worker
 * 4. Trusted device polls, validates, prompts user
 * 5. If approved, trusted device posts encrypted answer
 * 6. After WebRTC connects, member.added event is broadcast
 */

import crypto from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import { generateDeviceId } from './hlc'
import { getAppDataPath } from '../database/connection'
import { generateKeyPair, generateNonce, generateTopic, encrypt, decrypt, KeyPair } from './crypto'

// ============= Types =============

export interface DeviceKeyPair {
  publicKey: string // base64
  secretKey: string // base64
}

export interface FamilyMember {
  deviceId: string
  deviceName: string
  pubKey: string
  addedAt: string
  addedBy: string // deviceId of who added them
  isManager: boolean
}

export interface FamilyConfig {
  familyId: string
  deviceId: string
  deviceName: string
  keyPair: DeviceKeyPair // This device's keypair
  members: FamilyMember[] // Known family members
  blockedPubKeys: string[] // Revoked/kicked members
  createdAt: string
  joinedAt: string
  isCreator: boolean
  isManager: boolean
}

export interface InvitePayload {
  familyId: string
  nonce: string // One-time auth code
  topic: string // One-time signaling topic
  inviterPubKey: string
  inviterDeviceId: string
  inviterDeviceName: string
  expiresAt: number // Unix timestamp
  version: 2
}

export interface JoinRequest {
  nonce: string
  newPubKey: string
  newDeviceId: string
  newDeviceName: string
  encryptedOffer: string // WebRTC offer encrypted to inviter
  encryptedIceCandidates: string // ICE candidates encrypted to inviter
}

export interface JoinResponse {
  approved: boolean
  encryptedAnswer?: string // WebRTC answer encrypted to new device
  encryptedIceCandidates?: string
  encryptedFamilyData?: string // Initial family data (members list, etc.)
  trustedPubKey: string
  trustedDeviceId: string
}

export interface FamilyStatus {
  isConfigured: boolean
  isCreator: boolean
  isManager: boolean
  familyId: string | null
  deviceId: string | null
  deviceName: string | null
  memberCount: number
}

export interface PendingInvite {
  invite: InvitePayload
  createdAt: number
}

// Legacy types for backwards compatibility
export interface QRCodePayload {
  familyId: string
  publicKey: string
  secretKey: string
  version: 1
}

// ============= FamilyManager =============

export class FamilyManager {
  private config: FamilyConfig | null = null
  private configPath: string
  private pendingInvites: Map<string, PendingInvite> = new Map() // topic -> invite

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

      // Migrate old config format
      if (this.config && !this.config.keyPair) {
        await this.migrateConfig()
      }
    } catch {
      this.config = null
    }
  }

  /**
   * Migrate old config format to new format with individual keypairs
   */
  private async migrateConfig(): Promise<void> {
    if (!this.config) return

    // Generate a new keypair for this device
    const keyPair = generateKeyPair()

    // Create self as first member
    const selfMember: FamilyMember = {
      deviceId: this.config.deviceId,
      deviceName: this.config.deviceName,
      pubKey: keyPair.publicKey,
      addedAt: this.config.joinedAt,
      addedBy: this.config.deviceId,
      isManager: this.config.isManager,
    }

    this.config = {
      ...this.config,
      keyPair,
      members: [selfMember],
      blockedPubKeys: [],
    }

    await this.saveConfig()
    console.log('[Family] Migrated config to new format with individual keypair')
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
        deviceName: null,
        memberCount: 0,
      }
    }

    return {
      isConfigured: true,
      isCreator: this.config.isCreator,
      isManager: this.config.isManager,
      familyId: this.config.familyId,
      deviceId: this.config.deviceId,
      deviceName: this.config.deviceName,
      memberCount: this.config.members.length,
    }
  }

  /**
   * Get the current config (if configured)
   */
  getConfig(): FamilyConfig | null {
    return this.config
  }

  /**
   * Get this device's public key
   */
  getPublicKey(): string | null {
    return this.config?.keyPair.publicKey || null
  }

  /**
   * Get known family members
   */
  getMembers(): FamilyMember[] {
    return this.config?.members || []
  }

  /**
   * Check if a public key is blocked
   */
  isBlocked(pubKey: string): boolean {
    return this.config?.blockedPubKeys.includes(pubKey) ?? false
  }

  // ============= Family Creation =============

  /**
   * Create a new family
   */
  async createFamily(deviceName: string): Promise<FamilyConfig> {
    if (this.config) {
      throw new Error('Already part of a family. Leave first to create a new one.')
    }

    const familyId = crypto.randomUUID()
    const deviceId = generateDeviceId()
    const keyPair = generateKeyPair()
    const now = new Date().toISOString()

    const selfMember: FamilyMember = {
      deviceId,
      deviceName,
      pubKey: keyPair.publicKey,
      addedAt: now,
      addedBy: deviceId,
      isManager: true,
    }

    this.config = {
      familyId,
      deviceId,
      deviceName,
      keyPair,
      members: [selfMember],
      blockedPubKeys: [],
      createdAt: now,
      joinedAt: now,
      isCreator: true,
      isManager: true,
    }

    await this.saveConfig()
    return this.config
  }

  // ============= OAuth-Style Invite =============

  /**
   * Create an invite for a new device to join
   * Returns invite payload for QR code
   */
  createInvite(expirationHours = 48): InvitePayload {
    if (!this.config) {
      throw new Error('Not part of a family')
    }

    if (!this.config.isManager) {
      throw new Error('Only managers can invite new devices')
    }

    const invite: InvitePayload = {
      familyId: this.config.familyId,
      nonce: generateNonce(),
      topic: generateTopic(),
      inviterPubKey: this.config.keyPair.publicKey,
      inviterDeviceId: this.config.deviceId,
      inviterDeviceName: this.config.deviceName,
      expiresAt: Date.now() + expirationHours * 60 * 60 * 1000,
      version: 2,
    }

    // Store pending invite
    this.pendingInvites.set(invite.topic, {
      invite,
      createdAt: Date.now(),
    })

    // Clean up old pending invites
    this.cleanupPendingInvites()

    return invite
  }

  /**
   * Generate QR code data string for invite
   */
  getInviteQRData(invite: InvitePayload): string {
    return Buffer.from(JSON.stringify(invite)).toString('base64')
  }

  /**
   * Parse invite QR code data
   */
  static parseInviteQRData(data: string): InvitePayload {
    try {
      const json = Buffer.from(data, 'base64').toString('utf-8')
      const payload = JSON.parse(json)

      // Check if it's a v2 invite
      if (payload.version === 2) {
        if (!payload.familyId || !payload.nonce || !payload.topic || !payload.inviterPubKey) {
          throw new Error('Invalid invite: missing required fields')
        }
        return payload as InvitePayload
      }

      // Legacy v1 format
      throw new Error('Legacy QR code format not supported. Please generate a new invite.')
    } catch (err) {
      if (err instanceof Error && (err.message.includes('Invalid') || err.message.includes('Legacy'))) {
        throw err
      }
      throw new Error('Invalid QR code data: failed to parse')
    }
  }

  /**
   * Validate an invite
   */
  validateInvite(invite: InvitePayload): { valid: boolean; error?: string } {
    if (invite.expiresAt < Date.now()) {
      return { valid: false, error: 'Invite has expired' }
    }

    if (invite.version !== 2) {
      return { valid: false, error: 'Unsupported invite version' }
    }

    return { valid: true }
  }

  /**
   * Get a pending invite by topic
   */
  getPendingInvite(topic: string): InvitePayload | null {
    const pending = this.pendingInvites.get(topic)
    if (!pending) return null

    // Check if expired
    if (pending.invite.expiresAt < Date.now()) {
      this.pendingInvites.delete(topic)
      return null
    }

    return pending.invite
  }

  /**
   * Remove a pending invite (after use or rejection)
   */
  removePendingInvite(topic: string): void {
    this.pendingInvites.delete(topic)
  }

  /**
   * Clean up expired pending invites
   */
  private cleanupPendingInvites(): void {
    const now = Date.now()
    for (const [topic, pending] of Array.from(this.pendingInvites.entries())) {
      if (pending.invite.expiresAt < now) {
        this.pendingInvites.delete(topic)
      }
    }
  }

  // ============= Join Flow (New Device) =============

  /**
   * Create a join request (called by new device after scanning QR)
   */
  createJoinRequest(
    invite: InvitePayload,
    deviceName: string,
    webrtcOffer: string,
    iceCandidates: string
  ): { request: JoinRequest; keyPair: KeyPair; deviceId: string } {
    const keyPair = generateKeyPair()
    const deviceId = generateDeviceId()

    // Encrypt offer and ICE candidates to the inviter's public key
    const encryptedOffer = encrypt(webrtcOffer, invite.inviterPubKey, keyPair.secretKey)
    const encryptedIceCandidates = encrypt(iceCandidates, invite.inviterPubKey, keyPair.secretKey)

    const request: JoinRequest = {
      nonce: invite.nonce,
      newPubKey: keyPair.publicKey,
      newDeviceId: deviceId,
      newDeviceName: deviceName,
      encryptedOffer,
      encryptedIceCandidates,
    }

    return { request, keyPair, deviceId }
  }

  /**
   * Validate a join request (called by trusted device)
   */
  validateJoinRequest(
    request: JoinRequest,
    invite: InvitePayload
  ): { valid: boolean; error?: string; offer?: string; iceCandidates?: string } {
    if (!this.config) {
      return { valid: false, error: 'Not configured' }
    }

    // Validate nonce
    if (request.nonce !== invite.nonce) {
      return { valid: false, error: 'Invalid nonce' }
    }

    // Decrypt offer and ICE candidates
    const offer = decrypt(
      request.encryptedOffer,
      request.newPubKey,
      this.config.keyPair.secretKey
    )

    const iceCandidates = decrypt(
      request.encryptedIceCandidates,
      request.newPubKey,
      this.config.keyPair.secretKey
    )

    if (!offer || !iceCandidates) {
      return { valid: false, error: 'Failed to decrypt request' }
    }

    return { valid: true, offer, iceCandidates }
  }

  /**
   * Create a join response (called by trusted device after approval)
   */
  createJoinResponse(
    request: JoinRequest,
    approved: boolean,
    webrtcAnswer?: string,
    iceCandidates?: string
  ): JoinResponse {
    if (!this.config) {
      throw new Error('Not configured')
    }

    if (!approved) {
      return {
        approved: false,
        trustedPubKey: this.config.keyPair.publicKey,
        trustedDeviceId: this.config.deviceId,
      }
    }

    if (!webrtcAnswer || !iceCandidates) {
      throw new Error('WebRTC answer and ICE candidates required for approval')
    }

    // Encrypt response to new device's public key
    const encryptedAnswer = encrypt(webrtcAnswer, request.newPubKey, this.config.keyPair.secretKey)
    const encryptedIceCandidates = encrypt(iceCandidates, request.newPubKey, this.config.keyPair.secretKey)

    // Prepare family data for new member
    const familyData = {
      familyId: this.config.familyId,
      members: this.config.members,
    }
    const encryptedFamilyData = encrypt(
      JSON.stringify(familyData),
      request.newPubKey,
      this.config.keyPair.secretKey
    )

    return {
      approved: true,
      encryptedAnswer,
      encryptedIceCandidates,
      encryptedFamilyData,
      trustedPubKey: this.config.keyPair.publicKey,
      trustedDeviceId: this.config.deviceId,
    }
  }

  /**
   * Complete joining (called by new device after receiving response)
   */
  async completeJoin(
    invite: InvitePayload,
    response: JoinResponse,
    keyPair: KeyPair,
    deviceId: string,
    deviceName: string
  ): Promise<{ config: FamilyConfig; answer: string; iceCandidates: string }> {
    if (this.config) {
      throw new Error('Already part of a family')
    }

    if (!response.approved) {
      throw new Error('Join request was rejected')
    }

    // Decrypt response
    const answer = decrypt(
      response.encryptedAnswer!,
      response.trustedPubKey,
      keyPair.secretKey
    )

    const iceCandidates = decrypt(
      response.encryptedIceCandidates!,
      response.trustedPubKey,
      keyPair.secretKey
    )

    const familyDataJson = decrypt(
      response.encryptedFamilyData!,
      response.trustedPubKey,
      keyPair.secretKey
    )

    if (!answer || !iceCandidates || !familyDataJson) {
      throw new Error('Failed to decrypt join response')
    }

    const familyData = JSON.parse(familyDataJson)
    const now = new Date().toISOString()

    // Create self member entry
    const selfMember: FamilyMember = {
      deviceId,
      deviceName,
      pubKey: keyPair.publicKey,
      addedAt: now,
      addedBy: response.trustedDeviceId,
      isManager: false,
    }

    this.config = {
      familyId: invite.familyId,
      deviceId,
      deviceName,
      keyPair,
      members: [...familyData.members, selfMember],
      blockedPubKeys: [],
      createdAt: familyData.members[0]?.addedAt || now,
      joinedAt: now,
      isCreator: false,
      isManager: false,
    }

    await this.saveConfig()

    return { config: this.config, answer, iceCandidates }
  }

  // ============= Member Management =============

  /**
   * Add a new member (called when receiving member.added event)
   */
  async addMember(member: FamilyMember): Promise<void> {
    if (!this.config) return

    // Check if already exists
    if (this.config.members.some(m => m.deviceId === member.deviceId)) {
      return
    }

    // Check if blocked
    if (this.config.blockedPubKeys.includes(member.pubKey)) {
      console.log('[Family] Ignoring blocked member:', member.deviceId)
      return
    }

    this.config.members.push(member)
    await this.saveConfig()
  }

  /**
   * Kick a member (manager only)
   */
  async kickMember(deviceId: string): Promise<void> {
    if (!this.config) {
      throw new Error('Not part of a family')
    }

    if (!this.config.isManager) {
      throw new Error('Only managers can kick members')
    }

    const member = this.config.members.find(m => m.deviceId === deviceId)
    if (!member) {
      throw new Error('Member not found')
    }

    if (member.deviceId === this.config.deviceId) {
      throw new Error('Cannot kick yourself')
    }

    // Add to blocklist
    this.config.blockedPubKeys.push(member.pubKey)

    // Remove from members
    this.config.members = this.config.members.filter(m => m.deviceId !== deviceId)

    await this.saveConfig()
  }

  /**
   * Handle being kicked (self-cleanup)
   */
  async handleKicked(): Promise<void> {
    if (!this.config) return

    // Delete config
    try {
      await fs.unlink(this.configPath)
    } catch {
      // Ignore
    }

    this.config = null
  }

  /**
   * Block a public key (for revocation)
   */
  async blockPubKey(pubKey: string): Promise<void> {
    if (!this.config) return

    if (!this.config.blockedPubKeys.includes(pubKey)) {
      this.config.blockedPubKeys.push(pubKey)
      await this.saveConfig()
    }
  }

  // ============= Legacy Support =============

  /**
   * Join using legacy QR code (v1)
   * @deprecated Use OAuth-style join flow instead
   */
  async joinFamily(payload: QRCodePayload, deviceName: string): Promise<FamilyConfig> {
    throw new Error('Legacy QR code format not supported. Please generate a new invite.')
  }

  /**
   * Get legacy QR code payload
   * @deprecated Use createInvite() instead
   */
  getQRCodePayload(): QRCodePayload | null {
    console.warn('[Family] getQRCodePayload is deprecated. Use createInvite() instead.')
    return null
  }

  /**
   * Get legacy QR code data
   * @deprecated Use getInviteQRData() instead
   */
  getQRCodeData(): string | null {
    console.warn('[Family] getQRCodeData is deprecated. Use createInvite() and getInviteQRData() instead.')
    return null
  }

  /**
   * Parse legacy QR code data
   * @deprecated
   */
  static parseQRCodeData(data: string): QRCodePayload {
    throw new Error('Legacy QR code format not supported.')
  }

  // ============= Other Methods =============

  /**
   * Update device name
   */
  async updateDeviceName(name: string): Promise<void> {
    if (!this.config) {
      throw new Error('Not part of a family')
    }

    this.config.deviceName = name

    // Update in members list too
    const selfMember = this.config.members.find(m => m.deviceId === this.config!.deviceId)
    if (selfMember) {
      selfMember.deviceName = name
    }

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

    try {
      await fs.unlink(this.configPath)
    } catch {
      // Ignore
    }

    this.config = null
    this.pendingInvites.clear()
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
   * Get the family ID
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
