/**
 * SyncSettings - Family sync configuration and status
 *
 * Shows:
 * - Family sync status (enabled/disabled)
 * - Create/join family options
 * - QR code for sharing
 * - Connected peers (mesh members)
 * - Device info
 */

import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@headlessui/react";
import { QRCodeSVG } from "qrcode.react";
import type {
  SyncStatus,
  SyncPeerInfo,
  SyncRecoveryStatus,
  SyncRecoveryResult,
} from "../../../../shared/types";
import { Button } from "../ui/Button";
import { Input, Textarea, FormField } from "../ui/Input";
import { Card } from "../ui/Card";

export default function SyncSettings(): JSX.Element {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTroubleshootModal, setShowTroubleshootModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Form state
  const [deviceName, setDeviceName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [qrData, setQrData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Recovery state
  const [healthStatus, setHealthStatus] = useState<SyncRecoveryStatus | null>(
    null,
  );
  const [backups, setBackups] = useState<
    Array<{ name: string; timestamp: number; path: string }>
  >([]);
  const [recoveryResult, setRecoveryResult] =
    useState<SyncRecoveryResult | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Load sync status
  const loadStatus = useCallback(async () => {
    try {
      await window.api.syncInitialize();
      const status = await window.api.syncGetStatus();
      setSyncStatus(status);
      setError(null);

      // Check if we're the manager
      if (status.isEnabled) {
        const managerStatus = await window.api.syncIsManager();
        setIsManager(managerStatus);
      }
    } catch (err) {
      setError("Failed to load sync status");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Listen for peer events
  useEffect(() => {
    const cleanupConnected = window.api.onSyncPeerConnected(() => {
      loadStatus();
    });
    const cleanupDisconnected = window.api.onSyncPeerDisconnected(() => {
      loadStatus();
    });
    const cleanupCompleted = window.api.onSyncCompleted(() => {
      loadStatus();
    });

    return () => {
      cleanupConnected();
      cleanupDisconnected();
      cleanupCompleted();
    };
  }, [loadStatus]);

  // Create family
  const handleCreateFamily = async (): Promise<void> => {
    if (!deviceName.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      const result = await window.api.syncCreateFamily(deviceName.trim());
      if (result.success) {
        setShowCreateModal(false);
        setDeviceName("");
        await loadStatus();
      } else {
        setError(result.error || "Failed to create family");
      }
    } catch {
      setError("Failed to create family");
    } finally {
      setIsProcessing(false);
    }
  };

  // Join family
  const handleJoinFamily = async (): Promise<void> => {
    if (!deviceName.trim() || !joinCode.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      const result = await window.api.syncJoinFamily(
        joinCode.trim(),
        deviceName.trim(),
      );
      if (result.success) {
        setShowJoinModal(false);
        setDeviceName("");
        setJoinCode("");
        await loadStatus();
      } else {
        setError(result.error || "Failed to join family");
      }
    } catch {
      setError("Failed to join family");
    } finally {
      setIsProcessing(false);
    }
  };

  // Leave family
  const handleLeaveFamily = async (): Promise<void> => {
    if (
      !confirm(
        "Are you sure you want to leave this family? You will need to rejoin using a QR code.",
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await window.api.syncLeaveFamily();
      if (result.success) {
        await loadStatus();
      } else {
        setError(result.error || "Failed to leave family");
      }
    } catch {
      setError("Failed to leave family");
    } finally {
      setIsProcessing(false);
    }
  };

  // Show QR code
  const handleShowQR = async (): Promise<void> => {
    try {
      const result = await window.api.syncGetQRCode();
      if (result.success && result.qrData) {
        setQrData(result.qrData);
        setShowQRModal(true);
      } else {
        setError("Failed to generate QR code");
      }
    } catch {
      setError("Failed to generate QR code");
    }
  };

  // Kick a member (manager only)
  const handleKickMember = async (
    deviceId: string,
    deviceName: string,
  ): Promise<void> => {
    if (
      !confirm(
        `Are you sure you want to remove "${deviceName}" from this family? They will not be able to reconnect without a new invite.`,
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await window.api.syncKickMember(deviceId, deviceName);
      if (result.success) {
        await loadStatus();
      } else {
        setError(result.error || "Failed to kick member");
      }
    } catch {
      setError("Failed to kick member");
    } finally {
      setIsProcessing(false);
    }
  };

  // Open troubleshoot modal and load health data
  const handleOpenTroubleshoot = async (): Promise<void> => {
    setShowTroubleshootModal(true);
    setIsCheckingHealth(true);
    setRecoveryResult(null);

    try {
      const [health, backupList] = await Promise.all([
        window.api.syncCheckHealth(),
        window.api.syncListBackups(),
      ]);
      setHealthStatus(health);
      setBackups(backupList);
    } catch (err) {
      console.error("Failed to check sync health:", err);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Reset sync (full reset)
  const handleResetSync = async (): Promise<void> => {
    setIsProcessing(true);
    setRecoveryResult(null);

    try {
      const result = await window.api.syncReset();
      setRecoveryResult(result);
      if (result.success) {
        setShowResetConfirmModal(false);
        // Reload after a short delay
        setTimeout(() => {
          loadStatus();
          setShowTroubleshootModal(false);
        }, 1500);
      }
    } catch (err) {
      setRecoveryResult({
        success: false,
        message: `Reset failed: ${(err as Error).message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Attempt recovery
  const handleRecoverSync = async (): Promise<void> => {
    setIsProcessing(true);
    setRecoveryResult(null);

    try {
      const result = await window.api.syncRecover();
      setRecoveryResult(result);
      if (result.success) {
        // Refresh health status
        const health = await window.api.syncCheckHealth();
        setHealthStatus(health);
        const backupList = await window.api.syncListBackups();
        setBackups(backupList);
      }
    } catch (err) {
      setRecoveryResult({
        success: false,
        message: `Recovery failed: ${(err as Error).message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore from backup
  const handleRestoreBackup = async (backupName: string): Promise<void> => {
    if (
      !confirm(
        `Restore from backup "${backupName}"? This will replace your current sync data.`,
      )
    ) {
      return;
    }

    setIsProcessing(true);
    setRecoveryResult(null);

    try {
      const result = await window.api.syncRestoreBackup(backupName);
      setRecoveryResult(result);
      if (result.success) {
        // Refresh health status
        const health = await window.api.syncCheckHealth();
        setHealthStatus(health);
      }
    } catch (err) {
      setRecoveryResult({
        success: false,
        message: `Restore failed: ${(err as Error).message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-neutral-text mb-4">
          Family Sync
        </h2>
        <div className="text-neutral-textSecondary">Loading...</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-text">
            Family Sync
          </h2>
          <p className="text-sm text-neutral-textSecondary">
            Sync your data across family devices without any servers
          </p>
        </div>
        {syncStatus?.isEnabled && (
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              syncStatus.isConnected
                ? "bg-status-successLight text-status-successDark"
                : "bg-status-warningLight text-status-warningDark"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus.isConnected
                  ? "bg-status-success"
                  : "bg-status-warning"
              }`}
            />
            {syncStatus.isConnected ? "Connected" : "Waiting for peers"}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-status-errorLight border border-status-error/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-status-errorDark">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="text-status-error mt-1"
          >
            Dismiss
          </Button>
        </div>
      )}

      {!syncStatus?.isEnabled ? (
        // Not in a family yet
        <div className="space-y-4">
          <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔐</div>
              <div>
                <p className="font-medium text-brand-primaryDark">
                  Private P2P Sync
                </p>
                <p className="text-sm text-neutral-textSecondary mt-1">
                  Your data syncs directly between family devices using
                  encrypted peer-to-peer connections. No servers, no cloud
                  storage - your data stays yours.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(true)}
              className="p-4 border-2 border-dashed border-neutral-border rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-colors text-left"
            >
              <div className="text-2xl mb-2">✨</div>
              <div className="font-medium text-neutral-text">Create Family</div>
              <p className="text-sm text-neutral-textSecondary mt-1">
                Start a new family sync group and invite others
              </p>
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowJoinModal(true)}
              className="p-4 border-2 border-dashed border-neutral-border rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🔗</div>
              <div className="font-medium text-neutral-text">Join Family</div>
              <p className="text-sm text-neutral-textSecondary mt-1">
                Enter a code from another family device
              </p>
            </Button>
          </div>
        </div>
      ) : (
        // In a family
        <div className="space-y-6">
          {/* Device Info */}
          <div className="bg-neutral-backgroundSecondary rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-neutral-textSecondary">
                    This Device
                  </div>
                  {isManager && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-brand-primary/10 text-brand-primaryDark rounded-full">
                      Manager
                    </span>
                  )}
                </div>
                <div className="font-medium text-neutral-text">
                  {syncStatus.familyStatus.deviceName || "Unnamed Device"}
                </div>
                <div className="text-xs text-neutral-textTertiary font-mono mt-1">
                  ID: {syncStatus.familyStatus.deviceId?.slice(0, 8)}...
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleShowQR}
                leftIcon={<span>👋</span>}
              >
                Invite Family
              </Button>
            </div>
          </div>

          {/* Mesh Network Status */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-neutral-text">
                Family Mesh Network
              </h3>
              <div className="text-sm text-neutral-textSecondary">
                {syncStatus.connectedPeers.length} device
                {syncStatus.connectedPeers.length !== 1 ? "s" : ""} online
              </div>
            </div>

            <div className="bg-status-infoLight border border-status-info/20 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <span className="text-lg">🛡️</span>
                <div>
                  <p className="text-sm text-status-infoDark font-medium">
                    Your data never touches our servers
                  </p>
                  <p className="text-xs text-neutral-textSecondary mt-1">
                    All connections below are direct device-to-device using
                    end-to-end encryption. Only devices in this list can see
                    your data.
                  </p>
                </div>
              </div>
            </div>

            <PeerList
              peers={syncStatus.connectedPeers}
              currentDeviceId={syncStatus.familyStatus.deviceId}
              isManager={isManager}
              onKickMember={handleKickMember}
              isProcessing={isProcessing}
            />

            {syncStatus.pendingEvents > 0 && (
              <div className="mt-3 text-sm text-status-warning flex items-center gap-2">
                <span className="animate-pulse">●</span>
                {syncStatus.pendingEvents} event
                {syncStatus.pendingEvents !== 1 ? "s" : ""} waiting to sync
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-border flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveFamily}
              disabled={isProcessing}
              className="text-status-error hover:text-status-errorDark"
            >
              Leave Family Sync
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenTroubleshoot}
              leftIcon={<span>🔧</span>}
            >
              Troubleshoot
            </Button>
          </div>
        </div>
      )}

      {/* Create Family Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-neutral-text mb-4">
              Create Family Sync
            </Dialog.Title>

            <div className="space-y-4">
              <p className="text-sm text-neutral-textSecondary">
                Create a new family sync group. You'll get a QR code to share
                with other family devices.
              </p>

              <FormField
                label="Device Name"
                hint="This helps identify this device in the family network"
              >
                <Input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., Mom's MacBook, Kitchen iPad"
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateFamily}
                  disabled={!deviceName.trim() || isProcessing}
                  loading={isProcessing}
                >
                  Create Family
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Join Family Modal */}
      <Dialog
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-neutral-text mb-4">
              Join Family
            </Dialog.Title>

            <div className="space-y-4">
              <p className="text-sm text-neutral-textSecondary">
                Enter the sync code from another family device. You can find it
                by clicking "Show QR Code" on that device.
              </p>

              <FormField label="Device Name">
                <Input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., Dad's Laptop, School Computer"
                />
              </FormField>

              <FormField
                label="Sync Code"
                hint="Copy the code shown below the QR code on the other device"
              >
                <Textarea
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="Paste the sync code here..."
                  rows={4}
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowJoinModal(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleJoinFamily}
                  disabled={
                    !deviceName.trim() || !joinCode.trim() || isProcessing
                  }
                  loading={isProcessing}
                >
                  Join Family
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-neutral-text mb-4 text-center">
              Invite Family Member
            </Dialog.Title>

            <div className="space-y-4">
              <div className="bg-status-warningLight border border-status-warning/20 rounded-lg p-3">
                <p className="text-sm text-status-warningDark flex items-center gap-2">
                  <span>⚠️</span>
                  Only share this code with trusted family members
                </p>
              </div>

              {qrData && (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <QRCodeSVG
                      value={qrData}
                      size={180}
                      level="M"
                      includeMargin
                    />
                  </div>

                  {/* Share Buttons */}
                  <div className="w-full space-y-3">
                    <p className="text-sm text-neutral-textSecondary text-center">
                      Send invite via:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await window.api.syncShareInvite("email", qrData);
                          } catch (error) {
                            console.error(
                              "[SyncSettings] Failed to share invite via email:",
                              error,
                            );
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-status-infoLight hover:bg-status-info/20 text-status-infoDark rounded-lg transition-colors"
                      >
                        <span className="text-xl">📧</span>
                        <span className="font-medium">Email</span>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await window.api.syncShareInvite("sms", qrData);
                          } catch (error) {
                            console.error(
                              "[SyncSettings] Failed to share invite via SMS:",
                              error,
                            );
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-status-successLight hover:bg-status-success/20 text-status-successDark rounded-lg transition-colors"
                      >
                        <span className="text-xl">💬</span>
                        <span className="font-medium">Text</span>
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-border" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-neutral-textSecondary">
                          or copy code
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <Textarea
                        readOnly
                        value={qrData}
                        className="font-mono text-xs pr-16"
                        rows={2}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const result =
                              await window.api.syncGetInviteMessage(qrData);
                            if (result.success) {
                              await navigator.clipboard.writeText(
                                result.message,
                              );
                              // Show brief feedback
                              const btn =
                                document.activeElement as HTMLButtonElement;
                              const originalText = btn.textContent;
                              btn.textContent = "Copied!";
                              setTimeout(() => {
                                btn.textContent = originalText;
                              }, 1500);
                            }
                          } catch (error) {
                            console.error(
                              "[SyncSettings] Failed to copy invite message:",
                              error,
                            );
                          }
                        }}
                        className="absolute top-2 right-2 px-2 py-1 text-xs bg-brand-primary/10 text-brand-primaryDark rounded hover:bg-brand-primary/20 transition-colors"
                      >
                        Copy All
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowQRModal(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Troubleshoot Modal */}
      <Dialog
        open={showTroubleshootModal}
        onClose={() => setShowTroubleshootModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-neutral-text mb-4">
              Sync Troubleshooting
            </Dialog.Title>

            <div className="space-y-6">
              {/* Health Status */}
              <div>
                <h3 className="font-medium text-neutral-text mb-2">
                  Sync Health
                </h3>
                {isCheckingHealth ? (
                  <div className="text-neutral-textSecondary">Checking...</div>
                ) : healthStatus ? (
                  <div
                    className={`p-3 rounded-lg ${
                      healthStatus.isCorrupted
                        ? "bg-status-errorLight border border-status-error/20"
                        : "bg-status-successLight border border-status-success/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {healthStatus.isCorrupted ? "⚠️" : "✅"}
                      </span>
                      <div>
                        <div
                          className={`font-medium ${
                            healthStatus.isCorrupted
                              ? "text-status-errorDark"
                              : "text-status-successDark"
                          }`}
                        >
                          {healthStatus.isCorrupted
                            ? "Issues Detected"
                            : "Healthy"}
                        </div>
                        {healthStatus.isCorrupted &&
                          healthStatus.corruptionDetails && (
                            <div className="text-sm text-status-errorDark mt-1">
                              {healthStatus.corruptionDetails}
                            </div>
                          )}
                        <div className="text-sm text-neutral-textSecondary mt-1">
                          {healthStatus.eventLogLength} events in sync log
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-textSecondary">
                    Unable to check health
                  </div>
                )}
              </div>

              {/* Recovery Result */}
              {recoveryResult && (
                <div
                  className={`p-3 rounded-lg ${
                    recoveryResult.success
                      ? "bg-status-successLight border border-status-success/20"
                      : "bg-status-errorLight border border-status-error/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {recoveryResult.success ? "✅" : "❌"}
                    </span>
                    <div
                      className={
                        recoveryResult.success
                          ? "text-status-successDark"
                          : "text-status-errorDark"
                      }
                    >
                      {recoveryResult.message}
                    </div>
                  </div>
                </div>
              )}

              {/* Recovery Actions */}
              {healthStatus?.isCorrupted && healthStatus.canRecover && (
                <div>
                  <h3 className="font-medium text-neutral-text mb-2">
                    Recovery Options
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={handleRecoverSync}
                    disabled={isProcessing}
                    className="w-full p-3 text-left border border-neutral-border rounded-lg hover:bg-status-infoLight transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔄</span>
                      <div>
                        <div className="font-medium text-neutral-text">
                          Attempt Recovery
                        </div>
                        <div className="text-sm text-neutral-textSecondary">
                          Try to repair the sync log by salvaging valid events
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              )}

              {/* Backups */}
              {backups.length > 0 && (
                <div>
                  <h3 className="font-medium text-neutral-text mb-2">
                    Available Backups
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {backups.map((backup) => (
                      <div
                        key={backup.name}
                        className="flex items-center justify-between p-2 border border-neutral-border rounded-lg"
                      >
                        <div>
                          <div className="text-sm font-medium text-neutral-text">
                            {new Date(backup.timestamp).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-textTertiary font-mono">
                            {backup.name}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestoreBackup(backup.name)}
                          disabled={isProcessing}
                          className="text-xs px-2 py-1 text-status-info hover:bg-status-infoLight rounded transition-colors disabled:opacity-50"
                        >
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Option */}
              <div className="pt-4 border-t border-neutral-border">
                <h3 className="font-medium text-neutral-text mb-2">
                  Reset Sync
                </h3>
                <p className="text-sm text-neutral-textSecondary mb-3">
                  If sync continues to have issues, you can reset all sync data.
                  This will delete your sync history but preserve your local
                  data. You'll need to rejoin the family.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowResetConfirmModal(true)}
                  disabled={isProcessing}
                  className="text-status-error border-status-error/30 hover:bg-status-errorLight"
                >
                  Reset Sync Data
                </Button>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowTroubleshootModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Reset Confirmation Modal */}
      <Dialog
        open={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-neutral-text mb-4">
              Confirm Reset
            </Dialog.Title>

            <div className="space-y-4">
              <div className="bg-status-warningLight border border-status-warning/20 rounded-lg p-3">
                <p className="text-sm text-status-warningDark flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>
                    This will delete all sync data including your event history.
                    Your local data (activities, students, etc.) will be
                    preserved. You will need to rejoin the family using a new
                    invite.
                  </span>
                </p>
              </div>

              {recoveryResult && !recoveryResult.success && (
                <div className="bg-status-errorLight border border-status-error/20 rounded-lg p-3">
                  <p className="text-sm text-status-errorDark">
                    {recoveryResult.message}
                  </p>
                </div>
              )}

              {recoveryResult && recoveryResult.success && (
                <div className="bg-status-successLight border border-status-success/20 rounded-lg p-3">
                  <p className="text-sm text-status-successDark">
                    {recoveryResult.message}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowResetConfirmModal(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleResetSync}
                  disabled={isProcessing}
                  loading={isProcessing}
                >
                  Yes, Reset Sync
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Card>
  );
}

/**
 * PeerList - Shows all devices in the mesh network
 */
function PeerList({
  peers,
  currentDeviceId,
  isManager,
  onKickMember,
  isProcessing,
}: {
  peers: SyncPeerInfo[];
  currentDeviceId: string | null;
  isManager: boolean;
  onKickMember: (deviceId: string, deviceName: string) => Promise<void>;
  isProcessing: boolean;
}): JSX.Element {
  if (peers.length === 0) {
    return (
      <div className="text-center py-6 text-neutral-textSecondary">
        <div className="text-3xl mb-2">📡</div>
        <p>No other devices connected yet</p>
        <p className="text-sm mt-1">Share your QR code to add family devices</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {peers.map((peer) => {
        const isCurrentDevice = peer.peerId === currentDeviceId;
        return (
          <div
            key={peer.peerId}
            className="flex items-center gap-3 p-3 bg-white border border-neutral-border rounded-lg"
          >
            <div
              className={`w-3 h-3 rounded-full ${
                peer.isOnline ? "bg-status-success" : "bg-neutral-border"
              }`}
            />
            <div className="flex-1">
              <div className="font-medium text-neutral-text">
                {peer.deviceName || "Unknown Device"}
                {isCurrentDevice && (
                  <span className="ml-2 text-xs text-neutral-textTertiary">
                    (This device)
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-textSecondary font-mono">
                {peer.peerId.slice(0, 16)}...
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-neutral-textSecondary">
                {peer.isOnline ? (
                  <span className="text-status-success">Online</span>
                ) : (
                  <span>Last seen {formatLastSeen(peer.lastSeen)}</span>
                )}
              </div>
              {isManager && !isCurrentDevice && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onKickMember(
                      peer.peerId,
                      peer.deviceName || "Unknown Device",
                    )
                  }
                  disabled={isProcessing}
                  className="text-xs px-2 py-1 text-status-error hover:bg-status-errorLight rounded transition-colors disabled:opacity-50"
                  title="Remove from family"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Format last seen timestamp
 */
function formatLastSeen(timestamp: number | undefined): string {
  if (!timestamp) return "Never";

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
