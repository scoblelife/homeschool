import { useState } from 'react'
import { useResourcesStore } from './resourcesStore'
import { LearningResource, getResourceById } from './resourceData'
import type { GradeLevel } from '../../../../shared/types'

interface Props {
  onLogActivity?: (resource: LearningResource, studentId: string, duration: number) => void
  students?: Array<{ id: string; name: string; gradeLevel: string }>
}

export function ResourceLibrary({ onLogActivity, students }: Props) {
  const {
    filteredResources,
    selectedSubject,
    selectedGrade,
    selectedCategory,
    freeOnly,
    searchQuery,
    favoriteResources,
    recentlyUsed,
    allSubjects,
    allCategories,
    setSelectedSubject,
    setSelectedGrade,
    setSelectedCategory,
    setFreeOnly,
    setSearchQuery,
    clearFilters,
    toggleFavorite,
    trackUsage
  } = useResourcesStore()

  const [logModalResource, setLogModalResource] = useState<LearningResource | null>(null)

  const grades: GradeLevel[] = ['pre-k', 'k', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

  const categoryLabels: Record<LearningResource['category'], string> = {
    video: 'Video Lessons',
    practice: 'Practice & Drills',
    reading: 'Reading',
    game: 'Educational Games',
    tool: 'Interactive Tools',
    reference: 'Reference'
  }

  const subjectLabels: Record<string, string> = {
    'math': 'Math',
    'science': 'Science',
    'reading': 'Reading',
    'language-arts': 'Language Arts',
    'history': 'History',
    'geography': 'Geography',
    'art': 'Art',
    'music': 'Music',
    'technology': 'Technology',
    'foreign-language': 'Foreign Language',
    'social-studies': 'Social Studies',
    'english': 'English',
    'health': 'Health',
    'social-emotional': 'Social-Emotional'
  }

  const hasFilters = selectedSubject || selectedGrade || selectedCategory || freeOnly || searchQuery

  // Get recently used resources
  const recentResources = recentlyUsed
    .map(r => getResourceById(r.resourceId))
    .filter((r): r is LearningResource => r !== undefined)
    .slice(0, 5)

  // Get favorite resources
  const favoriteResourcesList = favoriteResources
    .map(id => getResourceById(id))
    .filter((r): r is LearningResource => r !== undefined)

  const handleOpenResource = (resource: LearningResource) => {
    trackUsage(resource.id)
    window.open(resource.url, '_blank', 'noopener,noreferrer')
  }

  const handleLogActivity = (resource: LearningResource) => {
    if (students && students.length > 0) {
      setLogModalResource(resource)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={selectedSubject || ''}
          onChange={(e) => setSelectedSubject(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Subjects</option>
          {allSubjects.map(s => (
            <option key={s} value={s}>{subjectLabels[s] || s}</option>
          ))}
        </select>

        <select
          value={selectedGrade || ''}
          onChange={(e) => setSelectedGrade((e.target.value as GradeLevel) || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Grades</option>
          {grades.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory((e.target.value as LearningResource['category']) || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Types</option>
          {allCategories.map(c => (
            <option key={c} value={c}>{categoryLabels[c]}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
            className="w-4 h-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          Free only
        </label>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900
              dark:hover:text-white flex items-center gap-1"
          >
            <XIcon className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Recently Used */}
      {!hasFilters && recentResources.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Recently Used
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentResources.map(resource => (
              <button
                key={resource.id}
                onClick={() => handleOpenResource(resource)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                  rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm flex items-center gap-2"
              >
                <span>{resource.icon}</span>
                {resource.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Favorites */}
      {!hasFilters && favoriteResourcesList.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Favorites
          </h3>
          <div className="flex flex-wrap gap-2">
            {favoriteResourcesList.map(resource => (
              <button
                key={resource.id}
                onClick={() => handleOpenResource(resource)}
                className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300
                  rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-sm flex items-center gap-2"
              >
                <span>{resource.icon}</span>
                {resource.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            isFavorite={favoriteResources.includes(resource.id)}
            onOpen={() => handleOpenResource(resource)}
            onToggleFavorite={() => toggleFavorite(resource.id)}
            onLogActivity={onLogActivity ? () => handleLogActivity(resource) : undefined}
            categoryLabels={categoryLabels}
            subjectLabels={subjectLabels}
          />
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No resources found matching your filters.
        </div>
      )}

      {/* Log Activity Modal */}
      {logModalResource && students && (
        <LogActivityModal
          resource={logModalResource}
          students={students}
          onClose={() => setLogModalResource(null)}
          onSubmit={(studentId, duration) => {
            onLogActivity?.(logModalResource, studentId, duration)
            setLogModalResource(null)
          }}
        />
      )}
    </div>
  )
}

interface ResourceCardProps {
  resource: LearningResource
  isFavorite: boolean
  onOpen: () => void
  onToggleFavorite: () => void
  onLogActivity?: () => void
  categoryLabels: Record<string, string>
  subjectLabels: Record<string, string>
}

function ResourceCard({
  resource,
  isFavorite,
  onOpen,
  onToggleFavorite,
  onLogActivity,
  categoryLabels,
  subjectLabels
}: ResourceCardProps) {
  const categoryColors: Record<LearningResource['category'], string> = {
    video: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    practice: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    reading: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    game: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    tool: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    reference: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{resource.icon}</span>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {resource.name}
            </h3>
            {resource.isFree && (
              <span className="text-xs text-green-600 dark:text-green-400">FREE</span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
          className="p-1 text-gray-400 hover:text-yellow-500"
        >
          {isFavorite ? <StarFilledIcon className="w-5 h-5 text-yellow-500" /> : <StarIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
        {resource.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        <span className={`px-2 py-0.5 text-xs rounded ${categoryColors[resource.category]}`}>
          {categoryLabels[resource.category]}
        </span>
        {resource.subjects.slice(0, 2).map(s => (
          <span
            key={s}
            className="px-2 py-0.5 text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
          >
            {subjectLabels[s] || s}
          </span>
        ))}
        {resource.subjects.length > 2 && (
          <span className="px-2 py-0.5 text-xs text-gray-400">
            +{resource.subjects.length - 2}
          </span>
        )}
      </div>

      {/* Grade Range */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Grades: {resource.gradeLevels[0]} - {resource.gradeLevels[resource.gradeLevels.length - 1]}
        {' '} • ~{resource.suggestedDuration} min
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpen}
          className="flex-1 px-3 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600
            text-sm font-medium flex items-center justify-center gap-2"
        >
          <ExternalLinkIcon className="w-4 h-4" />
          Open
        </button>
        {onLogActivity && (
          <button
            onClick={onLogActivity}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900
              dark:hover:text-white text-sm border border-gray-300 dark:border-gray-600 rounded-lg
              flex items-center gap-1"
            title="Log as activity"
          >
            <PlusIcon className="w-4 h-4" />
            Log
          </button>
        )}
      </div>
    </div>
  )
}

interface LogActivityModalProps {
  resource: LearningResource
  students: Array<{ id: string; name: string; gradeLevel: string }>
  onClose: () => void
  onSubmit: (studentId: string, duration: number) => void
}

function LogActivityModal({ resource, students, onClose, onSubmit }: LogActivityModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '')
  const [duration, setDuration] = useState(resource.suggestedDuration)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedStudentId) {
      onSubmit(selectedStudentId, duration)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Log Activity
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Recording time spent on: <strong>{resource.name}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="480"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || resource.suggestedDuration)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900
                dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600"
            >
              Log Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
