import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import { createActivity, getActivities } from '../../src/database'
import type { ActivityType, CreateActivity, Activity } from '../../src/types'
import { parseActivityInput } from '../../src/utils/activityParser'
import { useColors } from '../../src/theme/createStyles'

interface RecentTemplate {
  title: string
  subjectId: string
  activityType: ActivityType
  activitySubType?: string
  count: number
}

const activityTypes: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'worksheet', label: 'Worksheet', icon: '' },
  { value: 'video', label: 'Video', icon: '' },
  { value: 'reading', label: 'Reading', icon: '' },
  { value: 'writing', label: 'Writing', icon: '' },
  { value: 'hands_on', label: 'Hands-on', icon: '' },
  { value: 'interactive', label: 'Interactive', icon: '' },
]

const durationChips = [15, 30, 45, 60, 90]

export default function LogScreen() {
  const { students, subjects, selectedStudentId, getStudentById, getSubjectById } = useStore()
  const colors = useColors()

  const [textInput, setTextInput] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null)
  const [duration, setDuration] = useState<number | null>(30)
  const [showDetails, setShowDetails] = useState(false)
  const [recentTemplates, setRecentTemplates] = useState<RecentTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const studentColor = selectedStudentId
    ? getStudentById(selectedStudentId)?.color === 'child2' ? '#14b8a6' : '#d946ef'
    : '#d946ef'

  // Default to all students selected
  useEffect(() => {
    if (students.length > 0 && selectedStudentIds.length === 0) {
      setSelectedStudentIds(students.map((s) => s.id))
    }
  }, [students])

  // Load recent templates
  const loadRecents = useCallback(async () => {
    try {
      const activities = await getActivities({})

      const templateMap = new Map<string, RecentTemplate>()
      activities.slice(0, 100).forEach((activity: Activity) => {
        const key = `${activity.title}|${activity.subjectId}|${activity.activityType}`
        const existing = templateMap.get(key)
        if (existing) {
          existing.count++
        } else {
          templateMap.set(key, {
            title: activity.title,
            subjectId: activity.subjectId,
            activityType: activity.activityType,
            activitySubType: activity.activitySubType,
            count: 1,
          })
        }
      })

      const templates = Array.from(templateMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)

      setRecentTemplates(templates)
    } catch (err) {
      console.error('Failed to load recents:', err)
    }
  }, [])

  useEffect(() => {
    loadRecents()
  }, [loadRecents])

  // Quick log from template
  const handleQuickLog = async (template: RecentTemplate) => {
    if (selectedStudentIds.length === 0) {
      Alert.alert('Select a student', 'Please select at least one student.')
      return
    }

    setIsLoading(true)
    try {
      for (const studentId of selectedStudentIds) {
        await createActivity({
          studentId,
          subjectId: template.subjectId,
          sessionId: null,
          activityType: template.activityType,
          activitySubType: template.activitySubType,
          title: template.title,
          description: '',
          dateCompleted: format(new Date(), 'yyyy-MM-dd'),
          durationMinutes: 30,
          grade: null,
          maxGrade: null,
          notes: '',
        })
      }
      Alert.alert('Logged!', `${template.title} logged for ${selectedStudentIds.length === students.length ? 'both kids' : '1 student'}.`)
      await loadRecents()
    } catch (err) {
      console.error('Failed to quick log:', err)
      Alert.alert('Error', 'Failed to log activity')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit from text input
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return
    if (selectedStudentIds.length === 0) {
      Alert.alert('Select a student', 'Please select at least one student.')
      return
    }

    const parsed = parseActivityInput(textInput, subjects, students)

    // Use parsed subject or fall back to selected/first
    const subjectId = parsed.subject || selectedSubjectId || subjects[0]?.id
    if (!subjectId) {
      Alert.alert('Error', 'No subject could be determined. Please select one.')
      return
    }

    setIsLoading(true)
    try {
      for (const studentId of selectedStudentIds) {
        await createActivity({
          studentId,
          subjectId,
          sessionId: null,
          activityType: parsed.activityType || selectedType || 'worksheet',
          title: parsed.title,
          description: '',
          dateCompleted: format(new Date(), 'yyyy-MM-dd'),
          durationMinutes: parsed.durationMinutes || duration,
          grade: null,
          maxGrade: null,
          notes: '',
        })
      }
      Alert.alert('Logged!', `"${parsed.title}" logged successfully.`)
      setTextInput('')
      setSelectedType(null)
      setSelectedSubjectId('')
      await loadRecents()
    } catch (err) {
      console.error('Failed to log activity:', err)
      Alert.alert('Error', 'Failed to log activity')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id))
    } else {
      setSelectedStudentIds([...selectedStudentIds, id])
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Student Toggle */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {students.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id)
            const color = student.color === 'child2' ? '#14b8a6' : '#d946ef'
            return (
              <TouchableOpacity
                key={student.id}
                onPress={() => toggleStudent(student.id)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isSelected ? color : '#f3f4f6',
                  alignItems: 'center',
                  borderWidth: isSelected ? 0 : 1,
                  borderColor: '#e5e7eb',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isSelected ? '#fff' : '#6b7280',
                }}>
                  {student.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Text Input - Primary logging method */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
          marginBottom: 16,
        }}>
          <TextInput
            value={textInput}
            onChangeText={setTextInput}
            placeholder="What did you do? e.g., Math worksheet ch5 30min"
            placeholderTextColor="#9ca3af"
            multiline
            style={{
              fontSize: 16,
              color: '#1f2937',
              minHeight: 44,
              lineHeight: 22,
            }}
            onSubmitEditing={handleTextSubmit}
            returnKeyType="done"
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => setShowDetails(!showDetails)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name={showDetails ? 'chevron-up' : 'chevron-down'} size={16} color="#6b7280" />
              <Text style={{ fontSize: 13, color: '#6b7280' }}>
                {showDetails ? 'Hide details' : 'Add details'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTextSubmit}
              disabled={isLoading || !textInput.trim()}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: (isLoading || !textInput.trim()) ? '#e5e7eb' : studentColor,
              }}
            >
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: (isLoading || !textInput.trim()) ? '#9ca3af' : '#fff',
              }}>
                {isLoading ? 'Logging...' : 'Log'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expandable Details */}
        {showDetails && (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 1,
          }}>
            {/* Activity Type Chips */}
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {activityTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setSelectedType(selectedType === type.value ? null : type.value)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: selectedType === type.value ? studentColor : '#f3f4f6',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{type.icon}</Text>
                  <Text style={{
                    fontSize: 13,
                    color: selectedType === type.value ? '#fff' : '#6b7280',
                  }}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subject */}
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Subject</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  onPress={() => setSelectedSubjectId(selectedSubjectId === subject.id ? '' : subject.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: selectedSubjectId === subject.id ? studentColor : '#f3f4f6',
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    color: selectedSubjectId === subject.id ? '#fff' : '#6b7280',
                  }}>
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration */}
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Duration</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {durationChips.map((mins) => (
                <TouchableOpacity
                  key={mins}
                  onPress={() => setDuration(duration === mins ? null : mins)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: duration === mins ? studentColor : '#f3f4f6',
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    color: duration === mins ? '#fff' : '#6b7280',
                  }}>
                    {mins} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activities - One tap repeat */}
        {recentTemplates.length > 0 && (
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 10 }}>
              Quick Repeat
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {recentTemplates.map((template, index) => {
                const subject = getSubjectById(template.subjectId)
                const typeInfo = activityTypes.find((t) => t.value === template.activityType)
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleQuickLog(template)}
                    disabled={isLoading}
                    activeOpacity={0.7}
                    style={{
                      width: '48%',
                      padding: 12,
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <Text style={{ fontSize: 14 }}>{typeInfo?.icon}</Text>
                      <Text style={{ fontSize: 11, color: '#9ca3af' }}>{subject?.name}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }} numberOfLines={1}>
                      {template.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      {template.count}x logged
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
