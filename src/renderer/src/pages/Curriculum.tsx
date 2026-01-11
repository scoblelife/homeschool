import { useState, useEffect } from 'react'
import { useStore } from '../stores/useStore'
import { StandardsList, CoverageReport, ActivityStandardsModal } from '../features/curriculum'
import type { Activity, GradeLevel, LearningStandard } from '../../../shared/types'

type TabType = 'coverage' | 'standards' | 'custom'

export default function Curriculum(): JSX.Element {
  const { students, selectedStudentId, getSelectedStudent } = useStore()
  const [activeTab, setActiveTab] = useState<TabType>('coverage')
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const selectedStudent = getSelectedStudent()

  // Load recent activities for mapping
  useEffect(() => {
    if (selectedStudentId) {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      window.api.getActivities({
        studentId: selectedStudentId,
        startDate,
        endDate
      }).then(setRecentActivities)
    }
  }, [selectedStudentId])

  const tabs: { id: TabType; label: string }[] = [
    { id: 'coverage', label: 'Coverage Report' },
    { id: 'standards', label: 'Browse Standards' },
    { id: 'custom', label: 'Map Activities' }
  ]

  const openMappingModal = (activity: Activity) => {
    setSelectedActivity(activity)
    setIsModalOpen(true)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Curriculum Mapping
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Map activities to learning standards and track coverage
        </p>
      </div>

      {!selectedStudentId ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Select a student from the sidebar to view curriculum mapping.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex gap-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'coverage' && selectedStudent && (
            <CoverageReport
              studentId={selectedStudentId}
              gradeLevel={selectedStudent.gradeLevel as GradeLevel}
            />
          )}

          {activeTab === 'standards' && selectedStudent && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <StandardsList gradeLevel={selectedStudent.gradeLevel as GradeLevel} />
            </div>
          )}

          {activeTab === 'custom' && selectedStudent && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Select an activity from the list below to map it to learning standards.
                  This helps track which standards are being covered by your curriculum.
                </p>
              </div>

              {/* Recent Activities */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Activities
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last 30 days - click to map standards
                  </p>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
                  {recentActivities.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      No recent activities found.
                    </div>
                  ) : (
                    recentActivities.map(activity => (
                      <ActivityRow
                        key={activity.id}
                        activity={activity}
                        onClick={() => openMappingModal(activity)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Standards Mapping Modal */}
      {selectedActivity && selectedStudent && (
        <ActivityStandardsModal
          activity={selectedActivity}
          student={selectedStudent}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedActivity(null)
          }}
        />
      )}
    </div>
  )
}

// Activity row component
function ActivityRow({ activity, onClick }: { activity: Activity; onClick: () => void }) {
  const [standardCount, setStandardCount] = useState(0)

  useEffect(() => {
    window.api.getActivityStandards(activity.id).then(standards => {
      setStandardCount(standards.length)
    })
  }, [activity.id])

  return (
    <button
      onClick={onClick}
      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">
            {activity.title}
          </span>
          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
            {activity.activityType.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Date(activity.dateCompleted).toLocaleDateString()}
          {activity.durationMinutes && ` - ${activity.durationMinutes} min`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {standardCount > 0 ? (
          <span className="px-2 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
            {standardCount} standards
          </span>
        ) : (
          <span className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
            No standards
          </span>
        )}
        <ChevronRightIcon />
      </div>
    </button>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
