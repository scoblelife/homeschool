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

type ViewMode = 'main' | 'scanner' | 'qrcode' | 'create' | 'join'

export default function SyncScreen() {
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

    try {
      await syncManager.joinFamily(code, deviceName.trim())
      await syncManager.connect()
      await loadData()
      setViewMode('main')
      Alert.alert('Success', 'Joined family successfully!')
    } catch (error) {
      console.error('Error joining family:', error)
      Alert.alert('Error', 'Invalid invite code. Please try again.')
      setViewMode('main')
    }
  }

  const handleShowQRCode = () => {
    try {
      const code = syncManager.getInviteCode()
      const message = syncManager.getInviteMessage()
      setInviteCode(code)
      setInviteMessage(message)
      setViewMode('qrcode')
    } catch (error) {
      console.error('Error getting invite code:', error)
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d946ef" />
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

  // Create Family Screen
  if (viewMode === 'create') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Family</Text>
        </View>
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Device Name</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="e.g., Mom's iPhone"
            autoCapitalize="words"
          />
          <Text style={styles.helpText}>
            This name will be visible to other family members when you sync.
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, creating && styles.buttonDisabled]}
            onPress={handleCreateFamily}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Family</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setViewMode('main')}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // Join Family Screen (for entering device name before scanning)
  if (viewMode === 'join') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Join Family</Text>
        </View>
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Device Name</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="e.g., Dad's Phone"
            autoCapitalize="words"
          />
          <Text style={styles.helpText}>
            Enter a name for this device, then scan the family QR code.
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, !deviceName.trim() && styles.buttonDisabled]}
            onPress={() => setViewMode('scanner')}
            disabled={!deviceName.trim()}
          >
            <Text style={styles.primaryButtonText}>Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setViewMode('main')}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // Main Sync Screen
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Sync</Text>
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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sync with Family</Text>
              <Text style={styles.cardDescription}>
                Keep your homeschool data in sync across multiple devices. All
                family members can view and update activities, milestones, and
                more.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setViewMode('create')}
            >
              <Text style={styles.primaryButtonText}>Create New Family</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => setViewMode('join')}
            >
              <Text style={styles.outlineButtonText}>Join Existing Family</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Synced - show status and peers
          <View>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    status.connected ? styles.statusOnline : styles.statusOffline,
                  ]}
                />
                <Text style={styles.statusText}>
                  {status.connected ? 'Connected' : 'Not Connected'}
                </Text>
              </View>
              <Text style={styles.deviceName}>
                This device: {syncManager.getDeviceName()}
              </Text>
              {syncManager.isManager() && (
                <View style={styles.managerBadge}>
                  <Text style={styles.managerBadgeText}>Family Manager</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Family Members</Text>
              {peers.length === 0 ? (
                <Text style={styles.emptyText}>
                  No other devices connected. Share your invite code to add
                  family members.
                </Text>
              ) : (
                peers.map((peer) => (
                  <View key={peer.deviceId} style={styles.peerCard}>
                    <View style={styles.peerInfo}>
                      <Text style={styles.peerName}>{peer.deviceName}</Text>
                      <Text style={styles.peerStatus}>
                        {peer.isOnline ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.peerDot,
                        peer.isOnline ? styles.statusOnline : styles.statusOffline,
                      ]}
                    />
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShowQRCode}
              >
                <Text style={styles.actionButtonText}>Show Invite QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleLeaveFamily}
              >
                <Text style={[styles.actionButtonText, styles.dangerText]}>
                  Leave Family
                </Text>
              </TouchableOpacity>
            </View>

            {status.lastSyncTime && (
              <Text style={styles.lastSync}>
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
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  statusOnline: {
    backgroundColor: '#10b981',
  },
  statusOffline: {
    backgroundColor: '#9ca3af',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  deviceName: {
    fontSize: 14,
    color: '#6b7280',
  },
  managerBadge: {
    backgroundColor: '#fdf4ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  managerBadgeText: {
    fontSize: 12,
    color: '#d946ef',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
  peerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  peerInfo: {
    flex: 1,
  },
  peerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  peerStatus: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  peerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#d946ef',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d946ef',
  },
  outlineButtonText: {
    color: '#d946ef',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#fef2f2',
  },
  dangerText: {
    color: '#dc2626',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 24,
  },
  lastSync: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 20,
  },
})
