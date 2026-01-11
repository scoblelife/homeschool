import { useState, useEffect, useMemo } from 'react'
import { useCurriculumStore } from './curriculumStore'
import type { LearningStandard, GradeLevel } from '../../../../shared/types'

interface Props {
  gradeLevel: GradeLevel
  onSelectStandard?: (standard: LearningStandard) => void
  selectedIds?: string[]
}

export function StandardsList({ gradeLevel, onSelectStandard, selectedIds = [] }: Props) {
  const { standards, isLoading, loadStandards, selectedSubject, setSelectedSubject } = useCurriculumStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadStandards(gradeLevel)
  }, [gradeLevel, loadStandards])

  // Get unique subjects
  const subjects = useMemo(() => {
    const subjectMap = new Map<string, string>()
    standards.forEach(s => {
      if (!subjectMap.has(s.subjectId)) {
        subjectMap.set(s.subjectId, s.subjectId)
      }
    })
    return Array.from(subjectMap.keys())
  }, [standards])

  // Filter standards
  const filteredStandards = useMemo(() => {
    let filtered = standards

    if (selectedSubject) {
      filtered = filtered.filter(s => s.subjectId === selectedSubject)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [standards, selectedSubject, searchQuery])

  // Group by domain
  const groupedByDomain = useMemo(() => {
    const groups = new Map<string, LearningStandard[]>()
    filteredStandards.forEach(s => {
      const existing = groups.get(s.domain) || []
      existing.push(s)
      groups.set(s.domain, existing)
    })
    return groups
  }, [filteredStandards])

  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains)
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain)
    } else {
      newExpanded.add(domain)
    }
    setExpandedDomains(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading standards...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Subject Filter */}
        <div className="flex-1 min-w-48">
          <select
            value={selectedSubject || ''}
            onChange={(e) => setSelectedSubject(e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Subjects</option>
            {subjects.map(subjectId => (
              <option key={subjectId} value={subjectId}>
                {subjectId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search standards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Standards Count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredStandards.length} standards
      </p>

      {/* Grouped Standards */}
      <div className="space-y-3">
        {Array.from(groupedByDomain.entries()).map(([domain, domainStandards]) => {
          const isExpanded = expandedDomains.has(domain)
          const selectedCount = domainStandards.filter(s => selectedIds.includes(s.id)).length

          return (
            <div
              key={domain}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              {/* Domain Header */}
              <button
                onClick={() => toggleDomain(domain)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700
                  hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronIcon isExpanded={isExpanded} />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {domain}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({domainStandards.length} standards)
                  </span>
                </div>
                {selectedCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                    {selectedCount} mapped
                  </span>
                )}
              </button>

              {/* Standards in Domain */}
              {isExpanded && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {domainStandards.map(standard => {
                    const isSelected = selectedIds.includes(standard.id)

                    return (
                      <div
                        key={standard.id}
                        onClick={() => onSelectStandard?.(standard)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {onSelectStandard && (
                            <div className="mt-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded
                                  focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                {standard.code}
                              </span>
                              {standard.standardSet === 'custom' && (
                                <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                                  Custom
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {standard.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {standard.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredStandards.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No standards found matching your criteria.
        </div>
      )}
    </div>
  )
}

// Chevron icon component
function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
