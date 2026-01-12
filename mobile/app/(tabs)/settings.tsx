import { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../src/database'
import type { Student, CreateStudent, GradeLevel } from '../../src/types'
import { Card, Button, Modal, Input, EmptyState, Badge } from '../../src/components/ui'

const gradeLevels: { value: GradeLevel; label: string }[] = [
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

const colorOptions = [
  { value: 'fuchsia', label: 'Fuchsia', color: '#d946ef' },
  { value: 'teal', label: 'Teal', color: '#14b8a6' },
  { value: 'blue', label: 'Blue', color: '#3b82f6' },
  { value: 'orange', label: 'Orange', color: '#f97316' },
  { value: 'purple', label: 'Purple', color: '#a855f7' },
  { value: 'green', label: 'Green', color: '#22c55e' },
]

export default function SettingsScreen() {
  const { students, setStudents, selectedStudentId, setSelectedStudentId } = useStore()
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [newStudent, setNewStudent] = useState<Partial<CreateStudent>>({
    gradeLevel: 'k',
    color: 'child1',
  })

  const loadStudents = useCallback(async () => {
    try {
      const data = await getStudents()
      setStudents(data)
    } catch (err) {
      console.error('Failed to load students:', err)
    }
  }, [setStudents])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadStudents()
    setRefreshing(false)
  }, [loadStudents])

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.dateOfBirth) {
      Alert.alert('Error', 'Please fill in name and date of birth')
      return
    }

    try {
      const student = await createStudent({
        name: newStudent.name,
        dateOfBirth: newStudent.dateOfBirth,
        gradeLevel: newStudent.gradeLevel || 'k',
        color: newStudent.color || 'child1',
        calendarFeedUrl: newStudent.calendarFeedUrl,
      })

      setModalVisible(false)
      setNewStudent({ gradeLevel: 'k', color: 'child1' })
      await loadStudents()

      // Select the new student if no student was selected
      if (!selectedStudentId) {
        setSelectedStudentId(student.id)
      }
    } catch (err) {
      console.error('Failed to create student:', err)
      Alert.alert('Error', 'Failed to create student')
    }
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent || !newStudent.name) {
      Alert.alert('Error', 'Please fill in the name')
      return
    }

    try {
      await updateStudent(editingStudent.id, {
        name: newStudent.name,
        dateOfBirth: newStudent.dateOfBirth,
        gradeLevel: newStudent.gradeLevel,
        color: newStudent.color,
        calendarFeedUrl: newStudent.calendarFeedUrl,
      })

      setModalVisible(false)
      setEditingStudent(null)
      setNewStudent({ gradeLevel: 'k', color: 'child1' })
      await loadStudents()
    } catch (err) {
      console.error('Failed to update student:', err)
      Alert.alert('Error', 'Failed to update student')
    }
  }

  const handleDeleteStudent = async (student: Student) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}? This will also delete all their activities and milestones.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(student.id)
              await loadStudents()

              // If we deleted the selected student, select a different one
              if (selectedStudentId === student.id) {
                const remaining = students.filter((s) => s.id !== student.id)
                setSelectedStudentId(remaining.length > 0 ? remaining[0].id : null)
              }
            } catch (err) {
              console.error('Failed to delete student:', err)
              Alert.alert('Error', 'Failed to delete student')
            }
          },
        },
      ]
    )
  }

  const openEditModal = (student: Student) => {
    setEditingStudent(student)
    setNewStudent({
      name: student.name,
      dateOfBirth: student.dateOfBirth,
      gradeLevel: student.gradeLevel,
      color: student.color,
      calendarFeedUrl: student.calendarFeedUrl,
    })
    setModalVisible(true)
  }

  const openCreateModal = () => {
    setEditingStudent(null)
    setNewStudent({ gradeLevel: 'k', color: 'child1' })
    setModalVisible(true)
  }

  const getStudentColor = (colorValue: string) => {
    return colorOptions.find((c) => c.value === colorValue)?.color || '#d946ef'
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d946ef" />}
      >
        <View style={{ padding: 16 }}>
          {/* Students Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>Students</Text>
              <TouchableOpacity onPress={openCreateModal}>
                <Ionicons name="add-circle" size={28} color="#d946ef" />
              </TouchableOpacity>
            </View>

            {students.length === 0 ? (
              <EmptyState
                icon="people"
                title="No Students Yet"
                description="Add your first student to get started"
                action={
                  <Button onPress={openCreateModal} color="#d946ef">
                    Add Student
                  </Button>
                }
              />
            ) : (
              students.map((student) => {
                const studentColor = getStudentColor(student.color)
                const gradeLabel = gradeLevels.find((g) => g.value === student.gradeLevel)?.label

                return (
                  <TouchableOpacity key={student.id} onPress={() => openEditModal(student)} activeOpacity={0.7}>
                    <Card style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: studentColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                          }}
                        >
                          <Text style={{ fontSize: 20, fontWeight: '600', color: '#fff' }}>
                            {student.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>{student.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                            <Badge variant="primary">{gradeLabel || 'Unknown'}</Badge>
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>
                              Born {format(new Date(student.dateOfBirth), 'MMM d, yyyy')}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                      </View>
                    </Card>
                  </TouchableOpacity>
                )
              })
            )}
          </View>

          {/* App Info */}
          <Card>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>About</Text>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Homeschool Mobile</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Version 0.1.0</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
              Track activities, milestones, and plan events for your homeschool students.
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Student Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false)
          setEditingStudent(null)
          setNewStudent({ gradeLevel: 'k', color: 'child1' })
        }}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
        footer={
          <View style={{ gap: 8 }}>
            <Button
              onPress={editingStudent ? handleUpdateStudent : handleCreateStudent}
              color="#d946ef"
              fullWidth
            >
              {editingStudent ? 'Save Changes' : 'Add Student'}
            </Button>
            {editingStudent && (
              <Button onPress={() => handleDeleteStudent(editingStudent)} variant="danger" fullWidth>
                Delete Student
              </Button>
            )}
          </View>
        }
      >
        <Input
          label="Name *"
          value={newStudent.name || ''}
          onChangeText={(text) => setNewStudent({ ...newStudent, name: text })}
          placeholder="Enter name"
        />

        <Input
          label="Date of Birth *"
          value={newStudent.dateOfBirth || ''}
          onChangeText={(text) => setNewStudent({ ...newStudent, dateOfBirth: text })}
          placeholder="YYYY-MM-DD"
        />

        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Grade Level</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {gradeLevels.slice(0, 6).map((grade) => (
              <TouchableOpacity
                key={grade.value}
                onPress={() => setNewStudent({ ...newStudent, gradeLevel: grade.value })}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: newStudent.gradeLevel === grade.value ? '#d946ef' : '#f3f4f6',
                }}
              >
                <Text style={{ color: newStudent.gradeLevel === grade.value ? '#fff' : '#6b7280' }}>
                  {grade.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Color</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {colorOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setNewStudent({ ...newStudent, color: option.value })}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: option.color,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: newStudent.color === option.value ? 3 : 0,
                borderColor: '#1f2937',
              }}
            >
              {newStudent.color === option.value && (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Calendar Feed URL (optional)"
          value={newStudent.calendarFeedUrl || ''}
          onChangeText={(text) => setNewStudent({ ...newStudent, calendarFeedUrl: text })}
          placeholder="https://calendar.google.com/..."
          keyboardType="url"
          autoCapitalize="none"
        />
      </Modal>
    </View>
  )
}
