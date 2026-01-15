/**
 * Subject Balance Component
 *
 * Displays weekly subject balance with targets and alerts.
 */

import { useState, useEffect, useMemo } from 'react'
import { Dialog } from '@headlessui/react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import {
  useBalanceStore,
  calculateBalanceStatus,
  formatMinutes,
  getBalanceRecommendation,
  type BalanceData,
} from './balanceStore'
import type { Subject, ActivitySummary } from '../../../../shared/types'

interface SubjectBalanceProps {
  studentId: string
  studentName: string
  subjects: Subject[]
}

/**
 * Render the weekly subject balance UI for a student.
 *
 * Displays per-subject weekly targets versus actual activity, highlights subjects that are behind target,
 * and provides access to a modal for viewing and editing weekly targets.
 *
 * @param studentId - The identifier of the student whose activity and targets are shown
 * @param studentName - The student's display name used in the settings modal
 * @param subjects - The list of subjects to display and manage targets for
 * @returns A JSX element containing the weekly subject balance interface
 */
export function SubjectBalance({
  studentId,
  studentName,
  subjects,
}: SubjectBalanceProps): JSX.Element {
  const [showSettings, setShowSettings] = useState(false)
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([])
  const getTargets = useBalanceStore((state) => state.getTargets)
  const targets = getTargets(studentId)

  // Load this week's activity data
  useEffect(() => {
    loadWeeklyData()
  }, [studentId])

  const loadWeeklyData = async () => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 })

    const summary = await window.api.getActivitySummary(
      studentId,
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    )
    setActivitySummary(summary)
  }

  // Calculate balance data for each subject
  const balanceData: BalanceData[] = useMemo(() => {
    return subjects.map((subject) => {
      const target = targets.find((t) => t.subjectId === subject.id)
      const actual = activitySummary.find((a) => a.subjectId === subject.id)
      const targetMinutes = target?.targetMinutesPerWeek || 0
      const actualMinutes = actual?.totalMinutes || 0

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        targetMinutes,
        actualMinutes,
        percentageOfTarget: targetMinutes > 0 ? (actualMinutes / targetMinutes) * 100 : 0,
        status: targetMinutes > 0 ? calculateBalanceStatus(actualMinutes, targetMinutes) : 'no_target',
      }
    })
  }, [subjects, targets, activitySummary])

  // Get subjects that need attention
  const underTargetSubjects = balanceData.filter((d) => d.status === 'under')

  // Only show if there are targets set
  const hasTargets = targets.length > 0

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Subject Balance</h3>
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm text-fuchsia-600 hover:text-fuchsia-800 dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
          >
            {hasTargets ? 'Edit Targets' : 'Set Targets'}
          </button>
        </div>

        {!hasTargets ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set weekly hour targets for each subject to track balance.
          </p>
        ) : (
          <>
            {/* Alerts for under-target subjects */}
            {underTargetSubjects.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 text-lg">⚠️</span>
                  <div className="flex-1">
                    <div className="font-medium text-amber-800 dark:text-amber-300">Subjects Need Attention</div>
                    <ul className="mt-1 text-sm text-amber-700 dark:text-amber-400 space-y-1">
                      {underTargetSubjects.map((subject) => (
                        <li key={subject.subjectId}>
                          {getBalanceRecommendation(subject)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Balance bars */}
            <div className="space-y-3">
              {balanceData
                .filter((d) => d.status !== 'no_target')
                .map((data) => (
                  <BalanceBar key={data.subjectId} data={data} />
                ))}
            </div>
          </>
        )}
      </div>

      <TargetSettingsModal
        open={showSettings}
        onClose={() => {
          setShowSettings(false)
          loadWeeklyData() // Refresh data after settings change
        }}
        studentId={studentId}
        studentName={studentName}
        subjects={subjects}
      />
    </>
  )
}

interface BalanceBarProps {
  data: BalanceData
}

/**
 * Render a single subject's weekly balance as a labeled progress bar and summary.
 *
 * Displays the subject name, actual vs target minutes, a colored progress bar (visual width capped for display),
 * the percent of target achieved, and, when under target, the remaining time to reach the weekly target.
 *
 * @param data - Balance data for the subject, including `subjectName`, `targetMinutes`, `actualMinutes`, `percentageOfTarget`, and `status`
 * @returns A JSX element showing the subject balance row with progress bar and textual summary
 */
function BalanceBar({ data }: BalanceBarProps): JSX.Element {
  const percentage = Math.min(data.percentageOfTarget, 150) // Cap at 150% for display
  const barColor =
    data.status === 'under'
      ? 'bg-amber-500'
      : data.status === 'over'
      ? 'bg-blue-500'
      : 'bg-green-500'

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-gray-700 dark:text-gray-200">{data.subjectName}</span>
        <span className="text-gray-500 dark:text-gray-400">
          {formatMinutes(data.actualMinutes)} / {formatMinutes(data.targetMinutes)}
        </span>
      </div>
      <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`absolute h-full ${barColor} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        {/* Target line */}
        <div className="absolute h-full w-0.5 bg-gray-400 dark:bg-gray-500 left-[100%] transform -translate-x-1/2" />
      </div>
      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        <span>{Math.round(data.percentageOfTarget)}% of target</span>
        {data.status === 'under' && (
          <span className="text-amber-600 dark:text-amber-400">
            {formatMinutes(data.targetMinutes - data.actualMinutes)} remaining
          </span>
        )}
      </div>
    </div>
  )
}

interface TargetSettingsModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  subjects: Subject[]
}

/**
 * Modal dialog for viewing and editing a student's per-subject weekly hour targets.
 *
 * Loads the student's existing targets when opened, allows editing each subject's target hours
 * (0–40 hrs/week, step 0.5), and persists changes by setting or removing per-subject weekly
 * targets in the balance store when saved. Calls `onClose` after saving or cancelling.
 *
 * @param open - Whether the modal is visible
 * @param onClose - Callback invoked when the modal should be closed
 * @param studentId - Identifier of the student whose targets are being edited
 * @param studentName - Display name of the student shown in the modal description
 * @param subjects - List of subjects available for editing targets
 * @returns The rendered modal component as a JSX element
 */
function TargetSettingsModal({
  open,
  onClose,
  studentId,
  studentName,
  subjects,
}: TargetSettingsModalProps): JSX.Element {
  const setSubjectTarget = useBalanceStore((state) => state.setSubjectTarget)
  const removeSubjectTarget = useBalanceStore((state) => state.removeSubjectTarget)
  const getTargets = useBalanceStore((state) => state.getTargets)

  const [localTargets, setLocalTargets] = useState<Record<string, number>>({})

  // Initialize local targets from store
  useEffect(() => {
    if (open) {
      const targets = getTargets(studentId)
      const initial: Record<string, number> = {}
      targets.forEach((t) => {
        initial[t.subjectId] = t.targetMinutesPerWeek
      })
      setLocalTargets(initial)
    }
  }, [open, studentId, getTargets])

  const handleSave = () => {
    // Save all targets
    subjects.forEach((subject) => {
      const target = localTargets[subject.id]
      if (target && target > 0) {
        setSubjectTarget(studentId, subject.id, target)
      } else {
        removeSubjectTarget(studentId, subject.id)
      }
    })
    onClose()
  }

  const handleTargetChange = (subjectId: string, hours: number) => {
    setLocalTargets({
      ...localTargets,
      [subjectId]: hours * 60, // Convert hours to minutes
    })
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Weekly Hour Targets
          </Dialog.Title>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Set target hours per week for {studentName}'s subjects. You'll be alerted when subjects
            fall significantly below target.
          </p>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {subjects.map((subject) => {
              const currentMinutes = localTargets[subject.id] || 0
              const currentHours = Math.round((currentMinutes / 60) * 10) / 10

              return (
                <div key={subject.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{subject.name}</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={40}
                      step={0.5}
                      value={currentHours || ''}
                      onChange={(e) =>
                        handleTargetChange(subject.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">hrs/week</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              Save Targets
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

/**
 * Render a compact dashboard alert when one or more subjects are behind their weekly targets.
 *
 * Fetches the current week's activity summary and compares each subject's actual minutes to the configured weekly target; if any subjects are under target, displays a small amber alert listing their names.
 *
 * @param studentId - The student identifier used to load targets and activity data
 * @param subjects - The subjects to evaluate for weekly target compliance
 * @returns A JSX element containing a compact under-target alert listing subject names, or `null` when no subjects are behind
 */
export function SubjectBalanceAlert({
  studentId,
  subjects,
}: {
  studentId: string
  subjects: Subject[]
}): JSX.Element | null {
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([])
  const getTargets = useBalanceStore((state) => state.getTargets)
  const targets = getTargets(studentId)

  useEffect(() => {
    loadWeeklyData()
  }, [studentId])

  const loadWeeklyData = async () => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 })

    const summary = await window.api.getActivitySummary(
      studentId,
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    )
    setActivitySummary(summary)
  }

  // Calculate under-target subjects
  const underTargetSubjects = useMemo(() => {
    return subjects
      .map((subject) => {
        const target = targets.find((t) => t.subjectId === subject.id)
        const actual = activitySummary.find((a) => a.subjectId === subject.id)
        if (!target) return null

        const targetMinutes = target.targetMinutesPerWeek
        const actualMinutes = actual?.totalMinutes || 0
        const status = calculateBalanceStatus(actualMinutes, targetMinutes)

        if (status === 'under') {
          return {
            name: subject.name,
            deficit: targetMinutes - actualMinutes,
          }
        }
        return null
      })
      .filter(Boolean) as Array<{ name: string; deficit: number }>
  }, [subjects, targets, activitySummary])

  if (underTargetSubjects.length === 0) return null

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-amber-500">⚠️</span>
        <div className="text-sm">
          <span className="font-medium text-amber-800 dark:text-amber-300">Behind on: </span>
          <span className="text-amber-700 dark:text-amber-400">
            {underTargetSubjects.map((s) => s.name).join(', ')}
          </span>
        </div>
      </div>
    </div>
  )
}