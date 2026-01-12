/**
 * QR Scanner Component - scans QR codes for family invite codes
 */

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native'
import { CameraView, Camera } from 'expo-camera'

interface QRScannerProps {
  onScan: (data: string) => void
  onCancel: () => void
}

export function QRScanner({ onScan, onCancel }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  useEffect(() => {
    const getCameraPermissions = async () => {
      try {
        // First check if we already have permission
        const { status: existingStatus } = await Camera.getCameraPermissionsAsync()
        if (existingStatus === 'granted') {
          setHasPermission(true)
          return
        }

        // If not granted, request permission
        const { status } = await Camera.requestCameraPermissionsAsync()
        setHasPermission(status === 'granted')
      } catch (error) {
        console.error('Error getting camera permissions:', error)
        setHasPermission(false)
      }
    }

    getCameraPermissions()
  }, [])

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return
    setScanned(true)
    onScan(data)
  }

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim())
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <Text style={styles.subMessage}>
          You can still join by entering the invite code manually.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowManualInput(true)}
        >
          <Text style={styles.buttonText}>Enter Code Manually</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (showManualInput) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Enter Invite Code</Text>
        <TextInput
          style={styles.input}
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="Paste invite code here"
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.button} onPress={handleManualSubmit}>
          <Text style={styles.buttonText}>Join Family</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowManualInput(false)}
        >
          <Text style={styles.cancelButtonText}>Back to Scanner</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
      </CameraView>

      <View style={styles.footer}>
        <Text style={styles.instructions}>
          Point your camera at the QR code to join a family
        </Text>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManualInput(true)}
        >
          <Text style={styles.manualButtonText}>Enter code manually</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {scanned && (
        <TouchableOpacity
          style={styles.rescanButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.buttonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 3,
    borderTopWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  footer: {
    padding: 20,
    backgroundColor: '#000',
  },
  instructions: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  message: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  subMessage: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 20,
    fontSize: 14,
    minHeight: 100,
  },
  button: {
    backgroundColor: '#d946ef',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  manualButton: {
    padding: 12,
  },
  manualButtonText: {
    color: '#d946ef',
    fontSize: 14,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 16,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  rescanButton: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#d946ef',
    padding: 16,
    borderRadius: 8,
  },
})
