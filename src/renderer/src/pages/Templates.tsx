import { useState } from 'react'
import { TemplateLibrary, ActivityTemplate } from '../features/templates'
import { useStore } from '../stores/useStore'

export default function Templates() {
  const { students, selectedStudentId, subjects, setActivities, activities } = useStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null)
  const [addingActivity, setAddingActivity] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  const handleSelectTemplate = (template: ActivityTemplate) => {
    setSelectedTemplate(template)
    setShowAddModal(true)
  }

  const handleAddActivity = async (studentId: string) => {
    if (!selectedTemplate) return

    setAddingActivity(true)
    try {
      // Find matching subject or use first one
      const subject = subjects.find(s =>
        s.name.toLowerCase().includes(selectedTemplate.subjectId.toLowerCase()) ||
        selectedTemplate.subjectId.toLowerCase().includes(s.name.toLowerCase())
      ) || subjects[0]

      // Use the window.api to create the activity
      const today = new Date().toISOString().split('T')[0]
      await window.api.createActivity({
        studentId,
        subjectId: subject?.id || '',
        sessionId: null,
        activityType: selectedTemplate.activityType as 'worksheet' | 'video' | 'reading' | 'writing_print' | 'writing_cursive' | 'hands_on' | 'game' | 'assessment',
        title: selectedTemplate.name,
        description: selectedTemplate.description,
        dateCompleted: today,
        durationMinutes: selectedTemplate.durationMinutes,
        grade: null,
        maxGrade: null,
        notes: selectedTemplate.instructions || ''
      })

      // Refresh activities list
      const updatedActivities = await window.api.getActivities({})
      setActivities(updatedActivities)

      setShowAddModal(false)
      setSelectedTemplate(null)
      setSuccessMessage(`Added "${selectedTemplate.name}" for ${students.find(s => s.id === studentId)?.name}`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Failed to add activity:', error)
    } finally {
      setAddingActivity(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Activity Templates
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Browse pre-built activity templates organized by subject and grade level. One-click to add to your learning log.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-700 dark:text-green-300 flex items-center gap-2">
            <CheckIcon className="w-5 h-5" />
            {successMessage}
          </p>
        </div>
      )}

      <TemplateLibrary
        onSelectTemplate={handleSelectTemplate}
        studentGrade={selectedStudent?.gradeLevel}
      />

      {/* Add Activity Modal */}
      {showAddModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Add Activity from Template
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Adding "{selectedTemplate.name}" ({selectedTemplate.durationMinutes} min)
              </p>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Select a student to add this activity:
              </p>

              <div className="space-y-2">
                {students.map(student => (
                  <button
                    key={student.id}
                    onClick={() => handleAddActivity(student.id)}
                    disabled={addingActivity}
                    className="w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center justify-between"
                  >
                    <span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        ({student.gradeLevel})
                      </span>
                    </span>
                    <PlusIcon className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedTemplate(null)
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900
                    dark:hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}
