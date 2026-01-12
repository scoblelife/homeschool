/**
 * QR Code Display Component - shows QR code for family invite
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import * as Clipboard from 'expo-clipboard'

interface QRCodeDisplayProps {
  inviteCode: string
  inviteMessage: string
  onClose: () => void
}

export function QRCodeDisplay({ inviteCode, inviteMessage, onClose }: QRCodeDisplayProps) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: inviteMessage,
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode)
      Alert.alert('Copied', 'Invite code copied to clipboard')
    } catch (error) {
      console.error('Error copying:', error)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Invite</Text>
      <Text style={styles.subtitle}>
        Share this QR code with family members to let them join
      </Text>

      <View style={styles.qrContainer}>
        <QRCode
          value={inviteCode}
          size={200}
          backgroundColor="#fff"
          color="#000"
        />
      </View>

      <Text style={styles.instructions}>
        Scan this code with the Homeschool app or share the invite
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share Invite</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
          <Text style={styles.copyButtonText}>Copy Code</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  instructions: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: '#d946ef',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  copyButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 16,
  },
  closeButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
})
