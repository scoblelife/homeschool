/**
 * Offline Indicator Component
 *
 * Shows a banner when the device is offline and displays
 * the count of queued writes pending sync.
 * Appears at the top of the screen with a subtle animation.
 */

import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useIsOnline } from '../hooks/useNetworkStatus'
import { useColors } from '../theme'
import { getOfflineQueue, type OfflineStatus } from '../sync'

/**
 * Displays a top banner indicating offline status or pending queued writes.
 *
 * The banner updates its visibility and content based on network connectivity and the offline queue state, animates in and out, and exposes a retry action when a previous sync has failed while online.
 *
 * @returns A React element rendering the offline indicator banner.
 */
export function OfflineIndicator() {
  const isOnline = useIsOnline()
  const insets = useSafeAreaInsets()
  const colors = useColors()

  const [queueStatus, setQueueStatus] = useState<OfflineStatus | null>(null)
  const [retrying, setRetrying] = useState(false)

  const slideAnim = useRef(new Animated.Value(-50)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  // Subscribe to offline queue status changes
  useEffect(() => {
    let mounted = true

    const initQueue = async () => {
      try {
        const queue = getOfflineQueue()
        await queue.initialize()

        if (mounted) {
          setQueueStatus(queue.getStatus())
        }

        const unsubscribe = queue.onStatusChange((status) => {
          if (mounted) {
            setQueueStatus(status)
          }
        })

        return () => {
          mounted = false
          unsubscribe()
        }
      } catch (error) {
        console.error('[OfflineIndicator] Failed to initialize queue:', error)
      }
    }

    initQueue()

    return () => {
      mounted = false
    }
  }, [])

  // Determine if we should show the indicator
  const queuedCount = queueStatus?.queuedWriteCount ?? 0
  const hasFailedSync = (queueStatus?.failedSyncCount ?? 0) > 0
  const shouldShow = !isOnline || queuedCount > 0

  useEffect(() => {
    if (shouldShow) {
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
  }, [shouldShow, slideAnim, opacityAnim])

  const handleRetry = async () => {
    if (retrying) return

    setRetrying(true)
    try {
      const queue = getOfflineQueue()
      await queue.forceRetryAll()
    } catch (error) {
      console.error('[OfflineIndicator] Retry failed:', error)
    } finally {
      setRetrying(false)
    }
  }

  // Get display message
  const getMessage = () => {
    if (!isOnline) {
      if (queuedCount > 0) {
        return {
          title: "You're offline",
          subtitle: `${queuedCount} change${queuedCount === 1 ? '' : 's'} will sync when you reconnect`,
        }
      }
      return {
        title: "You're offline",
        subtitle: 'Changes will sync when you reconnect',
      }
    }

    if (queuedCount > 0) {
      if (hasFailedSync) {
        return {
          title: 'Sync failed',
          subtitle: `${queuedCount} change${queuedCount === 1 ? '' : 's'} pending - tap to retry`,
        }
      }
      return {
        title: 'Syncing...',
        subtitle: `${queuedCount} change${queuedCount === 1 ? '' : 's'} in queue`,
      }
    }

    return { title: '', subtitle: '' }
  }

  const message = getMessage()

  // Get background color based on status
  const getBackgroundColor = () => {
    if (!isOnline) return colors.warning
    if (hasFailedSync) return colors.error || '#EF4444'
    return colors.primary
  }

  // Always render but invisible when online and no queued writes
  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents={shouldShow ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        <Text style={[styles.icon]}>
          {!isOnline ? '📡' : hasFailedSync ? '⚠️' : '☁️'}
        </Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textInverse }]}>
            {message.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textInverse }]}>
            {message.subtitle}
          </Text>
        </View>
        {isOnline && hasFailedSync && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            disabled={retrying}
          >
            <Text style={[styles.retryText, { color: colors.textInverse }]}>
              {retrying ? 'Retrying...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        )}
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
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
})