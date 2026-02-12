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
import { useColors } from '../../src/theme/createStyles'
import { useStore } from '../../src/stores/useStore'

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
  const themed = useThemedStyles()
  const setOnboardingComplete = useStore((s) => s.setOnboardingComplete)
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

      // Update store so _layout.tsx navigation guard allows (tabs)
      setOnboardingComplete(true)

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
      setOnboardingComplete(true)
      router.replace('/(tabs)' as Href)
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
    }
  }

  return (
    <View style={[themed.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={themed.title}>Select Your State</Text>
        <Text style={themed.subtitle}>
          This helps us show relevant compliance info. You can change this later in Settings.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={themed.searchInput}
          placeholder="Search states..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search states"
          accessibilityRole="search"
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
              selectedState === state.code && themed.stateRowSelected,
            ]}
            onPress={() => setSelectedState(state.code)}
            accessibilityLabel={`${state.name}${selectedState === state.code ? ', selected' : ''}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedState === state.code }}
          >
            <Text
              style={[
                themed.stateName,
                selectedState === state.code && themed.stateNameSelected,
              ]}
            >
              {state.name}
            </Text>
            <Text
              style={[
                themed.stateCode,
                selectedState === state.code && themed.stateCodeSelected,
              ]}
            >
              {state.code}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[themed.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityLabel="Skip state selection"
          accessibilityRole="button"
        >
          <Text style={themed.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            themed.button,
            !selectedState && styles.buttonDisabled,
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleFinish}
          disabled={!selectedState || isSubmitting}
          accessibilityLabel={isSubmitting ? 'Finishing setup' : 'Finish Setup'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !selectedState || isSubmitting }}
        >
          <Text style={themed.buttonText}>
            {isSubmitting ? 'Finishing...' : 'Finish Setup'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})

function useThemedStyles() {
  const colors = useColors()
  return {
    container: { flex: 1, backgroundColor: colors.background } as const,
    title: { fontSize: 28, fontWeight: '700' as const, color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: colors.textSecondary },
    searchInput: { backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: colors.text },
    stateRowSelected: { backgroundColor: colors.primaryLight },
    stateName: { fontSize: 16, color: colors.text },
    stateNameSelected: { color: colors.primary, fontWeight: '600' as const },
    stateCode: { fontSize: 14, color: colors.textTertiary },
    stateCodeSelected: { color: colors.primary },
    footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.surface },
    skipButtonText: { fontSize: 16, color: colors.textSecondary },
    button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' as const },
    buttonText: { color: colors.textInverse, fontSize: 18, fontWeight: '600' as const },
  }
}
