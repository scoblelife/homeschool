import { useState } from 'react'
import { useTemplatesStore } from './templatesStore'
import { ActivityTemplate, getTemplateById } from './templateData'
import type { GradeLevel } from '../../../../shared/types'

interface Props {
  onSelectTemplate: (template: ActivityTemplate) => void
  studentGrade?: GradeLevel
}

export function TemplateLibrary({ onSelectTemplate, studentGrade }: Props) {
  const {
    filteredTemplates,
    selectedSubject,
    selectedGrade,
    selectedCategory,
    searchQuery,
    selectedTags,
    recentlyUsed,
    favorites,
    allSubjects,
    allTags,
    setSelectedSubject,
    setSelectedGrade,
    setSelectedCategory,
    setSearchQuery,
    toggleTag,
    clearFilters,
    addToRecentlyUsed,
    toggleFavorite
  } = useTemplatesStore()

  const [showDetails, setShowDetails] = useState<string | null>(null)

  const handleSelectTemplate = (template: ActivityTemplate) => {
    addToRecentlyUsed(template.id)
    onSelectTemplate(template)
  }

  // Get recently used templates
  const recentTemplates = recentlyUsed
    .map(id => getTemplateById(id))
    .filter((t): t is ActivityTemplate => t !== undefined)
    .slice(0, 5)

  // Get favorite templates
  const favoriteTemplates = favorites
    .map(id => getTemplateById(id))
    .filter((t): t is ActivityTemplate => t !== undefined)

  const grades: GradeLevel[] = ['pre-k', 'k', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
  const categories: Array<{ value: ActivityTemplate['category']; label: string }> = [
    { value: 'core', label: 'Core' },
    { value: 'enrichment', label: 'Enrichment' },
    { value: 'review', label: 'Review' },
    { value: 'assessment', label: 'Assessment' }
  ]

  const hasFilters = selectedSubject || selectedGrade || selectedCategory || searchQuery || selectedTags.length > 0

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={selectedSubject || ''}
          onChange={(e) => setSelectedSubject(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Subjects</option>
          {allSubjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedGrade || ''}
          onChange={(e) => setSelectedGrade((e.target.value as GradeLevel) || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Grades</option>
          {grades.slice(0, 5).map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory((e.target.value as ActivityTemplate['category']) || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900
              dark:hover:text-white flex items-center gap-1"
          >
            <XIcon className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-fuchsia-100 dark:bg-fuchsia-900
                text-fuchsia-700 dark:text-fuchsia-300 rounded-full text-sm cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              <XIcon className="w-3 h-3" />
            </span>
          ))}
        </div>
      )}

      {/* Recently Used */}
      {!hasFilters && recentTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Recently Used
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                  rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm flex items-center gap-2"
              >
                <ClockIcon className="w-4 h-4" />
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Favorites */}
      {!hasFilters && favoriteTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Favorites
          </h3>
          <div className="flex flex-wrap gap-2">
            {favoriteTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300
                  rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-sm flex items-center gap-2"
              >
                <StarFilledIcon className="w-4 h-4" />
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {hasFilters ? `${filteredTemplates.length} templates found` : 'All Templates'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isFavorite={favorites.includes(template.id)}
              isExpanded={showDetails === template.id}
              onToggleExpand={() => setShowDetails(showDetails === template.id ? null : template.id)}
              onSelect={() => handleSelectTemplate(template)}
              onToggleFavorite={() => toggleFavorite(template.id)}
              onTagClick={toggleTag}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No templates found matching your filters.
          </div>
        )}
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: ActivityTemplate
  isFavorite: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onSelect: () => void
  onToggleFavorite: () => void
  onTagClick: (tag: string) => void
}

function TemplateCard({
  template,
  isFavorite,
  isExpanded,
  onToggleExpand,
  onSelect,
  onToggleFavorite,
  onTagClick
}: TemplateCardProps) {
  const categoryColors: Record<ActivityTemplate['category'], string> = {
    core: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    enrichment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    assessment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {template.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {template.subjectName} • {template.durationMinutes} min
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
            className="p-1 text-gray-400 hover:text-yellow-500"
          >
            {isFavorite ? <StarFilledIcon className="w-5 h-5 text-yellow-500" /> : <StarIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {template.description}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-0.5 text-xs rounded-full ${categoryColors[template.category]}`}>
            {template.category}
          </span>
          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {template.grades.join(', ')}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map(tag => (
            <button
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag) }}
              className="px-2 py-0.5 text-xs bg-gray-50 dark:bg-gray-700 text-gray-500
                dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              #{tag}
            </button>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-400">
              +{template.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
            {template.materials && template.materials.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Materials:</span>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                  {template.materials.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {template.instructions && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Instructions:</span>
                <p className="text-gray-600 dark:text-gray-400">{template.instructions}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onSelect}
            className="flex-1 px-3 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600
              text-sm font-medium flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Activity
          </button>
          <button
            onClick={onToggleExpand}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900
              dark:hover:text-white text-sm"
          >
            {isExpanded ? 'Less' : 'More'}
          </button>
        </div>
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}
