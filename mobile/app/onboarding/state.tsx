import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native'
import { useRouter, Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { analytics } from '../../src/analytics'

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

const ONBOARDING_COMPLETE_KEY = '@homeschool/onboarding_complete'
const USER_STATE_KEY = '@homeschool/user_state'

export default function OnboardingState() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredStates = US_STATES.filter(
    (state) =>
      state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleFinish = async () => {
    setIsSubmitting(true)

    try {
      if (selectedState) {
        await AsyncStorage.setItem(USER_STATE_KEY, selectedState)
      }
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')

      // Track onboarding completion
      analytics.track('onboarding_completed', {
        state: selectedState || 'skipped',
      })

      // Navigate to main app
      router.replace('/(tabs)' as Href)
    } catch (err) {
      console.error('Failed to save state:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
      router.replace('/(tabs)' as Href)
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your State</Text>
        <Text style={styles.subtitle}>
          This helps us show relevant compliance info. You can change this later in Settings.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search states..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView
        style={styles.stateList}
        contentContainerStyle={styles.stateListContent}
        keyboardShouldPersistTaps="handled"
      >
        {filteredStates.map((state) => (
          <TouchableOpacity
            key={state.code}
            style={[
              styles.stateRow,
              selectedState === state.code && styles.stateRowSelected,
            ]}
            onPress={() => setSelectedState(state.code)}
          >
            <Text
              style={[
                styles.stateName,
                selectedState === state.code && styles.stateNameSelected,
              ]}
            >
              {state.name}
            </Text>
            <Text
              style={[
                styles.stateCode,
                selectedState === state.code && styles.stateCodeSelected,
              ]}
            >
              {state.code}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            !selectedState && styles.buttonDisabled,
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleFinish}
          disabled={!selectedState || isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Finishing...' : 'Finish Setup'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  stateList: {
    flex: 1,
  },
  stateListContent: {
    paddingHorizontal: 20,
  },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  stateRowSelected: {
    backgroundColor: '#fdf4ff',
  },
  stateName: {
    fontSize: 16,
    color: '#1f2937',
  },
  stateNameSelected: {
    color: '#d946ef',
    fontWeight: '600',
  },
  stateCode: {
    fontSize: 14,
    color: '#9ca3af',
  },
  stateCodeSelected: {
    color: '#d946ef',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#d946ef',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})
