/**
 * Family Manager - v2 OAuth-style device joining
 *
 * Implements the same protocol as desktop:
 * 1. Each device has its own NaCl box keypair (no shared family secret)
 * 2. QR code contains: nonce, one-time topic, inviter's public key
 * 3. New device posts encrypted offer to signaling server
 * 4. Trusted device polls, validates, auto-approves
 * 5. Trusted device posts encrypted answer + family data
 * 6. New device decrypts and saves config
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUUID } from "./events";
import {
  generateKeyPair,
  generateNonce,
  generateTopic,
  encrypt,
  decrypt,
  type KeyPair,
} from "./crypto";

const FAMILY_CONFIG_KEY = "@homeschool/family_config";
const DEVICE_CONFIG_KEY = "@homeschool/device_config";

// ============= Types (matching desktop v2) =============

export interface FamilyMember {
  deviceId: string;
  deviceName: string;
  pubKey: string;
  addedAt: string;
  addedBy: string;
  isManager: boolean;
}

export interface FamilyConfig {
  familyId: string;
  deviceId: string;
  deviceName: string;
  keyPair: KeyPair;
  members: FamilyMember[];
  blockedPubKeys: string[];
  createdAt: string;
  joinedAt: string;
  isCreator: boolean;
  isManager: boolean;
}

export interface InvitePayload {
  familyId: string;
  nonce: string;
  topic: string;
  inviterPubKey: string;
  inviterDeviceId: string;
  inviterDeviceName: string;
  expiresAt: number;
  version: 2;
}

export interface JoinRequest {
  nonce: string;
  newPubKey: string;
  newDeviceId: string;
  newDeviceName: string;
  encryptedOffer: string;
  encryptedIceCandidates: string;
}

export interface JoinResponse {
  approved: boolean;
  encryptedAnswer?: string;
  encryptedIceCandidates?: string;
  encryptedFamilyData?: string;
  trustedPubKey: string;
  trustedDeviceId: string;
}

export interface PendingInvite {
  invite: InvitePayload;
  createdAt: number;
}

// ============= V1 types for migration detection =============

interface V1FamilyConfig {
  familyId: string;
  publicKey: string;
  secretKey: string;
  createdAt: number;
}

interface V1DeviceConfig {
  deviceId: string;
  deviceName: string;
  isManager: boolean;
  joinedAt: number;
}

// ============= FamilyManager =============

export class FamilyManager {
  private static instance: FamilyManager | null = null;
  private familyConfig: FamilyConfig | null = null;
  private pendingInvites: Map<string, PendingInvite> = new Map();
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

    const familyJson = await AsyncStorage.getItem(FAMILY_CONFIG_KEY);
    if (familyJson) {
      const parsed = JSON.parse(familyJson);

      if (this.isV1Config(parsed)) {
        await this.migrateV1Config(parsed);
      } else {
        this.familyConfig = parsed as FamilyConfig;
      }
    }

    this.initialized = true;
  }

  // ============= Config Detection & Migration =============

  private isV1Config(config: Record<string, unknown>): boolean {
    return (
      typeof config.publicKey === "string" &&
      typeof config.secretKey === "string" &&
      !config.keyPair
    );
  }

  private async migrateV1Config(v1: V1FamilyConfig): Promise<void> {
    const deviceJson = await AsyncStorage.getItem(DEVICE_CONFIG_KEY);
    const v1Device: V1DeviceConfig | null = deviceJson
      ? JSON.parse(deviceJson)
      : null;

    const keyPair = generateKeyPair();
    const deviceId = v1Device?.deviceId || generateUUID();
    const deviceName = v1Device?.deviceName || "Mobile Device";
    const now = new Date().toISOString();

    const selfMember: FamilyMember = {
      deviceId,
      deviceName,
      pubKey: keyPair.publicKey,
      addedAt: now,
      addedBy: deviceId,
      isManager: v1Device?.isManager ?? true,
    };

    this.familyConfig = {
      familyId: v1.familyId,
      deviceId,
      deviceName,
      keyPair,
      members: [selfMember],
      blockedPubKeys: [],
      createdAt: new Date(v1.createdAt).toISOString(),
      joinedAt: v1Device ? new Date(v1Device.joinedAt).toISOString() : now,
      isCreator: v1Device?.isManager ?? true,
      isManager: v1Device?.isManager ?? true,
    };

    await this.saveConfig();
    await AsyncStorage.removeItem(DEVICE_CONFIG_KEY);
    console.log("[FamilyManager] Migrated v1 config to v2 format");
  }

  // ============= Accessors =============

  isSyncEnabled(): boolean {
    return this.familyConfig !== null;
  }

  getFamilyId(): string | null {
    return this.familyConfig?.familyId ?? null;
  }

  getDeviceId(): string | null {
    return this.familyConfig?.deviceId ?? null;
  }

  getDeviceName(): string | null {
    return this.familyConfig?.deviceName ?? null;
  }

  getPubKey(): string | null {
    return this.familyConfig?.keyPair.publicKey ?? null;
  }

  isManager(): boolean {
    return this.familyConfig?.isManager ?? false;
  }

  getMembers(): FamilyMember[] {
    return this.familyConfig?.members ?? [];
  }

  getConfig(): FamilyConfig | null {
    return this.familyConfig;
  }

  // ============= Family Creation =============

  async createFamily(deviceName: string): Promise<FamilyConfig> {
    const familyId = generateUUID();
    const deviceId = generateUUID();
    const keyPair = generateKeyPair();
    const now = new Date().toISOString();

    const selfMember: FamilyMember = {
      deviceId,
      deviceName,
      pubKey: keyPair.publicKey,
      addedAt: now,
      addedBy: deviceId,
      isManager: true,
    };

    this.familyConfig = {
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
    };

    await this.saveConfig();
    return this.familyConfig;
  }

  // ============= v2 Invite (OAuth-style) =============

  async createInvite(expirationHours = 48): Promise<InvitePayload> {
    if (!this.familyConfig) {
      throw new Error("[FamilyManager] No family configured");
    }
    if (!this.familyConfig.isManager) {
      throw new Error("[FamilyManager] Only managers can create invites");
    }

    const nonce = await generateNonce();
    const topic = await generateTopic();

    const invite: InvitePayload = {
      familyId: this.familyConfig.familyId,
      nonce,
      topic,
      inviterPubKey: this.familyConfig.keyPair.publicKey,
      inviterDeviceId: this.familyConfig.deviceId,
      inviterDeviceName: this.familyConfig.deviceName,
      expiresAt: Date.now() + expirationHours * 60 * 60 * 1000,
      version: 2,
    };

    this.pendingInvites.set(invite.topic, {
      invite,
      createdAt: Date.now(),
    });

    this.cleanupPendingInvites();
    return invite;
  }

  getInviteQRData(invite: InvitePayload): string {
    return btoa(JSON.stringify(invite));
  }

  static parseInviteQRData(data: string): InvitePayload {
    try {
      const json = atob(data.trim());
      const payload = JSON.parse(json);

      if (payload.version === 2) {
        if (
          !payload.familyId ||
          !payload.nonce ||
          !payload.topic ||
          !payload.inviterPubKey
        ) {
          throw new Error("Invalid invite: missing required fields");
        }
        return payload as InvitePayload;
      }

      throw new Error(
        "Legacy QR code format not supported. Please generate a new invite.",
      );
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("Invalid") || err.message.includes("Legacy"))
      ) {
        throw err;
      }
      throw new Error("Invalid QR code data: failed to parse");
    }
  }

  validateInvite(invite: InvitePayload): { valid: boolean; error?: string } {
    if (invite.expiresAt < Date.now()) {
      return { valid: false, error: "Invite has expired" };
    }
    if (invite.version !== 2) {
      return { valid: false, error: "Unsupported invite version" };
    }
    return { valid: true };
  }

  getPendingInvite(topic: string): InvitePayload | null {
    const pending = this.pendingInvites.get(topic);
    if (!pending) return null;

    if (pending.invite.expiresAt < Date.now()) {
      this.pendingInvites.delete(topic);
      return null;
    }

    return pending.invite;
  }

  removePendingInvite(topic: string): void {
    this.pendingInvites.delete(topic);
  }

  private cleanupPendingInvites(): void {
    const now = Date.now();
    for (const [topic, pending] of Array.from(this.pendingInvites.entries())) {
      if (pending.invite.expiresAt < now) {
        this.pendingInvites.delete(topic);
      }
    }
  }

  // ============= Join Flow (New Device Side) =============

  createJoinRequest(
    invite: InvitePayload,
    deviceName: string,
  ): { request: JoinRequest; keyPair: KeyPair; deviceId: string } {
    const keyPair = generateKeyPair();
    const deviceId = generateUUID();

    // Encrypt a placeholder offer (actual WebRTC negotiation happens later)
    const offerPayload = JSON.stringify({ type: "join", deviceName });
    const encryptedOffer = encrypt(
      offerPayload,
      invite.inviterPubKey,
      keyPair.secretKey,
    );
    const encryptedIceCandidates = encrypt(
      JSON.stringify([]),
      invite.inviterPubKey,
      keyPair.secretKey,
    );

    const request: JoinRequest = {
      nonce: invite.nonce,
      newPubKey: keyPair.publicKey,
      newDeviceId: deviceId,
      newDeviceName: deviceName,
      encryptedOffer,
      encryptedIceCandidates,
    };

    return { request, keyPair, deviceId };
  }

  // ============= Join Flow (Inviting Device Side) =============

  validateJoinRequest(
    request: JoinRequest,
    invite: InvitePayload,
  ): { valid: boolean; error?: string } {
    if (!this.familyConfig) {
      return { valid: false, error: "Not configured" };
    }

    if (request.nonce !== invite.nonce) {
      return { valid: false, error: "Invalid nonce" };
    }

    // Verify we can decrypt the offer (proves new device has a real keypair)
    const offer = decrypt(
      request.encryptedOffer,
      request.newPubKey,
      this.familyConfig.keyPair.secretKey,
    );

    if (!offer) {
      return { valid: false, error: "Failed to decrypt join request" };
    }

    return { valid: true };
  }

  createJoinResponse(request: JoinRequest): JoinResponse {
    if (!this.familyConfig) {
      throw new Error("[FamilyManager] Not configured");
    }

    // Encrypt family data for the new device
    const familyData = JSON.stringify({
      familyId: this.familyConfig.familyId,
      members: this.familyConfig.members,
    });

    const encryptedFamilyData = encrypt(
      familyData,
      request.newPubKey,
      this.familyConfig.keyPair.secretKey,
    );

    // Encrypt a placeholder answer
    const encryptedAnswer = encrypt(
      JSON.stringify({ type: "welcome" }),
      request.newPubKey,
      this.familyConfig.keyPair.secretKey,
    );

    const encryptedIceCandidates = encrypt(
      JSON.stringify([]),
      request.newPubKey,
      this.familyConfig.keyPair.secretKey,
    );

    return {
      approved: true,
      encryptedAnswer,
      encryptedIceCandidates,
      encryptedFamilyData,
      trustedPubKey: this.familyConfig.keyPair.publicKey,
      trustedDeviceId: this.familyConfig.deviceId,
    };
  }

  // ============= Join Completion (New Device Side) =============

  async completeJoin(
    invite: InvitePayload,
    response: JoinResponse,
    keyPair: KeyPair,
    deviceId: string,
    deviceName: string,
  ): Promise<FamilyConfig> {
    if (!response.approved) {
      throw new Error("[FamilyManager] Join request was rejected");
    }

    if (!response.encryptedFamilyData || !response.encryptedAnswer) {
      throw new Error("[FamilyManager] Missing encrypted data in response");
    }

    const familyDataJson = decrypt(
      response.encryptedFamilyData,
      response.trustedPubKey,
      keyPair.secretKey,
    );

    if (!familyDataJson) {
      throw new Error("[FamilyManager] Failed to decrypt family data");
    }

    const familyData = JSON.parse(familyDataJson) as {
      familyId: string;
      members: FamilyMember[];
    };
    const now = new Date().toISOString();

    const selfMember: FamilyMember = {
      deviceId,
      deviceName,
      pubKey: keyPair.publicKey,
      addedAt: now,
      addedBy: response.trustedDeviceId,
      isManager: false,
    };

    this.familyConfig = {
      familyId: invite.familyId,
      deviceId,
      deviceName,
      keyPair,
      members: [...familyData.members, selfMember],
      blockedPubKeys: [],
      createdAt: familyData.members[0]?.addedAt ?? now,
      joinedAt: now,
      isCreator: false,
      isManager: false,
    };

    await this.saveConfig();
    return this.familyConfig;
  }

  // ============= Member Management =============

  async addMember(member: FamilyMember): Promise<void> {
    if (!this.familyConfig) return;

    if (this.familyConfig.members.some((m) => m.deviceId === member.deviceId)) {
      return;
    }

    if (this.familyConfig.blockedPubKeys.includes(member.pubKey)) {
      console.log("[FamilyManager] Ignoring blocked member:", member.deviceId);
      return;
    }

    this.familyConfig.members.push(member);
    await this.saveConfig();
  }

  // ============= Leave / Update =============

  async leaveFamily(): Promise<void> {
    this.familyConfig = null;
    this.pendingInvites.clear();
    await AsyncStorage.removeItem(FAMILY_CONFIG_KEY);
    await AsyncStorage.removeItem(DEVICE_CONFIG_KEY);
  }

  async updateDeviceName(name: string): Promise<void> {
    if (!this.familyConfig) {
      throw new Error("[FamilyManager] No family configured");
    }

    this.familyConfig.deviceName = name;

    const selfMember = this.familyConfig.members.find(
      (m) => m.deviceId === this.familyConfig!.deviceId,
    );
    if (selfMember) {
      selfMember.deviceName = name;
    }

    await this.saveConfig();
  }

  // ============= Persistence =============

  private async saveConfig(): Promise<void> {
    if (!this.familyConfig) return;

    await AsyncStorage.setItem(
      FAMILY_CONFIG_KEY,
      JSON.stringify(this.familyConfig),
    );
  }
}
