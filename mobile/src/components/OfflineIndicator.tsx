/**
 * Offline Indicator Component
 *
 * Shows a banner when the device is offline.
 * Appears at the top of the screen with a subtle animation.
 */

import { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useIsOnline } from '../hooks/useNetworkStatus'
import { useColors } from '../theme'

export function OfflineIndicator() {
  const isOnline = useIsOnline()
  const insets = useSafeAreaInsets()
  const colors = useColors()

  const slideAnim = useRef(new Animated.Value(-50)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isOnline) {
      // Slide in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isOnline, slideAnim, opacityAnim])

  // Always render but invisible when online (for animation)
  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.warning,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents={isOnline ? 'none' : 'auto'}
    >
      <View style={styles.content}>
        <Text style={[styles.icon]}>📡</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textInverse }]}>
            You're offline
          </Text>
          <Text style={[styles.subtitle, { color: colors.textInverse }]}>
            Changes will sync when you reconnect
          </Text>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
})
