/**
 * Cloud Backup Service
 *
 * Provides encrypted cloud backup of the CRDT event log.
 * End-to-end encrypted - the cloud server never sees plaintext data.
 *
 * Features:
 * - Automatic daily backup (opt-in)
 * - Manual backup/restore
 * - User holds the encryption key
 * - Works with any cloud storage provider
 */

import { getDatabase } from '../database'
import { getAuthService } from '../auth'
import * as crypto from 'crypto'

// Types
export interface BackupMetadata {
  id: string
  createdAt: string
  size: number
  eventCount: number
  checksum: string
  encryptionVersion: number
}

export interface BackupStatus {
  lastBackupAt: string | null
  lastBackupSize: number | null
  autoBackupEnabled: boolean
  isBackingUp: boolean
  error: string | null
}

export interface BackupConfig {
  autoBackupEnabled: boolean
  autoBackupTime: string // HH:MM format
  encryptionKey?: string // User-provided or auto-generated
}

// Storage keys
const BACKUP_CONFIG_KEY = 'backup_config'
const BACKUP_STATUS_KEY = 'backup_status'
const ENCRYPTION_KEY_KEY = 'backup_encryption_key'

// Cloud API configuration
const CLOUD_API_URL = process.env.CLOUD_API_URL || 'https://api.homeschool.scoble.life'

// Encryption settings
const ENCRYPTION_VERSION = 1
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

/**
 * Generate a secure encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/**
 * Derive encryption key from password using PBKDF2
 */
export function deriveKeyFromPassword(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256')
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encryptData(data: Buffer, keyHex: string): Buffer {
  const key = Buffer.from(keyHex, 'hex')
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Return: version (1 byte) + iv (16 bytes) + authTag (16 bytes) + encrypted data
  return Buffer.concat([
    Buffer.from([ENCRYPTION_VERSION]),
    iv,
    authTag,
    encrypted,
  ])
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decryptData(encryptedData: Buffer, keyHex: string): Buffer {
  const version = encryptedData[0]
  if (version !== ENCRYPTION_VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`)
  }

  const key = Buffer.from(keyHex, 'hex')
  const iv = encryptedData.subarray(1, 1 + IV_LENGTH)
  const authTag = encryptedData.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = encryptedData.subarray(1 + IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}

/**
 * Cloud Backup Service
 */
class CloudBackupService {
  private static instance: CloudBackupService | null = null

  private config: BackupConfig = {
    autoBackupEnabled: false,
    autoBackupTime: '02:00', // 2 AM default
  }

  private status: BackupStatus = {
    lastBackupAt: null,
    lastBackupSize: null,
    autoBackupEnabled: false,
    isBackingUp: false,
    error: null,
  }

  private encryptionKey: string | null = null
  private autoBackupTimer: NodeJS.Timeout | null = null
  private statusListeners: Set<(status: BackupStatus) => void> = new Set()

  private constructor() {}

  static getInstance(): CloudBackupService {
    if (!CloudBackupService.instance) {
      CloudBackupService.instance = new CloudBackupService()
    }
    return CloudBackupService.instance
  }

  /**
   * Initialize the backup service
   */
  async initialize(): Promise<void> {
    try {
      const db = await getDatabase()

      // Load config
      const configResult = await db.all<{ value: string }>(
        `SELECT value FROM settings WHERE key = ?`,
        [BACKUP_CONFIG_KEY]
      )
      if (configResult.length > 0) {
        this.config = JSON.parse(configResult[0].value) as BackupConfig
      }

      // Load status
      const statusResult = await db.all<{ value: string }>(
        `SELECT value FROM settings WHERE key = ?`,
        [BACKUP_STATUS_KEY]
      )
      if (statusResult.length > 0) {
        const savedStatus = JSON.parse(statusResult[0].value) as Partial<BackupStatus>
        this.status = {
          ...this.status,
          lastBackupAt: savedStatus.lastBackupAt || null,
          lastBackupSize: savedStatus.lastBackupSize || null,
        }
      }

      // Load encryption key
      const keyResult = await db.all<{ value: string }>(
        `SELECT value FROM settings WHERE key = ?`,
        [ENCRYPTION_KEY_KEY]
      )
      if (keyResult.length > 0) {
        this.encryptionKey = keyResult[0].value
      }

      // Start auto-backup if enabled
      if (this.config.autoBackupEnabled) {
        this.scheduleAutoBackup()
      }

      console.log('[CloudBackup] Initialized')
    } catch (err) {
      console.error('[CloudBackup] Initialization error:', err)
    }
  }

  /**
   * Get current backup status
   */
  getStatus(): BackupStatus {
    return {
      ...this.status,
      autoBackupEnabled: this.config.autoBackupEnabled,
    }
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: (status: BackupStatus) => void): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  /**
   * Get or generate encryption key
   * The key is stored locally and never sent to the server
   */
  async getEncryptionKey(): Promise<string> {
    if (!this.encryptionKey) {
      this.encryptionKey = generateEncryptionKey()

      const db = await getDatabase()
      await db.run(
        `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
        [ENCRYPTION_KEY_KEY, this.encryptionKey]
      )
    }
    return this.encryptionKey
  }

  /**
   * Set encryption key from user-provided value
   */
  async setEncryptionKey(key: string): Promise<void> {
    if (key.length !== KEY_LENGTH * 2) {
      throw new Error('Invalid encryption key length')
    }

    this.encryptionKey = key
    const db = await getDatabase()
    await db.run(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
      [ENCRYPTION_KEY_KEY, key]
    )
  }

  /**
   * Export encryption key for user backup
   */
  async exportEncryptionKey(): Promise<string> {
    return await this.getEncryptionKey()
  }

  /**
   * Enable/disable automatic backups
   */
  async setAutoBackupEnabled(enabled: boolean): Promise<void> {
    this.config.autoBackupEnabled = enabled
    await this.saveConfig()

    if (enabled) {
      this.scheduleAutoBackup()
    } else if (this.autoBackupTimer) {
      clearTimeout(this.autoBackupTimer)
      this.autoBackupTimer = null
    }

    this.updateStatus({ autoBackupEnabled: enabled })
  }

  /**
   * Create a backup
   */
  async createBackup(): Promise<BackupMetadata | null> {
    const authService = getAuthService()
    if (!authService.isAuthenticated()) {
      throw new Error('Must be logged in to create cloud backup')
    }

    const token = await authService.getAccessToken()
    if (!token) {
      throw new Error('Failed to get access token')
    }

    try {
      this.updateStatus({ isBackingUp: true, error: null })

      // Get event log data
      const db = await getDatabase()
      const events = await db.all(`SELECT * FROM sync_events ORDER BY timestamp ASC`)

      if (events.length === 0) {
        this.updateStatus({ isBackingUp: false })
        return null
      }

      // Serialize events
      const eventData = JSON.stringify(events)
      const dataBuffer = Buffer.from(eventData, 'utf-8')

      // Encrypt
      const key = await this.getEncryptionKey()
      const encryptedData = encryptData(dataBuffer, key)

      // Calculate checksum
      const checksum = crypto.createHash('sha256').update(encryptedData).digest('hex')

      // Upload to cloud
      const response = await fetch(`${CLOUD_API_URL}/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          Authorization: `Bearer ${token}`,
          'X-Backup-Checksum': checksum,
          'X-Event-Count': events.length.toString(),
        },
        body: encryptedData,
      })

      if (!response.ok) {
        const errorData = await response.json() as { message?: string }
        throw new Error(errorData.message || 'Backup upload failed')
      }

      const metadata = await response.json() as BackupMetadata

      // Update status
      this.updateStatus({
        isBackingUp: false,
        lastBackupAt: metadata.createdAt,
        lastBackupSize: metadata.size,
      })
      await this.saveStatus()

      console.log('[CloudBackup] Backup created:', metadata.id)
      return metadata
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup failed'
      this.updateStatus({ isBackingUp: false, error: message })
      throw err
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    const authService = getAuthService()
    if (!authService.isAuthenticated()) {
      throw new Error('Must be logged in to list backups')
    }

    const token = await authService.getAccessToken()
    if (!token) {
      throw new Error('Failed to get access token')
    }

    const response = await fetch(`${CLOUD_API_URL}/backup`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to list backups')
    }

    return await response.json() as BackupMetadata[]
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(backupId: string): Promise<number> {
    const authService = getAuthService()
    if (!authService.isAuthenticated()) {
      throw new Error('Must be logged in to restore backup')
    }

    const token = await authService.getAccessToken()
    if (!token) {
      throw new Error('Failed to get access token')
    }

    try {
      // Download encrypted backup
      const response = await fetch(`${CLOUD_API_URL}/backup/${backupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to download backup')
      }

      const encryptedData = Buffer.from(await response.arrayBuffer())

      // Verify checksum
      const expectedChecksum = response.headers.get('X-Backup-Checksum')
      const actualChecksum = crypto.createHash('sha256').update(encryptedData).digest('hex')

      if (expectedChecksum && actualChecksum !== expectedChecksum) {
        throw new Error('Backup checksum mismatch - data may be corrupted')
      }

      // Decrypt
      const key = await this.getEncryptionKey()
      const decryptedData = decryptData(encryptedData, key)

      // Parse events
      interface SyncEventRow {
        id: string
        type: string
        data: string
        device_id: string
        timestamp: string
        processed: boolean
      }
      const events = JSON.parse(decryptedData.toString('utf-8')) as SyncEventRow[]

      // Insert events into database
      const db = await getDatabase()
      let insertedCount = 0

      for (const event of events) {
        // Check if event already exists
        const existing = await db.all(
          `SELECT id FROM sync_events WHERE id = ?`,
          [event.id]
        )

        if (existing.length === 0) {
          await db.run(
            `INSERT INTO sync_events (id, type, data, device_id, timestamp, processed)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              event.id,
              event.type,
              event.data,
              event.device_id,
              event.timestamp,
              event.processed,
            ]
          )
          insertedCount++
        }
      }

      console.log('[CloudBackup] Restored', insertedCount, 'events from backup')
      return insertedCount
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Restore failed'
      throw new Error(message)
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const authService = getAuthService()
    if (!authService.isAuthenticated()) {
      throw new Error('Must be logged in to delete backup')
    }

    const token = await authService.getAccessToken()
    if (!token) {
      throw new Error('Failed to get access token')
    }

    const response = await fetch(`${CLOUD_API_URL}/backup/${backupId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to delete backup')
    }
  }

  // Private methods

  private scheduleAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearTimeout(this.autoBackupTimer)
    }

    // Calculate time until next backup
    const [hours, minutes] = this.config.autoBackupTime.split(':').map(Number)
    const now = new Date()
    const nextBackup = new Date()
    nextBackup.setHours(hours, minutes, 0, 0)

    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1)
    }

    const msUntilBackup = nextBackup.getTime() - now.getTime()

    this.autoBackupTimer = setTimeout(async () => {
      try {
        await this.createBackup()
      } catch (error) {
        console.error('[CloudBackup] Auto-backup failed:', error)
      }

      // Schedule next backup
      this.scheduleAutoBackup()
    }, msUntilBackup)

    console.log('[CloudBackup] Auto-backup scheduled for', nextBackup.toISOString())
  }

  private updateStatus(partialStatus: Partial<BackupStatus>): void {
    this.status = { ...this.status, ...partialStatus }
    this.notifyListeners()
  }

  private notifyListeners(): void {
    const listeners = Array.from(this.statusListeners)
    for (const listener of listeners) {
      try {
        listener(this.status)
      } catch (err) {
        console.error('[CloudBackup] Error in status listener:', err)
      }
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      const db = await getDatabase()
      await db.run(
        `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
        [BACKUP_CONFIG_KEY, JSON.stringify(this.config)]
      )
    } catch (err) {
      console.error('[CloudBackup] Failed to save config:', err)
    }
  }

  private async saveStatus(): Promise<void> {
    try {
      const db = await getDatabase()
      await db.run(
        `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
        [BACKUP_STATUS_KEY, JSON.stringify({
          lastBackupAt: this.status.lastBackupAt,
          lastBackupSize: this.status.lastBackupSize,
        })]
      )
    } catch (err) {
      console.error('[CloudBackup] Failed to save status:', err)
    }
  }
}

/**
 * Get the singleton backup service instance
 */
export function getCloudBackupService(): CloudBackupService {
  return CloudBackupService.getInstance()
}
