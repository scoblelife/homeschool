import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, subDays } from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import { getActivities, createActivity, deleteActivity } from '../../src/database'
import type { Activity, CreateActivity, ActivityType } from '../../src/types'
import { StudentSelector } from '../../src/components/StudentSelector'
import { ActivityCard } from '../../src/components/ActivityCard'

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'video', label: 'Video' },
  { value: 'reading', label: 'Reading' },
  { value: 'writing', label: 'Writing' },
  { value: 'hands_on', label: 'Hands-On' },
  { value: 'interactive', label: 'Interactive' },
]

export default function ActivitiesScreen() {
  const { selectedStudentId, getSelectedStudent, subjects, getSubjectById } = useStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [newActivity, setNewActivity] = useState<Partial<CreateActivity>>({
    activityType: 'worksheet',
    title: '',
    description: '',
    notes: '',
    dateCompleted: format(new Date(), 'yyyy-MM-dd'),
  })

  const selectedStudent = getSelectedStudent()
  const studentColor = selectedStudent?.color === 'child2' ? '#14b8a6' : '#d946ef'

  const loadActivities = useCallback(async () => {
    if (!selectedStudentId) return

    try {
      const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const data = await getActivities({ studentId: selectedStudentId, startDate })
      setActivities(data)
    } catch (err) {
      console.error('Failed to load activities:', err)
    }
  }, [selectedStudentId])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadActivities()
    setRefreshing(false)
  }, [loadActivities])

  const handleCreateActivity = async () => {
    if (!selectedStudentId || !newActivity.subjectId || !newActivity.title) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    try {
      await createActivity({
        studentId: selectedStudentId,
        sessionId: null,
        subjectId: newActivity.subjectId,
        activityType: newActivity.activityType || 'worksheet',
        title: newActivity.title,
        description: newActivity.description || '',
        notes: newActivity.notes || '',
        dateCompleted: newActivity.dateCompleted || format(new Date(), 'yyyy-MM-dd'),
        durationMinutes: newActivity.durationMinutes || null,
        grade: newActivity.grade || null,
        maxGrade: newActivity.maxGrade || null,
      })

      setModalVisible(false)
      setNewActivity({
        activityType: 'worksheet',
        title: '',
        description: '',
        notes: '',
        dateCompleted: format(new Date(), 'yyyy-MM-dd'),
      })
      await loadActivities()
    } catch (err) {
      console.error('Failed to create activity:', err)
      Alert.alert('Error', 'Failed to create activity')
    }
  }

  const handleDeleteActivity = async (id: string) => {
    Alert.alert('Delete Activity', 'Are you sure you want to delete this activity?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteActivity(id)
            await loadActivities()
          } catch (err) {
            console.error('Failed to delete activity:', err)
          }
        },
      },
    ])
  }

  if (!selectedStudentId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#6b7280', textAlign: 'center' }}>
          Select a student to view activities
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColor} />}
      >
        <View style={{ padding: 16 }}>
          <StudentSelector />

          <View style={{ marginTop: 16 }}>
            {activities.length === 0 ? (
              <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' }}>
                <Text style={{ color: '#9ca3af', fontSize: 16 }}>No activities in the last 30 days</Text>
                <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>Tap + to log an activity</Text>
              </View>
            ) : (
              activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  subject={getSubjectById(activity.subjectId)}
                  onPress={() => handleDeleteActivity(activity.id)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: studentColor,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Activity Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#6b7280', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Log Activity</Text>
            <TouchableOpacity onPress={handleCreateActivity}>
              <Text style={{ color: studentColor, fontSize: 16, fontWeight: '600' }}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            {/* Title */}
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Title *</Text>
            <TextInput
              value={newActivity.title}
              onChangeText={(text) => setNewActivity({ ...newActivity, title: text })}
              placeholder="What did they do?"
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginBottom: 16,
              }}
            />

            {/* Subject */}
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Subject *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    onPress={() => setNewActivity({ ...newActivity, subjectId: subject.id })}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: newActivity.subjectId === subject.id ? studentColor : '#f3f4f6',
                    }}
                  >
                    <Text style={{ color: newActivity.subjectId === subject.id ? '#fff' : '#6b7280' }}>
                      {subject.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Activity Type */}
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {activityTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setNewActivity({ ...newActivity, activityType: type.value })}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: newActivity.activityType === type.value ? studentColor : '#f3f4f6',
                    }}
                  >
                    <Text style={{ color: newActivity.activityType === type.value ? '#fff' : '#6b7280' }}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Duration */}
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Duration (minutes)</Text>
            <TextInput
              value={newActivity.durationMinutes?.toString() || ''}
              onChangeText={(text) => setNewActivity({ ...newActivity, durationMinutes: parseInt(text) || undefined })}
              placeholder="30"
              keyboardType="number-pad"
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginBottom: 16,
              }}
            />

            {/* Notes */}
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Notes</Text>
            <TextInput
              value={newActivity.notes}
              onChangeText={(text) => setNewActivity({ ...newActivity, notes: text })}
              placeholder="Any additional notes..."
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginBottom: 16,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}
