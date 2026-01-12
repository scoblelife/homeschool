/**
 * Empty State Component
 *
 * Shown when lists or content areas are empty.
 */

import { ReactNode } from 'react'
import { clsx } from 'clsx'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('text-center py-12 px-4', className)}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-gray-400 mb-4 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// Pre-built empty states for common scenarios
export function NoStudentsEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      }
      title="No students yet"
      description="Add your first student to start tracking their learning journey."
      action={
        onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center px-4 py-2 bg-fuchsia-500 text-white text-sm font-semibold rounded-lg hover:bg-fuchsia-600 transition-colors"
          >
            Add Student
          </button>
        )
      }
    />
  )
}

export function NoActivitiesEmpty() {
  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      }
      title="No activities logged"
      description="Start logging activities to track learning progress."
    />
  )
}

export function NoResultsEmpty({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description={query ? `No matches for "${query}"` : 'Try adjusting your search or filters.'}
    />
  )
}
