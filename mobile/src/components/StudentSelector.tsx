import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useStore } from '../stores/useStore'

export function StudentSelector() {
  const { students, selectedStudentId, setSelectedStudentId } = useStore()

  if (students.length <= 1) return null

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {students.map((student) => {
          const isSelected = student.id === selectedStudentId
          const color = student.color === 'child2' ? '#14b8a6' : '#d946ef'

          return (
            <TouchableOpacity
              key={student.id}
              onPress={() => setSelectedStudentId(student.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isSelected ? color : '#f3f4f6',
                borderWidth: 2,
                borderColor: isSelected ? color : 'transparent',
              }}
            >
              <Text
                style={{
                  fontWeight: '600',
                  color: isSelected ? '#fff' : '#6b7280',
                }}
              >
                {student.name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </ScrollView>
  )
}
