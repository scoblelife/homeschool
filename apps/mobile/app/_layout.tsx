// Polyfill crypto.getRandomValues for uuid and other libraries (must be first import)
import 'expo-crypto'
import { getRandomValues } from 'expo-crypto'
if (typeof global.crypto === 'undefined') {
  // @ts-expect-error — polyfill for uuid's crypto requirement
  global.crypto = { getRandomValues }
} else if (typeof global.crypto.getRandomValues === 'undefined') {
  // @ts-expect-error — expo-crypto's getRandomValues has narrower typed-array signature than Web Crypto
  global.crypto.getRandomValues = getRandomValues
}

import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments, Href } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, Text, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { initializeSchema, getStudents, getSubjects } from '../src/database'
import { useStore } from '../src/stores/useStore'
import { SyncManager } from '../src/sync'
import { analytics } from '../src/analytics'
import { errorReporting } from '../src/errorReporting'
import { notifications } from '../src/notifications'
import { ThemeProvider, useTheme } from '../src/theme'

const ONBOARDING_COMPLETE_KEY = '@homeschool/onboarding_complete'

// Auto-connect sync if family is already configured
async function autoConnectSync() {
  try {
    const syncManager = SyncManager.getInstance()
    await syncManager.initialize()
    const status = syncManager.getStatus()
    if (status.enabled && !status.connected) {
      await syncManager.connect()
    }
  } catch (error) {
    console.error('[App] Auto-connect error:', error)
  }
}

setTimeout(autoConnectSync, 3000)

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { onboardingComplete, setOnboardingComplete, setStudents, setSubjects, setIsInitialized, setSelectedStudentId, selectedStudentId, students } = useStore()

  // Auto-select first student if none selected or selection is stale
  useEffect(() => {
    if (students.length === 0) return
    const selectionValid = selectedStudentId && students.some((s) => s.id === selectedStudentId)
    if (!selectionValid) {
      setSelectedStudentId(students[0].id)
    }
  }, [students, selectedStudentId, setSelectedStudentId])

  useEffect(() => {
    console.log('[App] useEffect starting initialization')
    async function initialize() {
      try {
        console.log('[App] Calling initializeSchema...')
        // Initialize database schema
        await initializeSchema()
        console.log('[App] Schema initialized successfully')

        // Initialize error reporting, analytics, and notifications
        await errorReporting.initialize()
        await analytics.initialize()
        await notifications.initialize()
        analytics.trackAppOpen()
        errorReporting.addBreadcrumb('app', 'App initialization complete')

        // Schedule notifications (requests permission on first launch)
        notifications.scheduleDailyReminder()

        // Check onboarding status
        const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)
        const isComplete = onboardingStatus === 'true'
        setOnboardingComplete(isComplete)
        console.log('[App] Onboarding complete:', isComplete)

        // Load initial data
        const [studentsData, subjectsData] = await Promise.all([
          getStudents(),
          getSubjects(),
        ])

        setStudents(studentsData)
        setSubjects(subjectsData)

        // Select first student by default
        if (studentsData.length > 0) {
          setSelectedStudentId(studentsData[0].id)
        }

        setIsInitialized(true)
      } catch (err) {
        console.error('Failed to initialize app:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsInitializing(false)
      }
    }

    initialize()
  }, [])

  // Handle navigation based on onboarding status
  useEffect(() => {
    if (isInitializing) return

    const inOnboarding = (segments[0] as string) === 'onboarding'

    if (!onboardingComplete && !inOnboarding) {
      // Need to complete onboarding
      router.replace('/onboarding' as Href)
    } else if (onboardingComplete && inOnboarding) {
      // Already completed, go to main app
      router.replace('/(tabs)' as Href)
    }
  }, [isInitializing, onboardingComplete, segments])

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#d946ef" />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
        <Text style={{ color: '#ef4444', fontSize: 18, textAlign: 'center' }}>Failed to initialize app</Text>
        <Text style={{ color: '#666', marginTop: 8, textAlign: 'center' }}>{error}</Text>
      </View>
    )
  }

  return (
    <ThemeProvider>
      <ThemedLayout />
    </ThemeProvider>
  )
}

function ThemedLayout() {
  const { colors, isDark } = useTheme()

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}
