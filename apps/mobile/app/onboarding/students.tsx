import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter, Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createStudent, getStudents } from '../../src/database'
import { seedDemoData } from '../../src/database/seedDemoData'
import { useStore } from '../../src/stores/useStore'
import type { GradeLevel } from '../../src/types'
import { analytics } from '../../src/analytics'
import { useColors } from '../../src/theme/createStyles'
import { DatePicker } from '../../src/components/ui'

const isDemoDataAllowed = __DEV__ || process.env.EXPO_PUBLIC_DEMO_DATA === '1'
const ONBOARDING_COMPLETE_KEY = '@homeschool/onboarding_complete'

const COLORS = [
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#8b5cf6' },
]

const GRADE_LEVELS: { value: string; label: string }[] = [
  { value: 'pre-k', label: 'Pre-K' },
  { value: 'k', label: 'Kindergarten' },
  { value: '1st', label: '1st Grade' },
  { value: '2nd', label: '2nd Grade' },
  { value: '3rd', label: '3rd Grade' },
  { value: '4th', label: '4th Grade' },
  { value: '5th', label: '5th Grade' },
  { value: '6th', label: '6th Grade' },
  { value: '7th', label: '7th Grade' },
  { value: '8th', label: '8th Grade' },
  { value: '9th', label: '9th Grade' },
  { value: '10th', label: '10th Grade' },
  { value: '11th', label: '11th Grade' },
  { value: '12th', label: '12th Grade' },
]

interface StudentForm {
  name: string
  dateOfBirth: string
  gradeLevel: string
  color: string
}

export default function OnboardingStudents() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { setStudents, setSelectedStudentId, setOnboardingComplete } = useStore()
  const themed = useThemedStyles()

  const [students, setLocalStudents] = useState<StudentForm[]>([
    { name: '', dateOfBirth: '', gradeLevel: '', color: COLORS[0].value },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addStudent = () => {
    const nextColor = COLORS[students.length % COLORS.length].value
    setLocalStudents([...students, { name: '', dateOfBirth: '', gradeLevel: '', color: nextColor }])
  }

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setLocalStudents(students.filter((_, i) => i !== index))
    }
  }

  const updateStudent = (index: number, field: keyof StudentForm, value: string) => {
    const updated = [...students]
    updated[index] = { ...updated[index], [field]: value }
    setLocalStudents(updated)
  }

  const handleDemoData = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await seedDemoData({ skipExistingCheck: true })
      const studentsData = await getStudents()
      setStudents(studentsData)
      if (studentsData.length > 0) {
        setSelectedStudentId(studentsData[0].id)
      }

      analytics.track('demo_data_loaded', { source: 'onboarding' })

      // Mark onboarding complete and go straight to main app
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
      setOnboardingComplete(true)
      router.replace('/(tabs)' as Href)
    } catch (err) {
      console.error('[Onboarding] Failed to seed demo data:', err)
      setError(String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    const validStudents = students.filter((s) => s.name.trim() && s.gradeLevel && s.dateOfBirth)

    if (validStudents.length === 0) {
      setError('Please add at least one student with a name, date of birth, and grade level')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const createdStudents = []
      for (const student of validStudents) {
        const created = await createStudent({
          name: student.name.trim(),
          dateOfBirth: student.dateOfBirth,
          gradeLevel: student.gradeLevel as GradeLevel,
          color: student.color,
        })
        createdStudents.push(created)
      }

      setStudents(createdStudents)
      if (createdStudents.length > 0) {
        setSelectedStudentId(createdStudents[0].id)
      }

      // Track students added during onboarding
      analytics.track('student_added', {
        count: createdStudents.length,
        source: 'onboarding',
      })

      router.push('/onboarding/state' as Href)
    } catch (err) {
      console.error('Failed to create students:', err)
      setError('Failed to save students. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={themed.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.scroll, { paddingTop: insets.top + 20 }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={themed.title}>Add Your Students</Text>
        <Text style={themed.subtitle}>
          Who will you be tracking? You can always add more later.
        </Text>

        {isDemoDataAllowed && (
          <TouchableOpacity
            style={themed.demoButton}
            onPress={() => {
              Alert.alert(
                'Load Demo Data',
                'This will add two sample students with activities, books, milestones, and events — then skip straight to the app.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Load Demo Data', onPress: handleDemoData },
                ]
              )
            }}
            disabled={isSubmitting}
            accessibilityLabel="Load demo data instead of adding students"
            accessibilityRole="button"
          >
            <Text style={themed.demoButtonText}>Use Demo Data Instead</Text>
          </TouchableOpacity>
        )}

        {students.map((student, index) => (
          <View key={index} style={themed.studentCard}>
            <View style={styles.cardHeader}>
              <Text style={themed.cardTitle}>Student {index + 1}</Text>
              {students.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeStudent(index)}
                  accessibilityLabel={`Remove student ${index + 1}`}
                  accessibilityRole="button"
                >
                  <Text style={themed.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={themed.label}>Name</Text>
            <TextInput
              style={themed.input}
              placeholder="Student's name"
              value={student.name}
              onChangeText={(value) => updateStudent(index, 'name', value)}
              autoCapitalize="words"
            />

            <DatePicker
              label="Date of Birth"
              value={student.dateOfBirth}
              onChange={(date) => updateStudent(index, 'dateOfBirth', date)}
              placeholder="Select date of birth"
            />

            <Text style={themed.label}>Grade Level</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.gradeScroll}
            >
              {GRADE_LEVELS.map((grade) => (
                <TouchableOpacity
                  key={grade.value}
                  style={[
                    themed.gradeChip,
                    student.gradeLevel === grade.value && themed.gradeChipSelected,
                  ]}
                  onPress={() => updateStudent(index, 'gradeLevel', grade.value)}
                  accessibilityLabel={`${grade.label}${student.gradeLevel === grade.value ? ', selected' : ''}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: student.gradeLevel === grade.value }}
                >
                  <Text
                    style={[
                      themed.gradeChipText,
                      student.gradeLevel === grade.value && themed.gradeChipTextSelected,
                    ]}
                  >
                    {grade.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={themed.label}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color.value },
                    student.color === color.value && themed.colorCircleSelected,
                  ]}
                  onPress={() => updateStudent(index, 'color', color.value)}
                  accessibilityLabel={`${color.name} color${student.color === color.value ? ', selected' : ''}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: student.color === color.value }}
                  testID={`color-${color.name}`}
                />
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={addStudent}
          accessibilityLabel="Add another student"
          accessibilityRole="button"
        >
          <Text style={themed.addButtonText}>+ Add Another Student</Text>
        </TouchableOpacity>

        {error && <Text style={themed.error}>{error}</Text>}
      </ScrollView>

      <View style={[themed.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[themed.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityLabel={isSubmitting ? 'Saving students' : 'Continue to state selection'}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
        >
          <Text style={themed.buttonText}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gradeScroll: {
    marginBottom: 16,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  addButton: {
    paddingVertical: 16,
    alignItems: 'center',
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
    subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 24 },
    studentCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
    removeText: { fontSize: 14, color: colors.error },
    label: { fontSize: 14, fontWeight: '500' as const, color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, marginBottom: 16, color: colors.text },
    gradeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
    gradeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    gradeChipText: { fontSize: 14, color: colors.text },
    gradeChipTextSelected: { color: colors.textInverse, fontWeight: '500' as const },
    colorCircleSelected: { borderWidth: 3, borderColor: colors.text },
    addButtonText: { fontSize: 16, color: colors.primary, fontWeight: '600' as const },
    demoButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' as const, marginBottom: 20 },
    demoButtonText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' as const },
    error: { fontSize: 14, color: colors.error, textAlign: 'center' as const, marginTop: 8 },
    footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.surface },
    button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' as const },
    buttonText: { color: colors.textInverse, fontSize: 18, fontWeight: '600' as const },
  }
}
