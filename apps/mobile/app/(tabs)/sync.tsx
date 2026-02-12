/**
 * Family Sync Screen - manage family sync settings
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { SyncManager, SyncPeer, SyncStatus } from '../../src/sync'
import { QRScanner, QRCodeDisplay } from '../../src/components/sync'
import { useColors } from '../../src/theme/createStyles'

type ViewMode = 'main' | 'scanner' | 'qrcode' | 'create' | 'join' | 'joining'

export default function SyncScreen() {
  const colors = useColors()
  const [syncManager] = useState(() => SyncManager.getInstance())
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [peers, setPeers] = useState<SyncPeer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('main')

  // Create family state
  const [deviceName, setDeviceName] = useState('')
  const [creating, setCreating] = useState(false)

  // Invite code for sharing
  const [inviteCode, setInviteCode] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  // Join progress state
  const [joinProgress, setJoinProgress] = useState('')

  const loadData = useCallback(async () => {
    try {
      await syncManager.initialize()

      // Auto-connect if sync is enabled
      const currentStatus = syncManager.getStatus()
      if (currentStatus.enabled && !currentStatus.connected) {
        await syncManager.connect()
      }

      setStatus(syncManager.getStatus())
      setPeers(syncManager.getPeers())
      setDeviceName(syncManager.getDeviceName() || '')
    } catch (error) {
      console.error('Error loading sync data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [syncManager])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData])
  )

  // Subscribe to peer updates (for when device names are received)
  useEffect(() => {
    const unsubscribePeerConnected = syncManager.onPeerConnected(() => {
      setPeers(syncManager.getPeers())
    })

    const unsubscribePeerDisconnected = syncManager.onPeerDisconnected(() => {
      setPeers(syncManager.getPeers())
    })

    const unsubscribePeersUpdate = syncManager.onPeersUpdate((updatedPeers) => {
      setPeers(updatedPeers)
    })

    return () => {
      unsubscribePeerConnected()
      unsubscribePeerDisconnected()
      unsubscribePeersUpdate()
    }
  }, [syncManager])

  // Clean up invite polling when leaving QR screen
  useEffect(() => {
    if (viewMode !== 'qrcode') {
      syncManager.stopInvitePolling()
    }
  }, [viewMode, syncManager])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleCreateFamily = async () => {
    if (!deviceName.trim()) {
      Alert.alert('Error', 'Please enter a device name')
      return
    }

    setCreating(true)
    try {
      await syncManager.createFamily(deviceName.trim())
      await syncManager.connect()
      await loadData()
      setViewMode('main')
      Alert.alert('Success', 'Family created! Share the invite code with family members.')
    } catch (error) {
      console.error('Error creating family:', error)
      Alert.alert('Error', 'Failed to create family')
    } finally {
      setCreating(false)
    }
  }

  const handleJoinFamily = async (code: string) => {
    if (!deviceName.trim()) {
      Alert.alert('Error', 'Please enter a device name first')
      setViewMode('join')
      return
    }

    setViewMode('joining')
    setJoinProgress('Starting...')

    try {
      await syncManager.joinFamily(code, deviceName.trim(), (progressStatus) => {
        setJoinProgress(progressStatus)
      })
      await syncManager.connect()
      await loadData()
      setViewMode('main')
      Alert.alert('Success', 'Joined family successfully!')
    } catch (error) {
      console.error('Error joining family:', error)
      Alert.alert('Error', 'Failed to join family. Please try again.')
      setViewMode('main')
    }
  }

  const handleShowQRCode = async () => {
    try {
      const { qrData } = await syncManager.createInvite()
      const message = `Join my Homeschool family!\n\nOpen the Homeschool app and scan this QR code to join.`
      setInviteCode(qrData)
      setInviteMessage(message)
      setViewMode('qrcode')
    } catch (error) {
      console.error('Error creating invite:', error)
      Alert.alert('Error', 'Failed to generate invite code')
    }
  }

  const handleLeaveFamily = () => {
    Alert.alert(
      'Leave Family',
      'Are you sure you want to leave this family? Your local data will be kept, but you will no longer sync with other family members.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await syncManager.leaveFamily()
              await loadData()
              Alert.alert('Success', 'You have left the family')
            } catch (error) {
              console.error('Error leaving family:', error)
              Alert.alert('Error', 'Failed to leave family')
            }
          },
        },
      ]
    )
  }

  const themed = useThemedStyles()

  if (loading) {
    return (
      <View style={themed.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  // QR Scanner Modal
  if (viewMode === 'scanner') {
    return (
      <QRScanner
        onScan={handleJoinFamily}
        onCancel={() => setViewMode('main')}
      />
    )
  }

  // QR Code Display Modal
  if (viewMode === 'qrcode') {
    return (
      <QRCodeDisplay
        inviteCode={inviteCode}
        inviteMessage={inviteMessage}
        onClose={() => setViewMode('main')}
      />
    )
  }

  // Joining Progress Screen
  if (viewMode === 'joining') {
    return (
      <View style={themed.container}>
        <View style={themed.header}>
          <Text style={themed.title}>Joining Family</Text>
        </View>
        <View style={styles.joiningContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={themed.joiningText}>{joinProgress}</Text>
          <Text style={themed.joiningHint}>
            Please keep the app open while joining...
          </Text>
        </View>
      </View>
    )
  }

  // Create Family Screen
  if (viewMode === 'create') {
    return (
      <View style={themed.container}>
        <View style={themed.header}>
          <Text style={themed.title}>Create Family</Text>
        </View>
        <ScrollView style={styles.content}>
          <Text style={themed.sectionTitle}>Device Name</Text>
          <TextInput
            style={themed.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="e.g., Mom's iPhone"
            autoCapitalize="words"
          />
          <Text style={themed.helpText}>
            This name will be visible to other family members when you sync.
          </Text>

          <TouchableOpacity
            style={[themed.primaryButton, creating && styles.buttonDisabled]}
            onPress={handleCreateFamily}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={themed.primaryButtonText}>Create Family</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={themed.secondaryButton}
            onPress={() => setViewMode('main')}
          >
            <Text style={themed.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // Join Family Screen (for entering device name before scanning)
  if (viewMode === 'join') {
    return (
      <View style={themed.container}>
        <View style={themed.header}>
          <Text style={themed.title}>Join Family</Text>
        </View>
        <ScrollView style={styles.content}>
          <Text style={themed.sectionTitle}>Device Name</Text>
          <TextInput
            style={themed.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="e.g., Dad's Phone"
            autoCapitalize="words"
          />
          <Text style={themed.helpText}>
            Enter a name for this device, then scan the family QR code.
          </Text>

          <TouchableOpacity
            style={[themed.primaryButton, !deviceName.trim() && styles.buttonDisabled]}
            onPress={() => setViewMode('scanner')}
            disabled={!deviceName.trim()}
          >
            <Text style={themed.primaryButtonText}>Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={themed.secondaryButton}
            onPress={() => setViewMode('main')}
          >
            <Text style={themed.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // Main Sync Screen
  return (
    <View style={themed.container}>
      <View style={themed.header}>
        <Text style={themed.title}>Family Sync</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!status?.enabled ? (
          // Not synced - show setup options
          <View>
            <View style={themed.card}>
              <Text style={themed.cardTitle}>Sync with Family</Text>
              <Text style={themed.cardDescription}>
                Keep your homeschool data in sync across multiple devices. All
                family members can view and update activities, milestones, and
                more.
              </Text>
            </View>

            <TouchableOpacity
              style={themed.primaryButton}
              onPress={() => setViewMode('create')}
            >
              <Text style={themed.primaryButtonText}>Create New Family</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={themed.outlineButton}
              onPress={() => setViewMode('join')}
            >
              <Text style={themed.outlineButtonText}>Join Existing Family</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Synced - show status and peers
          <View>
            <View style={themed.statusCard}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    status.connected ? themed.statusOnline : themed.statusOffline,
                  ]}
                />
                <Text style={themed.statusText}>
                  {status.connected ? 'Connected' : 'Not Connected'}
                </Text>
              </View>
              <Text style={themed.deviceName}>
                This device: {syncManager.getDeviceName()}
              </Text>
              {syncManager.isManager() && (
                <View style={themed.managerBadge}>
                  <Text style={themed.managerBadgeText}>Family Manager</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={themed.sectionTitle}>Family Members</Text>
              {peers.length === 0 ? (
                <Text style={themed.emptyText}>
                  No other devices connected. Share your invite code to add
                  family members.
                </Text>
              ) : (
                peers.map((peer) => (
                  <View key={peer.deviceId} style={themed.peerCard}>
                    <View style={styles.peerInfo}>
                      <Text style={themed.peerName}>{peer.deviceName}</Text>
                      <Text style={themed.peerStatus}>
                        {peer.isOnline ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.peerDot,
                        peer.isOnline ? themed.statusOnline : themed.statusOffline,
                      ]}
                    />
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={themed.sectionTitle}>Actions</Text>
              <TouchableOpacity
                style={themed.actionButton}
                onPress={handleShowQRCode}
              >
                <Text style={themed.actionButtonText}>Show Invite QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[themed.actionButton, themed.dangerButton]}
                onPress={handleLeaveFamily}
              >
                <Text style={[themed.actionButtonText, themed.dangerText]}>
                  Leave Family
                </Text>
              </TouchableOpacity>
            </View>

            {status.lastSyncTime && (
              <Text style={themed.lastSync}>
                Last synced: {new Date(status.lastSyncTime).toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  section: {
    marginBottom: 24,
  },
  peerInfo: {
    flex: 1,
  },
  peerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  joiningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
})

function useThemedStyles() {
  const colors = useColors()
  return {
    container: { flex: 1, backgroundColor: colors.background } as const,
    loadingContainer: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: colors.background },
    header: { backgroundColor: colors.surface, paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 28, fontWeight: 'bold' as const, color: colors.text },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardTitle: { fontSize: 18, fontWeight: '600' as const, color: colors.text, marginBottom: 8 },
    cardDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    statusCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    statusOnline: { backgroundColor: colors.success },
    statusOffline: { backgroundColor: colors.textTertiary },
    statusText: { fontSize: 16, fontWeight: '500' as const, color: colors.text },
    deviceName: { fontSize: 14, color: colors.textSecondary },
    managerBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' as const, marginTop: 8 },
    managerBadgeText: { fontSize: 12, color: colors.primary, fontWeight: '500' as const },
    sectionTitle: { fontSize: 16, fontWeight: '600' as const, color: colors.text, marginBottom: 12 },
    emptyText: { fontSize: 14, color: colors.textTertiary, textAlign: 'center' as const, padding: 20 },
    peerCard: { backgroundColor: colors.surface, borderRadius: 8, padding: 14, marginBottom: 8, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    peerName: { fontSize: 15, fontWeight: '500' as const, color: colors.text },
    peerStatus: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    primaryButton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 16, alignItems: 'center' as const, marginBottom: 12 },
    primaryButtonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' as const },
    outlineButton: { backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 16, alignItems: 'center' as const, marginBottom: 12, borderWidth: 1, borderColor: colors.primary },
    outlineButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' as const },
    secondaryButton: { paddingVertical: 16, alignItems: 'center' as const },
    secondaryButtonText: { color: colors.textSecondary, fontSize: 16 },
    actionButton: { backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8 },
    actionButtonText: { color: colors.text, fontSize: 15, fontWeight: '500' as const },
    dangerButton: { backgroundColor: colors.errorLight },
    dangerText: { color: colors.error },
    input: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 8, color: colors.text },
    helpText: { fontSize: 13, color: colors.textSecondary, marginBottom: 24 },
    lastSync: { fontSize: 12, color: colors.textTertiary, textAlign: 'center' as const, marginTop: 20 },
    joiningText: { fontSize: 18, fontWeight: '500' as const, color: colors.text, marginTop: 24, textAlign: 'center' as const },
    joiningHint: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' as const },
  }
}
