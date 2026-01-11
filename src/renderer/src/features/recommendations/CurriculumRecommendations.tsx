import { useState } from 'react'
import { useRecommendationsStore } from './recommendationsStore'
import type { CurriculumRecommendation } from './curriculumData'
import type { GradeLevel } from '../../../../shared/types'

export function CurriculumRecommendations() {
  const {
    filteredRecommendations,
    selectedSubject,
    selectedGrade,
    selectedStyle,
    selectedPrice,
    selectedCategory,
    searchQuery,
    savedRecommendations,
    allSubjects,
    allStyles,
    setSelectedSubject,
    setSelectedGrade,
    setSelectedStyle,
    setSelectedPrice,
    setSelectedCategory,
    setSearchQuery,
    clearFilters,
    toggleSaved
  } = useRecommendationsStore()

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const grades: GradeLevel[] = ['pre-k', 'k', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

  const priceOptions: Array<{ value: CurriculumRecommendation['priceRange']; label: string }> = [
    { value: 'free', label: 'Free' },
    { value: 'budget', label: 'Budget ($)' },
    { value: 'mid', label: 'Mid-range ($$)' },
    { value: 'premium', label: 'Premium ($$$)' }
  ]

  const categoryOptions: Array<{ value: CurriculumRecommendation['category']; label: string }> = [
    { value: 'complete', label: 'Complete Curriculum' },
    { value: 'subject', label: 'Single Subject' },
    { value: 'supplement', label: 'Supplement' }
  ]

  const styleLabels: Record<CurriculumRecommendation['style'], string> = {
    traditional: 'Traditional',
    charlotte_mason: 'Charlotte Mason',
    classical: 'Classical',
    montessori: 'Montessori/Waldorf',
    unschooling: 'Unschooling',
    unit_study: 'Unit Study',
    online: 'Online'
  }

  const subjectLabels: Record<string, string> = {
    'math': 'Math',
    'reading': 'Reading',
    'writing': 'Writing',
    'language-arts': 'Language Arts',
    'science': 'Science',
    'history': 'History',
    'social-studies': 'Social Studies',
    'art': 'Art',
    'bible': 'Bible'
  }

  const hasFilters = selectedSubject || selectedGrade || selectedStyle || selectedPrice || selectedCategory || searchQuery

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search curricula..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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
          onChange={(e) => setSelectedCategory((e.target.value as CurriculumRecommendation['category']) || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Types</option>
          {categoryOptions.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          value={selectedStyle || ''}
          onChange={(e) => setSelectedStyle((e.target.value as CurriculumRecommendation['style']) || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Styles</option>
          {allStyles.map(s => (
            <option key={s} value={s}>{styleLabels[s]}</option>
          ))}
        </select>

        <select
          value={selectedPrice || ''}
          onChange={(e) => setSelectedPrice((e.target.value as CurriculumRecommendation['priceRange']) || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Prices</option>
          {priceOptions.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

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

      {/* Results count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {filteredRecommendations.length} curriculum{filteredRecommendations.length !== 1 ? 's' : ''} found
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRecommendations.map(rec => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            isExpanded={expandedId === rec.id}
            isSaved={savedRecommendations.includes(rec.id)}
            onToggleExpand={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
            onToggleSaved={() => toggleSaved(rec.id)}
            styleLabels={styleLabels}
            subjectLabels={subjectLabels}
          />
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No curricula found matching your filters.
        </div>
      )}
    </div>
  )
}

interface RecommendationCardProps {
  recommendation: CurriculumRecommendation
  isExpanded: boolean
  isSaved: boolean
  onToggleExpand: () => void
  onToggleSaved: () => void
  styleLabels: Record<string, string>
  subjectLabels: Record<string, string>
}

function RecommendationCard({
  recommendation,
  isExpanded,
  isSaved,
  onToggleExpand,
  onToggleSaved,
  styleLabels,
  subjectLabels
}: RecommendationCardProps) {
  const priceColors: Record<CurriculumRecommendation['priceRange'], string> = {
    free: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    budget: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    mid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    premium: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  }

  const categoryColors: Record<CurriculumRecommendation['category'], string> = {
    complete: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    subject: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    supplement: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  const categoryLabels: Record<CurriculumRecommendation['category'], string> = {
    complete: 'Complete',
    subject: 'Single Subject',
    supplement: 'Supplement'
  }

  const priceLabels: Record<CurriculumRecommendation['priceRange'], string> = {
    free: 'Free',
    budget: '$',
    mid: '$$',
    premium: '$$$'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {recommendation.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              by {recommendation.publisher}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSaved() }}
            className="p-1 text-gray-400 hover:text-red-500"
            title={isSaved ? 'Remove from saved' : 'Save for later'}
          >
            {isSaved ? <HeartFilledIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {recommendation.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-0.5 text-xs rounded-full ${categoryColors[recommendation.category]}`}>
            {categoryLabels[recommendation.category]}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${priceColors[recommendation.priceRange]}`}>
            {priceLabels[recommendation.priceRange]}
          </span>
          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {styleLabels[recommendation.style]}
          </span>
        </div>

        {/* Subjects */}
        <div className="flex flex-wrap gap-1 mb-3">
          {recommendation.subjects.map(s => (
            <span
              key={s}
              className="px-2 py-0.5 text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
            >
              {subjectLabels[s] || s}
            </span>
          ))}
        </div>

        {/* Grade Range */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Grades: {recommendation.gradeLevels[0]} - {recommendation.gradeLevels[recommendation.gradeLevels.length - 1]}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3 text-sm">
            {/* Features */}
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Features:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {recommendation.features.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Pros */}
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Pros:</span>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1">
                {recommendation.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Cons:</span>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1">
                {recommendation.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Best For */}
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Best For:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {recommendation.bestFor.map((b, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <a
            href={recommendation.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700
              text-sm font-medium flex items-center justify-center gap-2"
          >
            <ExternalLinkIcon className="w-4 h-4" />
            Visit Website
          </a>
          <button
            onClick={onToggleExpand}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900
              dark:hover:text-white text-sm border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            {isExpanded ? 'Less' : 'Details'}
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

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

function HeartFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
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
