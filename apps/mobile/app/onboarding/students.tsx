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
} from 'react-native'
import { useRouter, Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createStudent } from '../../src/database'
import { useStore } from '../../src/stores/useStore'
import type { GradeLevel } from '../../src/types'
import { analytics } from '../../src/analytics'

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
  gradeLevel: string
  color: string
}

export default function OnboardingStudents() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { setStudents, setSelectedStudentId } = useStore()

  const [students, setLocalStudents] = useState<StudentForm[]>([
    { name: '', gradeLevel: '', color: COLORS[0].value },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addStudent = () => {
    const nextColor = COLORS[students.length % COLORS.length].value
    setLocalStudents([...students, { name: '', gradeLevel: '', color: nextColor }])
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

  const handleSubmit = async () => {
    const validStudents = students.filter((s) => s.name.trim() && s.gradeLevel)

    if (validStudents.length === 0) {
      setError('Please add at least one student with a name and grade level')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const createdStudents = []
      for (const student of validStudents) {
        const created = await createStudent({
          name: student.name.trim(),
          dateOfBirth: '', // Optional, can be set later in settings
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.scroll, { paddingTop: insets.top + 20 }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add Your Students</Text>
        <Text style={styles.subtitle}>
          Who will you be tracking? You can always add more later.
        </Text>

        {students.map((student, index) => (
          <View key={index} style={styles.studentCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Student {index + 1}</Text>
              {students.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeStudent(index)}
                  accessibilityLabel={`Remove student ${index + 1}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Student's name"
              value={student.name}
              onChangeText={(value) => updateStudent(index, 'name', value)}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Grade Level</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.gradeScroll}
            >
              {GRADE_LEVELS.map((grade) => (
                <TouchableOpacity
                  key={grade.value}
                  style={[
                    styles.gradeChip,
                    student.gradeLevel === grade.value && styles.gradeChipSelected,
                  ]}
                  onPress={() => updateStudent(index, 'gradeLevel', grade.value)}
                  accessibilityLabel={`${grade.label}${student.gradeLevel === grade.value ? ', selected' : ''}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: student.gradeLevel === grade.value }}
                >
                  <Text
                    style={[
                      styles.gradeChipText,
                      student.gradeLevel === grade.value && styles.gradeChipTextSelected,
                    ]}
                  >
                    {grade.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color.value },
                    student.color === color.value && styles.colorCircleSelected,
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
          <Text style={styles.addButtonText}>+ Add Another Student</Text>
        </TouchableOpacity>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityLabel={isSubmitting ? 'Saving students' : 'Continue to state selection'}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    marginBottom: 24,
  },
  studentCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  removeText: {
    fontSize: 14,
    color: '#ef4444',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  gradeScroll: {
    marginBottom: 16,
  },
  gradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  gradeChipSelected: {
    backgroundColor: '#d946ef',
    borderColor: '#d946ef',
  },
  gradeChipText: {
    fontSize: 14,
    color: '#374151',
  },
  gradeChipTextSelected: {
    color: '#fff',
    fontWeight: '500',
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
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#1f2937',
  },
  addButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    color: '#d946ef',
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
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
