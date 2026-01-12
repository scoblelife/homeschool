import { useState, useEffect } from 'react'
import type { Activity, LearningStandard, GradeLevel, Student } from '../../../../shared/types'
import { StandardsList } from './StandardsList'

interface Props {
  activity: Activity
  student: Student
  isOpen: boolean
  onClose: () => void
}

export function ActivityStandardsModal({ activity, student, isOpen, onClose }: Props) {
  const [mappedStandardIds, setMappedStandardIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Load current standards for activity
  useEffect(() => {
    if (isOpen && activity) {
      window.api.getActivityStandards(activity.id).then(standards => {
        setMappedStandardIds(standards.map(s => s.id))
        setIsDirty(false)
      })
    }
  }, [isOpen, activity])

  const handleSelectStandard = (standard: LearningStandard) => {
    setMappedStandardIds(prev => {
      if (prev.includes(standard.id)) {
        return prev.filter(id => id !== standard.id)
      } else {
        return [...prev, standard.id]
      }
    })
    setIsDirty(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await window.api.setActivityStandards(activity.id, mappedStandardIds)
      setIsDirty(false)
      onClose()
    } catch (err) {
      console.error('Failed to save standards:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800
          text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Map Learning Standards
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Activity: {activity.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {mappedStandardIds.length} standards mapped to this activity
              </span>
            </div>

            <StandardsList
              gradeLevel={student.gradeLevel as GradeLevel}
              onSelectStandard={handleSelectStandard}
              selectedIds={mappedStandardIds}
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                !isDirty || isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-fuchsia-500 hover:bg-fuchsia-600'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
