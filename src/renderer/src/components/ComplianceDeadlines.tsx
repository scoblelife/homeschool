/**
 * Compliance Deadlines Component
 *
 * Displays upcoming filing deadlines based on user's state.
 * Shows countdown and allows marking deadlines as completed.
 */

import { useState, useEffect } from 'react'
import { format, differenceInDays, addYears } from 'date-fns'

interface Deadline {
  name: string
  date: Date
  description: string
  daysUntil: number
  completed?: boolean
}

interface ComplianceDeadlinesProps {
  className?: string
  compact?: boolean
}

export function ComplianceDeadlines({ className = '', compact = false }: ComplianceDeadlinesProps) {
  const [stateCode, setStateCode] = useState<string | null>(null)
  const [stateName, setStateName] = useState<string>('')
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [completedDeadlines, setCompletedDeadlines] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDeadlines()
    loadCompletedDeadlines()
  }, [])

  const loadDeadlines = async () => {
    setIsLoading(true)
    try {
      // Get user's selected state
      const savedState = await window.api.getSetting('homeschool_state')
      if (!savedState) {
        setIsLoading(false)
        return
      }

      setStateCode(savedState)

      // Get state requirements and deadlines
      const requirements = await window.api.complianceGetStateRequirements(savedState)
      if (requirements) {
        setStateName(requirements.state)
      }

      const upcomingDeadlines = await window.api.complianceGetUpcomingDeadlines(savedState)

      // Convert to our Deadline format
      const formattedDeadlines = upcomingDeadlines.map((d) => ({
        name: d.name,
        date: new Date(d.date),
        description: d.description,
        daysUntil: d.daysUntil,
      }))

      setDeadlines(formattedDeadlines)
    } catch (err) {
      console.error('[ComplianceDeadlines] Failed to load:', err)
    }
    setIsLoading(false)
  }

  const loadCompletedDeadlines = async () => {
    try {
      const saved = await window.api.getSetting('completed_deadlines')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Filter out deadlines from previous years
        const currentYear = new Date().getFullYear()
        const valid = parsed.filter((d: string) => {
          const [, year] = d.split('_')
          return parseInt(year) >= currentYear
        })
        setCompletedDeadlines(new Set(valid))
      }
    } catch (err) {
      console.error('[ComplianceDeadlines] Failed to load completed:', err)
    }
  }

  const toggleDeadlineComplete = async (deadline: Deadline) => {
    const key = `${deadline.name}_${deadline.date.getFullYear()}`
    const newCompleted = new Set(completedDeadlines)

    if (newCompleted.has(key)) {
      newCompleted.delete(key)
    } else {
      newCompleted.add(key)
    }

    setCompletedDeadlines(newCompleted)
    await window.api.setSetting('completed_deadlines', JSON.stringify(Array.from(newCompleted)))
  }

  const getUrgencyColor = (daysUntil: number): string => {
    if (daysUntil < 0) return 'text-red-600 bg-red-50 border-red-200'
    if (daysUntil <= 7) return 'text-red-600 bg-red-50 border-red-200'
    if (daysUntil <= 30) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getUrgencyLabel = (daysUntil: number): string => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`
    if (daysUntil === 0) return 'Due today'
    if (daysUntil === 1) return 'Due tomorrow'
    if (daysUntil <= 7) return `${daysUntil} days`
    if (daysUntil <= 30) return `${daysUntil} days`
    return `${daysUntil} days`
  }

  // Filter out completed deadlines for display
  const pendingDeadlines = deadlines.filter((d) => {
    const key = `${d.name}_${d.date.getFullYear()}`
    return !completedDeadlines.has(key)
  })

  const completedCount = deadlines.length - pendingDeadlines.length

  if (isLoading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!stateCode) {
    return (
      <div className={`${className} p-4 border border-gray-200 rounded-lg bg-gray-50`}>
        <p className="text-sm text-gray-600">
          Set your state in Settings to see compliance deadlines.
        </p>
      </div>
    )
  }

  if (deadlines.length === 0) {
    return (
      <div className={`${className} p-4 border border-green-200 rounded-lg bg-green-50`}>
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <p className="text-sm text-green-700">
            {stateName} has no specific filing deadlines. You're all set!
          </p>
        </div>
      </div>
    )
  }

  if (compact) {
    // Compact view for dashboard widget
    const urgentDeadlines = pendingDeadlines.filter((d) => d.daysUntil <= 30)

    if (urgentDeadlines.length === 0 && pendingDeadlines.length === 0) {
      return (
        <div className={`${className} p-3 border border-green-200 rounded-lg bg-green-50`}>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm text-green-700">All deadlines met!</p>
          </div>
        </div>
      )
    }

    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Compliance Deadlines</h3>
          <span className="text-xs text-gray-500">{stateName}</span>
        </div>
        <div className="space-y-2">
          {urgentDeadlines.slice(0, 3).map((deadline, idx) => (
            <div
              key={idx}
              className={`p-2 rounded border ${getUrgencyColor(deadline.daysUntil)}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{deadline.name}</span>
                <span className="text-xs font-semibold">
                  {getUrgencyLabel(deadline.daysUntil)}
                </span>
              </div>
            </div>
          ))}
          {pendingDeadlines.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              +{pendingDeadlines.length - 3} more
            </p>
          )}
        </div>
      </div>
    )
  }

  // Full view
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Filing Deadlines</h2>
          <p className="text-sm text-gray-500">{stateName} Requirements</p>
        </div>
        {completedCount > 0 && (
          <span className="text-sm text-green-600">
            {completedCount} of {deadlines.length} completed
          </span>
        )}
      </div>

      <div className="space-y-3">
        {deadlines.map((deadline, idx) => {
          const key = `${deadline.name}_${deadline.date.getFullYear()}`
          const isCompleted = completedDeadlines.has(key)

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border transition-all ${
                isCompleted
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : getUrgencyColor(deadline.daysUntil)
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleDeadlineComplete(deadline)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {isCompleted && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}
                    >
                      {deadline.name}
                    </h3>
                    {!isCompleted && (
                      <span
                        className={`text-sm font-semibold px-2 py-0.5 rounded ${
                          deadline.daysUntil <= 7
                            ? 'bg-red-100 text-red-700'
                            : deadline.daysUntil <= 30
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {getUrgencyLabel(deadline.daysUntil)}
                      </span>
                    )}
                  </div>

                  <p className={`text-sm mt-1 ${isCompleted ? 'text-gray-400' : 'opacity-80'}`}>
                    {deadline.description}
                  </p>

                  <p className={`text-xs mt-2 ${isCompleted ? 'text-gray-400' : 'opacity-70'}`}>
                    Due: {format(deadline.date, 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
