import { useState } from 'react'
import { ResourceLibrary, LearningResource } from '../features/resources'
import { useStore } from '../stores/useStore'

export default function Resources() {
  const { students, selectedStudentId, subjects, setActivities } = useStore()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleLogActivity = async (resource: LearningResource, studentId: string, duration: number) => {
    try {
      // Find matching subject or use first one
      const resourceSubject = resource.subjects[0]
      const subject = subjects.find(s =>
        s.name.toLowerCase().includes(resourceSubject) ||
        resourceSubject.includes(s.name.toLowerCase())
      ) || subjects[0]

      const today = new Date().toISOString().split('T')[0]
      await window.api.createActivity({
        studentId,
        subjectId: subject?.id || '',
        sessionId: null,
        activityType: resource.suggestedActivityType,
        title: `${resource.name}`,
        description: `Used ${resource.name} - ${resource.description}`,
        dateCompleted: today,
        durationMinutes: duration,
        grade: null,
        maxGrade: null,
        notes: `Resource: ${resource.url}`
      })

      // Refresh activities
      const updatedActivities = await window.api.getActivities({})
      setActivities(updatedActivities)

      const studentName = students.find(s => s.id === studentId)?.name || 'Student'
      setSuccessMessage(`Logged ${duration} minutes of ${resource.name} for ${studentName}`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Learning Resources
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Quick links to educational websites and apps. Track time spent learning with each resource.
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

      {/* Info box */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Track Your Learning Time
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Click "Open" to visit any resource in a new tab. Click "Log" to record time spent
          as an activity in your learning log. Favorite resources appear at the top for quick access.
        </p>
      </div>

      <ResourceLibrary
        onLogActivity={handleLogActivity}
        students={students}
      />
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
