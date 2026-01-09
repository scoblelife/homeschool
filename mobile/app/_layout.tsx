import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, Text, ActivityIndicator } from 'react-native'
import { initializeSchema, getStudents, getSubjects } from '../src/database'
import { useStore } from '../src/stores/useStore'

export default function RootLayout() {
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setStudents, setSubjects, setIsInitialized, setSelectedStudentId, students } = useStore()

  useEffect(() => {
    async function initialize() {
      try {
        // Initialize database schema
        await initializeSchema()

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}
