/**
 * Family Manager - handles family creation, joining, and credentials
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUUID } from "./events";
import * as Crypto from "expo-crypto";

const FAMILY_CONFIG_KEY = "@homeschool/family_config";
const DEVICE_CONFIG_KEY = "@homeschool/device_config";

export interface FamilyConfig {
  familyId: string;
  publicKey: string;
  secretKey: string;
  createdAt: number;
}

export interface DeviceConfig {
  deviceId: string;
  deviceName: string;
  isManager: boolean;
  joinedAt: number;
}

export interface FamilyInvite {
  familyId: string;
  publicKey: string;
  secretKey: string;
  version?: number; // Desktop includes version: 1
}

export class FamilyManager {
  private static instance: FamilyManager | null = null;
  private familyConfig: FamilyConfig | null = null;
  private deviceConfig: DeviceConfig | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): FamilyManager {
    if (!FamilyManager.instance) {
      FamilyManager.instance = new FamilyManager();
    }
    return FamilyManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load family config
    const familyJson = await AsyncStorage.getItem(FAMILY_CONFIG_KEY);
    if (familyJson) {
      this.familyConfig = JSON.parse(familyJson);
    }

    // Load device config
    const deviceJson = await AsyncStorage.getItem(DEVICE_CONFIG_KEY);
    if (deviceJson) {
      this.deviceConfig = JSON.parse(deviceJson);
    }

    this.initialized = true;
  }

  /**
   * Check if sync is enabled (family is configured)
   */
  isSyncEnabled(): boolean {
    return this.familyConfig !== null && this.deviceConfig !== null;
  }

  /**
   * Get the family ID
   */
  getFamilyId(): string | null {
    return this.familyConfig?.familyId || null;
  }

  /**
   * Get the device ID
   */
  getDeviceId(): string | null {
    return this.deviceConfig?.deviceId || null;
  }

  /**
   * Get device name
   */
  getDeviceName(): string | null {
    return this.deviceConfig?.deviceName || null;
  }

  /**
   * Get public key for this family
   */
  getPubKey(): string | null {
    return this.familyConfig?.publicKey || null;
  }

  /**
   * Check if this device is the family manager
   */
  isManager(): boolean {
    return this.deviceConfig?.isManager || false;
  }

  /**
   * Create a new family
   */
  async createFamily(deviceName: string): Promise<FamilyConfig> {
    const familyId = generateUUID();

    // Generate keypair for the family (using random bytes as placeholder)
    // In production, use proper Ed25519 keypair
    const publicKeyBytes = await Crypto.getRandomBytesAsync(32);
    const secretKeyBytes = await Crypto.getRandomBytesAsync(64);

    const publicKey = this.bytesToHex(publicKeyBytes);
    const secretKey = this.bytesToHex(secretKeyBytes);

    this.familyConfig = {
      familyId,
      publicKey,
      secretKey,
      createdAt: Date.now(),
    };

    this.deviceConfig = {
      deviceId: generateUUID(),
      deviceName,
      isManager: true,
      joinedAt: Date.now(),
    };

    await this.saveConfig();

    return this.familyConfig;
  }

  /**
   * Join an existing family via QR code data
   */
  async joinFamily(qrData: string, deviceName: string): Promise<void> {
    const invite = this.parseInviteCode(qrData);

    this.familyConfig = {
      familyId: invite.familyId,
      publicKey: invite.publicKey,
      secretKey: invite.secretKey,
      createdAt: Date.now(),
    };

    this.deviceConfig = {
      deviceId: generateUUID(),
      deviceName,
      isManager: false,
      joinedAt: Date.now(),
    };

    await this.saveConfig();
  }

  /**
   * Leave the current family
   */
  async leaveFamily(): Promise<void> {
    this.familyConfig = null;
    this.deviceConfig = null;

    await AsyncStorage.removeItem(FAMILY_CONFIG_KEY);
    await AsyncStorage.removeItem(DEVICE_CONFIG_KEY);
  }

  /**
   * Generate QR code data for sharing
   */
  getInviteCode(): string {
    if (!this.familyConfig) {
      throw new Error("No family configured");
    }

    const invite: FamilyInvite = {
      familyId: this.familyConfig.familyId,
      publicKey: this.familyConfig.publicKey,
      secretKey: this.familyConfig.secretKey,
      version: 1, // Match desktop format
    };

    return this.encodeInvite(invite);
  }

  /**
   * Get a human-readable invite message
   */
  getInviteMessage(): string {
    const code = this.getInviteCode();
    return `Join my Homeschool family!\n\nOpen the Homeschool app and scan this code or paste it in the "Join Family" screen:\n\n${code}`;
  }

  /**
   * Update device name
   */
  async updateDeviceName(name: string): Promise<void> {
    if (!this.deviceConfig) {
      throw new Error("No device configured");
    }

    this.deviceConfig.deviceName = name;
    await this.saveConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): { family: FamilyConfig | null; device: DeviceConfig | null } {
    return {
      family: this.familyConfig,
      device: this.deviceConfig,
    };
  }

  // Private helpers

  private async saveConfig(): Promise<void> {
    if (this.familyConfig) {
      await AsyncStorage.setItem(
        FAMILY_CONFIG_KEY,
        JSON.stringify(this.familyConfig),
      );
    }
    if (this.deviceConfig) {
      await AsyncStorage.setItem(
        DEVICE_CONFIG_KEY,
        JSON.stringify(this.deviceConfig),
      );
    }
  }

  private encodeInvite(invite: FamilyInvite): string {
    const json = JSON.stringify(invite);
    // Base64 encode for QR code
    return btoa(json);
  }

  private parseInviteCode(code: string): FamilyInvite {
    try {
      // Try to decode as base64
      const json = atob(code.trim());
      const invite = JSON.parse(json) as FamilyInvite;

      if (!invite.familyId || !invite.publicKey || !invite.secretKey) {
        throw new Error("Invalid invite code: missing required fields");
      }

      return invite;
    } catch (error) {
      throw new Error("Invalid invite code format");
    }
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}
