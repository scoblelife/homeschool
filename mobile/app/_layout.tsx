import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments, Href } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, Text, ActivityIndicator, NativeModules } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { initializeSchema, getStudents, getSubjects } from '../src/database'
import { useStore } from '../src/stores/useStore'
import { SyncManager } from '../src/sync'
import { FamilyManager } from '../src/sync/family'
import { analytics } from '../src/analytics'
import { errorReporting } from '../src/errorReporting'

const ONBOARDING_COMPLETE_KEY = '@homeschool/onboarding_complete'

console.log('[App] RootLayout module loaded')
console.log('[App] HyperswarmModule available:', !!NativeModules.HyperswarmModule)

// Desktop's family invite code for testing - same family as desktop app (~/.homeschool/sync/family.json)
const DESKTOP_FAMILY_INVITE = 'REDACTED_INVITE_TOKEN'
const DESKTOP_FAMILY_ID = 'REDACTED_FAMILY_ID'

// Ensure iOS is configured with the same family as desktop for testing
async function ensureTestFamily() {
  try {
    const familyManager = FamilyManager.getInstance()
    await familyManager.initialize()

    const currentFamilyId = familyManager.getFamilyId()
    console.log('[App] Current family ID:', currentFamilyId)

    if (currentFamilyId !== DESKTOP_FAMILY_ID) {
      console.log('[App] Joining desktop family for testing...')
      // Leave current family if any
      if (currentFamilyId) {
        await familyManager.leaveFamily()
      }
      // Join desktop's family
      await familyManager.joinFamily(DESKTOP_FAMILY_INVITE, 'iPhone Simulator')
      console.log('[App] Joined desktop family:', DESKTOP_FAMILY_ID)
    } else {
      console.log('[App] Already on desktop family')
    }
  } catch (error) {
    console.error('[App] Error configuring test family:', error)
  }
}

// Auto-connect sync for testing
async function autoConnectSync() {
  try {
    // First ensure we're on the same family as desktop
    await ensureTestFamily()

    console.log('[App] Auto-connecting sync for testing...')
    console.log('[App] HyperswarmModule present:', !!NativeModules.HyperswarmModule)
    console.log('[App] HyperswarmModule methods:', NativeModules.HyperswarmModule ? Object.keys(NativeModules.HyperswarmModule) : 'N/A')
    const syncManager = SyncManager.getInstance()
    await syncManager.initialize()
    const status = syncManager.getStatus()
    console.log('[App] Sync status:', JSON.stringify(status))
    if (status.enabled && !status.connected) {
      console.log('[App] Attempting to connect via native Hyperswarm...')
      await syncManager.connect()
      console.log('[App] Sync connect completed')
    } else if (!status.enabled) {
      console.log('[App] Sync NOT enabled - family not configured on this device')
      console.log('[App] Go to Settings tab and create/join a family to enable sync')
    } else if (status.connected) {
      console.log('[App] Already connected')
    }
  } catch (error) {
    console.error('[App] Auto-connect error:', error)
  }
}

// Call auto-connect after a delay
setTimeout(autoConnectSync, 3000)

export default function RootLayout() {
  console.log('[App] RootLayout rendering')
  const router = useRouter()
  const segments = useSegments()
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)
  const { setStudents, setSubjects, setIsInitialized, setSelectedStudentId, students } = useStore()

  useEffect(() => {
    console.log('[App] useEffect starting initialization')
    async function initialize() {
      try {
        console.log('[App] Calling initializeSchema...')
        // Initialize database schema
        await initializeSchema()
        console.log('[App] Schema initialized successfully')

        // Initialize error reporting and analytics
        await errorReporting.initialize()
        await analytics.initialize()
        analytics.trackAppOpen()
        errorReporting.addBreadcrumb('app', 'App initialization complete')

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
    if (isInitializing || onboardingComplete === null) return

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
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1f2937',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}
